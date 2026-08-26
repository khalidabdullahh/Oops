import urllib.request, json, time, socket, base64, subprocess, http.server, socketserver, threading, struct, os, tempfile, shutil

PORT = 8205
CDP_PORT = 9310
DIRECTORY = '/Users/khalidabdullah/AntiGravity/Oops!'
tmp_dir = tempfile.mkdtemp(prefix='chrome_snap_')

subprocess.run(["pkill", "-f", "Google Chrome"], check=False)
time.sleep(0.5)

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
    '--window-size=390,844',
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
        chunk = sock.recv(length - len(data))
        if not chunk:
            break
        data += chunk
    return json.loads(data.decode('utf-8', errors='ignore'))

ws_url = None
for _ in range(40):
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

if not ws_url:
    print("Could not find page target")
    exit(1)

parts = ws_url.replace('ws://', '').split('/', 1)
host_p, port_p = parts[0].split(':')
path = '/' + parts[1]

s = socket.create_connection((host_p, int(port_p)))
ws_handshake(s, parts[0], path)

msg_id = 1
def send_cmd(method, params=None):
    global msg_id
    msg_id += 1
    ws_send(s, {'id': msg_id, 'method': method, 'params': params or {}})
    st = time.time()
    s.settimeout(2.0)
    while time.time() - st < 2.0:
        try:
            msg = ws_recv(s)
            if msg and msg.get('id') == msg_id:
                return msg.get('result', {})
        except socket.timeout:
            break
    return {}

send_cmd('Runtime.enable')
send_cmd('Page.enable')

time.sleep(3.5)

out_dir = '/Users/khalidabdullah/.gemini/antigravity/brain/bf5c2eba-890e-4c1e-8ee6-57099f2c6918/.tempmediaStorage'
os.makedirs(out_dir, exist_ok=True)

def take_snap(filename, width, height, is_mobile):
    send_cmd('Emulation.setDeviceMetricsOverride', {
        'width': width,
        'height': height,
        'deviceScaleFactor': 2.0,
        'mobile': is_mobile
    })
    time.sleep(0.5)
    res = send_cmd('Page.captureScreenshot', {'format': 'png'})
    if 'data' in res:
        img_bytes = base64.b64decode(res['data'])
        out_path = os.path.join(out_dir, filename)
        with open(out_path, 'wb') as f:
            f.write(img_bytes)
        print(f"Captured: {out_path} ({len(img_bytes)} bytes)")
        return out_path
    return None

# 1. Capture Mobile Portrait - WorldSelect / Intro
snap1 = take_snap('mobile_portrait_intro.png', 390, 844, True)

# 2. Transition to GameScene and capture Portrait
send_cmd('Runtime.evaluate', {
    'expression': 'window.game.scene.start("GameScene", { world: 0, level: 0, deaths: 0 });'
})
time.sleep(0.8)
snap2 = take_snap('mobile_portrait_gameplay.png', 390, 844, True)

# 3. Capture Mobile Landscape - Gameplay
snap3 = take_snap('mobile_landscape_gameplay.png', 844, 390, True)

# 4. Capture Mobile Landscape - World Map
send_cmd('Runtime.evaluate', {
    'expression': 'window.game.scene.start("WorldSelectScene");'
})
time.sleep(0.8)
snap4 = take_snap('mobile_landscape_worldmap.png', 844, 390, True)

# 5. Capture Mobile Portrait - World Map
snap5 = take_snap('mobile_portrait_worldmap.png', 390, 844, True)

s.close()
proc.terminate()
httpd.shutdown()
shutil.rmtree(tmp_dir, ignore_errors=True)
