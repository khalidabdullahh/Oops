import urllib.request, json, time, socket, base64, subprocess, http.server, socketserver, threading, struct, os, tempfile, shutil

PORT = 8235
CDP_PORT = 9335
DIRECTORY = '/Users/khalidabdullah/AntiGravity/Oops!'
tmp_dir = tempfile.mkdtemp(prefix='chrome_world30_test_')

subprocess.run(["pkill", "-f", "Google Chrome"], check=False)
time.sleep(0.5)

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    def log_message(self, format, *args):
        pass

socketserver.TCPServer.allow_reuse_address = True
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

msg_id = 1
def send_cmd(method, params=None):
    global msg_id
    msg_id += 1
    ws_send(s, {'id': msg_id, 'method': method, 'params': params or {}})
    st = time.time()
    s.settimeout(3.0)
    while time.time() - st < 3.0:
        try:
            msg = ws_recv(s)
            if msg and msg.get('id') == msg_id:
                return msg.get('result', {})
        except socket.timeout:
            break
    return {}

def eval_js(expr):
    res = send_cmd('Runtime.evaluate', {'expression': expr, 'returnByValue': True})
    return res.get('result', {}).get('value')

def capture_screenshot(filename, w, h, is_mobile=True):
    send_cmd('Emulation.setDeviceMetricsOverride', {
        'width': w,
        'height': h,
        'deviceScaleFactor': 2,
        'mobile': is_mobile,
        'screenOrientation': {
            'angle': 0 if h > w else 90,
            'type': 'portraitPrimary' if h > w else 'landscapePrimary'
        }
    })
    send_cmd('Emulation.setTouchEmulationEnabled', {'enabled': is_mobile})
    eval_js('window.dispatchEvent(new Event("resize"));')
    time.sleep(0.4)
    res = send_cmd('Page.captureScreenshot', {'format': 'png'})
    data = base64.b64decode(res['data'])
    out_path = os.path.join('/Users/khalidabdullah/.gemini/antigravity/brain/bf5c2eba-890e-4c1e-8ee6-57099f2c6918/.tempmediaStorage', filename)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, 'wb') as f:
        f.write(data)
    print(f"Captured: {out_path} ({len(data)} bytes)")

send_cmd('Runtime.enable')
send_cmd('Page.enable')

time.sleep(3.0)

print("\n=== 🧪 1. TESTING LEVEL DEATH VS TOTAL DEATH DISPLAY ===")

# Start GameScene at Level 5 with 14 total deaths and 0 level deaths
eval_js('window.game.scene.start("GameScene", { world: 0, level: 4, deaths: 14, levelDeaths: 0 });')
time.sleep(0.5)

d_state1 = eval_js('''(() => {
    var g = window.game.scene.getScene("GameScene");
    var deckInfo = document.getElementById("deck-level-info");
    return {
        level: g.currentLevel + 1,
        deaths: g.deaths,
        levelDeaths: g.levelDeaths,
        hudDeathText: g.deathText ? g.deathText.text : "",
        deckInfoText: deckInfo ? deckInfo.textContent : ""
    };
})()''')
print("Level 5 (0 level deaths, 14 total deaths):", d_state1)
assert d_state1['levelDeaths'] == 0
assert d_state1['deaths'] == 14
assert "LV:0" in d_state1['hudDeathText'] or "LV: 0" in d_state1['hudDeathText']
assert "TOT:14" in d_state1['hudDeathText'] or "TOT: 14" in d_state1['hudDeathText']
assert "LV: 0" in d_state1['deckInfoText']
assert "TOT: 14" in d_state1['deckInfoText']
print("✅ Test 1 Passed: Level deaths (0) and Total deaths (14) are distinctly separated!")

# Die twice on Level 5
eval_js('window.game.scene.getScene("GameScene").onPlayerDie();')
time.sleep(0.55)
eval_js('window.game.scene.getScene("GameScene").onPlayerDie();')
time.sleep(0.6)

d_state2 = eval_js('''(() => {
    var g = window.game.scene.getScene("GameScene");
    var deckInfo = document.getElementById("deck-level-info");
    return {
        levelDeaths: g.levelDeaths,
        deaths: g.deaths,
        hudDeathText: g.deathText ? g.deathText.text : "",
        deckInfoText: deckInfo ? deckInfo.textContent : ""
    };
})()''')
print("Level 5 after 2 deaths:", d_state2)
assert d_state2['levelDeaths'] == 2
assert d_state2['deaths'] == 16
assert "LV:2" in d_state2['hudDeathText']
assert "TOT:16" in d_state2['hudDeathText']
assert "LV: 2" in d_state2['deckInfoText']
assert "TOT: 16" in d_state2['deckInfoText']
print("✅ Test 2 Passed: Deaths increment both level counter (2) and total counter (16) accurately!")

print("\n=== 🧪 2. TESTING WORLD 1 LEVEL 30 COMPLETION SCREEN ===")

# Start GameScene at Level 30 (index 29)
eval_js('window.game.scene.start("GameScene", { world: 0, level: 29, deaths: 42, levelDeaths: 1 });')
time.sleep(0.5)

# Trigger completion on Level 30
eval_js('window.game.scene.getScene("GameScene").skipCurrentLevel();')
time.sleep(1.2) # wait for transition to WorldCompleteScene

w30_state = eval_js('''(() => {
    var isWorldCompleteActive = window.game.scene.isActive("WorldCompleteScene");
    var wcScene = window.game.scene.getScene("WorldCompleteScene");
    return {
        isActive: isWorldCompleteActive,
        totalDeaths: wcScene ? wcScene.totalDeaths : null
    };
})()''')
print("State after Level 30 completion:", w30_state)
assert w30_state['isActive'] == True
assert w30_state['totalDeaths'] == 42
print("✅ Test 3 Passed: Level 30 completion smoothly triggers WorldCompleteScene!")

# Capture screenshots of WorldCompleteScene
capture_screenshot('world1_complete_landscape.png', 844, 390, True)
capture_screenshot('world1_complete_portrait.png', 390, 844, True)

s.close()
proc.terminate()
httpd.shutdown()
shutil.rmtree(tmp_dir, ignore_errors=True)
