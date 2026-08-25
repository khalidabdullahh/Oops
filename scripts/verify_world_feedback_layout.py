import urllib.request, json, time, socket, base64, subprocess, http.server, socketserver, threading, struct, os, tempfile, shutil

PORT = 8170
CDP_PORT = 9284
DIRECTORY = '/Users/khalidabdullah/AntiGravity/Oops!'
tmp_dir = tempfile.mkdtemp(prefix='chrome_world_fb_')

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
    f'--user-data-dir={tmp_dir}',
    '--window-size=1280,720',
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
    time.sleep(0.3)
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

ctx_id = None
st = time.time()
s.settimeout(1.0)
while time.time() - st < 3.5:
    try:
        msg = ws_recv(s)
        if not msg:
            break
        if msg.get('method') == 'Runtime.executionContextCreated':
            ctx_id = msg.get('params', {}).get('context', {}).get('id')
    except socket.timeout:
        pass

time.sleep(1.0)
# 1. Capture World Map screenshot
ws_send(s, {'id': 10, 'method': 'Page.captureScreenshot', 'params': {'format': 'png'}})

# 2. Test Feedback button in WorldSelectScene click opens modal
ws_send(s, {'id': 20, 'method': 'Runtime.evaluate', 'params': {'contextId': ctx_id, 'expression': '''
(() => {
  window.FeedbackManager.open();
  const modal = document.getElementById("feedback-modal");
  return JSON.stringify({ isModalOpen: modal && !modal.classList.contains("hidden") });
})()
''', 'returnByValue': True}})

# 3. Capture Gameplay screenshot
ws_send(s, {'id': 25, 'method': 'Runtime.evaluate', 'params': {'contextId': ctx_id, 'expression': '''
(() => {
  window.FeedbackManager.close();
  window.game.scene.start("GameScene", { world: 0, level: 0, deaths: 0 });
})()
'''}})
time.sleep(1.0)
ws_send(s, {'id': 30, 'method': 'Page.captureScreenshot', 'params': {'format': 'png'}})

st = time.time()
s.settimeout(3.0)
while time.time() - st < 3.0:
    try:
        msg = ws_recv(s)
        if not msg:
            break
        mid = msg.get('id')
        if mid == 10:
            data = msg.get('result', {}).get('data')
            if data:
                with open('/Users/khalidabdullah/AntiGravity/Oops!/docs/world_map_feedback_sound.png', 'wb') as f:
                    f.write(base64.b64decode(data))
                print('Saved docs/world_map_feedback_sound.png')
        elif mid == 20:
            val = msg.get('result', {}).get('result', {}).get('value')
            print('MODAL TEST RESULT:', val)
        elif mid == 30:
            data = msg.get('result', {}).get('data')
            if data:
                with open('/Users/khalidabdullah/AntiGravity/Oops!/docs/clean_gameplay.png', 'wb') as f:
                    f.write(base64.b64decode(data))
                print('Saved docs/clean_gameplay.png')
    except socket.timeout:
        break

proc.terminate()
httpd.shutdown()
shutil.rmtree(tmp_dir, ignore_errors=True)
print('ALL CHECKS COMPLETE!')
