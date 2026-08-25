import urllib.request, json, time, socket, base64, subprocess, http.server, socketserver, threading, struct, os, tempfile, shutil

PORT = 8205
CDP_PORT = 9325
DIRECTORY = '/Users/khalidabdullah/AntiGravity/Oops!'
tmp_dir = tempfile.mkdtemp(prefix='chrome_shot_')

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    def log_message(self, format, *args):
        pass

httpd = socketserver.TCPServer(('127.0.0.1', PORT), Handler)
t = threading.Thread(target=httpd.serve_forever)
t.daemon = True
t.start()

# Test Portrait 452x874 first
chrome_bin = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
cmd = [
    chrome_bin,
    '--headless=new',
    f'--user-data-dir={tmp_dir}',
    '--window-size=452,874',
    f'--remote-debugging-port={CDP_PORT}',
    f'http://127.0.0.1:{PORT}/index.html'
]
proc = subprocess.Popen(cmd)

def ws_handshake(sock, host, path):
    key = base64.b64encode(os.urandom(16)).decode('utf-8')
    req = f'GET {path} HTTP/1.1\r\nHost: {host}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n'
    sock.sendall(req.encode('utf-8'))
    resp = b''
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

ws_url = None
for _ in range(35):
    time.sleep(0.1)
    try:
        req = urllib.request.urlopen(f'http://127.0.0.1:{CDP_PORT}/json')
        targets = json.loads(req.read().decode('utf-8'))
        page_targets = [tg for tg in targets if tg.get('type') == 'page']
        if page_targets:
            ws_url = page_targets[0]['webSocketDebuggerUrl']
            break
    except Exception:
        pass

parts = ws_url.replace('ws://', '').split('/', 1)
host_p, port_p = parts[0].split(':')
path = '/' + parts[1]

s = socket.create_connection((host_p, int(port_p)))
ws_handshake(s, parts[0], path)

ws_send(s, {'id': 1, 'method': 'Runtime.enable'})
ws_send(s, {'id': 2, 'method': 'Page.enable'})

time.sleep(1.5)

# Take screenshot of portrait
ws_send(s, {'id': 50, 'method': 'Page.captureScreenshot', 'params': {'format': 'png'}})
st = time.time()
while time.time() - st < 3.0:
    msg = ws_recv(s)
    if msg and msg.get('id') == 50:
        data = base64.b64decode(msg['result']['data'])
        with open('/Users/khalidabdullah/AntiGravity/Oops!/docs/test_mobile_portrait.png', 'wb') as f:
            f.write(data)
        print("Captured test_mobile_portrait.png!")
        break

# Now switch to Landscape (874x452)
ws_send(s, {'id': 51, 'method': 'Emulation.setDeviceMetricsOverride', 'params': {
    'width': 874,
    'height': 452,
    'deviceScaleFactor': 1,
    'mobile': True,
    'screenOrientation': {'type': 'landscapePrimary', 'angle': 90}
}})
time.sleep(1.0)

ws_send(s, {'id': 52, 'method': 'Page.captureScreenshot', 'params': {'format': 'png'}})
st = time.time()
while time.time() - st < 3.0:
    msg = ws_recv(s)
    if msg and msg.get('id') == 52:
        data = base64.b64decode(msg['result']['data'])
        with open('/Users/khalidabdullah/AntiGravity/Oops!/docs/test_mobile_landscape.png', 'wb') as f:
            f.write(data)
        print("Captured test_mobile_landscape.png!")
        break

proc.terminate()
httpd.shutdown()
shutil.rmtree(tmp_dir, ignore_errors=True)
