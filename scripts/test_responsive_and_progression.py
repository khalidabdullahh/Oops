import urllib.request, json, time, socket, base64, subprocess, http.server, socketserver, threading, struct, os, tempfile, shutil

PORT = 8298
CDP_PORT = 9328
DIRECTORY = '/Users/khalidabdullah/AntiGravity/Oops!'
tmp_dir = tempfile.mkdtemp(prefix='chrome_responsive_')

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
    b1, b2 = header[0], header[1]
    opcode = b1 & 0x0F
    is_masked = bool(b2 & 0x80)
    length = b2 & 0x7F
    if length == 126:
        data = sock.recv(2)
        length = struct.unpack('>H', data)[0]
    elif length == 127:
        data = sock.recv(8)
        length = struct.unpack('>Q', data)[0]
    
    mask = sock.recv(4) if is_masked else None
    body = b''
    while len(body) < length:
        chunk = sock.recv(length - len(body))
        if not chunk:
            break
        body += chunk
    if is_masked:
        body = bytearray(b ^ mask[i % 4] for i, b in enumerate(body))
    return json.loads(body.decode('utf-8', errors='ignore'))

try:
    tabs = []
    for _ in range(50):
        try:
            tabs_data = urllib.request.urlopen(f'http://127.0.0.1:{CDP_PORT}/json').read()
            loaded_tabs = json.loads(tabs_data.decode())
            if len(loaded_tabs) > 0 and 'webSocketDebuggerUrl' in loaded_tabs[0]:
                tabs = loaded_tabs
                break
        except Exception:
            pass
        time.sleep(0.2)

    if not tabs:
        raise RuntimeError("Failed to connect to Chrome CDP within 10s")

    target = tabs[0]
    ws_url = target['webSocketDebuggerUrl']
    ws_path = ws_url.split(f':{CDP_PORT}')[1]
    
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.connect(('127.0.0.1', CDP_PORT))
    ws_handshake(sock, f'127.0.0.1:{CDP_PORT}', ws_path)
    
    msg_id = 1
    def send_cmd(method, params=None):
        global msg_id
        msg_id += 1
        payload = {"id": msg_id, "method": method, "params": params or {}}
        ws_send(sock, payload)
        while True:
            res = ws_recv(sock)
            if res and res.get("id") == msg_id:
                return res.get("result", {})

    send_cmd("Runtime.enable")
    send_cmd("Page.enable")
    
    # Wait for game to be booted
    print("Waiting for Phaser game to boot...")
    for _ in range(30):
        time.sleep(0.4)
        chk = send_cmd("Runtime.evaluate", {
            "expression": "!!(window.game && window.game.isBooted && window.game.scene.getScenes(true).length > 0)",
            "returnByValue": True
        })
        if chk.get("result", {}).get("value") is True:
            print("Phaser game booted successfully!")
            break

    viewports = [
        ("Desktop 1280x720", 1280, 720, False),
        ("360x800 portrait", 360, 800, True),
        ("390x844 portrait", 390, 844, True),
        ("412x915 portrait", 412, 915, True),
        ("800x360 landscape", 800, 360, False),
        ("844x390 landscape", 844, 390, False),
        ("915x412 landscape", 915, 412, False)
    ]

    print("\n=== Testing Responsive Layouts Across 7 Viewports ===")
    for name, w, h, is_mobile in viewports:
        send_cmd("Emulation.setDeviceMetricsOverride", {
            "width": w,
            "height": h,
            "deviceScaleFactor": 2.0,
            "mobile": is_mobile
        })
        time.sleep(0.4)

        eval_res = send_cmd("Runtime.evaluate", {
            "expression": """
            (function() {
                var canvas = document.querySelector('canvas');
                var rotatePrompt = document.getElementById('rotate-prompt');
                var gamepad = document.getElementById('mobile-gamepad');
                var activeScenes = window.game ? window.game.scene.getScenes(true).map(function(s){ return s.scene.key; }) : [];
                return {
                    canvasExists: !!canvas,
                    canvasW: canvas ? canvas.clientWidth : 0,
                    canvasH: canvas ? canvas.clientHeight : 0,
                    rotatePromptExists: !!rotatePrompt,
                    gamepadDisplay: gamepad ? window.getComputedStyle(gamepad).display : 'none',
                    activeScenes: activeScenes
                };
            })()
            """,
            "returnByValue": True
        })
        val = eval_res.get("result", {}).get("value", {})
        print(f"[{name}] -> Canvas: {val.get('canvasW')}x{val.get('canvasH')} | Rotate Prompt: {val.get('rotatePromptExists')} | Gamepad: {val.get('gamepadDisplay')} | Active Scenes: {val.get('activeScenes')}")

    print("\n=== Testing Handcrafted Level Inspection & World 2 Level 6 ===")
    eval_start = send_cmd("Runtime.evaluate", {
        "expression": """
        (function() {
            window.game.scene.stop("IntroScene");
            window.game.scene.stop("WorldSelectScene");
            window.game.scene.start("GameScene", { world: 1, level: 5, deaths: 0 });
            return { started: true };
        })()
        """,
        "returnByValue": True
    })
    time.sleep(0.8)

    eval_inspect = send_cmd("Runtime.evaluate", {
        "expression": """
        (function() {
            var g = window.game.scene.getScene("GameScene");
            if (!g) return { error: "No GameScene" };
            return {
                world: g.currentWorld,
                level: g.currentLevel,
                platformsCount: g.platforms.getChildren().length,
                iciclesCount: g.icicles.getChildren().length,
                spikesCount: g.spikes.getChildren().length,
                exitGateX: g.exitGate ? g.exitGate.x : null,
                exitGateY: g.exitGate ? g.exitGate.y : null
            };
        })()
        """,
        "returnByValue": True
    })
    print("World 2 Level 6 Inspection:", eval_inspect.get("result", {}).get("value"))

    print("\n=== Testing World 1 Level 6 Fake Door Trap ===")
    send_cmd("Runtime.evaluate", {
        "expression": 'window.game.scene.start("GameScene", { world: 0, level: 5, deaths: 0 });',
        "returnByValue": True
    })
    time.sleep(0.8)
    eval_w1l6 = send_cmd("Runtime.evaluate", {
        "expression": """
        (function() {
            var g = window.game.scene.getScene("GameScene");
            return {
                world: g.currentWorld,
                level: g.currentLevel,
                platformsCount: g.platforms.getChildren().length,
                trampolinesCount: g.trampolines.getChildren().length,
                spikesCount: g.spikes.getChildren().length,
                exitGateX: g.exitGate ? g.exitGate.x : null,
                exitGateY: g.exitGate ? g.exitGate.y : null
            };
        })()
        """,
        "returnByValue": True
    })
    print("World 1 Level 6 Inspection:", eval_w1l6.get("result", {}).get("value"))

    print("\n=== Testing World 3 Level 5 Laser Crusher Chamber ===")
    send_cmd("Runtime.evaluate", {
        "expression": 'window.game.scene.start("GameScene", { world: 2, level: 4, deaths: 0 });',
        "returnByValue": True
    })
    time.sleep(0.8)
    eval_w3l5 = send_cmd("Runtime.evaluate", {
        "expression": """
        (function() {
            var g = window.game.scene.getScene("GameScene");
            return {
                world: g.currentWorld,
                level: g.currentLevel,
                lasersCount: g.lasers.getChildren().length,
                crushersCount: g.crushers.getChildren().length,
                platformsCount: g.platforms.getChildren().length,
                exitGateX: g.exitGate ? g.exitGate.x : null,
                exitGateY: g.exitGate ? g.exitGate.y : null
            };
        })()
        """,
        "returnByValue": True
    })
    print("World 3 Level 5 Inspection:", eval_w3l5.get("result", {}).get("value"))

    print("\n=== Testing World 4 Level 3 Ceiling Spikes Gravity Inversion ===")
    send_cmd("Runtime.evaluate", {
        "expression": 'window.game.scene.start("GameScene", { world: 3, level: 2, deaths: 0 });',
        "returnByValue": True
    })
    time.sleep(0.8)
    eval_w4l3 = send_cmd("Runtime.evaluate", {
        "expression": """
        (function() {
            var g = window.game.scene.getScene("GameScene");
            return {
                world: g.currentWorld,
                level: g.currentLevel,
                spikesCount: g.spikes.getChildren().length,
                platformsCount: g.platforms.getChildren().length,
                exitGateX: g.exitGate ? g.exitGate.x : null,
                exitGateY: g.exitGate ? g.exitGate.y : null
            };
        })()
        """,
        "returnByValue": True
    })
    print("World 4 Level 3 Inspection:", eval_w4l3.get("result", {}).get("value"))

    print("\n=== Testing World 5 Level 3 Phase-Cycling Bridge ===")
    send_cmd("Runtime.evaluate", {
        "expression": 'window.game.scene.start("GameScene", { world: 4, level: 2, deaths: 0 });',
        "returnByValue": True
    })
    time.sleep(0.8)
    eval_w5l3 = send_cmd("Runtime.evaluate", {
        "expression": """
        (function() {
            var g = window.game.scene.getScene("GameScene");
            return {
                world: g.currentWorld,
                level: g.currentLevel,
                glitchBlocksCount: g.glitchBlocks.length,
                spikesCount: g.spikes.getChildren().length,
                platformsCount: g.platforms.getChildren().length,
                exitGateX: g.exitGate ? g.exitGate.x : null,
                exitGateY: g.exitGate ? g.exitGate.y : null
            };
        })()
        """,
        "returnByValue": True
    })
    print("World 5 Level 3 Inspection:", eval_w5l3.get("result", {}).get("value"))

    sock.close()
finally:
    proc.terminate()
    shutil.rmtree(tmp_dir, ignore_errors=True)
