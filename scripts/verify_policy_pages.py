import urllib.request, json, time, subprocess, http.server, socketserver, threading, os

PORT = 8255
DIRECTORY = '/Users/khalidabdullah/AntiGravity/Oops!'

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

pages = ['privacy.html', 'terms.html', 'about.html', 'ads.txt', 'index.html']
for page in pages:
    url = f'http://127.0.0.1:{PORT}/{page}'
    req = urllib.request.urlopen(url)
    content = req.read().decode('utf-8')
    assert req.status == 200
    print(f"✅ {page} loads successfully (HTTP 200, {len(content)} bytes)")

httpd.shutdown()
