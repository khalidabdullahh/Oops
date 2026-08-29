import urllib.request, json, time, socket, base64, subprocess, http.server, socketserver, threading, struct, os, tempfile, shutil
import xml.etree.ElementTree as ET

PORT = 8997
CDP_PORT = 9997
DIRECTORY = '/Users/khalidabdullah/AntiGravity/Oops!'
tmp_dir = tempfile.mkdtemp(prefix='chrome_seo_suite_')

# 1. VERIFY ROBOTS.TXT
print("=== 🤖 1. ROBOTS.TXT VERIFICATION ===")
robots_path = os.path.join(DIRECTORY, 'robots.txt')
assert os.path.exists(robots_path), "robots.txt missing!"
with open(robots_path, 'r') as f:
    robots_content = f.read()
assert "User-agent: *" in robots_content
assert "Sitemap: https://oops-snowy-three.vercel.app/sitemap.xml" in robots_content
print("✅ robots.txt verified: Valid directives and sitemap reference present.")

# 2. VERIFY SITEMAP.XML
print("\n=== 🗺️ 2. SITEMAP.XML VERIFICATION ===")
sitemap_path = os.path.join(DIRECTORY, 'sitemap.xml')
assert os.path.exists(sitemap_path), "sitemap.xml missing!"
tree = ET.parse(sitemap_path)
root = tree.getroot()
namespace = {'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
urls = [loc.text for loc in root.findall('ns:url/ns:loc', namespace)]
expected_urls = [
    'https://oops-snowy-three.vercel.app/',
    'https://oops-snowy-three.vercel.app/play',
    'https://oops-snowy-three.vercel.app/about',
    'https://oops-snowy-three.vercel.app/privacy',
    'https://oops-snowy-three.vercel.app/terms'
]
print("URLs in sitemap:", urls)
for exp in expected_urls:
    assert exp in urls, f"Missing {exp} in sitemap!"
print("✅ sitemap.xml verified: All 5 canonical URLs present and valid XML structure.")

# 3. VERIFY ADSENSE META TAG IN ALL 5 PAGES
print("\n=== 🏷️ 3. ADSENSE PUBLISHER META TAG VERIFICATION ===")
for fname in ['index.html', 'play.html', 'about.html', 'privacy.html', 'terms.html']:
    fpath = os.path.join(DIRECTORY, fname)
    with open(fpath, 'r') as f:
        content = f.read()
    assert 'meta name="google-adsense-account" content="ca-pub-7942277005068512"' in content, f"Missing AdSense meta tag in {fname}"
    assert '<link rel="canonical" href="https://oops-snowy-three.vercel.app' in content, f"Missing canonical in {fname}"
print("✅ All 5 HTML files have verified AdSense account meta tag & canonical tags.")

# 4. LAUNCH HTTP SERVER & HEADLESS CHROME
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
    '--window-size=1280,1000',
    f'--remote-debugging-port={CDP_PORT}',
    f'http://127.0.0.1:{PORT}/index.html'
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

    s.settimeout(4.0)
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
send_cmd('Page.navigate', {'url': f'http://127.0.0.1:{PORT}/index.html'})
time.sleep(2.5)

# 5. VERIFY INDEX.HTML METADATA & SCHEMA.ORG
print("\n=== 📄 4. INDEX.HTML ON-PAGE & STRUCTURED DATA ===")
index_meta = eval_js('''(() => {
    const canonical = document.querySelector('link[rel="canonical"]');
    const desc = document.querySelector('meta[name="description"]');
    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(s => {
        try { return JSON.parse(s.textContent); } catch(e) { return null; }
    });
    return {
        title: document.title,
        canonical: canonical ? canonical.href : null,
        description: desc ? desc.content : null,
        h1Count: document.querySelectorAll('h1').length,
        h1Text: document.querySelector('h1') ? document.querySelector('h1').textContent.trim() : null,
        schema: scripts
    };
})()''')

print("Title:", index_meta['title'])
print("Canonical:", index_meta['canonical'])
print("Meta Description:", index_meta['description'])
print("H1 Text:", index_meta['h1Text'])
assert "Puzzle Platformer" in index_meta['title']
assert "oops-snowy-three.vercel.app" in index_meta['canonical']
assert index_meta['h1Count'] == 1

schemas = index_meta['schema']
assert len(schemas) > 0 and schemas[0] is not None
graph = schemas[0].get('@graph', [])
schema_types = [item.get('@type') for item in graph]
print("Structured Data Types:", schema_types)
assert 'WebSite' in schema_types
assert 'VideoGame' in schema_types
assert 'FAQPage' in schema_types
print("✅ index.html passed: Canonical, title, description, and Schema.org WebSite/VideoGame/FAQPage valid!")

# 6. VERIFY PLAY.HTML
print("\n=== 🎮 5. PLAY.HTML CANONICAL & ENGINE INTEGRITY ===")
send_cmd('Page.navigate', {'url': f'http://127.0.0.1:{PORT}/play.html'})
time.sleep(3.0)

play_meta = eval_js('''(() => {
    const canonical = document.querySelector('link[rel="canonical"]');
    const desc = document.querySelector('meta[name="description"]');
    const schemas = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(s => {
        try { return JSON.parse(s.textContent); } catch(e) { return null; }
    });
    return {
        title: document.title,
        canonical: canonical ? canonical.href : null,
        description: desc ? desc.content : null,
        isBooted: !!(window.game && window.game.isBooted),
        canvasW: window.game ? window.game.canvas.width : 0,
        canvasH: window.game ? window.game.canvas.height : 0,
        schemaTypes: schemas[0] ? schemas[0]['@graph'].map(i => i['@type']) : []
    };
})()''')

print("Play Title:", play_meta['title'])
print("Play Canonical:", play_meta['canonical'])
print("Play Schema Types:", play_meta['schemaTypes'])
print("Phaser Booted:", play_meta['isBooted'])
print("Canvas Dimensions:", play_meta['canvasW'], "x", play_meta['canvasH'])
assert "play" in play_meta['canonical']
assert 'BreadcrumbList' in play_meta['schemaTypes']
assert play_meta['isBooted']
assert play_meta['canvasW'] == 960 and play_meta['canvasH'] == 540
print("✅ play.html passed: Canonical /play, Breadcrumbs, and Phaser canvas 960x540 verified!")

s.close()
proc.terminate()
httpd.shutdown()
shutil.rmtree(tmp_dir, ignore_errors=True)
print("\n🎉 ALL SEO SUITE VERIFICATION CHECKS PASSED 100%!")
