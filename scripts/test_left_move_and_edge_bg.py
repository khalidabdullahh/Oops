import urllib.request, json, time, socket, base64, subprocess, http.server, socketserver, threading, struct, os, tempfile, shutil

PORT = 8175
CDP_PORT = 9290
DIRECTORY = '/Users/khalidabdullah/AntiGravity/Oops!'
tmp_dir = tempfile.mkdtemp(prefix='chrome_bg_left_')

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

time.sleep(0.8)
# 1. Check Body Background in WorldSelectScene
ws_send(s, {'id': 10, 'method': 'Runtime.evaluate', 'params': {'contextId': ctx_id, 'expression': '''
(() => {
  return JSON.stringify({ bodyBg: document.body.style.backgroundColor, docBg: document.documentElement.style.backgroundColor });
})()
''', 'returnByValue': True}})

# 2. Start GameScene and hold Left key to walk all the way left
ws_send(s, {'id': 20, 'method': 'Runtime.evaluate', 'params': {'contextId': ctx_id, 'expression': '''
(() => {
  window.game.scene.start("GameScene", { world: 0, level: 0, deaths: 0 });
})()
'''}})
time.sleep(0.6)

# 3. Simulate holding Left key for 1.5 seconds
ws_send(s, {'id': 30, 'method': 'Runtime.evaluate', 'params': {'contextId': ctx_id, 'expression': '''
(() => {
  const g = window.game.scene.getScene("GameScene");
  g.touchLeft = true;
})()
'''}})
time.sleep(1.2)

# 4. Check player status (must be ALIVE with deaths === 0, player.x clamped at >= 18)
ws_send(s, {'id': 40, 'method': 'Runtime.evaluate', 'params': {'contextId': ctx_id, 'expression': '''
(() => {
  const g = window.game.scene.getScene("GameScene");
  return JSON.stringify({
    isDead: g.isDead,
    deaths: g.deaths,
    playerX: Math.round(g.player.x),
    playerY: Math.round(g.player.y),
    bodyBg: document.body.style.backgroundColor
  });
})()
''', 'returnByValue': True}})

st = time.time()
s.settimeout(3.0)
while time.time() - st < 3.0:
    try:
        msg = ws_recv(s)
        if not msg:
            break
        mid = msg.get('id')
        if mid in [10, 40]:
            val = msg.get('result', {}).get('result', {}).get('value')
            print(f'MSG {mid} RESULT:', val)
    except socket.timeout:
        break

proc.terminate()
httpd.shutdown()
shutil.rmtree(tmp_dir, ignore_errors=True)
print('TEST COMPLETED!')
