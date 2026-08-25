// ═══════════════════════════════════════════════════════════════
//  Oops! – Ultra-Sharp Phaser 3 Edition
//  Faithfully matched to Reference: Organic World Island Map & Monochromatic Caverns
// ═══════════════════════════════════════════════════════════════

"use strict";

// ─── 1. Save Manager ─────────────────────────────────────────
const SAVE_KEY = "oops_save_v3";

const SaveManager = {
  save(levelIndex, totalDeaths) {
    const prev = this.load() || { level: 0, deaths: 0, maxUnlocked: 0, cleared: [] };
    const maxUnlocked = Math.max(prev.maxUnlocked || 0, levelIndex);
    const cleared = prev.cleared || [];
    if (!cleared.includes(levelIndex - 1) && levelIndex > 0) {
      cleared.push(levelIndex - 1);
    }
    const data = {
      level: levelIndex,
      maxUnlocked: maxUnlocked,
      deaths: totalDeaths,
      cleared: cleared,
      savedAt: Date.now(),
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch(e) {}
  },

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch(e) { return null; }
  },

  clear() {
    try { localStorage.removeItem(SAVE_KEY); } catch(e) {}
  },

  getMaxUnlocked() {
    const d = this.load();
    return d ? (d.maxUnlocked || d.level || 0) : 0;
  }
};

// ─── 2. Web Audio Synthesizer ────────────────────────────────
const AudioEngine = {
  ctx: null,
  muted: false,
  musicTimer: null,
  musicStep: 0,
  melody: [
    261, 329, 392, 523, 261, 329, 392, 523,
    220, 261, 329, 440, 220, 261, 329, 440,
    196, 246, 293, 392, 196, 246, 293, 392,
    174, 220, 261, 349, 196, 246, 293, 392
  ],

  init() {
    try {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().catch(()=>{});
      }
    } catch(e) {}
  },

  playTone(freq, type = "square", duration = 0.08, vol = 0.15, delay = 0) {
    if (!this.ctx || this.muted) return;
    try {
      const t = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
      osc.start(t);
      osc.stop(t + duration);
    } catch(e) {}
  },

  sfxJump() {
    this.playTone(320, "square", 0.08, 0.16);
    this.playTone(480, "square", 0.06, 0.14, 0.025);
  },
  sfxLand() {
    this.playTone(130, "sawtooth", 0.04, 0.12);
  },
  sfxDie() {
    for (let i = 0; i < 5; i++) {
      this.playTone(460 - i * 75, "sawtooth", 0.1, 0.2, i * 0.05);
    }
  },
  sfxWin() {
    [523, 659, 784, 1047, 1318].forEach((f, i) => this.playTone(f, "square", 0.14, 0.2, i * 0.08));
  },
  sfxTrap() {
    this.playTone(240, "sawtooth", 0.12, 0.2);
    this.playTone(150, "sawtooth", 0.1, 0.16, 0.06);
  },
  sfxPortal() {
    for (let i = 0; i < 6; i++) {
      this.playTone(320 + i * 85, "sine", 0.06, 0.14, i * 0.03);
    }
  },
  sfxCrush() {
    this.playTone(95, "sawtooth", 0.25, 0.35);
    this.playTone(65, "square", 0.3, 0.4, 0.03);
  },
  sfxBounce() {
    this.playTone(280, "sine", 0.12, 0.2);
    this.playTone(580, "sine", 0.15, 0.25, 0.04);
  },

  startMusic() {
    if (this.musicTimer || this.muted) return;
    this.musicStep = 0;
    this.musicTimer = setInterval(() => {
      if (this.muted || !this.ctx) return;
      const freq = this.melody[this.musicStep % this.melody.length];
      this.playTone(freq, "triangle", 0.16, 0.025);
      this.musicStep++;
    }, 220);
  },

  stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  },

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) this.stopMusic();
    else this.startMusic();
    return this.muted;
  }
};

// ─── 3. Video-Reference Multiverse Worlds ────────────────────
const WORLD_THEMES = [
  {
    id: 0,
    name: "DESERT RUINS",
    badge: "WORLD 1",
    subtitle: "Ancient sandstone cavern & crumbling gaps",
    bg: 0x8a2c14, // Reference warm terracotta
    platform: 0xe5825b, // Reference warm sand stone
    platformTop: 0xf5a27d,
    spike: 0xcc2200,
    door: 0xffffff,
    island: 0xd97c52,
    islandBorder: 0xbf633b,
    accent: 0xffd32a
  },
  {
    id: 1,
    name: "FROST SPIRE",
    badge: "WORLD 2",
    subtitle: "Glacier floes & plummeting icicles",
    bg: 0x12364c, // Deep glacial blue
    platform: 0x5fa8c8, // Ice blue platform
    platformTop: 0x82cce8,
    spike: 0x00d2d3,
    door: 0xffffff,
    island: 0x3d7b9c,
    islandBorder: 0x275b78,
    accent: 0x70a1ff
  },
  {
    id: 2,
    name: "SHADOW CRYPT",
    badge: "WORLD 3",
    subtitle: "Obsidian crypt & phantom spikes",
    bg: 0x280e3d, // Dark mystic violet
    platform: 0x8a5ca8, // Purple stone platform
    platformTop: 0xa878c8,
    spike: 0xd63031,
    door: 0xffffff,
    island: 0x5a2d78,
    islandBorder: 0x401c59,
    accent: 0xe056fd
  },
  {
    id: 3,
    name: "GRAVITY NEXUS",
    badge: "WORLD 4",
    subtitle: "Cyberpunk dimension & ceiling walking",
    bg: 0x0a2f22, // Matrix dark green
    platform: 0x38b88c, // Cyber emerald platform
    platformTop: 0x5cd8ac,
    spike: 0x10ac84,
    door: 0xffffff,
    island: 0x1d664c,
    islandBorder: 0x124a35,
    accent: 0x2ed573
  },
  {
    id: 4,
    name: "GLITCH CORE",
    badge: "WORLD 5",
    subtitle: "Unstable reality & deceptive finale",
    bg: 0x3d0a28, // Deep magenta abyss
    platform: 0xb84a82, // Neon magenta platform
    platformTop: 0xd86aa2,
    spike: 0xff4757,
    door: 0xffffff,
    island: 0x7d2358,
    islandBorder: 0x5c143e,
    accent: 0xff3838
  }
];

function getTheme(levelIndex) {
  const worldIndex = Math.min(Math.floor(levelIndex / 6), WORLD_THEMES.length - 1);
  return WORLD_THEMES[worldIndex];
}

// ─── 4. BootScene: Procedural Cartoon Hero & World Assets ────
class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create() {
    this.createCartoonHero();
    this.createWorldAssets();
    this.createAnimations();

    // Proceed to Overworld Island Map on launch
    this.scene.start("WorldSelectScene");
  }

  createCartoonHero() {
    const drawHeroFrame = (key, options = {}) => {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      const {
        blink = false,
        legOffset = 0,
        bobY = 0,
        armsUp = false,
        panicked = false,
        dead = false,
        eyeLookX = 1
      } = options;

      const yOff = bobY;

      if (dead) {
        // Comic dizzy death pose
        g.fillStyle(0x0984e3, 1);
        g.fillRoundedRect(6, 20 + yOff, 20, 10, 3);
        g.fillStyle(0xffdbac, 1);
        g.fillCircle(16, 12 + yOff, 10);
        g.fillStyle(0xff3838, 1);
        g.fillRect(6, 7 + yOff, 20, 4);
        g.lineStyle(2, 0x111111, 1);
        g.lineBetween(10, 10 + yOff, 14, 14 + yOff);
        g.lineBetween(14, 10 + yOff, 10, 14 + yOff);
        g.lineBetween(18, 10 + yOff, 22, 14 + yOff);
        g.lineBetween(22, 10 + yOff, 18, 14 + yOff);
        g.fillStyle(0x111111, 1);
        g.fillCircle(16, 18 + yOff, 3);
        g.fillStyle(0xff7675, 1);
        g.fillRect(16, 18 + yOff, 3, 3);
        g.fillStyle(0xe17055, 1);
        g.fillRect(8, 30 + yOff, 6, 6);
        g.fillRect(18, 30 + yOff, 6, 6);
        g.generateTexture(key, 32, 40);
        return;
      }

      // Headband fluttering ribbons
      g.fillStyle(0xd63031, 1);
      g.fillRect(2, 8 + yOff, 5, 4);
      g.fillStyle(0xff3838, 1);
      g.fillRect(0, 10 + yOff, 4, 4);

      // Cartoon Head (Skin Tone)
      g.fillStyle(0xffdbac, 1);
      g.fillCircle(16, 12 + yOff, 10);

      // Red Ninja Headband across forehead
      g.fillStyle(0xff3838, 1);
      g.fillRect(6, 6 + yOff, 20, 4);
      g.fillStyle(0xf1c40f, 1);
      g.fillRect(15, 6 + yOff, 2, 4);

      // Cheerful Pink Cheeks
      g.fillStyle(0xff7675, 0.75);
      g.fillCircle(10, 15 + yOff, 2);
      g.fillCircle(22, 15 + yOff, 2);

      // Expressive Eyes
      if (blink) {
        g.lineStyle(2, 0x111111, 1);
        g.lineBetween(11, 12 + yOff, 14, 12 + yOff);
        g.lineBetween(18, 12 + yOff, 21, 12 + yOff);
      } else if (panicked) {
        g.fillStyle(0xffffff, 1);
        g.fillCircle(12, 11 + yOff, 4);
        g.fillCircle(20, 11 + yOff, 4);
        g.fillStyle(0x111111, 1);
        g.fillCircle(12, 13 + yOff, 2);
        g.fillCircle(20, 13 + yOff, 2);
        g.fillStyle(0x111111, 1);
        g.fillCircle(16, 18 + yOff, 2.5);
      } else {
        const px = eyeLookX;
        g.fillStyle(0xffffff, 1);
        g.fillRoundedRect(10, 9 + yOff, 5, 7, 2);
        g.fillRoundedRect(17, 9 + yOff, 5, 7, 2);
        g.fillStyle(0x111111, 1);
        g.fillRect(11 + px, 10 + yOff, 3, 5);
        g.fillRect(18 + px, 10 + yOff, 3, 5);
        g.fillStyle(0xffffff, 1);
        g.fillRect(11 + px, 10 + yOff, 1.5, 1.5);
        g.fillRect(18 + px, 10 + yOff, 1.5, 1.5);

        g.lineStyle(1.5, 0x111111, 1);
        g.lineBetween(14, 18 + yOff, 18, 18 + yOff);
      }

      // Shirt / Tunic (Vibrant Blue)
      g.fillStyle(0x0984e3, 1);
      g.fillRoundedRect(8, 20 + yOff, 16, 10, 3);

      // Gold Belt & Buckle
      g.fillStyle(0xf1c40f, 1);
      g.fillRect(8, 28 + yOff, 16, 3);
      g.fillStyle(0xe67e22, 1);
      g.fillRect(14, 27 + yOff, 4, 5);

      // Arms & Hands
      if (armsUp) {
        g.fillStyle(0x0984e3, 1);
        g.fillRect(5, 14 + yOff, 4, 8);
        g.fillRect(23, 14 + yOff, 4, 8);
        g.fillStyle(0xffdbac, 1);
        g.fillCircle(7, 13 + yOff, 2.5);
        g.fillCircle(25, 13 + yOff, 2.5);
      } else {
        g.fillStyle(0x0984e3, 1);
        g.fillRect(5, 21 + yOff, 3, 6);
        g.fillRect(24, 21 + yOff, 3, 6);
        g.fillStyle(0xffdbac, 1);
        g.fillCircle(6.5, 28 + yOff, 2);
        g.fillCircle(25.5, 28 + yOff, 2);
      }

      // Animated Running Legs & Boots
      g.fillStyle(0x2d3436, 1);
      const leg1X = 10 + legOffset;
      const leg2X = 18 - legOffset;
      g.fillRect(leg1X, 31 + yOff, 4, 4);
      g.fillRect(leg2X, 31 + yOff, 4, 4);

      g.fillStyle(0xe17055, 1);
      g.fillRoundedRect(leg1X - 1, 34 + yOff, 6, 5, 2);
      g.fillRoundedRect(leg2X - 1, 34 + yOff, 6, 5, 2);

      g.generateTexture(key, 32, 40);
    };

    drawHeroFrame("hero_idle_1", { blink: false, bobY: 0, legOffset: 0 });
    drawHeroFrame("hero_idle_2", { blink: true,  bobY: 1, legOffset: 0 });
    drawHeroFrame("hero_run_1",  { blink: false, bobY: -1, legOffset: 2 });
    drawHeroFrame("hero_run_2",  { blink: false, bobY: 0,  legOffset: 0 });
    drawHeroFrame("hero_run_3",  { blink: false, bobY: -1, legOffset: -2 });
    drawHeroFrame("hero_run_4",  { blink: false, bobY: 0,  legOffset: 0 });
    drawHeroFrame("hero_jump",   { blink: false, bobY: -2, armsUp: true, legOffset: 0 });
    drawHeroFrame("hero_fall",   { panicked: true, bobY: 1, legOffset: 0 });
    drawHeroFrame("hero_dead",   { dead: true });
  }

  createWorldAssets() {
    // 1. Monochromatic Platform Texture
    const platGfx = this.make.graphics({ x: 0, y: 0, add: false });
    platGfx.fillStyle(0xffffff, 1);
    platGfx.fillRect(0, 0, 32, 32);
    platGfx.fillStyle(0x000000, 0.12);
    platGfx.fillRect(0, 0, 32, 3);
    platGfx.generateTexture("plat_tex", 32, 32);

    // 2. Sharp Saw-Tooth Spikes (20x20)
    const spkGfx = this.make.graphics({ x: 0, y: 0, add: false });
    spkGfx.fillStyle(0xffffff, 1);
    spkGfx.beginPath();
    spkGfx.moveTo(0, 20);
    spkGfx.lineTo(10, 0);
    spkGfx.lineTo(20, 20);
    spkGfx.closePath();
    spkGfx.fill();
    spkGfx.generateTexture("spike_up", 20, 20);

    // 3. Menacing Crusher Block
    const crushGfx = this.make.graphics({ x: 0, y: 0, add: false });
    crushGfx.fillStyle(0x2d3436, 1);
    crushGfx.fillRoundedRect(0, 0, 60, 60, 4);
    crushGfx.fillStyle(0x1e272e, 1);
    crushGfx.fillRect(6, 6, 48, 48);
    crushGfx.fillStyle(0xff3838, 1);
    crushGfx.fillTriangle(14, 20, 26, 26, 14, 32);
    crushGfx.fillTriangle(46, 20, 34, 26, 46, 32);
    crushGfx.fillStyle(0xcc2200, 1);
    crushGfx.fillTriangle(0, 60, 10, 72, 20, 60);
    crushGfx.fillTriangle(20, 60, 30, 72, 40, 60);
    crushGfx.fillTriangle(40, 60, 50, 72, 60, 60);
    crushGfx.generateTexture("crusher_tex", 60, 72);

    // 4. White/Grey Arch Exit Door (Reference Video Match)
    const doorGfx = this.make.graphics({ x: 0, y: 0, add: false });
    doorGfx.fillStyle(0xffffff, 1);
    doorGfx.fillRoundedRect(0, 0, 32, 46, 10);
    doorGfx.fillStyle(0x2d3436, 1);
    doorGfx.fillRoundedRect(4, 8, 24, 38, 8);
    doorGfx.generateTexture("door_tex", 32, 46);

    // 5. Cave Portal Mound for World Map (44x44)
    const caveGfx = this.make.graphics({ x: 0, y: 0, add: false });
    caveGfx.fillStyle(0x3a180c, 1);
    caveGfx.fillRoundedRect(2, 2, 40, 40, 12);
    caveGfx.fillStyle(0x110502, 1);
    caveGfx.fillCircle(22, 22, 14);
    caveGfx.generateTexture("cave_node", 44, 44);

    // 6. Particle Dot
    const dotGfx = this.make.graphics({ x: 0, y: 0, add: false });
    dotGfx.fillStyle(0xffffff, 1);
    dotGfx.fillCircle(4, 4, 4);
    dotGfx.generateTexture("part_dot", 8, 8);
  }

  createAnimations() {
    this.anims.create({
      key: "hero_anim_idle",
      frames: [
        { key: "hero_idle_1", duration: 1200 },
        { key: "hero_idle_2", duration: 200 }
      ],
      repeat: -1
    });

    this.anims.create({
      key: "hero_anim_run",
      frames: [
        { key: "hero_run_1" },
        { key: "hero_run_2" },
        { key: "hero_run_3" },
        { key: "hero_run_4" }
      ],
      frameRate: 11,
      repeat: -1
    });

    this.anims.create({
      key: "hero_anim_jump",
      frames: [{ key: "hero_jump" }],
      repeat: 0
    });

    this.anims.create({
      key: "hero_anim_fall",
      frames: [{ key: "hero_fall" }],
      repeat: 0
    });
  }
}

// ─── 5. WorldSelectScene: Overworld Island Map ────────────────
class WorldSelectScene extends Phaser.Scene {
  constructor() {
    super("WorldSelectScene");
    this.currentWorldIdx = 0;
  }

  create() {
    const { width, height } = this.scale;
    const maxUnlocked = SaveManager.getMaxUnlocked();

    AudioEngine.init();

    // Multiverse Deep Background
    this.bgGfx = this.add.graphics();
    this.drawBackground();

    // Floating Island Container
    this.islandContainer = this.add.container(0, 0);
    this.renderWorldIsland();
  }

  drawBackground() {
    const { width, height } = this.scale;
    const theme = WORLD_THEMES[this.currentWorldIdx];
    this.bgGfx.clear();
    this.bgGfx.fillStyle(theme.bg, 1);
    this.bgGfx.fillRect(0, 0, width, height);

    // Subtle cavern mist particles
    if (this.particles) this.particles.destroy();
    this.particles = this.add.particles(0, 0, "part_dot", {
      x: { min: 0, max: width },
      y: { min: 0, max: height },
      lifespan: 3000,
      speedY: { min: -15, max: 15 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 0.25, end: 0 },
      tint: 0xffffff,
      frequency: 200
    });
  }

  renderWorldIsland() {
    this.islandContainer.removeAll(true);
    const { width, height } = this.scale;
    const theme = WORLD_THEMES[this.currentWorldIdx];
    const maxUnlocked = SaveManager.getMaxUnlocked();
    const isWorldUnlocked = (this.currentWorldIdx === 0) || (maxUnlocked >= this.currentWorldIdx * 6);

    // 1. Top Header Title
    const titleText = this.add.text(width / 2, 40, "Oops! - WORLD MAP", {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "24px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 6
    }).setOrigin(0.5);
    this.islandContainer.add(titleText);

    // Sound Toggle (Top-Right)
    const sndText = this.add.text(width - 40, 40, AudioEngine.muted ? "🔇" : "🔊", {
      fontSize: "22px"
    }).setOrigin(0.5).setInteractive({ cursor: "pointer" });
    sndText.on("pointerdown", () => {
      AudioEngine.init();
      const muted = AudioEngine.toggleMute();
      sndText.setText(muted ? "🔇" : "🔊");
    });
    this.islandContainer.add(sndText);

    // 2. Large Pixel Organic World Island
    const islandW = 760, islandH = 340;
    const islandX = width / 2, islandY = height / 2 + 25;

    const islGfx = this.add.graphics();
    // Shadow
    islGfx.fillStyle(0x000000, 0.4);
    islGfx.fillRoundedRect(islandX - islandW / 2 + 10, islandY - islandH / 2 + 15, islandW, islandH, 24);
    // Island Base
    islGfx.fillStyle(theme.island, isWorldUnlocked ? 1 : 0.4);
    islGfx.fillRoundedRect(islandX - islandW / 2, islandY - islandH / 2, islandW, islandH, 24);
    islGfx.lineStyle(4, theme.islandBorder, 1);
    islGfx.strokeRoundedRect(islandX - islandW / 2, islandY - islandH / 2, islandW, islandH, 24);
    this.islandContainer.add(islGfx);

    // World Banner on Island
    const worldBadge = this.add.text(islandX, islandY - islandH / 2 + 35, `${theme.badge}: ${theme.name}`, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "14px",
      color: isWorldUnlocked ? "#ffd32a" : "#888888",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5);
    this.islandContainer.add(worldBadge);

    const subText = this.add.text(islandX, islandY - islandH / 2 + 60, theme.subtitle, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "8.5px",
      color: "#ffffff"
    }).setOrigin(0.5);
    this.islandContainer.add(subText);

    // 3. Winding Cave Level Nodes (6 Levels for this world: 1 to 6)
    // Node coordinates along a natural winding trail
    const nodeCoords = [
      { x: islandX - 260, y: islandY + 30 },
      { x: islandX - 160, y: islandY - 20 },
      { x: islandX - 50,  y: islandY + 40 },
      { x: islandX + 50,  y: islandY - 20 },
      { x: islandX + 160, y: islandY + 35 },
      { x: islandX + 260, y: islandY - 15 }
    ];

    // Draw winding trail lines between nodes
    const trailGfx = this.add.graphics();
    trailGfx.lineStyle(4, theme.islandBorder, 0.75);
    for (let i = 0; i < nodeCoords.length - 1; i++) {
      trailGfx.lineBetween(nodeCoords[i].x, nodeCoords[i].y, nodeCoords[i+1].x, nodeCoords[i+1].y);
    }
    this.islandContainer.add(trailGfx);

    nodeCoords.forEach((pt, c) => {
      const lvlIdx = this.currentWorldIdx * 6 + c;
      const isCleared = lvlIdx < maxUnlocked;
      const isCurrent = lvlIdx === maxUnlocked;
      const isLocked  = (lvlIdx > maxUnlocked) && (lvlIdx > 0);

      const nodeGfx = this.add.graphics();
      const fillCol = isCleared ? 0x2ed573 : isCurrent ? 0xffd32a : 0x222226;
      const borderCol = isCleared ? 0x26af5f : isCurrent ? 0xffffff : 0x444444;

      nodeGfx.fillStyle(fillCol, isLocked ? 0.35 : 0.95);
      nodeGfx.fillCircle(pt.x, pt.y, 28);
      nodeGfx.lineStyle(3, borderCol, 1);
      nodeGfx.strokeCircle(pt.x, pt.y, 28);

      const numText = this.add.text(pt.x, pt.y - 4, `${lvlIdx + 1}`, {
        fontFamily: "'Press Start 2P', monospace",
        fontSize: "14px",
        color: isLocked ? "#555555" : isCurrent ? "#000000" : "#ffffff",
        stroke: "#000000",
        strokeThickness: isCurrent ? 0 : 3
      }).setOrigin(0.5);

      const statusText = this.add.text(pt.x, pt.y + 14, isCleared ? "✓" : isCurrent ? "★" : "🔒", {
        fontFamily: "'Press Start 2P', monospace",
        fontSize: "8px",
        color: isCleared ? "#ffffff" : isCurrent ? "#000000" : "#777777"
      }).setOrigin(0.5);

      this.islandContainer.add([nodeGfx, numText, statusText]);

      // Active level bouncing arrow cursor
      if (isCurrent && isWorldUnlocked) {
        const arrow = this.add.text(pt.x, pt.y - 44, "▼", {
          fontFamily: "'Press Start 2P', monospace",
          fontSize: "16px",
          color: "#ffd32a"
        }).setOrigin(0.5);
        this.tweens.add({
          targets: arrow,
          y: pt.y - 36,
          duration: 400,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut"
        });
        this.islandContainer.add(arrow);
      }

      if (!isLocked && isWorldUnlocked) {
        const hitZone = this.add.zone(pt.x, pt.y, 56, 56).setInteractive({ cursor: "pointer" });
        hitZone.on("pointerover", () => {
          nodeGfx.setScale(1.1);
          numText.setScale(1.1);
          statusText.setScale(1.1);
        });
        hitZone.on("pointerout", () => {
          nodeGfx.setScale(1);
          numText.setScale(1);
          statusText.setScale(1);
        });
        hitZone.on("pointerdown", () => {
          AudioEngine.init();
          AudioEngine.sfxJump();
          this.scene.start("GameScene", { level: lvlIdx, deaths: 0 });
        });
        this.islandContainer.add(hitZone);
      }
    });

    // 4. World Switching Arrows on Island (Left and Right)
    if (this.currentWorldIdx > 0) {
      const prevBtn = this.add.container(islandX - islandW / 2 + 50, islandY + islandH / 2 - 40);
      const pbGfx = this.add.graphics();
      pbGfx.fillStyle(0x111111, 0.8);
      pbGfx.fillRoundedRect(-50, -18, 100, 36, 6);
      pbGfx.lineStyle(2, 0xffffff, 0.8);
      pbGfx.strokeRoundedRect(-50, -18, 100, 36, 6);
      const pbLabel = this.add.text(0, 0, "◀ PREV", {
        fontFamily: "'Press Start 2P', monospace",
        fontSize: "9px",
        color: "#ffffff"
      }).setOrigin(0.5);
      prevBtn.add([pbGfx, pbLabel]);
      const pZone = this.add.zone(0, 0, 100, 36).setInteractive({ cursor: "pointer" });
      pZone.on("pointerdown", () => {
        AudioEngine.init();
        AudioEngine.sfxJump();
        this.currentWorldIdx--;
        this.drawBackground();
        this.renderWorldIsland();
      });
      prevBtn.add(pZone);
      this.islandContainer.add(prevBtn);
    }

    if (this.currentWorldIdx < WORLD_THEMES.length - 1) {
      const nextBtn = this.add.container(islandX + islandW / 2 - 50, islandY + islandH / 2 - 40);
      const nbGfx = this.add.graphics();
      nbGfx.fillStyle(0x111111, 0.8);
      nbGfx.fillRoundedRect(-50, -18, 100, 36, 6);
      nbGfx.lineStyle(2, 0xffffff, 0.8);
      nbGfx.strokeRoundedRect(-50, -18, 100, 36, 6);
      const nbLabel = this.add.text(0, 0, "NEXT ▶", {
        fontFamily: "'Press Start 2P', monospace",
        fontSize: "9px",
        color: "#ffffff"
      }).setOrigin(0.5);
      nextBtn.add([nbGfx, nbLabel]);
      const nZone = this.add.zone(0, 0, 100, 36).setInteractive({ cursor: "pointer" });
      nZone.on("pointerdown", () => {
        AudioEngine.init();
        AudioEngine.sfxJump();
        this.currentWorldIdx++;
        this.drawBackground();
        this.renderWorldIsland();
      });
      nextBtn.add(nZone);
      this.islandContainer.add(nextBtn);
    }

    // Direct Play Button for Current World
    if (isWorldUnlocked) {
      const playBtn = this.add.container(islandX, islandY + islandH / 2 - 40);
      const plGfx = this.add.graphics();
      plGfx.fillStyle(0x2ed573, 1);
      plGfx.fillRoundedRect(-140, -18, 280, 36, 8);
      plGfx.lineStyle(2, 0xffffff, 1);
      plGfx.strokeRoundedRect(-140, -18, 280, 36, 8);

      const plLabel = this.add.text(0, 0, `▶ PLAY LEVEL ${Math.min(maxUnlocked + 1, (this.currentWorldIdx + 1) * 6)}`, {
        fontFamily: "'Press Start 2P', monospace",
        fontSize: "10px",
        color: "#ffffff"
      }).setOrigin(0.5);
      playBtn.add([plGfx, plLabel]);

      const plZone = this.add.zone(0, 0, 280, 36).setInteractive({ cursor: "pointer" });
      plZone.on("pointerdown", () => {
        AudioEngine.init();
        AudioEngine.sfxJump();
        const startLvl = Math.max(this.currentWorldIdx * 6, Math.min(maxUnlocked, (this.currentWorldIdx + 1) * 6 - 1));
        this.scene.start("GameScene", { level: startLvl, deaths: 0 });
      });
      playBtn.add(plZone);
      this.islandContainer.add(playBtn);
    }
  }
}

// ─── 6. GameScene: Core Platformer & 30 Deceptive Levels ──────
class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  init(data) {
    this.currentLevel = data.level || 0;
    this.deaths = data.deaths || 0;
    this.levelTime = 0;
    this.isDead = false;
    this.isComplete = false;
    this.gravityDir = 1;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.touchLeft = false;
    this.touchRight = false;
    this.touchJump = false;
  }

  create() {
    const { width, height } = this.scale;
    const theme = getTheme(this.currentLevel);

    AudioEngine.init();
    AudioEngine.startMusic();

    // 1. Monochromatic Reference Style Background
    this.bgGfx = this.add.graphics();
    this.bgGfx.fillStyle(theme.bg, 1);
    this.bgGfx.fillRect(0, 0, width, height);

    // 2. Physics Groups
    this.platforms = this.physics.add.staticGroup();
    this.spikes = this.physics.add.staticGroup();
    this.crushers = this.physics.add.group();
    this.trampolines = this.physics.add.staticGroup();
    this.fallingPlatforms = [];
    this.customTriggers = [];

    // 3. Build Level Layout
    this.buildLevelData(this.currentLevel);

    // 4. Create Animated Cartoon Hero
    this.player = this.physics.add.sprite(this.spawnX, this.spawnY, "hero_idle_1");
    // DO NOT enable bottom world bounds so player falls off into pit and dies!
    this.player.setCollideWorldBounds(false);
    this.player.body.setSize(22, 34);
    this.player.body.setOffset(5, 4);
    this.player.body.setGravityY(1400);
    this.player.anims.play("hero_anim_idle");

    // Collisions
    this.physics.add.collider(this.player, this.platforms, this.onPlatformCollide, null, this);
    this.physics.add.collider(this.player, this.trampolines, this.onTrampolineCollide, null, this);
    this.physics.add.overlap(this.player, this.spikes, this.onPlayerDie, null, this);
    this.physics.add.overlap(this.player, this.crushers, this.onPlayerDie, null, this);

    if (this.exitGate) {
      this.physics.add.overlap(this.player, this.exitGate, this.onReachExit, null, this);
    }

    // 5. Input Controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.keyShift = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.keyF = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);

    // 6. Minimalist HUD
    this.createHUD();

    // 7. On-Screen Touch Gamepad
    this.createMobileGamepad();

    // 8. Sliding Level Intro Banner
    this.showLevelBanner();
  }

  showLevelBanner() {
    const { width } = this.scale;
    const theme = getTheme(this.currentLevel);

    const banner = this.add.text(width / 2, 60, `${theme.badge}: LEVEL ${this.currentLevel + 1}`, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "14px",
      color: "#ffd32a",
      stroke: "#000000",
      strokeThickness: 5
    }).setOrigin(0.5).setDepth(200);

    this.tweens.add({
      targets: banner,
      alpha: 0,
      y: 40,
      delay: 1200,
      duration: 500,
      onComplete: () => banner.destroy()
    });
  }

  createHUD() {
    const { width } = this.scale;

    // Top-Left: Level Title
    this.levelText = this.add.text(25, 20, `LEVEL ${this.currentLevel + 1}`, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "11px",
      color: "#ffffff"
    }).setDepth(100);

    // Top-Center: Progress Boxes (matching video reference)
    const worldLevelIdx = this.currentLevel % 6;
    let progString = "";
    for (let i = 0; i < 6; i++) {
      progString += (i === worldLevelIdx) ? "■ " : "□ ";
    }
    this.add.text(width / 2 - 60, 20, progString.trim(), {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "12px",
      color: "#ffffff"
    }).setDepth(100);

    // Top-Right: Deaths & Map Return
    this.deathText = this.add.text(width - 90, 20, `💀 ${this.deaths}`, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "11px",
      color: "#ff4757"
    }).setDepth(100);

    const mapBtn = this.add.text(width - 32, 20, "🗺️", {
      fontSize: "20px"
    }).setOrigin(0.5).setDepth(100).setInteractive({ cursor: "pointer" });

    mapBtn.on("pointerdown", () => {
      AudioEngine.stopMusic();
      this.scene.start("WorldSelectScene");
    });
  }

  createMobileGamepad() {
    const { width, height } = this.scale;
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 1024);
    if (!isTouch) return;

    const padY = height - 50;

    // Reference matching polygon styled buttons
    const makeTouchBtn = (x, y, w, h, label, onPress, onRelease) => {
      const g = this.add.graphics().setDepth(150);
      g.fillStyle(0x000000, 0.3);
      g.fillRoundedRect(x - w/2, y - h/2, w, h, 8);
      g.lineStyle(2.5, 0xffa502, 0.85);
      g.strokeRoundedRect(x - w/2, y - h/2, w, h, 8);

      this.add.text(x, y, label, {
        fontFamily: "'Press Start 2P', monospace",
        fontSize: "14px",
        color: "#ffffff"
      }).setOrigin(0.5).setDepth(151);

      const zone = this.add.zone(x, y, w, h).setDepth(152).setInteractive();

      zone.on("pointerdown", () => {
        g.clear();
        g.fillStyle(0xff4757, 0.7);
        g.fillRoundedRect(x - w/2, y - h/2, w, h, 8);
        g.lineStyle(2.5, 0xffffff, 1);
        g.strokeRoundedRect(x - w/2, y - h/2, w, h, 8);
        if (onPress) onPress();
      });

      const release = () => {
        g.clear();
        g.fillStyle(0x000000, 0.3);
        g.fillRoundedRect(x - w/2, y - h/2, w, h, 8);
        g.lineStyle(2.5, 0xffa502, 0.85);
        g.strokeRoundedRect(x - w/2, y - h/2, w, h, 8);
        if (onRelease) onRelease();
      };

      zone.on("pointerup", release);
      zone.on("pointerout", release);
    };

    // D-Pad Left / Right (Bottom Left)
    makeTouchBtn(70, padY, 80, 52, "◀", () => { this.touchLeft = true; }, () => { this.touchLeft = false; });
    makeTouchBtn(165, padY, 80, 52, "▶", () => { this.touchRight = true; }, () => { this.touchRight = false; });

    // Jump & Restart (Bottom Right)
    makeTouchBtn(width - 75, padY, 95, 52, "▲", () => { this.touchJump = true; }, () => { this.touchJump = false; });
    makeTouchBtn(width - 160, padY, 50, 42, "↺", () => { this.restartLevel(); }, null);

    // Gravity Flip (World 4 only)
    if (this.currentLevel >= 18 && this.currentLevel <= 23) {
      makeTouchBtn(width - 225, padY, 50, 42, "⇄", () => { this.flipGravity(); }, null);
    }
  }

  update(time, delta) {
    if (this.isDead || this.isComplete) return;
    const dt = delta / 1000;
    this.levelTime += dt;
    const { width, height } = this.scale;

    // ── CRITICAL: OUT OF BOUNDS / FALLING DOWN DEATH CHECK ──
    // If player falls off the screen into a pit, trigger instant death and restart!
    if (this.player.y > height + 25 || this.player.y < -120 || this.player.x < -60 || this.player.x > width + 60) {
      this.onPlayerDie();
      return;
    }

    // 1. Horizontal Movement & Direction Facing
    const left = this.cursors.left.isDown || this.keyA.isDown || this.touchLeft;
    const right = this.cursors.right.isDown || this.keyD.isDown || this.touchRight;
    const walkSpeed = 220;

    if (left) {
      this.player.setVelocityX(-walkSpeed);
      this.player.setFlipX(true); // Face LEFT
    } else if (right) {
      this.player.setVelocityX(walkSpeed);
      this.player.setFlipX(false); // Face RIGHT
    } else {
      this.player.setVelocityX(0);
    }

    // 2. Jumping & Coyote Time
    const onFloor = (this.gravityDir === 1) ? this.player.body.blocked.down : this.player.body.blocked.up;
    if (onFloor) {
      this.coyoteTimer = 0.12;
    } else {
      this.coyoteTimer -= dt;
    }

    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
                        Phaser.Input.Keyboard.JustDown(this.cursors.space) ||
                        Phaser.Input.Keyboard.JustDown(this.keyW) ||
                        this.touchJump;

    if (jumpPressed) {
      this.jumpBufferTimer = 0.12;
      this.touchJump = false;
    } else {
      this.jumpBufferTimer -= dt;
    }

    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.player.setVelocityY(-560 * this.gravityDir);
      this.jumpBufferTimer = 0;
      this.coyoteTimer = 0;
      AudioEngine.sfxJump();

      this.tweens.add({
        targets: this.player,
        scaleX: 0.8,
        scaleY: 1.25,
        duration: 120,
        yoyo: true,
        ease: "Quad.easeOut"
      });
    }

    // 3. Cartoon Animation State Machine
    if (!onFloor) {
      if (this.player.body.velocity.y * this.gravityDir < 0) {
        this.player.anims.play("hero_anim_jump", true);
      } else {
        this.player.anims.play("hero_anim_fall", true);
      }
    } else {
      if (Math.abs(this.player.body.velocity.x) > 10) {
        this.player.anims.play("hero_anim_run", true);
      } else {
        this.player.anims.play("hero_anim_idle", true);
      }
    }

    // 4. Gravity Flip (World 4)
    if (this.currentLevel >= 18 && this.currentLevel <= 23) {
      if (Phaser.Input.Keyboard.JustDown(this.keyShift) || Phaser.Input.Keyboard.JustDown(this.keyF)) {
        this.flipGravity();
      }
    }

    // 5. R key restart
    if (Phaser.Input.Keyboard.JustDown(this.keyR)) {
      this.restartLevel();
    }

    // 6. Interactive Hazards
    this.updateHazards(dt);
  }

  flipGravity() {
    this.gravityDir *= -1;
    this.player.body.setGravityY(1400 * this.gravityDir);
    this.player.setFlipY(this.gravityDir === -1);
    AudioEngine.sfxPortal();
    this.cameras.main.shake(120, 0.015);
  }

  updateHazards(dt) {
    // A. Ceiling Crushers
    this.crushers.getChildren().forEach(crusher => {
      const dist = Math.abs(this.player.x - crusher.x);
      if (!crusher.isDropping && !crusher.isRetracting && dist < 75 && this.player.y > crusher.y) {
        crusher.isDropping = true;
        crusher.setVelocityY(850);
        AudioEngine.sfxCrush();
      }
      if (crusher.isDropping && crusher.body.blocked.down) {
        crusher.isDropping = false;
        crusher.isRetracting = true;
        crusher.setVelocityY(0);
        this.cameras.main.shake(160, 0.022);
        this.time.delayedCall(400, () => {
          if (crusher && crusher.body) crusher.setVelocityY(-140);
        });
      }
      if (crusher.isRetracting && crusher.y <= crusher.startY) {
        crusher.setVelocityY(0);
        crusher.y = crusher.startY;
        crusher.isRetracting = false;
      }
    });

    // B. Fleeing Exit Door (Level Devil signature mechanic)
    if (this.exitGate && this.exitGate.fleeOnProximity && !this.exitGate.hasFled) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.exitGate.x, this.exitGate.y);
      if (dist < 110) {
        this.exitGate.hasFled = true;
        AudioEngine.sfxTrap();
        this.tweens.add({
          targets: this.exitGate,
          x: this.exitGate.targetX || this.exitGate.x,
          y: this.exitGate.targetY || (this.exitGate.y - 140),
          duration: 350,
          ease: "Back.easeOut"
        });
        this.showTrollToast(this.exitGate.fleeMessage || "Not so fast! 😇");
      }
    }

    // C. Falling Platforms
    this.fallingPlatforms.forEach(p => {
      if (p.stepped && !p.hasFallen) {
        p.shakeTimer -= dt;
        p.x += (Math.random() - 0.5) * 4;
        if (p.shakeTimer <= 0) {
          p.hasFallen = true;
          this.physics.world.enable(p);
          p.body.setGravityY(1200);
          p.body.setImmovable(false);
        }
      }
    });

    // D. Custom Triggers
    this.customTriggers.forEach(t => {
      if (!t.triggered && t.condition(this)) {
        t.triggered = true;
        t.action(this);
      }
    });
  }

  showTrollToast(msg) {
    const { width } = this.scale;
    const toast = this.add.text(width / 2, 70, msg, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "11px",
      color: "#ffd32a",
      backgroundColor: "#111111ee",
      padding: { x: 14, y: 8 }
    }).setOrigin(0.5).setDepth(200);

    this.tweens.add({
      targets: toast,
      y: 48,
      alpha: 0,
      delay: 1500,
      duration: 450,
      onComplete: () => toast.destroy()
    });
  }

  onPlatformCollide(player, platform) {
    if (platform.isFallingPlat && !platform.stepped) {
      platform.stepped = true;
      platform.shakeTimer = 0.28;
    }
  }

  onTrampolineCollide(player, tramp) {
    player.setVelocityY(-720 * this.gravityDir);
    AudioEngine.sfxBounce();
    this.tweens.add({
      targets: tramp,
      scaleY: 0.5,
      duration: 80,
      yoyo: true
    });
  }

  onPlayerDie() {
    if (this.isDead || this.isComplete) return;
    this.isDead = true;
    this.deaths++;
    AudioEngine.sfxDie();
    this.cameras.main.shake(260, 0.035);

    SaveManager.save(this.currentLevel, this.deaths);

    this.player.anims.stop();
    this.player.setTexture("hero_dead");
    this.player.setVelocity(0, -250);

    this.add.particles(this.player.x, this.player.y, "part_dot", {
      speed: { min: 80, max: 260 },
      scale: { start: 1.1, end: 0 },
      lifespan: 600,
      quantity: 24,
      tint: 0xff4757
    });

    this.time.delayedCall(500, () => {
      this.restartLevel();
    });
  }

  restartLevel() {
    this.scene.restart({ level: this.currentLevel, deaths: this.deaths });
  }

  onReachExit() {
    if (this.isComplete || this.isDead) return;
    this.isComplete = true;
    AudioEngine.sfxWin();

    const nextLvl = this.currentLevel + 1;
    SaveManager.save(nextLvl, this.deaths);

    this.add.particles(this.exitGate.x, this.exitGate.y, "part_dot", {
      speed: { min: 100, max: 320 },
      scale: { start: 1.3, end: 0 },
      lifespan: 800,
      quantity: 36,
      tint: [0xffd32a, 0x2ed573, 0xff4757, 0x70a1ff]
    });

    this.time.delayedCall(700, () => {
      if (nextLvl >= 30 || nextLvl % 6 === 0) {
        this.scene.start("WorldSelectScene");
      } else {
        this.scene.start("GameScene", { level: nextLvl, deaths: this.deaths });
      }
    });
  }

  // ─── 7. 30 Handcrafted Deceptive Levels (Reference Style) ──
  buildLevelData(lvl) {
    const { width, height } = this.scale;
    const theme = getTheme(lvl);

    const addPlat = (x, y, w, h) => {
      const p = this.add.tileSprite(x + w/2, y + h/2, w, h, "plat_tex");
      p.setTint(theme.platform);
      this.platforms.add(p);
      return p;
    };

    const addFallingPlat = (x, y, w, h) => {
      const p = this.add.tileSprite(x + w/2, y + h/2, w, h, "plat_tex");
      p.setTint(theme.platform);
      p.isFallingPlat = true;
      p.stepped = false;
      p.hasFallen = false;
      this.platforms.add(p);
      this.fallingPlatforms.push(p);
      return p;
    };

    const addSpike = (x, y) => {
      const s = this.spikes.create(x, y, "spike_up");
      s.setTint(theme.spike);
      s.body.setSize(18, 14).setOffset(1, 6);
      return s;
    };

    const addCrusher = (x, startY) => {
      const c = this.crushers.create(x, startY, "crusher_tex");
      c.startY = startY;
      c.isDropping = false;
      c.isRetracting = false;
      c.body.setImmovable(true);
      c.body.setSize(52, 60);
      return c;
    };

    const addTrampoline = (x, y) => {
      const tr = this.trampolines.create(x, y, "tramp_tex");
      tr.body.setSize(32, 12).setOffset(0, 4);
      return tr;
    };

    this.spawnX = 60;
    this.spawnY = 410;

    // ── LEVEL 1: First Steps (Pit Gaps & Fleeing Door) ───────
    if (lvl === 0) {
      addPlat(0, 460, 240, 80);
      addPlat(340, 460, 240, 80);
      addPlat(680, 460, 280, 80);

      // Spikes in the pit gaps
      addSpike(290, 450);
      addSpike(630, 450);

      // Elevated escape platform
      addPlat(800, 310, 160, 25);

      // Fleeing Exit Door
      this.exitGate = this.physics.add.sprite(890, 437, "door_tex");
      this.exitGate.fleeOnProximity = true;
      this.exitGate.targetX = 890;
      this.exitGate.targetY = 287;
      this.exitGate.fleeMessage = "Too slow! Jump up! 😜";
    }

    // ── LEVEL 2: Watch Your Head (Desert Crushers) ───────────
    else if (lvl === 1) {
      addPlat(0, 460, width, 80);
      addCrusher(300, 60);
      addCrusher(600, 60);
      this.exitGate = this.physics.add.sprite(900, 437, "door_tex");
    }

    // ── LEVEL 3: Crumbling Trust (Falling Bridges) ───────────
    else if (lvl === 2) {
      addPlat(0, 460, 160, 80);
      addFallingPlat(220, 460, 120, 25);
      addFallingPlat(420, 460, 120, 25);
      addFallingPlat(620, 460, 120, 25);
      addPlat(800, 460, 160, 80);

      for (let sx = 200; sx <= 780; sx += 40) addSpike(sx, 520);
      this.exitGate = this.physics.add.sprite(900, 437, "door_tex");
    }

    // ── LEVEL 4: Pop-Up Floor Spikes ─────────────────────────
    else if (lvl === 3) {
      addPlat(0, 460, width, 80);
      this.customTriggers.push({
        triggered: false,
        condition: (scene) => scene.player.x > 380,
        action: (scene) => {
          for (let i = 0; i < 4; i++) {
            const sp = scene.spikes.create(480 + i * 22, 450, "spike_up").setTint(theme.spike);
            scene.tweens.add({ targets: sp, y: 440, duration: 100, yoyo: true });
          }
          AudioEngine.sfxTrap();
          scene.showTrollToast("Surprise! 😈");
        }
      });
      this.exitGate = this.physics.add.sprite(900, 437, "door_tex");
    }

    // ── LEVEL 5: Super Trampoline Leap ───────────────────────
    else if (lvl === 4) {
      addPlat(0, 460, 180, 80);
      addTrampoline(130, 452);
      addPlat(760, 310, 200, 230);
      for (let sx = 200; sx < 740; sx += 30) addSpike(sx, 520);
      this.exitGate = this.physics.add.sprite(880, 287, "door_tex");
    }

    // ── LEVEL 6: Desert Gauntlet (World 1 Climax) ────────────
    else if (lvl === 5) {
      addPlat(0, 460, 140, 80);
      addFallingPlat(200, 460, 100, 25);
      addCrusher(360, 60);
      addFallingPlat(480, 460, 100, 25);
      addCrusher(640, 60);
      addPlat(780, 340, 180, 200);
      this.exitGate = this.physics.add.sprite(880, 317, "door_tex");
      this.exitGate.fleeOnProximity = true;
      this.exitGate.targetX = 880;
      this.exitGate.targetY = 155;
      addPlat(820, 185, 140, 25);
    }

    // ── LEVELS 7 to 12 (World 2: Frost Spire) ────────────────
    else if (lvl >= 6 && lvl <= 11) {
      const sub = lvl - 6;
      addPlat(0, 460, 160, 80);
      addPlat(220 + sub * 10, 420 - sub * 20, 120, 25);
      addFallingPlat(420, 360 - sub * 10, 100, 25);
      addCrusher(580, 50);
      addPlat(740, 300 - sub * 15, 220, 240);
      for (let sx = 180; sx < 720; sx += 40) addSpike(sx, 520);
      this.exitGate = this.physics.add.sprite(880, 277 - sub * 15, "door_tex");
    }

    // ── LEVELS 13 to 18 (World 3: Shadow Crypt) ──────────────
    else if (lvl >= 12 && lvl <= 17) {
      const sub = lvl - 12;
      addPlat(0, 460, 180, 80);
      addPlat(260, 400 - sub * 10, 90, 25);
      addPlat(440, 340 - sub * 10, 90, 25);
      addFallingPlat(600, 280 - sub * 10, 90, 25);
      addCrusher(300 + sub * 30, 50);
      addPlat(760, 220, 200, 320);
      this.exitGate = this.physics.add.sprite(880, 197, "door_tex");
    }

    // ── LEVELS 19 to 24 (World 4: Gravity Nexus) ─────────────
    else if (lvl >= 18 && lvl <= 23) {
      addPlat(0, 460, 200, 80);
      addPlat(0, 0, width, 50);
      addPlat(300, 460, 120, 80);
      addPlat(500, 120, 140, 25);
      addPlat(740, 460, 220, 80);

      for (let sx = 220; sx < 720; sx += 40) addSpike(sx, 520);
      this.exitGate = this.physics.add.sprite(880, 437, "door_tex");
    }

    // ── LEVELS 25 to 30 (World 5: Glitch Core & Finale) ──────
    else {
      const sub = lvl - 24;
      addPlat(0, 460, 160, 80);
      addFallingPlat(220, 400 - sub * 8, 100, 25);
      addCrusher(360, 50);
      addFallingPlat(500, 320 - sub * 8, 100, 25);
      addCrusher(640, 50);
      addPlat(780, 220, 180, 320);
      this.exitGate = this.physics.add.sprite(880, 197, "door_tex");
    }
  }
}

// ─── 8. Phaser Game Configuration ────────────────────────────
const config = {
  type: Phaser.AUTO,
  parent: "game-container",
  width: 960,
  height: 540,
  render: {
    pixelArt: true,
    antialias: false,
    roundPixels: true,
    powerPreference: "high-performance"
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [BootScene, WorldSelectScene, GameScene]
};

// Start the game instance
try {
  window.game = new Phaser.Game(config);
} catch (err) {
  console.error("Critical: Failed to launch Phaser Game:", err);
}
