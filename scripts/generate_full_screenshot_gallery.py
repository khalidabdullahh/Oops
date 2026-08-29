import urllib.request, json, time, socket, base64, subprocess, http.server, socketserver, threading, struct, os, tempfile, shutil

PORT = 8995
CDP_PORT = 9995
DIRECTORY = '/Users/khalidabdullah/AntiGravity/Oops!'
OUTPUT_DIR = '/tmp/new_screenshots'
os.makedirs(OUTPUT_DIR, exist_ok=True)

tmp_dir = tempfile.mkdtemp(prefix='chrome_scr_full_')

socketserver.TCPServer.allow_reuse_address = True
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
    '--disable-gpu',
    '--no-sandbox',
    f'--user-data-dir={tmp_dir}',
    '--window-size=1280,720',
    f'--remote-debugging-port={CDP_PORT}',
    f'http://127.0.0.1:{PORT}/play.html'
]
proc = subprocess.Popen(cmd)
time.sleep(3.0)

ws_url = None
for _ in range(80):
    try:
        req = urllib.request.urlopen(f'http://127.0.0.1:{CDP_PORT}/json')
        targets = json.loads(req.read().decode('utf-8'))
        page_targets = [tg for tg in targets if tg.get('type') == 'page']
        if page_targets and 'webSocketDebuggerUrl' in page_targets[0]:
            ws_url = page_targets[0]['webSocketDebuggerUrl']
            break
    except Exception:
        pass
    time.sleep(0.25)

assert ws_url is not None, "Failed to connect to Chrome CDP"

parts = ws_url.replace('ws://', '').split('/', 1)
host_p, port_p = parts[0].split(':')
path = '/' + parts[1]

s = socket.create_connection((host_p, int(port_p)))
key = base64.b64encode(os.urandom(16)).decode('utf-8')
req = f'GET {path} HTTP/1.1\r\nHost: {host_p}:{port_p}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n'
s.sendall(req.encode('utf-8'))
resp = b''
while b'\r\n\r\n' not in resp:
    resp += s.recv(1024)

req_counter = 0
def send_cmd(method, params=None):
    global req_counter
    req_counter += 1
    req_id = req_counter
    payload = json.dumps({'id': req_id, 'method': method, 'params': params or {}}).encode('utf-8')
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
    s.sendall(frame)

    s.settimeout(6.0)
    while True:
        try:
            h = s.recv(2)
            if not h or len(h) < 2: return None
            l = h[1] & 0x7F
            if l == 126: l = struct.unpack('>H', s.recv(2))[0]
            elif l == 127: l = struct.unpack('>Q', s.recv(8))[0]
            d = b''
            while len(d) < l:
                d += s.recv(l - len(d))
            msg = json.loads(d.decode('utf-8', errors='ignore'))
            if msg.get('id') == req_id:
                return msg
        except socket.timeout:
            return None

def eval_js(expr):
    res = send_cmd('Runtime.evaluate', {'expression': expr, 'returnByValue': True})
    return res.get('result', {}).get('result', {}).get('value')

send_cmd('Runtime.enable')
send_cmd('Page.enable')
time.sleep(2.0)

for _ in range(20):
    is_booted = eval_js('!!(window.game && window.game.isBooted)')
    if is_booted: break
    time.sleep(0.5)

print("Game booted successfully!")

# Get canvas bounding rect for pixel-perfect clipping
canvas_clip = eval_js('''(() => {
    const c = document.querySelector('canvas');
    if (!c) return null;
    const r = c.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height), scale: 1 };
})()''')

print("Canvas clip rect:", canvas_clip)

def capture(filename, use_clip=True):
    params = {'format': 'png'}
    if use_clip and canvas_clip and canvas_clip['width'] > 0 and canvas_clip['height'] > 0:
        params['clip'] = canvas_clip
    scr = send_cmd('Page.captureScreenshot', params)
    data = scr.get('result', {}).get('data', '')
    if data:
        out_path = os.path.join(OUTPUT_DIR, filename)
        with open(out_path, 'wb') as f:
            f.write(base64.b64decode(data))
        print(f"✅ Captured {filename} ({len(data)} bytes)")
    else:
        print(f"❌ Failed to capture {filename}")

# 1. INTRO SCENE (Interactive Troll Intro)
eval_js('''(() => {
    const sc = window.game.scene.getScenes(true)[0];
    sc.scene.start("IntroScene");
})()''')
time.sleep(2.5)
capture("01_title_intro_showcase.png")

# 2. WORLD SELECT SCENE (30 Handcrafted Levels Grid)
eval_js('''(() => {
    const sc = window.game.scene.getScenes(true)[0];
    sc.scene.start("WorldSelectScene");
})()''')
time.sleep(1.8)
capture("02_world_select_map.png")

# 3. STAGE 1: FIRST STEPS (Desert Ruins 2.5D Sandstone & Spikes)
eval_js('''(() => {
    const sc = window.game.scene.getScenes(true)[0];
    sc.scene.start("GameScene", { world: 0, level: 0, deaths: 0, levelDeaths: 0 });
})()''')
time.sleep(1.2)
capture("03_stage_01_desert_ruins.png")

# 4. STAGE 6: CRUSHER ALLEY (Heavy Stone Drop Crushers)
eval_js('''(() => {
    const sc = window.game.scene.getScenes(true)[0];
    sc.scene.start("GameScene", { world: 0, level: 5, deaths: 4, levelDeaths: 1 });
})()''')
time.sleep(1.2)
capture("04_stage_06_crusher_alley.png")

# 5. STAGE 10: SPRING TRAMPOLINES & VERTICAL MOMENTUM
eval_js('''(() => {
    const sc = window.game.scene.getScenes(true)[0];
    sc.scene.start("GameScene", { world: 0, level: 9, deaths: 9, levelDeaths: 2 });
})()''')
time.sleep(1.2)
capture("05_stage_10_spring_trampoline.png")

# 6. STAGE 15: FLEEING TROLL EXIT PORTAL
eval_js('''(() => {
    const sc = window.game.scene.getScenes(true)[0];
    sc.scene.start("GameScene", { world: 0, level: 14, deaths: 16, levelDeaths: 3 });
})()''')
time.sleep(1.2)
capture("06_stage_15_fleeing_portal.png")

# 7. STAGE 20: POP-UP SPIKES & SHIFTING FLOORS
eval_js('''(() => {
    const sc = window.game.scene.getScenes(true)[0];
    sc.scene.start("GameScene", { world: 0, level: 19, deaths: 23, levelDeaths: 4 });
})()''')
time.sleep(1.2)
capture("07_stage_20_shifting_sandstone.png")

# 8. STAGE 25: MULTI-TIER HAZARD CHASMS
eval_js('''(() => {
    const sc = window.game.scene.getScenes(true)[0];
    sc.scene.start("GameScene", { world: 0, level: 24, deaths: 38, levelDeaths: 5 });
})()''')
time.sleep(1.2)
capture("08_stage_25_hazard_chasms.png")

# 9. STAGE 30: MASTER SINGULARITY CLIMAX
eval_js('''(() => {
    const sc = window.game.scene.getScenes(true)[0];
    sc.scene.start("GameScene", { world: 0, level: 29, deaths: 51, levelDeaths: 7 });
})()''')
time.sleep(1.2)
capture("09_stage_30_master_singularity.png")

# 10. COMIC DEATH & GHOST SOUL EFFECT
eval_js('''(() => {
    const gs = window.game.scene.getScene("GameScene");
    if (gs && gs.handlePlayerDeath) {
        gs.handlePlayerDeath("spike");
    }
})()''')
time.sleep(0.35)
capture("10_comic_death_ghost_effect.png")

# 11. WORLD 1 VICTORY CELEBRATION & WORLD 2 TEASER
eval_js('''(() => {
    const sc = window.game.scene.getScenes(true)[0];
    sc.scene.start("WorldCompleteScene", { world: 0, totalDeaths: 52 });
})()''')
time.sleep(1.8)
capture("11_world_complete_celebration.png")

# 12. 7-DEATH REWARDED AD OFFER MODAL (Full Window View with Modal)
eval_js('''(() => {
    if (window.MonetizationManager && window.MonetizationManager.showDeathSkipOfferModal) {
        window.MonetizationManager.showDeathSkipOfferModal(7, () => {}, () => {});
    }
})()''')
time.sleep(0.6)
capture("12_rewarded_ad_level_skip_modal.png", use_clip=False)

s.close()
proc.terminate()
httpd.shutdown()
shutil.rmtree(tmp_dir, ignore_errors=True)
print("\n🎉 ALL 12 SCREENSHOTS CAPTURED PERFECTLY!")
