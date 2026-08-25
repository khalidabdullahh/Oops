import urllib.request, json, time, socket, base64, subprocess, http.server, socketserver, threading, struct, os

PORT = 8118
DIRECTORY = '/Users/khalidabdullah/AntiGravity/Oops!'

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
    '--user-data-dir=/tmp/test_chrome_audit_full',
    '--window-size=960,540',
    '--remote-debugging-port=9249',
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
        req = urllib.request.urlopen('http://127.0.0.1:9249/json')
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

ws_send(s, {'id': 10, 'method': 'Runtime.evaluate', 'params': {'contextId': ctx_id, 'expression': 'window.game.scene.start("GameScene", { world: 0, level: 0, deaths: 0 })'}})
time.sleep(1.0)

audit_code = """
(() => {
  const issues = [];
  const scene = window.game.scene.getScene("GameScene");
  
  for (let w = 0; w < 5; w++) {
    for (let lvl = 0; lvl < 30; lvl++) {
      try {
        scene.currentWorld = w;
        scene.currentLevel = lvl;
        scene.platforms.clear(true, true);
        scene.spikes.clear(true, true);
        scene.crushers.clear(true, true);
        scene.icicles.clear(true, true);
        scene.lasers.clear(true, true);
        scene.trampolines.clear(true, true);
        scene.fallingPlatforms = [];
        scene.glitchBlocks = [];
        scene.customTriggers = [];
        if (scene.exitGate) scene.exitGate.destroy();

        scene.buildWorldLevel(w, lvl);

        if (!scene.exitGate) {
          issues.push({ world: w + 1, level: lvl + 1, issue: 'No exitGate found' });
          continue;
        }

        // Get all floor platforms sorted by X
        const plats = scene.platforms.getChildren().map(p => ({
          left: p.x - p.width/2,
          right: p.x + p.width/2,
          top: p.y - p.height/2,
          bottom: p.y + p.height/2,
          y: p.y,
          width: p.width
        })).filter(p => p.top > 50).sort((a, b) => a.left - b.left);

        if (plats.length === 0) {
          issues.push({ world: w + 1, level: lvl + 1, issue: 'No floor platforms found' });
          continue;
        }

        // Check spawn platform
        const spawnOnPlat = plats.some(p => p.left <= 80 && p.right >= 40 && p.top >= 350);
        if (!spawnOnPlat) {
          issues.push({ world: w + 1, level: lvl + 1, issue: 'Spawn is not on a solid platform' });
        }

        // Check gaps between consecutive platforms
        for (let i = 0; i < plats.length - 1; i++) {
          const gap = plats[i+1].left - plats[i].right;
          // In world 4 (gravity), ceiling/floor flip is used
          if (w !== 3 && gap > 150) {
            const hasTramp = scene.trampolines.getChildren().some(t => t.x >= plats[i].left && t.x <= plats[i].right);
            if (!hasTramp || gap > 240) {
              issues.push({ world: w + 1, level: lvl + 1, issue: `Gap too wide (${Math.round(gap)}px) between x=${Math.round(plats[i].right)} and x=${Math.round(plats[i+1].left)}` });
            }
          }
        }

        // Check if exit gate is on or above a reachable platform
        const exitX = scene.exitGate.x, exitY = scene.exitGate.y;
        const hasExitPlat = plats.some(p => p.left <= exitX + 50 && p.right >= exitX - 50);
        if (!hasExitPlat) {
          issues.push({ world: w + 1, level: lvl + 1, issue: `Exit gate at (${Math.round(exitX)}, ${Math.round(exitY)}) has no platform underneath` });
        }

      } catch (err) {
        issues.push({ world: w + 1, level: lvl + 1, issue: 'Runtime Crash: ' + err.message });
      }
    }
  }
  return JSON.stringify(issues);
})()
"""

ws_send(s, {'id': 100, 'method': 'Runtime.evaluate', 'params': {'contextId': ctx_id, 'expression': audit_code, 'returnByValue': True}})

s.settimeout(5.0)
start_time = time.time()
while time.time() - start_time < 5.0:
    try:
        msg = ws_recv(s)
        if not msg:
            break
        if msg.get('id') == 100:
            val = msg.get('result', {}).get('result', {}).get('value')
            print('AUDIT RESULT FOR 150 LEVELS:')
            print(val)
    except socket.timeout:
        break

proc.terminate()
httpd.shutdown()
