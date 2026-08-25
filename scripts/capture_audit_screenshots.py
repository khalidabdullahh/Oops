import urllib.request, json, time, socket, base64, subprocess, http.server, socketserver, threading, struct, os

PORT = 8120
DIRECTORY = '/Users/khalidabdullah/AntiGravity/Oops!'
SHOTS_DIR = os.path.join(DIRECTORY, 'docs', 'audit_screenshots')
os.makedirs(SHOTS_DIR, exist_ok=True)

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
    '--user-data-dir=/tmp/test_chrome_audit_shots',
    '--window-size=960,540',
    '--remote-debugging-port=9251',
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
for _ in range(20):
    time.sleep(0.5)
    try:
        req = urllib.request.urlopen('http://127.0.0.1:9251/json')
        targets = json.loads(req.read().decode('utf-8'))
        page_targets = [tg for tg in targets if tg.get('type') == 'page']
        if page_targets:
            ws_url = page_targets[0]['webSocketDebuggerUrl']
            break
    except Exception:
        pass

parts = ws_url.replace('ws://', '').split('/', 1)
host, port = parts[0].split(':')
path = '/' + parts[1]

s = socket.create_connection((host, int(port)))
ws_handshake(s, parts[0], path)

ws_send(s, {'id': 1, 'method': 'Runtime.enable'})
ws_send(s, {'id': 2, 'method': 'Page.enable'})

ctx_id = None
start_time = time.time()
s.settimeout(1.0)
while time.time() - start_time < 3.5:
    try:
        msg = ws_recv(s)
        if not msg:
            break
        if msg.get('method') == 'Runtime.executionContextCreated':
            ctx_id = msg.get('params', {}).get('context', {}).get('id')
    except socket.timeout:
        pass

def take_screen(filename, expr_before=None, wait_sec=0.8):
    if expr_before:
        ws_send(s, {'id': 50, 'method': 'Runtime.evaluate', 'params': {'contextId': ctx_id, 'expression': expr_before}})
        time.sleep(wait_sec)
    
    ws_send(s, {'id': 51, 'method': 'Page.captureScreenshot', 'params': {'format': 'png'}})
    
    s.settimeout(3.0)
    st = time.time()
    while time.time() - st < 3.0:
        try:
            msg = ws_recv(s)
            if not msg:
                break
            if msg.get('id') == 51:
                data = msg.get('result', {}).get('data')
                if data:
                    out_path = os.path.join(SHOTS_DIR, filename)
                    with open(out_path, 'wb') as f:
                        f.write(base64.b64decode(data))
                    print(f'Captured {filename} ({len(data)} bytes)')
                break
        except socket.timeout:
            break

# 1. World Map Island
take_screen('01_world_map_island.png', 'window.game.scene.start("WorldSelectScene", { world: 0 })', 1.0)

# 2. World 1 (Desert Ruins - Level 5 with balanced trampolines)
take_screen('02_world1_desert_level5_balanced.png', 'window.game.scene.start("GameScene", { world: 0, level: 4, deaths: 0 })', 1.0)

# 3. World 2 (Frost Spire - Glacier Floes & Falling Icicles)
take_screen('03_world2_frost_glaciers.png', 'window.game.scene.start("GameScene", { world: 1, level: 2, deaths: 0 })', 1.0)

# 4. World 3 (Shadow Crypt - Mystic Obsidian Cavern & Lasers)
take_screen('04_world3_shadow_crypt.png', 'window.game.scene.start("GameScene", { world: 2, level: 1, deaths: 0 })', 1.0)

# 5. World 4 (Gravity Nexus - Ceiling Walking)
take_screen('05_world4_gravity_nexus.png', 'window.game.scene.start("GameScene", { world: 3, level: 0, deaths: 0 })', 1.0)

# 6. World 5 (Glitch Core - Reality Distortion & Control Flips)
take_screen('06_world5_glitch_core.png', 'window.game.scene.start("GameScene", { world: 4, level: 0, deaths: 0 })', 1.0)

proc.terminate()
httpd.shutdown()
print('ALL AUDIT SCREENSHOTS SAVED SUCCESSFULLY!')
