import urllib.request, json, time, socket, base64, subprocess, http.server, socketserver, threading, struct, os, tempfile, shutil

PORT = 8219
CDP_PORT = 9319
DIRECTORY = '/Users/khalidabdullah/AntiGravity/Oops!'
tmp_dir = tempfile.mkdtemp(prefix='chrome_monetize_test_')

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
    s.settimeout(2.0)
    while time.time() - st < 2.0:
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

send_cmd('Runtime.enable')
send_cmd('Page.enable')

time.sleep(3.0)

print("\n=== 🧪 TESTING MONETIZATION & REWARDED AD FLOW ===")

# 1. Start GameScene at Level 1 with 0 deaths
eval_js('window.game.scene.start("GameScene", { world: 0, level: 0, deaths: 0, levelDeaths: 0, skipOfferUnlocked: false });')
time.sleep(0.5)

state1 = eval_js('''(() => {
    var g = window.game.scene.getScene("GameScene");
    var modal = document.getElementById("rewarded-ad-offer-modal");
    var deckSkip = document.getElementById("deck-btn-skip");
    var isModalVisible = modal && !modal.classList.contains("hidden") && modal.style.display !== "none";
    var isSkipVisible = (deckSkip && !deckSkip.classList.contains("hidden") && deckSkip.style.display !== "none") ||
                        (g && g.hudSkipBtn && g.hudSkipBtn.visible);
    return {
        level: g.currentLevel + 1,
        deaths: g.deaths,
        levelDeaths: g.levelDeaths,
        modalVisible: isModalVisible,
        skipVisible: isSkipVisible
    };
})()''')
print("Initial State:", state1)
assert state1['levelDeaths'] == 0
assert state1['modalVisible'] == False
assert state1['skipVisible'] == False
print("✅ Test 1 Passed: Level 1 starts with 0 deaths, no popup, no skip button.")

# 2. Trigger 6 Deaths (waiting 0.55s between deaths for respawn)
for i in range(1, 7):
    eval_js('window.game.scene.getScene("GameScene").onPlayerDie();')
    time.sleep(0.55)

state_6deaths = eval_js('''(() => {
    var g = window.game.scene.getScene("GameScene");
    var modal = document.getElementById("rewarded-ad-offer-modal");
    var isModalVisible = modal && !modal.classList.contains("hidden") && modal.style.display !== "none";
    return {
        levelDeaths: g.levelDeaths,
        modalVisible: isModalVisible
    };
})()''')
print("State at 6 Deaths:", state_6deaths)
assert state_6deaths['levelDeaths'] == 6
assert state_6deaths['modalVisible'] == False
print("✅ Test 2 Passed: Deaths 1-6 do NOT show offer popup.")

# 3. Trigger 7th Death
eval_js('window.game.scene.getScene("GameScene").onPlayerDie();')
time.sleep(0.6)

state_7deaths = eval_js('''(() => {
    var g = window.game.scene.getScene("GameScene");
    var modal = document.getElementById("rewarded-ad-offer-modal");
    var title = modal ? modal.querySelector(".ad-offer-title").textContent : "";
    var isModalVisible = modal && !modal.classList.contains("hidden") && modal.style.display !== "none";
    return {
        levelDeaths: g.levelDeaths,
        skipOfferUnlocked: g.skipOfferUnlocked,
        modalVisible: isModalVisible,
        modalTitle: title
    };
})()''')
print("State at 7th Death:", state_7deaths)
assert state_7deaths['levelDeaths'] == 7
assert state_7deaths['skipOfferUnlocked'] == True
assert state_7deaths['modalVisible'] == True
assert "OOPS!" in state_7deaths['modalTitle']
print("✅ Test 3 Passed: 7th death triggers exactly one rewarded ad popup offer!")

# 4. Press "NO THANKS"
eval_js('document.getElementById("btn-ad-decline").click();')
time.sleep(0.6)

state_declined = eval_js('''(() => {
    var g = window.game.scene.getScene("GameScene");
    var modal = document.getElementById("rewarded-ad-offer-modal");
    var deckSkip = document.getElementById("deck-btn-skip");
    var isModalVisible = modal && !modal.classList.contains("hidden") && modal.style.display !== "none";
    var isSkipVisible = (deckSkip && !deckSkip.classList.contains("hidden") && deckSkip.style.display !== "none") ||
                        (g && g.hudSkipBtn && g.hudSkipBtn.visible);
    return {
        modalVisible: isModalVisible,
        skipVisible: isSkipVisible,
        skipOfferUnlocked: g.skipOfferUnlocked
    };
})()''')
print("State after declining offer:", state_declined)
assert state_declined['modalVisible'] == False
assert state_declined['skipVisible'] == True
print("✅ Test 4 Passed: 'NO THANKS' closes modal and unlocks persistent Skip Level button.")

# 5. Trigger 8th and 9th deaths (Confirm modal does NOT repeat)
eval_js('window.game.scene.getScene("GameScene").onPlayerDie();')
time.sleep(0.55)
eval_js('window.game.scene.getScene("GameScene").onPlayerDie();')
time.sleep(0.6)

state_more_deaths = eval_js('''(() => {
    var g = window.game.scene.getScene("GameScene");
    var modal = document.getElementById("rewarded-ad-offer-modal");
    var isModalVisible = modal && !modal.classList.contains("hidden") && modal.style.display !== "none";
    return {
        levelDeaths: g.levelDeaths,
        modalVisible: isModalVisible,
        skipVisible: g.hudSkipBtn ? g.hudSkipBtn.visible : false
    };
})()''')
print("State at 9 Deaths:", state_more_deaths)
assert state_more_deaths['levelDeaths'] == 9
assert state_more_deaths['modalVisible'] == False
assert state_more_deaths['skipVisible'] == True
print("✅ Test 5 Passed: Deaths 8 & 9 do NOT show popup again; Skip button remains available.")

# 6. Test Ad Cancellation Flow
eval_js('MonetizationManager.triggerRewardedFlow();')
time.sleep(0.3)
eval_js('document.getElementById("btn-sim-cancel").click();')
time.sleep(0.3)

state_cancelled = eval_js('''(() => {
    var g = window.game.scene.getScene("GameScene");
    return {
        level: g.currentLevel + 1,
        isComplete: g.isComplete,
        skipVisible: g.hudSkipBtn ? g.hudSkipBtn.visible : false
    };
})()''')
print("State after cancelled ad:", state_cancelled)
assert state_cancelled['level'] == 1
assert state_cancelled['isComplete'] == False
assert state_cancelled['skipVisible'] == True
print("✅ Test 6 Passed: Cancelled ad does NOT skip level; player stays on Level 1.")

# 7. Test Ad Completion & Reward Flow
eval_js('MonetizationManager.triggerRewardedFlow();')
time.sleep(0.3)
eval_js('document.getElementById("btn-sim-complete").click();')
time.sleep(1.0) # wait for skip animation and restart to Level 2

state_level2 = eval_js('''(() => {
    var g = window.game.scene.getScene("GameScene");
    var modal = document.getElementById("rewarded-ad-offer-modal");
    var deckSkip = document.getElementById("deck-btn-skip");
    var isModalVisible = modal && !modal.classList.contains("hidden") && modal.style.display !== "none";
    var isSkipVisible = (deckSkip && !deckSkip.classList.contains("hidden") && deckSkip.style.display !== "none") ||
                        (g && g.hudSkipBtn && g.hudSkipBtn.visible);
    return {
        level: g.currentLevel + 1,
        levelDeaths: g.levelDeaths,
        skipOfferUnlocked: g.skipOfferUnlocked,
        modalVisible: isModalVisible,
        skipVisible: isSkipVisible
    };
})()''')
print("State after level skip (Level 2):", state_level2)
assert state_level2['level'] == 2
assert state_level2['levelDeaths'] == 0
assert state_level2['skipOfferUnlocked'] == False
assert state_level2['modalVisible'] == False
assert state_level2['skipVisible'] == False
print("✅ Test 7 Passed: Rewarded ad completed, Level 1 skipped to Level 2 with clean fresh 0 death counter!")

print("\n🎉 ALL 7 MONETIZATION & REWARDED AD TESTS PASSED WITH 100% SUCCESS!")

s.close()
proc.terminate()
httpd.shutdown()
shutil.rmtree(tmp_dir, ignore_errors=True)
