import math
import os
import random
from PIL import Image, ImageDraw, ImageFont, ImageFilter

os.makedirs("screenshots", exist_ok=True)

# 1920x1080 Full HD crisp renders
W, H = 1920, 1080
SCALE = 2 # 2x of 960x540 virtual resolution

def get_font(size):
    font_paths = [
        "/System/Library/Fonts/Monaco.dfont",
        "/System/Library/Fonts/SFNSMono.ttf",
        "/System/Library/Fonts/Courier.dfont",
        "/System/Library/Fonts/Helvetica.ttc"
    ]
    for p in font_paths:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except:
                pass
    return ImageFont.load_default()

def draw_theme_bg(draw, bg1_hex, bg2_hex, fog_color, crack_color, seed=42):
    # Gradient background
    r1, g1, b1 = int(bg1_hex[1:3], 16), int(bg1_hex[3:5], 16), int(bg1_hex[5:7], 16)
    r2, g2, b2 = int(bg2_hex[1:3], 16), int(bg2_hex[3:5], 16), int(bg2_hex[5:7], 16)
    for y in range(H):
        t = y / H
        r = int(r1 + (r2 - r1) * t)
        g = int(g1 + (g2 - g1) * t)
        b = int(b1 + (b2 - b1) * t)
        draw.line([(0, y), (W, y)], fill=(r, g, b))

    # Background cracks (Level Devil style)
    cr_r, cr_g, cr_b, cr_a = crack_color
    cr_col = (cr_r, cr_g, cr_b)
    rnd = random.Random(seed)
    for i in range(12):
        x = int((W * (i + 1)) / 13)
        y_start = 100 + (i * 83) % 300
        length = 60 + (i * 71) % 180
        curr_x, curr_y = x, y_start
        for step in range(6):
            next_x = curr_x + rnd.randint(-20, 20)
            next_y = curr_y + length // 6
            draw.line([(curr_x, curr_y), (next_x, next_y)], fill=cr_col, width=2)
            curr_x, curr_y = next_x, next_y

    # Subtle ambient particles
    for _ in range(80):
        px = rnd.randint(0, W)
        py = rnd.randint(0, H - 150)
        psz = rnd.randint(2, 4)
        pa = rnd.randint(30, 90)
        draw.rectangle([px, py, px + psz, py + psz], fill=(255, 255, 255, pa))

    # Bottom atmospheric fog
    fog_r, fog_g, fog_b, _ = fog_color
    for y in range(H - 200, H):
        t = (y - (H - 200)) / 200
        draw.line([(0, y), (W, y)], fill=(fog_r, fog_g, fog_b), width=1)

def draw_hud(draw, level_num, deaths, time_s, world_name="DESERT"):
    f_hud = get_font(28)
    f_sub = get_font(20)
    # HUD Container bar
    draw.rectangle([0, 0, W, 80], fill=(10, 5, 5, 180))
    draw.line([(0, 80), (W, 80)], fill=(255, 255, 255, 30), width=2)
    
    draw.text((60, 26), f"LEVEL {level_num}", fill=(255, 255, 255), font=f_hud)
    draw.text((240, 30), f"[{world_name}]", fill=(232, 160, 0), font=f_sub)
    draw.text((W // 2 - 100, 26), f"💀 DEATHS: {deaths}", fill=(255, 71, 87), font=f_hud)
    draw.text((W - 320, 26), f"⏱ TIME: {time_s:.1f}s", fill=(255, 211, 42), font=f_hud)
    # Gamepad toggle icon
    draw.rectangle([W - 80, 18, W - 36, 62], fill=(40, 40, 55), outline=(100, 100, 140), width=2)
    draw.text((W - 68, 24), "🎮", font=get_font(22))

def draw_gamepad(draw):
    f_btn = get_font(32)
    f_lbl = get_font(22)
    
    # Left D-Pad
    # Left Button
    draw.rounded_rectangle([60, H - 160, 180, H - 40], radius=24, fill=(20, 20, 35, 220), outline=(255, 255, 255, 100), width=3)
    draw.text((105, H - 118), "◀", fill=(255, 255, 255), font=f_btn)
    
    # Right Button
    draw.rounded_rectangle([210, H - 160, 330, H - 40], radius=24, fill=(20, 20, 35, 220), outline=(255, 255, 255, 100), width=3)
    draw.text((255, H - 118), "▶", fill=(255, 255, 255), font=f_btn)
    
    # Action Buttons (Right)
    # Restart Button
    draw.rounded_rectangle([W - 380, H - 160, W - 260, H - 40], radius=24, fill=(50, 40, 15, 220), outline=(232, 160, 0, 180), width=3)
    draw.text((W - 350, H - 115), "↺ R", fill=(232, 160, 0), font=f_lbl)
    
    # Jump Button
    draw.rounded_rectangle([W - 230, H - 160, W - 50, H - 40], radius=24, fill=(20, 70, 40, 230), outline=(46, 213, 115, 200), width=3)
    draw.text((W - 195, H - 115), "▲ JUMP", fill=(255, 255, 255), font=f_lbl)

def draw_platform(draw, x, y, w, h, p_type="solid", main_col=(200, 96, 26), top_col=(224, 120, 32)):
    x, y, w, h = x * SCALE, y * SCALE, w * SCALE, h * SCALE
    if p_type == "solid":
        draw.rectangle([x, y, x + w, y + h], fill=main_col)
        draw.rectangle([x, y, x + w, y + 10], fill=top_col)
        draw.rectangle([x + w - 8, y + 10, x + w, y + h], fill=(max(0, main_col[0]-40), max(0, main_col[1]-40), max(0, main_col[2]-40)))
    elif p_type == "vanish":
        draw.rectangle([x, y, x + w, y + h], fill=(80, 110, 160))
        draw.rectangle([x, y, x + w, y + 8], fill=(130, 170, 240))
        for dx in range(int(x + 10), int(x + w - 10), 24):
            draw.rectangle([dx, y + 12, dx + 12, y + h - 6], fill=(190, 220, 255))
    elif p_type == "ice":
        draw.rectangle([x, y, x + w, y + h], fill=(130, 200, 240))
        draw.rectangle([x, y, x + w, y + 8], fill=(220, 245, 255))
        draw.line([(x, y + 4), (x + w, y + 4)], fill=(255, 255, 255), width=2)
    elif p_type == "trampoline":
        draw.rectangle([x, y + 14, x + w, y + h], fill=(60, 60, 75))
        draw.rectangle([x, y, x + w, y + 14], fill=(255, 170, 30))
        draw.rectangle([x + 8, y + 4, x + w - 8, y + 10], fill=(255, 240, 100))

def draw_spike(draw, x, y, direction="up", col=(204, 34, 0)):
    x, y = x * SCALE, y * SCALE
    w, h = 16 * SCALE, 16 * SCALE
    if direction == "up":
        pts = [(x, y + h), (x + w // 2, y), (x + w, y + h)]
    else:
        pts = [(x, y), (x + w // 2, y + h), (x + w, y)]
    draw.polygon(pts, fill=col)
    # Highlight
    draw.polygon([(pts[0][0] + 4, pts[0][1]), (pts[1][0], pts[1][1] + 4), (pts[2][0] - 4, pts[2][1])], fill=(min(255, col[0]+40), min(255, col[1]+40), min(255, col[2]+40)))

def draw_saw(draw, cx, cy, radius=22, angle=0.8, col=(255, 102, 0)):
    cx, cy, radius = cx * SCALE, cy * SCALE, radius * SCALE
    teeth = 8
    pts = []
    for i in range(teeth * 2):
        a = angle + (i * math.pi / teeth)
        r = radius if (i % 2 == 0) else radius * 0.65
        pts.append((cx + math.cos(a) * r, cy + math.sin(a) * r))
    draw.polygon(pts, fill=col)
    draw.ellipse([cx - radius * 0.4, cy - radius * 0.4, cx + radius * 0.4, cy + radius * 0.4], fill=(70, 70, 80))
    draw.ellipse([cx - 6, cy - 6, cx + 6, cy + 6], fill=(255, 255, 255))

def draw_portal(draw, cx, cy, col1=(255, 136, 0), col2=(204, 68, 0)):
    cx, cy = cx * SCALE, cy * SCALE
    draw.ellipse([cx - 30, cy - 50, cx + 30, cy + 50], fill=col1)
    draw.ellipse([cx - 20, cy - 38, cx + 20, cy + 38], fill=(20, 5, 35))
    draw.ellipse([cx - 10, cy - 24, cx + 10, cy + 24], fill=(255, 255, 255))

def draw_exit(draw, x, y):
    x, y = x * SCALE, y * SCALE
    draw.rectangle([x, y, x + 50, y + 70], fill=(232, 192, 96))
    draw.rectangle([x + 8, y + 8, x + 42, y + 62], fill=(255, 235, 140))
    draw.ellipse([x + 32, y + 36, x + 40, y + 44], fill=(120, 70, 10))

def draw_player(draw, x, y, squishX=1.0, squishY=1.0):
    x, y = x * SCALE, y * SCALE
    w, h = 22 * SCALE * squishX, 30 * SCALE * squishY
    # Body
    draw.rectangle([x, y, x + w, y + h - 10], fill=(232, 232, 232))
    # Headband/Hair
    draw.rectangle([x, y, x + w, y + 10], fill=(204, 51, 0))
    # Eye
    draw.rectangle([x + w - 14, y + 14, x + w - 6, y + 24], fill=(204, 51, 0))
    draw.rectangle([x + w - 10, y + 18, x + w - 6, y + 22], fill=(255, 255, 255))
    # Legs
    draw.rectangle([x + 4, y + h - 10, x + 14, y + h], fill=(128, 128, 152))
    draw.rectangle([x + w - 14, y + h - 10, x + w - 4, y + h], fill=(128, 128, 152))


# ==============================================================================
# SCREENSHOT 1: TITLE SCREEN ("Oops!")
# ==============================================================================
img1 = Image.new("RGB", (W, H))
draw1 = ImageDraw.Draw(img1)
draw_theme_bg(draw1, "#0a0000", "#1f0500", (120, 32, 0, 80), (180, 50, 0, 90), 101)

f_title = get_font(120)
f_sub = get_font(34)
f_btn = get_font(38)
f_ctrl = get_font(24)

# Title with glowing shadow
for offset, col in [(8, (120, 0, 0)), (4, (204, 51, 0)), (0, (255, 80, 20))]:
    draw1.text((W // 2 - 200 + offset, 160 + offset), "Oops!", fill=col, font=f_title)

draw1.text((W // 2 - 290, 330), "a totally fair game 😇", fill=(232, 160, 0), font=f_sub)

# Controls Card
draw1.rounded_rectangle([W // 2 - 450, 420, W // 2 + 450, 600], radius=20, fill=(20, 10, 10, 230), outline=(150, 50, 20), width=3)
draw1.text((W // 2 - 400, 460), "PC : ← → / A D — Move   |   Space / W — Jump   |   R — Restart", fill=(220, 220, 220), font=f_ctrl)
draw1.text((W // 2 - 320, 520), "Mobile : On-Screen Responsive Touch Gamepad", fill=(232, 160, 0), font=f_ctrl)

# Play Button
draw1.rounded_rectangle([W // 2 - 220, 660, W // 2 + 220, 770], radius=20, fill=(204, 51, 0), outline=(255, 120, 50), width=4)
draw1.text((W // 2 - 140, 695), "▶ PLAY NOW", fill=(255, 255, 255), font=f_btn)

draw1.text((W // 2 - 270, 850), "⚠️ Trust nothing. Question everything.", fill=(255, 211, 42), font=f_ctrl)
draw_gamepad(draw1)
img1.save("screenshots/01_title_screen.jpg", quality=95)


# ==============================================================================
# SCREENSHOT 2: DESERT WORLD (Level 1 & 2 Gameplay & Traps)
# ==============================================================================
img2 = Image.new("RGB", (W, H))
draw2 = ImageDraw.Draw(img2)
draw_theme_bg(draw2, "#7a2000", "#b03800", (120, 32, 0, 90), (0, 0, 0, 50), 202)
draw_hud(draw2, 1, 0, 2.4, "DESERT")

# Level 1 Tutorial Geometry
draw_platform(draw2, 0, 480, 960, 60, "solid", (200, 96, 26), (224, 120, 32))
draw_platform(draw2, 200, 380, 120, 20, "solid", (200, 96, 26), (224, 120, 32))
draw_platform(draw2, 380, 310, 120, 20, "solid", (200, 96, 26), (224, 120, 32))
draw_platform(draw2, 560, 380, 120, 20, "solid", (200, 96, 26), (224, 120, 32))

# Vanishing Trap Block
draw_platform(draw2, 700, 290, 100, 20, "vanish")
draw_platform(draw2, 820, 240, 140, 20, "solid", (200, 96, 26), (224, 120, 32))

# Spikes
for sx in [220, 236, 252, 580, 596]:
    draw_spike(draw2, sx, 464, "up", (204, 34, 0))

draw_exit(draw2, 870, 190)

# Jumping Player with Stretch
draw_player(draw2, 430, 260, squishX=0.8, squishY=1.2)

# Trap Warning Text bubble
draw2.rounded_rectangle([W // 2 - 320, 110, W // 2 + 320, 170], radius=12, fill=(20, 10, 10, 200), outline=(232, 160, 0), width=2)
draw2.text((W // 2 - 280, 128), "💡 \"The floor won't always be there for you.\"", fill=(255, 211, 42), font=get_font(22))

draw_gamepad(draw2)
img2.save("screenshots/02_gameplay_traps.jpg", quality=95)


# ==============================================================================
# SCREENSHOT 3: SHADOW WORLD (Level 3 Buzzsaws & Gauntlet)
# ==============================================================================
img3 = Image.new("RGB", (W, H))
draw3 = ImageDraw.Draw(img3)
draw_theme_bg(draw3, "#180c06", "#2a1508", (24, 12, 6, 120), (0, 0, 0, 80), 303)
draw_hud(draw3, 3, 7, 8.8, "SHADOW")

# Shadow platforms
draw_platform(draw3, 0, 460, 200, 60, "solid", (88, 48, 30), (106, 56, 32))
draw_platform(draw3, 240, 380, 160, 20, "solid", (88, 48, 30), (106, 56, 32))
draw_platform(draw3, 460, 300, 160, 20, "ice")
draw_platform(draw3, 680, 220, 160, 20, "solid", (88, 48, 30), (106, 56, 32))
draw_platform(draw3, 850, 380, 110, 20, "solid", (88, 48, 30), (106, 56, 32))
draw_platform(draw3, 850, 140, 110, 60, "solid", (88, 48, 30), (106, 56, 32))

# Moving Saws
draw_saw(draw3, 320, 440, radius=24, angle=1.2, col=(204, 68, 0))
draw_saw(draw3, 550, 260, radius=26, angle=0.4, col=(204, 68, 0))
draw_saw(draw3, 770, 180, radius=24, angle=2.1, col=(204, 68, 0))
draw_saw(draw3, 100, 200, radius=28, angle=3.0, col=(204, 68, 0))

# Spikes
for sx in [460, 476, 600, 616]:
    draw_spike(draw3, sx, 284, "up", (170, 51, 0))

draw_exit(draw3, 870, 90)
draw_player(draw3, 280, 345)

draw_gamepad(draw3)
img3.save("screenshots/03_portal_mechanics.jpg", quality=95)


# ==============================================================================
# SCREENSHOT 4: VOID WORLD (Level 5 Portals, Trampolines & Hazards)
# ==============================================================================
img4 = Image.new("RGB", (W, H))
draw4 = ImageDraw.Draw(img4)
draw_theme_bg(draw4, "#180540", "#2a0f60", (24, 5, 64, 100), (80, 40, 160, 60), 404)
draw_hud(draw4, 5, 14, 18.2, "VOID")

# Void platforms
draw_platform(draw4, 0, 460, 180, 60, "solid", (90, 56, 152), (104, 72, 160))
draw_platform(draw4, 250, 380, 120, 20, "trampoline")
draw_platform(draw4, 480, 300, 120, 20, "solid", (90, 56, 152), (104, 72, 160))
draw_platform(draw4, 710, 380, 120, 20, "vanish")
draw_platform(draw4, 850, 200, 110, 20, "solid", (90, 56, 152), (104, 72, 160))
draw_platform(draw4, 0, 200, 120, 20, "solid", (90, 56, 152), (104, 72, 160))

# Portals & Saws
draw_portal(draw4, 420, 350, (255, 136, 0), (204, 68, 0))
draw_portal(draw4, 750, 340, (160, 64, 224), (96, 32, 160))
draw_saw(draw4, 610, 260, radius=24, angle=0.5, col=(160, 64, 224))

for sx in [480, 496, 576, 592]:
    draw_spike(draw4, sx, 284, "up", (144, 48, 208))

draw_exit(draw4, 50, 150)
draw_player(draw4, 290, 310, squishX=0.8, squishY=1.3)

draw_gamepad(draw4)
img4.save("screenshots/04_death_screen.jpg", quality=95)


# ==============================================================================
# SCREENSHOT 5: THE "Oops!" DEATH SCREEN & RETRY UI
# ==============================================================================
img5 = Image.new("RGB", (W, H))
draw5 = ImageDraw.Draw(img5)
draw_theme_bg(draw5, "#0a0000", "#180500", (100, 20, 0, 100), (140, 30, 0, 80), 505)

# Dark frosted overlay
draw5.rectangle([0, 0, W, H], fill=(10, 0, 0, 180))

f_dt = get_font(90)
f_dm = get_font(34)
f_btn = get_font(32)
f_skull = get_font(38)

# "Oops!" Title
for offset, col in [(6, (100, 0, 0)), (3, (204, 51, 0)), (0, (255, 71, 87))]:
    draw5.text((W // 2 - 160 + offset, 240 + offset), "Oops!", fill=col, font=f_dt)

draw5.text((W // 2 - 250, 400), "\"The floor betrayed you 😂\"", fill=(220, 220, 220), font=f_dm)
draw5.text((W // 2 - 140, 480), "💀 18 deaths", fill=(232, 160, 0), font=f_skull)

# Retry Button
draw5.rounded_rectangle([W // 2 - 200, 580, W // 2 + 200, 680], radius=18, fill=(204, 51, 0), outline=(255, 100, 40), width=3)
draw5.text((W // 2 - 120, 615), "↺ TRY AGAIN", fill=(255, 255, 255), font=f_btn)

# Particle fragments
rnd = random.Random(999)
for _ in range(60):
    px = rnd.randint(W // 2 - 300, W // 2 + 300)
    py = rnd.randint(200, 750)
    psz = rnd.randint(4, 10)
    draw5.rectangle([px, py, px + psz, py + psz], fill=(255, rnd.randint(40, 180), 20))

draw_gamepad(draw5)
img5.save("screenshots/05_character_animations.jpg", quality=95)

print("All 5 conceptual showcase images successfully rendered!")
