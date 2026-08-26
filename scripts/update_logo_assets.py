from PIL import Image
import os, shutil

SRC = "/Users/khalidabdullah/.gemini/antigravity/brain/bf5c2eba-890e-4c1e-8ee6-57099f2c6918/oops_official_logo_1787751419136.jpg"
ROOT = "/Users/khalidabdullah/AntiGravity/Oops!"

img = Image.open(SRC).convert("RGBA")

# 1. Main 512x512 logo.png
logo_512 = img.resize((512, 512), Image.Resampling.LANCZOS)
logo_512.save(os.path.join(ROOT, "logo.png"), format="PNG", optimize=True)
logo_512.save(os.path.join(ROOT, "icons", "logo.png"), format="PNG", optimize=True)
logo_512.save(os.path.join(ROOT, "icons", "icon-512.png"), format="PNG", optimize=True)
logo_512.save(os.path.join(ROOT, "icons", "icon-512-maskable.png"), format="PNG", optimize=True)

# 2. 192x192 PWA Icon
logo_192 = img.resize((192, 192), Image.Resampling.LANCZOS)
logo_192.save(os.path.join(ROOT, "icons", "icon-192.png"), format="PNG", optimize=True)
logo_192.save(os.path.join(ROOT, "icons", "icon-192-maskable.png"), format="PNG", optimize=True)
logo_192.save(os.path.join(ROOT, "icons", "apple-touch-icon.png"), format="PNG", optimize=True)
logo_192.save(os.path.join(ROOT, "apple-touch-icon.png"), format="PNG", optimize=True)

# 3. Favicon 64x64, 32x32, 16x16
logo_64 = img.resize((64, 64), Image.Resampling.LANCZOS)
logo_64.save(os.path.join(ROOT, "favicon.png"), format="PNG", optimize=True)

logo_32 = img.resize((32, 32), Image.Resampling.LANCZOS)
logo_32.save(os.path.join(ROOT, "icons", "favicon-32x32.png"), format="PNG", optimize=True)

logo_16 = img.resize((16, 16), Image.Resampling.LANCZOS)
logo_16.save(os.path.join(ROOT, "icons", "favicon-16x16.png"), format="PNG", optimize=True)

logo_512.save(os.path.join(ROOT, "favicon.ico"), format="ICO", sizes=[(16,16), (32,32), (48,48), (64,64)])

print("✅ All logo, icon, and favicon assets successfully generated from official brand image!")
