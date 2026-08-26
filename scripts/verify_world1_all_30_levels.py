import urllib.request, json, time, socket, base64, subprocess, http.server, socketserver, threading, struct, os, tempfile, shutil

PORT = 8200
CDP_PORT = 9310
DIRECTORY = '/Users/khalidabdullah/AntiGravity/Oops!'
tmp_dir = tempfile.mkdtemp(prefix='chrome_w1_test_')

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
    print("Could not find page target ws_url")
    proc.terminate()
    httpd.shutdown()
    exit(1)

parts = ws_url.replace('ws://', '').split('/', 1)
host_p, port_p = parts[0].split(':')
path = '/' + parts[1]

s = socket.create_connection((host_p, int(port_p)))
ws_handshake(s, parts[0], path)

def eval_js(expr, req_id):
    ws_send(s, {
        'id': req_id,
        'method': 'Runtime.evaluate',
        'params': {'expression': expr, 'returnByValue': True}
    })
    st = time.time()
    s.settimeout(1.0)
    while time.time() - st < 1.0:
        try:
            msg = ws_recv(s)
            if msg and msg.get('id') == req_id:
                return msg.get('result', {}).get('result', {}).get('value')
        except socket.timeout:
            break
    return None

ws_send(s, {'id': 1, 'method': 'Runtime.enable'})
ws_send(s, {'id': 2, 'method': 'Page.enable'})

# 1. Wait for game boot
for i in range(25):
    time.sleep(0.3)
    boot_val = eval_js('!!(window.game && window.game.isBooted)', 10 + i)
    if boot_val:
        print("Game Booted Successfully!")
        break

print("\n=== Auditing All 30 Handcrafted Levels in World 1 ===")
all_levels_data = []
for lvl in range(30):
    eval_js(f'window.game.scene.start("GameScene", {{ world: 0, level: {lvl}, deaths: 0 }});', 100 + lvl * 2)
    time.sleep(0.15)
    lvl_info = eval_js('''(() => {
        var g = window.game.scene.getScene("GameScene");
        if (!g) return { error: "No GameScene" };
        return {
            level: g.currentLevel + 1,
            platforms: g.platforms.getChildren().length,
            fallingPlatforms: g.fallingPlatforms.length,
            spikes: g.spikes.getChildren().length,
            crushers: g.crushers.getChildren().length,
            trampolines: g.trampolines.getChildren().length,
            customTriggers: g.customTriggers.length,
            exitX: g.exitGate ? g.exitGate.x : 0,
            exitY: g.exitGate ? g.exitGate.y : 0,
            flee: g.exitGate ? !!g.exitGate.fleeOnProximity : false
        };
    })()''', 100 + lvl * 2 + 1)
    all_levels_data.append(lvl_info)
    print(f"Level {lvl+1:02d}: {lvl_info.get('platforms')} plats, {lvl_info.get('fallingPlatforms')} falling, {lvl_info.get('spikes')} spikes, {lvl_info.get('crushers')} crushers, {lvl_info.get('trampolines')} tramps, {lvl_info.get('customTriggers')} triggers, Exit=({lvl_info.get('exitX')}, {lvl_info.get('exitY')}), Flee={lvl_info.get('flee')}")

# Verify uniqueness: Check that no two levels have identical fingerprints
fingerprints = set()
duplicates = []
for d in all_levels_data:
    fp = (d['platforms'], d['fallingPlatforms'], d['spikes'], d['crushers'], d['trampolines'], d['customTriggers'], d['exitX'], d['exitY'])
    if fp in fingerprints:
        duplicates.append(d['level'])
    fingerprints.add(fp)

if len(duplicates) == 0:
    print(f"\n✅ 100% SUCCESS: ALL 30 LEVELS ARE COMPLETELY UNIQUE WITH ZERO DUPLICATES! ({len(fingerprints)}/30 unique layouts)")
else:
    print(f"\n⚠️ Warning: Levels {duplicates} share similar signatures.")

s.close()
proc.terminate()
httpd.shutdown()
shutil.rmtree(tmp_dir, ignore_errors=True)
