import http.server
import socketserver
import threading
import subprocess
import time
import json
import urllib.request
import socket
import base64
import os
import struct

PORT = 8098
DIRECTORY = '/Users/khalidabdullah/AntiGravity/Oops!'

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    def log_message(self, format, *args):
        pass

httpd = socketserver.TCPServer(('127.0.0.1', PORT), Handler)
t = threading.Thread(target=httpd.serve_forever)
t.daemon = True
t.start()

chrome_bin = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
cmd = [
    chrome_bin,
    '--headless=new',
    '--user-data-dir=/tmp/test_chrome_verify',
    '--remote-debugging-port=9229',
    f'http://127.0.0.1:{PORT}/index.html'
]
proc = subprocess.Popen(cmd)

def ws_handshake(sock, host, path):
    key = base64.b64encode(os.urandom(16)).decode('utf-8')
    req = (
        f"GET {path} HTTP/1.1\r\n"
        f"Host: {host}\r\n"
        "Upgrade: websocket\r\n"
        "Connection: Upgrade\r\n"
        f"Sec-WebSocket-Key: {key}\r\n"
        "Sec-WebSocket-Version: 13\r\n\r\n"
    )
    sock.sendall(req.encode('utf-8'))
    resp = b""
    while b'\r\n\r\n' not in resp:
        resp += sock.recv(1024)

def ws_send(sock, data_dict):
    payload = json.dumps(data_dict).encode('utf-8')
    length = len(payload)
    frame = bytearray([0x81])
    if length <= 125:
        frame.append(0x80 | length)
    elif length <= 65535:
        frame.append(0x80 | 126)
        frame.extend(struct.pack('>H', length))
    else:
        frame.append(0x80 | 127)
        frame.extend(struct.pack('>Q', length))
    mask = os.urandom(4)
    frame.extend(mask)
    masked_payload = bytearray(b ^ mask[i % 4] for i, b in enumerate(payload))
    frame.extend(masked_payload)
    sock.sendall(frame)

def ws_recv(sock):
    header = sock.recv(2)
    if not header or len(header) < 2:
        return None
    length = header[1] & 0x7F
    if length == 126:
        length = struct.unpack('>H', sock.recv(2))[0]
    elif length == 127:
        length = struct.unpack('>Q', sock.recv(8))[0]
    data = b''
    while len(data) < length:
        data += sock.recv(length - len(data))
    return json.loads(data.decode('utf-8', errors='ignore'))

# Retry loop to connect to Chrome
ws_url = None
for _ in range(20):
    time.sleep(0.5)
    try:
        req = urllib.request.urlopen('http://127.0.0.1:9229/json')
        targets = json.loads(req.read().decode('utf-8'))
        page_targets = [t for t in targets if t.get('type') == 'page']
        if page_targets:
            ws_url = page_targets[0]['webSocketDebuggerUrl']
            break
    except Exception:
        pass

if not ws_url:
    print('Failed to obtain WebSocket Debugger URL!')
    proc.terminate()
    httpd.shutdown()
    exit(1)

print('Connected to DevTools WS:', ws_url)
parts = ws_url.replace('ws://', '').split('/', 1)
host, port = parts[0].split(':')
path = '/' + parts[1]

s = socket.create_connection((host, int(port)))
ws_handshake(s, parts[0], path)

ws_send(s, {'id': 1, 'method': 'Runtime.enable'})
ws_send(s, {'id': 2, 'method': 'Log.enable'})
ws_send(s, {'id': 3, 'method': 'Page.enable'})

time.sleep(2)

ws_send(s, {'id': 10, 'method': 'Runtime.evaluate', 'params': {'expression': '({ hasPhaser: typeof Phaser !== "undefined", hasGame: !!window.game, isBooted: window.game ? window.game.isBooted : false, isRunning: window.game ? window.game.isRunning : false, activeScenes: window.game ? window.game.scene.getScenes(true).map(s => s.scene.key) : [], canvasFound: !!document.querySelector("canvas"), canvasWidth: document.querySelector("canvas") ? document.querySelector("canvas").width : 0, canvasHeight: document.querySelector("canvas") ? document.querySelector("canvas").height : 0 })', 'returnByValue': True}})
ws_send(s, {'id': 11, 'method': 'Page.captureScreenshot', 'params': {'format': 'png'}})

s.settimeout(4.0)
start_time = time.time()
while time.time() - start_time < 4.0:
    try:
        msg = ws_recv(s)
        if not msg:
            break
        if msg.get('method') == 'Runtime.exceptionThrown':
            print('EXCEPTION:', json.dumps(msg, indent=2))
        elif msg.get('method') == 'Runtime.consoleAPICalled':
            args = msg.get('params', {}).get('args', [])
            print('CONSOLE:', [a.get('value') for a in args])
        elif msg.get('id') == 10:
            print('DIAGNOSTIC RESULT:', json.dumps(msg.get('result', {}).get('result', {}).get('value'), indent=2))
        elif msg.get('id') == 11:
            data = msg.get('result', {}).get('data')
            if data:
                with open('/tmp/oops_live_shot.png', 'wb') as f:
                    f.write(base64.b64decode(data))
                print('Live screenshot captured: /tmp/oops_live_shot.png (' + str(len(data)) + ' bytes)')
    except socket.timeout:
        break

proc.terminate()
httpd.shutdown()
print('Verification script completed!')
