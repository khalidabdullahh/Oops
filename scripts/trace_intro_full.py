import urllib.request, json, time, socket, base64, subprocess, http.server, socketserver, threading, struct, os, tempfile, shutil

PORT = 8499
CDP_PORT = 9599
DIRECTORY = '/Users/khalidabdullah/AntiGravity/Oops!'
tmp_dir = tempfile.mkdtemp(prefix='chrome_trace_')

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

def capture_screen(filename):
    global msg_id
    msg_id += 1
    ws_send(s, {'id': msg_id, 'method': 'Page.captureScreenshot', 'params': {'format': 'png'}})
    st = time.time()
    s.settimeout(5.0)
    while time.time() - st < 5.0:
        try:
            m = ws_recv(s)
            if m and m.get('id') == msg_id:
                data = m.get('result', {}).get('data')
                if data:
                    with open(filename, 'wb') as f:
                        f.write(base64.b64decode(data))
                    print(f"Captured: {filename}")
                    return True
        except socket.timeout:
            break
    return False

# Poll for 8 seconds and log intro complete status
for step in range(16):
    time.sleep(0.5)
    info = eval_js("""(() => {
        var s = window.game.scene.getScene('IntroScene');
        return {
            t: (performance.now()/1000).toFixed(1),
            active: s ? s.scene.isActive() : false,
            introComplete: s ? !!s.introComplete : false
        };
    })()""")
    print(f"Step {step}:", info)
    if info and info.get('introComplete'):
        print("🎯 Intro completed successfully at step", step)
        capture_screen('/Users/khalidabdullah/.gemini/antigravity/brain/bf5c2eba-890e-4c1e-8ee6-57099f2c6918/.tempmediaStorage/intro_final_card.png')
        break

# Test skip button click
eval_js("window.game.scene.start('WorldSelectScene');")
time.sleep(0.8)
w_state = eval_js("[...window.game.scene.scenes.filter(s => s.scene.isActive()).map(s => s.scene.key)]")
print("World state after skip:", w_state)
capture_screen('/Users/khalidabdullah/.gemini/antigravity/brain/bf5c2eba-890e-4c1e-8ee6-57099f2c6918/.tempmediaStorage/world_select_final.png')

proc.terminate()
httpd.shutdown()
shutil.rmtree(tmp_dir, ignore_errors=True)
