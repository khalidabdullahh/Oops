import urllib.request, json, time, socket, base64, subprocess, http.server, socketserver, threading, struct, os

PORT = 8135
CDP_PORT = 9255
DIRECTORY = '/Users/khalidabdullah/AntiGravity/Oops!'
SHOTS_DIR = os.path.join(DIRECTORY, 'docs', 'mobile_viewport_tests')
os.makedirs(SHOTS_DIR, exist_ok=True)

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
    '--user-data-dir=/tmp/test_chrome_mobile_viewports',
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
for _ in range(30):
    time.sleep(0.4)
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
    print('Failed to obtain ws_url')
    proc.terminate()
    httpd.shutdown()
    exit(1)

parts = ws_url.replace('ws://', '').split('/', 1)
host_p, port_p = parts[0].split(':')
path = '/' + parts[1]

s = socket.create_connection((host_p, int(port_p)))
ws_handshake(s, parts[0], path)

ws_send(s, {'id': 1, 'method': 'Runtime.enable'})
ws_send(s, {'id': 2, 'method': 'Page.enable'})

ctx_id = None
st = time.time()
s.settimeout(1.0)
while time.time() - st < 3.5:
    try:
        msg = ws_recv(s)
        if not msg:
            break
        if msg.get('method') == 'Runtime.executionContextCreated':
            ctx_id = msg.get('params', {}).get('context', {}).get('id')
    except socket.timeout:
        pass

# Start GameScene
ws_send(s, {'id': 10, 'method': 'Runtime.evaluate', 'params': {'contextId': ctx_id, 'expression': 'window.game.scene.start("GameScene", { world: 0, level: 0, deaths: 0 })'}})
time.sleep(1.0)

viewports = [
    ('desktop_1280x720', 1280, 720, False),
    ('mobile_360x800', 360, 800, True),
    ('mobile_390x844', 390, 844, True),
    ('mobile_412x915', 412, 915, True),
    ('landscape_mobile_844x390', 844, 390, True),
    ('landscape_mobile_800x360', 800, 360, True)
]

inspect_code = '''
(() => {
  const canvas = document.querySelector("canvas");
  const gamepad = document.getElementById("mobile-gamepad");
  const btnJump = document.getElementById("btn-jump");
  const btnLeft = document.getElementById("btn-left");
  const btnRight = document.getElementById("btn-right");
  
  const cRect = canvas ? canvas.getBoundingClientRect() : null;
  const jRect = btnJump ? btnJump.getBoundingClientRect() : null;
  const lRect = btnLeft ? btnLeft.getBoundingClientRect() : null;
  
  return {
    viewport: { width: window.innerWidth, height: window.innerHeight },
    canvas: cRect ? {
      width: Math.round(cRect.width),
      height: Math.round(cRect.height),
      top: Math.round(cRect.top),
      left: Math.round(cRect.left),
      isHorizontallyCentered: Math.abs((window.innerWidth - cRect.width)/2 - cRect.left) < 3,
      isVerticallyCentered: Math.abs((window.innerHeight - cRect.height)/2 - cRect.top) < 3
    } : null,
    gamepadVisible: gamepad ? !gamepad.classList.contains("hidden") && window.getComputedStyle(gamepad).display !== "none" : false,
    btnJump: jRect ? {
      width: Math.round(jRect.width),
      height: Math.round(jRect.height),
      rightOffset: Math.round(window.innerWidth - jRect.right),
      bottomOffset: Math.round(window.innerHeight - jRect.bottom)
    } : null,
    btnLeft: lRect ? {
      width: Math.round(lRect.width),
      height: Math.round(lRect.height),
      leftOffset: Math.round(lRect.left),
      bottomOffset: Math.round(window.innerHeight - lRect.bottom)
    } : null
  };
})()
'''

all_results = []

for idx, (name, w, h, is_mob) in enumerate(viewports):
    msg_base = (idx + 1) * 100
    
    ws_send(s, {
        'id': msg_base + 1,
        'method': 'Emulation.setDeviceMetricsOverride',
        'params': {
            'width': w,
            'height': h,
            'deviceScaleFactor': 2,
            'mobile': is_mob,
            'fitWindow': False
        }
    })
    
    if is_mob:
        ws_send(s, {'id': msg_base + 2, 'method': 'Emulation.setTouchEmulationEnabled', 'params': {'enabled': True, 'maxTouchPoints': 5}})
    else:
        ws_send(s, {'id': msg_base + 2, 'method': 'Emulation.setTouchEmulationEnabled', 'params': {'enabled': False}})
    
    time.sleep(0.5)
    ws_send(s, {'id': msg_base + 3, 'method': 'Runtime.evaluate', 'params': {'contextId': ctx_id, 'expression': 'if (window.game && window.game.scale) window.game.scale.refresh(); MobileGamepad.show(window.game.scene.getScene("GameScene"));'}})
    time.sleep(0.5)
    
    ws_send(s, {'id': msg_base + 4, 'method': 'Runtime.evaluate', 'params': {'contextId': ctx_id, 'expression': inspect_code, 'returnByValue': True}})
    ws_send(s, {'id': msg_base + 5, 'method': 'Page.captureScreenshot', 'params': {'format': 'png'}})
    
    metrics = None
    st = time.time()
    s.settimeout(3.0)
    while time.time() - st < 3.0:
        try:
            msg = ws_recv(s)
            if not msg:
                break
            if msg.get('id') == msg_base + 4:
                metrics = msg.get('result', {}).get('result', {}).get('value')
            elif msg.get('id') == msg_base + 5:
                data = msg.get('result', {}).get('data')
                if data:
                    out_f = os.path.join(SHOTS_DIR, f'{name}.png')
                    with open(out_f, 'wb') as f:
                        f.write(base64.b64decode(data))
                    print(f'Captured: {out_f}')
                break
        except socket.timeout:
            break
            
    res = {'name': name, 'width': w, 'height': h, 'metrics': metrics}
    all_results.append(res)
    print(f'RESULT FOR {name}:')
    print(json.dumps(res, indent=2))

proc.terminate()
httpd.shutdown()
print('ALL MULTI-VIEWPORT TESTS COMPLETED SUCCESSFULLY!')
