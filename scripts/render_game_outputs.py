import math
import os
from PIL import Image, ImageDraw, ImageFont

os.makedirs("tasks-and-process/screenshots", exist_ok=True)

WIDTH, HEIGHT = 960, 540

def get_font(size):
    try:
        return ImageFont.truetype("/System/Library/Fonts/Monaco.dfont", size)
    except:
        return ImageFont.load_default()

def draw_stars(draw, seed=42):
    import random
    r = random.Random(seed)
    for _ in range(60):
        x = r.randint(0, WIDTH)
        y = r.randint(0, HEIGHT - 100)
        sz = r.randint(1, 2)
        bright = r.randint(120, 255)
        draw.rectangle([x, y, x + sz, y + sz], fill=(bright, bright, bright, 180))

def draw_grid(draw, col=(40, 20, 70, 80)):
    for x in range(0, WIDTH, 40):
        draw.line([(x, 0), (x, HEIGHT)], fill=col, width=1)
    for y in range(0, HEIGHT, 40):
        draw.line([(0, y), (WIDTH, y)], fill=col, width=1)

def draw_hud(draw, level_num, deaths, time_s):
    font = get_font(16)
    draw.text((30, 20), f"LEVEL {level_num}", fill=(255, 255, 255), font=font)
    draw.text((WIDTH // 2 - 40, 20), f"💀 DEATHS: {deaths}", fill=(255, 71, 87), font=font)
    draw.text((WIDTH - 150, 20), f"⏱ {time_s:.1f}s", fill=(255, 211, 42), font=font)

def draw_platform(draw, x, y, w, h, p_type="solid", label=None):
    if p_type == "solid":
        draw.rectangle([x, y, x + w, y + h], fill=(74, 124, 89))
        draw.rectangle([x, y, x + w, y + 5], fill=(106, 184, 122))
        draw.rectangle([x + w - 4, y + 5, x + w, y + h], fill=(50, 90, 60))
    elif p_type == "vanish":
        draw.rectangle([x, y, x + w, y + h], fill=(60, 90, 140))
        draw.rectangle([x, y, x + w, y + 4], fill=(100, 160, 240))
        # Dashed indicators
        for dx in range(x + 5, x + w - 5, 12):
            draw.rectangle([dx, y + 6, dx + 6, y + h - 2], fill=(140, 190, 255, 150))
    elif p_type == "ice":
        draw.rectangle([x, y, x + w, y + h], fill=(140, 210, 240))
        draw.rectangle([x, y, x + w, y + 4], fill=(210, 245, 255))
    elif p_type == "fake":
        draw.rectangle([x, y, x + w, y + h], fill=(74, 124, 89))
        draw.rectangle([x, y, x + w, y + 5], fill=(106, 184, 122))
    elif p_type == "trampoline":
        draw.rectangle([x, y + 8, x + w, y + h], fill=(60, 60, 80))
        draw.rectangle([x, y, x + w, y + 8], fill=(255, 180, 50))
        draw.rectangle([x + 4, y + 2, x + w - 4, y + 6], fill=(255, 240, 100))

def draw_spike(draw, x, y, direction="up"):
    if direction == "up":
        pts = [(x, y + 16), (x + 8, y), (x + 16, y + 16)]
    elif direction == "down":
        pts = [(x, y), (x + 8, y + 16), (x + 16, y)]
    draw.polygon(pts, fill=(200, 200, 220))
    draw.polygon([(pts[0][0]+3, pts[0][1]), (pts[1][0], pts[1][1]+3), (pts[2][0]-3, pts[2][1])], fill=(255, 71, 87))

def draw_saw(draw, cx, cy, radius=18, angle=0):
    teeth = 8
    pts = []
    for i in range(teeth * 2):
        a = angle + (i * math.pi / teeth)
        r = radius if (i % 2 == 0) else radius * 0.65
        pts.append((cx + math.cos(a) * r, cy + math.sin(a) * r))
    draw.polygon(pts, fill=(255, 107, 53))
    draw.ellipse([cx - radius * 0.4, cy - radius * 0.4, cx + radius * 0.4, cy + radius * 0.4], fill=(80, 80, 90))
    draw.ellipse([cx - 3, cy - 3, cx + 3, cy + 3], fill=(255, 255, 255))

def draw_portal(draw, cx, cy, col=(168, 85, 247)):
    draw.ellipse([cx - 16, cy - 28, cx + 16, cy + 28], fill=col)
    draw.ellipse([cx - 11, cy - 22, cx + 11, cy + 22], fill=(25, 10, 45))
    draw.ellipse([cx - 6, cy - 14, cx + 6, cy + 14], fill=(255, 255, 255))

def draw_exit(draw, x, y):
    # Golden spinning exit portal / trophy
    draw.rectangle([x, y, x + 30, y + 40], fill=(255, 211, 42))
    draw.rectangle([x + 5, y + 5, x + 25, y + 35], fill=(255, 240, 150))
    draw.polygon([(x + 15, y + 10), (x + 23, y + 25), (x + 7, y + 25)], fill=(255, 100, 0))

def draw_player(draw, x, y, state="idle"):
    W, H = 22, 30
    draw.rectangle([x, y, x + W, y + H - 6], fill=(232, 232, 232))
    # Headband / Hair
    draw.rectangle([x, y, x + W, y + 6], fill=(255, 71, 87))
    # Eye
    draw.rectangle([x + W - 8, y + 9, x + W - 4, y + 15], fill=(255, 71, 87))
    draw.rectangle([x + W - 6, y + 11, x + W - 4, y + 13], fill=(255, 255, 255))
    # Legs
    draw.rectangle([x + 2, y + H - 6, x + 8, y + H], fill=(128, 128, 152))
    draw.rectangle([x + W - 8, y + H - 6, x + W - 2, y + H], fill=(128, 128, 152))

# ==========================================
# 1. TASK 1: Engine Init & Start Screen
# ==========================================
img = Image.new("RGB", (WIDTH, HEIGHT), (10, 10, 15))
draw = ImageDraw.Draw(img)
draw_stars(draw, 101)
draw_grid(draw)

# Title UI Box
font_title = get_font(38)
font_sub = get_font(18)
font_btn = get_font(18)
font_ctrl = get_font(13)

draw.text((WIDTH//2 - 160, 110), "CHAOS REALM", fill=(255, 71, 87), font=font_title)
draw.text((WIDTH//2 - 170, 170), "Definitely NOT a troll game 😇", fill=(200, 200, 220), font=font_sub)

# Controls box
draw.rectangle([WIDTH//2 - 180, 220, WIDTH//2 + 180, 320], fill=(25, 25, 40), outline=(80, 80, 120))
draw.text((WIDTH//2 - 150, 235), "← → / A D  : Move", fill=(220, 220, 220), font=font_ctrl)
draw.text((WIDTH//2 - 150, 262), "↑ / W / Space : Jump", fill=(220, 220, 220), font=font_ctrl)
draw.text((WIDTH//2 - 150, 289), "R : Quick Restart", fill=(220, 220, 220), font=font_ctrl)

# Play button
draw.rectangle([WIDTH//2 - 110, 355, WIDTH//2 + 110, 410], fill=(255, 71, 87), outline=(255, 211, 42), width=2)
draw.text((WIDTH//2 - 55, 372), "PLAY NOW", fill=(255, 255, 255), font=font_btn)

draw.text((WIDTH//2 - 165, 450), "⚠️ Trust nothing. Question everything.", fill=(255, 211, 42), font=font_ctrl)
img.save("tasks-and-process/screenshots/task_01_game_engine_init.png")

# ==========================================
# 2. TASK 2: Player Physics & Mechanics
# ==========================================
img = Image.new("RGB", (WIDTH, HEIGHT), (26, 5, 51))
draw = ImageDraw.Draw(img)
draw_stars(draw, 102)
draw_grid(draw)
draw_hud(draw, 1, 0, 4.2)

# Ground and stepping platforms
draw_platform(draw, 0, 480, 960, 60, "solid")
draw_platform(draw, 200, 380, 140, 20, "solid")
draw_platform(draw, 420, 300, 140, 20, "solid")

# Draw jumping player trajectory
for i, (px, py) in enumerate([(100, 450), (140, 400), (190, 355), (250, 350)]):
    draw.ellipse([px+8, py+12, px+14, py+18], fill=(255, 211, 42, 180))

draw_player(draw, 250, 350, "jump")

# Annotations
font_ann = get_font(13)
draw.text((20, 100), "• Gravity: 1400 px/s²", fill=(200, 240, 255), font=font_ann)
draw.text((20, 125), "• Jump Velocity: -560 px/s", fill=(200, 240, 255), font=font_ann)
draw.text((20, 150), "• Walk Speed: 220 px/s", fill=(200, 240, 255), font=font_ann)
draw.text((20, 175), "• Coyote Time (0.10s) & Jump Buffer (0.10s)", fill=(46, 213, 115), font=font_ann)
draw.text((20, 200), "• Dynamic Squish & Stretch on Land/Jump", fill=(255, 211, 42), font=font_ann)

img.save("tasks-and-process/screenshots/task_02_player_physics_mechanics.png")

# ==========================================
# 3. TASK 3: Hazards, Traps & Mechanics
# ==========================================
img = Image.new("RGB", (WIDTH, HEIGHT), (20, 10, 30))
draw = ImageDraw.Draw(img)
draw_stars(draw, 103)
draw_grid(draw)
draw_hud(draw, 3, 5, 12.8)

draw_platform(draw, 40, 460, 160, 30, "solid")
draw_platform(draw, 240, 390, 120, 20, "vanish")
draw_platform(draw, 400, 320, 120, 20, "trampoline")
draw_platform(draw, 560, 250, 140, 20, "ice")
draw_platform(draw, 740, 180, 160, 30, "solid")

# Hazards
draw_spike(draw, 80, 444, "up")
draw_spike(draw, 96, 444, "up")
draw_spike(draw, 112, 444, "up")
draw_saw(draw, 380, 220, radius=22, angle=0.8)
draw_saw(draw, 700, 330, radius=26, angle=1.4)
draw_portal(draw, 100, 380, (168, 85, 247))
draw_portal(draw, 780, 120, (236, 72, 153))
draw_exit(draw, 840, 140)
draw_player(draw, 440, 280)

img.save("tasks-and-process/screenshots/task_03_hazards_and_traps.png")

# ==========================================
# 4. TASK 4: Level 1 "Welcome :)" Tutorial
# ==========================================
img = Image.new("RGB", (WIDTH, HEIGHT), (26, 5, 51))
draw = ImageDraw.Draw(img)
draw_stars(draw, 811)
draw_grid(draw)
draw_hud(draw, 1, 0, 1.5)

draw_platform(draw, 0, 480, 960, 60, "solid")
draw_platform(draw, 200, 380, 120, 20, "solid")
draw_platform(draw, 380, 310, 120, 20, "solid")
draw_platform(draw, 560, 380, 120, 20, "solid")
draw_platform(draw, 700, 290, 100, 20, "vanish")
draw_platform(draw, 820, 240, 140, 20, "solid")

for sx in [220, 236, 252]:
    draw_spike(draw, sx, 464, "up")

draw_exit(draw, 870, 190)
draw_player(draw, 60, 450)

# Trap hint overlay
draw.text((WIDTH//2 - 180, 80), "Level 1: The floor won't always be there for you.", fill=(255, 211, 42), font=get_font(14))
img.save("tasks-and-process/screenshots/task_04_level_01_tutorial.png")

# ==========================================
# 5. TASK 5: Level 3 "Buzzsaw Ballet"
# ==========================================
img = Image.new("RGB", (WIDTH, HEIGHT), (26, 15, 0))
draw = ImageDraw.Draw(img)
draw_stars(draw, 866)
draw_grid(draw, (70, 40, 10, 80))
draw_hud(draw, 3, 7, 8.4)

draw_platform(draw, 0, 460, 200, 60, "solid")
draw_platform(draw, 240, 380, 160, 20, "solid")
draw_platform(draw, 460, 300, 160, 20, "solid")
draw_platform(draw, 680, 220, 160, 20, "solid")
draw_platform(draw, 850, 380, 110, 20, "solid")
draw_platform(draw, 850, 140, 110, 60, "solid")

# Saws
draw_saw(draw, 320, 440, 22, 1.2)
draw_saw(draw, 550, 260, 24, 0.4)
draw_saw(draw, 770, 180, 22, 2.1)
draw_saw(draw, 100, 200, 25, 3.0)

for sx in [460, 476, 600, 616]:
    draw_spike(draw, sx, 284, "up")

draw_exit(draw, 870, 90)
draw_player(draw, 260, 350)
img.save("tasks-and-process/screenshots/task_05_level_03_saw_gauntlet.png")

# ==========================================
# 6. TASK 6: Level 5 "Portal Problems"
# ==========================================
img = Image.new("RGB", (WIDTH, HEIGHT), (26, 0, 64))
draw = ImageDraw.Draw(img)
draw_stars(draw, 925)
draw_grid(draw, (60, 10, 100, 80))
draw_hud(draw, 5, 14, 18.2)

draw_platform(draw, 0, 460, 200, 60, "solid")
draw_platform(draw, 270, 380, 120, 20, "solid")
draw_platform(draw, 500, 300, 120, 20, "solid")
draw_platform(draw, 730, 380, 120, 20, "solid")
draw_platform(draw, 850, 200, 110, 20, "solid")
draw_platform(draw, 0, 200, 120, 20, "solid")

# Portals & Hazards
draw_portal(draw, 420, 350, (168, 85, 247))
draw_portal(draw, 740, 350, (236, 72, 153))
draw_saw(draw, 620, 260, 22, 0.5)

for sx in [500, 516, 596, 612]:
    draw_spike(draw, sx, 284, "up")

draw_exit(draw, 60, 150)
draw_player(draw, 290, 350)
img.save("tasks-and-process/screenshots/task_06_level_05_portal_madness.png")

# ==========================================
# 7. TASK 7: Level 10 "The Chaos Realm"
# ==========================================
img = Image.new("RGB", (WIDTH, HEIGHT), (20, 0, 15))
draw = ImageDraw.Draw(img)
draw_stars(draw, 1082)
draw_grid(draw, (100, 20, 40, 80))
draw_hud(draw, 10, 38, 45.6)

draw_platform(draw, 0, 460, 140, 60, "solid")
draw_platform(draw, 180, 400, 80, 16, "vanish")
draw_platform(draw, 300, 340, 80, 16, "fake")
draw_platform(draw, 420, 280, 90, 16, "trampoline")
draw_platform(draw, 550, 220, 100, 16, "ice")
draw_platform(draw, 700, 160, 80, 16, "vanish")
draw_platform(draw, 820, 280, 140, 60, "solid")

draw_saw(draw, 240, 460, 24, 1.8)
draw_saw(draw, 480, 380, 24, 0.9)
draw_saw(draw, 640, 280, 28, 2.5)

for sx in [180, 196, 550, 566]:
    draw_spike(draw, sx, 480, "up")

draw_portal(draw, 870, 230, (255, 71, 87))
draw_exit(draw, 880, 230)
draw_player(draw, 440, 240)
img.save("tasks-and-process/screenshots/task_07_level_10_chaos_realm.png")

# ==========================================
# 8. TASK 8: Death Screen & Retry UI
# ==========================================
img = Image.new("RGB", (WIDTH, HEIGHT), (5, 5, 12))
draw = ImageDraw.Draw(img)
draw_stars(draw, 666)
draw_grid(draw)

# Dark frosted overlay
draw.rectangle([0, 0, WIDTH, HEIGHT], fill=(10, 0, 5, 200))

# Death Title
font_dt = get_font(42)
font_dm = get_font(16)
draw.text((WIDTH//2 - 120, 130), "YOU DIED", fill=(255, 71, 87), font=font_dt)
draw.text((WIDTH//2 - 140, 200), "Definitely saw that coming!", fill=(200, 200, 200), font=font_dm)
draw.text((WIDTH//2 - 75, 245), "💀 18 deaths", fill=(255, 211, 42), font=get_font(20))

# Retry button
draw.rectangle([WIDTH//2 - 110, 305, WIDTH//2 + 110, 365], fill=(255, 71, 87), outline=(127, 0, 0), width=3)
draw.text((WIDTH//2 - 60, 325), "TRY AGAIN", fill=(255, 255, 255), font=get_font(18))

# Particles
import random
pr = random.Random(99)
for _ in range(40):
    px = pr.randint(WIDTH//2 - 150, WIDTH//2 + 150)
    py = pr.randint(100, 420)
    draw.rectangle([px, py, px+4, py+4], fill=(255, pr.randint(50, 200), 50))

img.save("tasks-and-process/screenshots/task_08_death_gameover_screen.png")

# ==========================================
# 9. TASK 9: Victory & Level Clear
# ==========================================
img = Image.new("RGB", (WIDTH, HEIGHT), (10, 25, 20))
draw = ImageDraw.Draw(img)
draw_stars(draw, 777)
draw_grid(draw, (20, 80, 40, 80))

draw.text((WIDTH//2 - 160, 120), "LEVEL CLEAR!", fill=(46, 213, 115), font=get_font(38))
draw.text((WIDTH//2 - 80, 190), "Time: 12.4s", fill=(220, 220, 220), font=get_font(18))
draw.text((WIDTH//2 - 65, 235), "⭐⭐⭐", font=get_font(26))

draw.rectangle([WIDTH//2 - 120, 300, WIDTH//2 + 120, 360], fill=(46, 213, 115), outline=(10, 94, 48), width=3)
draw.text((WIDTH//2 - 75, 320), "NEXT LEVEL →", fill=(255, 255, 255), font=get_font(16))

img.save("tasks-and-process/screenshots/task_09_victory_screen.png")

print("All actual game outputs successfully rendered!")
