import urllib.request, json, time, socket, base64, subprocess, http.server, socketserver, threading, struct, os, tempfile, shutil

PORT = 8991
CDP_PORT = 9991
DIRECTORY = '/Users/khalidabdullah/AntiGravity/Oops!'
tmp_dir = tempfile.mkdtemp(prefix='chrome_robust_')

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
    '--disable-gpu',
    '--no-sandbox',
    f'--user-data-dir={tmp_dir}',
    '--window-size=1280,720',
    f'--remote-debugging-port={CDP_PORT}',
    f'http://127.0.0.1:{PORT}/index.html'
]
proc = subprocess.Popen(cmd)
time.sleep(2.0)

ws_url = None
for _ in range(50):
    try:
        req = urllib.request.urlopen(f'http://127.0.0.1:{CDP_PORT}/json')
        targets = json.loads(req.read().decode('utf-8'))
        page_targets = [tg for tg in targets if tg.get('type') == 'page']
        if page_targets and 'webSocketDebuggerUrl' in page_targets[0]:
            ws_url = page_targets[0]['webSocketDebuggerUrl']
            break
    except Exception:
        pass
    time.sleep(0.2)

print("CDP WS URL:", ws_url)
assert ws_url is not None, "Failed to connect to Chrome CDP"

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

parts = ws_url.replace('ws://', '').split('/', 1)
host_p, port_p = parts[0].split(':')
path = '/' + parts[1]
s = socket.create_connection((host_p, int(port_p)))
ws_handshake(s, parts[0], path)

msg_id = 1
def eval_js(expr):
    global msg_id
    msg_id += 1
    ws_send(s, {'id': msg_id, 'method': 'Runtime.evaluate', 'params': {'expression': expr, 'returnByValue': True}})
    st = time.time()
    s.settimeout(3.0)
    while time.time() - st < 3.0:
        try:
            m = ws_recv(s)
            if m and m.get('id') == msg_id:
                res = m.get('result', {}).get('result', {})
                return res.get('value')
        except socket.timeout:
            break
    return None

time.sleep(1.5)

# Verify MONETIZATION_CONFIG
pub_id = eval_js("MONETIZATION_CONFIG.publisherId")
print("Verified MONETIZATION_CONFIG.publisherId:", pub_id)
assert pub_id == "ca-pub-7942277005068512", f"Unexpected publisher ID: {pub_id}"

# Verify adBreak function
has_adbreak = eval_js("typeof window.adBreak === 'function'")
print("Verified window.adBreak exists:", has_adbreak)
assert has_adbreak is True, "window.adBreak is not a function"

# Verify 7 deaths threshold
deaths_thresh = eval_js("MONETIZATION_CONFIG.deathsThreshold")
print("Verified deathsThreshold:", deaths_thresh)
assert deaths_thresh == 7, "deathsThreshold is not 7"

# Test GameScene start and Monetization flow
eval_js("window.game.scene.start('GameScene', { world: 0, level: 0 });")
time.sleep(1.0)

game_state = eval_js("""(() => {
    var g = window.game.scene.getScene('GameScene');
    return {
        isActive: g.scene.isActive(),
        currentLevel: g.currentLevel,
        levelDeaths: g.levelDeaths,
        skipUnlocked: g.skipOfferUnlocked
    };
})()""")
print("GameScene initial state:", game_state)
assert game_state['isActive'] is True
assert game_state['levelDeaths'] == 0
assert game_state['skipUnlocked'] == False

# Trigger 7 deaths
for i in range(7):
    eval_js("""(() => {
        var g = window.game.scene.getScene('GameScene');
        g.isDead = false;
        g.onPlayerDie();
    })()""")
    time.sleep(0.55)

time.sleep(0.8) # Wait for delayedCall(450ms)

modal_state = eval_js("""(() => {
    var g = window.game.scene.getScene('GameScene');
    var modal = document.getElementById('rewarded-ad-offer-modal');
    return {
        levelDeaths: g.levelDeaths,
        skipUnlocked: g.skipOfferUnlocked,
        modalExists: !!modal,
        classList: modal ? modal.className : '',
        styleDisplay: modal ? modal.style.display : '',
        computedDisplay: modal ? window.getComputedStyle(modal).display : ''
    };
})()""")
print("Detailed state after 7 deaths:", modal_state)
assert modal_state['levelDeaths'] == 7
assert modal_state['skipUnlocked'] is True
assert modal_state['computedDisplay'] != 'none', f"Modal is not visible, computed display: {modal_state['computedDisplay']}"
print("✅ 7-Death Rewarded Ad Offer Modal successfully triggered and visible!")

# Test Declining offer
eval_js("MonetizationManager.declineOffer();")
time.sleep(0.5)

decline_state = eval_js("""(() => {
    var g = window.game.scene.getScene('GameScene');
    var deckBtn = document.getElementById('deck-btn-skip');
    var modal = document.getElementById('rewarded-ad-offer-modal');
    return {
        modalHidden: modal ? modal.classList.contains('hidden') : false,
        deckBtnVisible: deckBtn ? !deckBtn.classList.contains('hidden') : false,
        hudBtnVisible: g.hudSkipBtn ? g.hudSkipBtn.visible : false
    };
})()""")
print("State after declining offer:", decline_state)
assert decline_state['modalHidden'] is True
assert decline_state['deckBtnVisible'] is True
assert decline_state['hudBtnVisible'] is True
print("✅ Persistent Skip Level button successfully unlocked on deck & HUD!")

# Test Rewarded Ad Level Skip completion
eval_js("window.game.scene.getScene('GameScene').skipCurrentLevel();")
time.sleep(0.8)

skip_state = eval_js("""(() => {
    var g = window.game.scene.getScene('GameScene');
    return {
        isComplete: g.isComplete,
        skipOfferUsed: g.skipOfferUsed
    };
})()""")
print("State after skipCurrentLevel():", skip_state)
assert skip_state['isComplete'] is True
assert skip_state['skipOfferUsed'] is True
print("✅ Level skip awarded cleanly upon rewarded ad completion!")

proc.terminate()
httpd.shutdown()
shutil.rmtree(tmp_dir, ignore_errors=True)
print("🎉 ALL MONETIZATION TESTS PASSED WITH 100% INTEGRITY!")
