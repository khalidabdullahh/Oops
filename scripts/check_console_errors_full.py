import urllib.request, json, time, socket, base64, subprocess, http.server, socketserver, threading, struct, os, tempfile, shutil

PORT = 8200
CDP_PORT = 9320
DIRECTORY = '/Users/khalidabdullah/AntiGravity/Oops!'
tmp_dir = tempfile.mkdtemp(prefix='chrome_err_full_')

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
        data += sock.recv(length - len(data))
    return json.loads(data.decode('utf-8', errors='ignore'))

ws_url = None
for _ in range(35):
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

parts = ws_url.replace('ws://', '').split('/', 1)
host_p, port_p = parts[0].split(':')
path = '/' + parts[1]

s = socket.create_connection((host_p, int(port_p)))
ws_handshake(s, parts[0], path)

ws_send(s, {'id': 1, 'method': 'Runtime.enable'})
ws_send(s, {'id': 2, 'method': 'Page.enable'})
ws_send(s, {'id': 3, 'method': 'Log.enable'})

st = time.time()
s.settimeout(2.0)
logs = []
while time.time() - st < 4.0:
    try:
        msg = ws_recv(s)
        if not msg:
            break
        method = msg.get('method', '')
        if 'Console' in method or 'exceptionThrown' in method or 'entryAdded' in method:
            logs.append(msg)
            print('CDP EVENT:', json.dumps(msg))
    except socket.timeout:
        break

# Evaluate scene state
ws_send(s, {'id': 99, 'method': 'Runtime.evaluate', 'params': {
    'expression': '''(() => {
        const loader = document.getElementById("game-loader");
        return {
            hasLoaderInDom: !!loader,
            loaderOpacity: loader ? loader.style.opacity : null,
            phaserDefined: typeof Phaser !== 'undefined',
            gameObj: !!window.game,
            activeScenes: window.game ? window.game.scene.getScenes(true).map(s => s.scene.key) : []
        };
    })()''',
    'returnByValue': True
}})

st = time.time()
while time.time() - st < 2.0:
    try:
        msg = ws_recv(s)
        if msg and msg.get('id') == 99:
            print("STATE EVAL:", msg.get('result', {}).get('result', {}).get('value'))
            break
    except socket.timeout:
        break

proc.terminate()
httpd.shutdown()
shutil.rmtree(tmp_dir, ignore_errors=True)
