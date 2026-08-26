from PIL import Image, ImageDraw, ImageFilter
import math

SRC = "/Users/khalidabdullah/.gemini/antigravity/brain/bf5c2eba-890e-4c1e-8ee6-57099f2c6918/.tempmediaStorage/logo_2b06124.png"
OUT_BANNER = "/Users/khalidabdullah/.gemini/antigravity/brain/bf5c2eba-890e-4c1e-8ee6-57099f2c6918/.tempmediaStorage/banner_16x9.png"

# Target 16:9 size: 1280 x 720
W, H = 1280, 720
bg = Image.new("RGBA", (W, H), (7, 12, 18, 255))
draw = ImageDraw.Draw(bg)

# Draw subtle grid lines
grid_size = 40
for x in range(0, W, grid_size):
    draw.line([(x, 0), (x, H)], fill=(18, 30, 42, 200), width=1)
for y in range(0, H, grid_size):
    draw.line([(0, y), (W, y)], fill=(18, 30, 42, 200), width=1)

# Add soft radial green glow in center
glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
gdraw = ImageDraw.Draw(glow)
center_x, center_y = W // 2, H // 2
for r in range(450, 50, -15):
    alpha = int(45 * (1 - r / 450))
    gdraw.ellipse([center_x - r, center_y - r, center_x + r, center_y + r], fill=(46, 213, 115, alpha))
glow = glow.filter(ImageFilter.GaussianBlur(30))
bg = Image.alpha_composite(bg, glow)

# Load and resize logo to fit inside 720 height with nice padding
logo = Image.open(SRC).convert("RGBA")
target_logo_h = 640
target_logo_w = int(logo.width * (target_logo_h / logo.height))
logo_resized = logo.resize((target_logo_w, target_logo_h), Image.Resampling.LANCZOS)

# Create soft drop shadow for the logo
shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
sdraw = ImageDraw.Draw(shadow)
lx = (W - target_logo_w) // 2
ly = (H - target_logo_h) // 2
sdraw.rectangle([lx + 10, ly + 20, lx + target_logo_w - 10, ly + target_logo_h + 10], fill=(0, 0, 0, 180))
shadow = shadow.filter(ImageFilter.GaussianBlur(25))
bg = Image.alpha_composite(bg, shadow)

# Paste logo centered
bg.paste(logo_resized, (lx, ly), logo_resized)

# Save
bg.save(OUT_BANNER, format="PNG", optimize=True)
print("✅ 16:9 Landscape Banner generated at:", OUT_BANNER)
