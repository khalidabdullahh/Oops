import urllib.request, json, time, socket, base64, subprocess, http.server, socketserver, threading, struct, os, tempfile, shutil

PORT = 8996
CDP_PORT = 9996
DIRECTORY = '/Users/khalidabdullah/AntiGravity/Oops!'
tmp_dir = tempfile.mkdtemp(prefix='chrome_scr_test_')

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

# Wait for game to boot
for _ in range(20):
    is_booted = eval_js('!!(window.game && window.game.isBooted)')
    if is_booted:
        break
    time.sleep(0.5)

print("Game booted:", is_booted)

# Switch to WorldSelectScene
eval_js('''(() => {
    const scenes = window.game.scene.getScenes(true);
    if (scenes.length > 0) {
        scenes[0].scene.start("WorldSelectScene");
    }
})()''')
time.sleep(2.0)

# Take screenshot
scr = send_cmd('Page.captureScreenshot', {'format': 'png'})
data = scr.get('result', {}).get('data', '')
if data:
    with open('/tmp/test_world_select.png', 'wb') as f:
        f.write(base64.b64decode(data))
    print("Screenshot saved to /tmp/test_world_select.png, size:", len(data))

s.close()
proc.terminate()
httpd.shutdown()
shutil.rmtree(tmp_dir, ignore_errors=True)
