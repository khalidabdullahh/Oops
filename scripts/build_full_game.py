# Generator script for Oops! Phaser 3 game.js
import os

code = r'''// ═══════════════════════════════════════════════════════════════
//  Oops! – Ultra-Sharp Phaser 3 Edition
//  Featuring Animated Cartoon Hero, 5 Immersive Worlds & 30 Troll Levels
// ═══════════════════════════════════════════════════════════════

"use strict";

// ─── 1. Save Manager (localStorage) ─────────────────────────
const SAVE_KEY = "oops_phaser_save_v2";

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

  hasSave() {
    const d = this.load();
    return d !== null && typeof d.level === "number" && d.level > 0;
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
    this.playTone(340, "square", 0.08, 0.16);
    this.playTone(520, "square", 0.06, 0.14, 0.03);
  },
  sfxLand() {
    this.playTone(140, "sawtooth", 0.04, 0.12);
  },
  sfxDie() {
    for (let i = 0; i < 5; i++) {
      this.playTone(480 - i * 80, "sawtooth", 0.1, 0.18, i * 0.05);
    }
  },
  sfxWin() {
    [523, 659, 784, 1047, 1318].forEach((f, i) => this.playTone(f, "square", 0.14, 0.2, i * 0.08));
  },
  sfxTrap() {
    this.playTone(260, "sawtooth", 0.12, 0.2);
    this.playTone(160, "sawtooth", 0.1, 0.16, 0.06);
  },
  sfxPortal() {
    for (let i = 0; i < 6; i++) {
      this.playTone(340 + i * 90, "sine", 0.06, 0.14, i * 0.03);
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

// ─── 3. Multiverse World Themes & Realistic Palettes ─────────
const WORLD_THEMES = [
  {
    name: "DESERT RUINS",
    subtitle: "Ancient sandstone arches & falling crumbling tiles",
    bgTop: 0x5a1800, bgBottom: 0x1e0800,
    platform: 0xc8601a, platformTop: 0xe07820,
    spike: 0xcc2200, exit: 0xf1c40f,
    particle: 0xffa502,
    ambience: "dust"
  },
  {
    name: "FROST SPIRE",
    subtitle: "Slippery glacier floes & plummeting icicles",
    bgTop: 0x0a2638, bgBottom: 0x04101a,
    platform: 0x227093, platformTop: 0x34ace0,
    spike: 0x00d2d3, exit: 0x70a1ff,
    particle: 0xffffff,
    ambience: "snow"
  },
  {
    name: "SHADOW CRYPT",
    subtitle: "Dark obsidian corridors & phantom hazards",
    bgTop: 0x1f0d2b, bgBottom: 0x0c0414,
    platform: 0x47206b, platformTop: 0x70389f,
    spike: 0x8820c0, exit: 0xe056fd,
    particle: 0xbe2edd,
    ambience: "embers"
  },
  {
    name: "GRAVITY NEXUS",
    subtitle: "Cyberpunk matrix & inverted ceiling walking",
    bgTop: 0x052b1e, bgBottom: 0x02120c,
    platform: 0x10ac84, platformTop: 0x1dd1a1,
    spike: 0x10ac84, exit: 0x2ed573,
    particle: 0x1dd1a1,
    ambience: "matrix"
  },
  {
    name: "GLITCH CORE",
    subtitle: "Unstable reality & chaotic deceptive finale",
    bgTop: 0x30052b, bgBottom: 0x140212,
    platform: 0x833471, platformTop: 0xb53471,
    spike: 0xea2027, exit: 0xf368e0,
    particle: 0xff3838,
    ambience: "sparks"
  }
];

function getTheme(levelIndex) {
  const worldIndex = Math.min(Math.floor(levelIndex / 6), WORLD_THEMES.length - 1);
  return WORLD_THEMES[worldIndex];
}

// ─── 4. BootScene: High-Detail Procedural Cartoon Generator ──
class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create() {
    this.createCartoonHero();
    this.createWorldAssets();
    this.createAnimations();

    // Proceed straight to Menu
    this.scene.start("MenuScene");
  }

  // Draw expressive multi-frame cartoon hero (32x40)
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
        // Comic dizzy shock death frame
        // Body sprawled
        g.fillStyle(0x0984e3, 1);
        g.fillRoundedRect(6, 20 + yOff, 20, 10, 3);
        // Head tilted
        g.fillStyle(0xffdbac, 1);
        g.fillCircle(16, 12 + yOff, 10);
        // Red headband
        g.fillStyle(0xff3838, 1);
        g.fillRect(6, 7 + yOff, 20, 4);
        // X X eyes
        g.lineStyle(2, 0x111111, 1);
        // Left eye X
        g.lineBetween(10, 10 + yOff, 14, 14 + yOff);
        g.lineBetween(14, 10 + yOff, 10, 14 + yOff);
        // Right eye X
        g.lineBetween(18, 10 + yOff, 22, 14 + yOff);
        g.lineBetween(22, 10 + yOff, 18, 14 + yOff);
        // Dizzy open mouth & tongue
        g.fillStyle(0x111111, 1);
        g.fillCircle(16, 18 + yOff, 3);
        g.fillStyle(0xff7675, 1);
        g.fillRect(16, 18 + yOff, 3, 3);
        // Legs in shock
        g.fillStyle(0xe17055, 1);
        g.fillRect(8, 30 + yOff, 6, 6);
        g.fillRect(18, 30 + yOff, 6, 6);
        g.generateTexture(key, 32, 40);
        return;
      }

      // Headband fluttering ribbons (back)
      g.fillStyle(0xd63031, 1);
      g.fillRect(2, 8 + yOff, 5, 4);
      g.fillStyle(0xff3838, 1);
      g.fillRect(0, 10 + yOff, 4, 4);

      // Cute Cartoon Head (Skin Tone)
      g.fillStyle(0xffdbac, 1);
      g.fillCircle(16, 12 + yOff, 10);

      // Red Ninja/Hero Headband across forehead
      g.fillStyle(0xff3838, 1);
      g.fillRect(6, 6 + yOff, 20, 4);
      // Gold emblem on headband
      g.fillStyle(0xf1c40f, 1);
      g.fillRect(15, 6 + yOff, 2, 4);

      // Cheerful Pink Cheeks
      g.fillStyle(0xff7675, 0.75);
      g.fillCircle(10, 15 + yOff, 2);
      g.fillCircle(22, 15 + yOff, 2);

      // Eyes & Expression
      if (blink) {
        // Cute sleeping/blinking line eyes
        g.lineStyle(2, 0x111111, 1);
        g.lineBetween(11, 12 + yOff, 14, 12 + yOff);
        g.lineBetween(18, 12 + yOff, 21, 12 + yOff);
      } else if (panicked) {
        // Wide panic eyes looking down
        g.fillStyle(0xffffff, 1);
        g.fillCircle(12, 11 + yOff, 4);
        g.fillCircle(20, 11 + yOff, 4);
        g.fillStyle(0x111111, 1);
        g.fillCircle(12, 13 + yOff, 2);
        g.fillCircle(20, 13 + yOff, 2);
        // Shock mouth "O"
        g.fillStyle(0x111111, 1);
        g.fillCircle(16, 18 + yOff, 2.5);
      } else {
        // Big cartoon eyes looking forward
        const px = eyeLookX;
        // White sclera
        g.fillStyle(0xffffff, 1);
        g.fillRoundedRect(10, 9 + yOff, 5, 7, 2);
        g.fillRoundedRect(17, 9 + yOff, 5, 7, 2);
        // Dark Pupils
        g.fillStyle(0x111111, 1);
        g.fillRect(11 + px, 10 + yOff, 3, 5);
        g.fillRect(18 + px, 10 + yOff, 3, 5);
        // Sparkle Glint
        g.fillStyle(0xffffff, 1);
        g.fillRect(11 + px, 10 + yOff, 1.5, 1.5);
        g.fillRect(18 + px, 10 + yOff, 1.5, 1.5);

        // Smile
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
        // Jumping arms raised in air
        g.fillStyle(0x0984e3, 1);
        g.fillRect(5, 14 + yOff, 4, 8);
        g.fillRect(23, 14 + yOff, 4, 8);
        g.fillStyle(0xffdbac, 1);
        g.fillCircle(7, 13 + yOff, 2.5);
        g.fillCircle(25, 13 + yOff, 2.5);
      } else {
        // Normal arms at sides
        g.fillStyle(0x0984e3, 1);
        g.fillRect(5, 21 + yOff, 3, 6);
        g.fillRect(24, 21 + yOff, 3, 6);
        g.fillStyle(0xffdbac, 1);
        g.fillCircle(6.5, 28 + yOff, 2);
        g.fillCircle(25.5, 28 + yOff, 2);
      }

      // Animated Running Legs & Leather Boots
      g.fillStyle(0x2d3436, 1); // Pants
      const leg1X = 10 + legOffset;
      const leg2X = 18 - legOffset;
      g.fillRect(leg1X, 31 + yOff, 4, 4);
      g.fillRect(leg2X, 31 + yOff, 4, 4);

      // Boots (Warm Brown)
      g.fillStyle(0xe17055, 1);
      g.fillRoundedRect(leg1X - 1, 34 + yOff, 6, 5, 2);
      g.fillRoundedRect(leg2X - 1, 34 + yOff, 6, 5, 2);

      g.generateTexture(key, 32, 40);
    };

    // Generate hero animation frames
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
    // 1. World Platform Tile
    const platGfx = this.make.graphics({ x: 0, y: 0, add: false });
    platGfx.fillStyle(0x333333, 1);
    platGfx.fillRect(0, 0, 32, 32);
    platGfx.fillStyle(0x555555, 1);
    platGfx.fillRect(0, 0, 32, 4);
    platGfx.generateTexture("plat_tex", 32, 32);

    // 2. Sharp Spikes (20x20)
    const spkGfx = this.make.graphics({ x: 0, y: 0, add: false });
    spkGfx.fillStyle(0xee2200, 1);
    spkGfx.beginPath();
    spkGfx.moveTo(0, 20);
    spkGfx.lineTo(10, 0);
    spkGfx.lineTo(20, 20);
    spkGfx.closePath();
    spkGfx.fill();
    spkGfx.generateTexture("spike_up", 20, 20);

    const spkDownGfx = this.make.graphics({ x: 0, y: 0, add: false });
    spkDownGfx.fillStyle(0xee2200, 1);
    spkDownGfx.beginPath();
    spkDownGfx.moveTo(0, 0);
    spkDownGfx.lineTo(10, 20);
    spkDownGfx.lineTo(20, 0);
    spkDownGfx.closePath();
    spkDownGfx.fill();
    spkDownGfx.generateTexture("spike_down", 20, 20);

    // 3. Menacing Crusher Block (60x72)
    const crushGfx = this.make.graphics({ x: 0, y: 0, add: false });
    crushGfx.fillStyle(0x2d3436, 1);
    crushGfx.fillRoundedRect(0, 0, 60, 60, 4);
    crushGfx.fillStyle(0x1e272e, 1);
    crushGfx.fillRect(6, 6, 48, 48);
    // Evil glowing eyes
    crushGfx.fillStyle(0xff3838, 1);
    crushGfx.fillTriangle(14, 20, 26, 26, 14, 32);
    crushGfx.fillTriangle(46, 20, 34, 26, 46, 32);
    // Spikes on bottom
    crushGfx.fillStyle(0xcc2200, 1);
    crushGfx.fillTriangle(0, 60, 10, 72, 20, 60);
    crushGfx.fillTriangle(20, 60, 30, 72, 40, 60);
    crushGfx.fillTriangle(40, 60, 50, 72, 60, 60);
    crushGfx.generateTexture("crusher_tex", 60, 72);

    // 4. Exit Gateway Portal (34x52)
    const doorGfx = this.make.graphics({ x: 0, y: 0, add: false });
    doorGfx.fillStyle(0x111111, 1);
    doorGfx.fillRoundedRect(0, 0, 34, 52, 10);
    doorGfx.lineStyle(3, 0xffd32a, 1);
    doorGfx.strokeRoundedRect(1, 1, 32, 50, 8);
    doorGfx.fillStyle(0xffaa00, 0.75);
    doorGfx.fillCircle(17, 26, 11);
    doorGfx.fillStyle(0xffffff, 0.9);
    doorGfx.fillCircle(17, 26, 4);
    doorGfx.generateTexture("door_tex", 34, 52);

    // 5. Bouncy Trampoline Pad (32x16)
    const trampGfx = this.make.graphics({ x: 0, y: 0, add: false });
    trampGfx.fillStyle(0x2ed573, 1);
    trampGfx.fillRoundedRect(0, 8, 32, 8, 3);
    trampGfx.fillStyle(0xff4757, 1);
    trampGfx.fillRoundedRect(4, 2, 24, 6, 2);
    trampGfx.generateTexture("tramp_tex", 32, 16);

    // 6. Particles
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

// ─── 5. MenuScene: Start Screen with Hero Preview ───────────
class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    const { width, height } = this.scale;

    // Atmospheric Gradient Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x3a0800, 0x3a0800, 0x0d0200, 0x0d0200, 1);
    bg.fillRect(0, 0, width, height);

    // Floating Dust Particles
    this.add.particles(0, 0, "part_dot", {
      x: { min: 0, max: width },
      y: { min: 0, max: height },
      lifespan: 4000,
      speedY: { min: -30, max: -10 },
      speedX: { min: -15, max: 15 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.5, end: 0 },
      tint: 0xffa502,
      frequency: 180
    });

    // Big Oops! Title Banner
    const titleText = this.add.text(width / 2, height * 0.20, "Oops!", {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "62px",
      color: "#ff4757",
      stroke: "#000000",
      strokeThickness: 10
    }).setOrigin(0.5);

    // Title pulse/bounce animation
    this.tweens.add({
      targets: titleText,
      scaleX: 1.06,
      scaleY: 1.06,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    this.add.text(width / 2, height * 0.31, "A Totally Fair Deceptive Platformer", {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "10px",
      color: "#ffd32a"
    }).setOrigin(0.5);

    // Cute Animated Hero Preview in Center
    const heroPreview = this.add.sprite(width / 2, height * 0.43, "hero_idle_1").setScale(1.8);
    heroPreview.anims.play("hero_anim_idle");

    // Button Creator Helper
    const createBtn = (y, text, bgCol, borderCol, onClick) => {
      const container = this.add.container(width / 2, y);
      const btnW = 340, btnH = 46;

      const btnBg = this.add.graphics();
      btnBg.fillStyle(bgCol, 0.95);
      btnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
      btnBg.lineStyle(2, borderCol, 1);
      btnBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);

      const label = this.add.text(0, 0, text, {
        fontFamily: "'Press Start 2P', monospace",
        fontSize: "11px",
        color: "#ffffff"
      }).setOrigin(0.5);

      const hitZone = this.add.zone(0, 0, btnW, btnH).setInteractive({ cursor: "pointer" });

      hitZone.on("pointerover", () => {
        container.setScale(1.04);
        btnBg.clear();
        btnBg.fillStyle(borderCol, 1);
        btnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
        btnBg.lineStyle(2, 0xffffff, 1);
        btnBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
      });

      hitZone.on("pointerout", () => {
        container.setScale(1);
        btnBg.clear();
        btnBg.fillStyle(bgCol, 0.95);
        btnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
        btnBg.lineStyle(2, borderCol, 1);
        btnBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
      });

      hitZone.on("pointerdown", () => {
        container.setScale(0.96);
        AudioEngine.init();
        AudioEngine.sfxJump();
        onClick();
      });

      container.add([btnBg, label, hitZone]);
      return container;
    };

    let btnY = height * 0.56;

    // 1. Direct START GAME Button (Always starts Level 1 World 1)
    createBtn(btnY, "▶ START GAME (LEVEL 1)", 0xff4757, 0xc0392b, () => {
      this.scene.start("GameScene", { level: 0, deaths: 0 });
    });
    btnY += 54;

    // 2. Continue Button (If saved progress exists)
    if (SaveManager.hasSave()) {
      const save = SaveManager.load();
      createBtn(btnY, `▶ CONTINUE (LEVEL ${(save.level || 0) + 1})`, 0x2ed573, 0x1e824c, () => {
        this.scene.start("GameScene", { level: save.level, deaths: save.deaths || 0 });
      });
      btnY += 54;
    }

    // 3. Select World & Level Map
    createBtn(btnY, "🗺️ WORLD MAP & LEVELS", 0xffa502, 0xd35400, () => {
      this.scene.start("WorldSelectScene");
    });

    // Controls Hint on Bottom
    this.add.text(width / 2, height * 0.94, "PC: Arrow Keys / WASD to Move & Jump | R: Restart\nMobile: On-Screen Touch Buttons", {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "8.5px",
      color: "#888888",
      align: "center",
      lineSpacing: 5
    }).setOrigin(0.5);

    // Audio Toggle Icon (Top-Right)
    const sndText = this.add.text(width - 32, 28, AudioEngine.muted ? "🔇" : "🔊", {
      fontSize: "22px"
    }).setOrigin(0.5).setInteractive({ cursor: "pointer" });

    sndText.on("pointerdown", () => {
      AudioEngine.init();
      const muted = AudioEngine.toggleMute();
      sndText.setText(muted ? "🔇" : "🔊");
    });
  }
}

// ─── 6. WorldSelectScene: 5 Worlds & 30 Levels Map ───────────
class WorldSelectScene extends Phaser.Scene {
  constructor() {
    super("WorldSelectScene");
  }

  create() {
    const { width, height } = this.scale;
    const maxUnlocked = SaveManager.getMaxUnlocked();

    // Dark Nebula Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0526, 0x1a0526, 0x05010a, 0x05010a, 1);
    bg.fillRect(0, 0, width, height);

    // Title
    this.add.text(width / 2, 32, "SELECT WORLD & LEVEL", {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "18px",
      color: "#ffd32a"
    }).setOrigin(0.5);

    // 5 World Cards
    const worldW = 162, worldGap = 14;
    const startX = (width - (5 * worldW + 4 * worldGap)) / 2 + worldW / 2;

    WORLD_THEMES.forEach((w, i) => {
      const wx = startX + i * (worldW + worldGap);
      const wy = 84;
      const unlocked = maxUnlocked >= (i * 6);

      const wBg = this.add.graphics();
      wBg.fillStyle(unlocked ? w.platform : 0x222222, 0.9);
      wBg.fillRoundedRect(wx - worldW/2, wy - 26, worldW, 52, 6);
      wBg.lineStyle(1.5, unlocked ? w.platformTop : 0x444444, 1);
      wBg.strokeRoundedRect(wx - worldW/2, wy - 26, worldW, 52, 6);

      this.add.text(wx, wy - 9, `W${i+1}: ${w.name.split(" ")[0]}`, {
        fontFamily: "'Press Start 2P', monospace",
        fontSize: "8.5px",
        color: unlocked ? "#ffffff" : "#666666"
      }).setOrigin(0.5);

      this.add.text(wx, wy + 9, `Lv ${i*6 + 1} - ${i*6 + 6}`, {
        fontFamily: "'Press Start 2P', monospace",
        fontSize: "7.5px",
        color: unlocked ? "#ffd32a" : "#444444"
      }).setOrigin(0.5);

      const wZone = this.add.zone(wx, wy, worldW, 52).setInteractive({ cursor: unlocked ? "pointer" : "default" });
      wZone.on("pointerdown", () => {
        if (!unlocked) return;
        AudioEngine.init();
        AudioEngine.sfxJump();
        this.scene.start("GameScene", { level: i * 6, deaths: 0 });
      });
    });

    // 30 Level Nodes Grid (6 columns x 5 rows)
    const cols = 6, rows = 5;
    const nodeSize = 42, gapX = 18, gapY = 16;
    const gridW = cols * nodeSize + (cols - 1) * gapX;
    const gridLeft = (width - gridW) / 2 + nodeSize / 2;
    const gridTop = 155 + nodeSize / 2;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const lvlIdx = r * cols + c;
        const nx = gridLeft + c * (nodeSize + gapX);
        const ny = gridTop + r * (nodeSize + gapY);

        const isCleared = lvlIdx < maxUnlocked;
        const isCurrent = lvlIdx === maxUnlocked;
        const isLocked  = lvlIdx > maxUnlocked;

        const nodeGfx = this.add.graphics();
        const fillCol = isCleared ? 0x2ed573 : isCurrent ? 0xffa502 : 0x1f1f2e;
        const borderCol = isCleared ? 0x26af5f : isCurrent ? 0xffd32a : 0x333344;

        nodeGfx.fillStyle(fillCol, isLocked ? 0.3 : 0.85);
        nodeGfx.fillRoundedRect(nx - nodeSize/2, ny - nodeSize/2, nodeSize, nodeSize, 6);
        nodeGfx.lineStyle(2, borderCol, 1);
        nodeGfx.strokeRoundedRect(nx - nodeSize/2, ny - nodeSize/2, nodeSize, nodeSize, 6);

        const numText = this.add.text(nx, ny, `${lvlIdx + 1}`, {
          fontFamily: "'Press Start 2P', monospace",
          fontSize: "11px",
          color: isLocked ? "#555555" : "#ffffff"
        }).setOrigin(0.5);

        if (!isLocked) {
          const nodeZone = this.add.zone(nx, ny, nodeSize, nodeSize).setInteractive({ cursor: "pointer" });
          nodeZone.on("pointerover", () => {
            nodeGfx.setScale(1.1);
            numText.setScale(1.1);
          });
          nodeZone.on("pointerout", () => {
            nodeGfx.setScale(1);
            numText.setScale(1);
          });
          nodeZone.on("pointerdown", () => {
            AudioEngine.init();
            AudioEngine.sfxJump();
            this.scene.start("GameScene", { level: lvlIdx, deaths: 0 });
          });
        }
      }
    }

    // Back to Menu Button
    const backBtn = this.add.text(width / 2, height - 32, "◀ BACK TO MENU", {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "11px",
      color: "#888888"
    }).setOrigin(0.5).setInteractive({ cursor: "pointer" });

    backBtn.on("pointerover", () => backBtn.setColor("#ffffff"));
    backBtn.on("pointerout",  () => backBtn.setColor("#888888"));
    backBtn.on("pointerdown", () => {
      AudioEngine.init();
      this.scene.start("MenuScene");
    });
  }
}

// ─── 7. GameScene: Core Platformer & 30 Deceptive Levels ──────
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
    this.gravityDir = 1; // 1 = normal, -1 = ceiling (World 4)
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

    // 1. Realistic Thematic Background
    this.bgGfx = this.add.graphics();
    this.bgGfx.fillGradientStyle(theme.bgTop, theme.bgTop, theme.bgBottom, theme.bgBottom, 1);
    this.bgGfx.fillRect(0, 0, width, height);

    // Atmospheric Particle Emitter
    this.add.particles(0, 0, "part_dot", {
      x: { min: 0, max: width },
      y: { min: 0, max: height },
      lifespan: 3000,
      speedY: { min: -25, max: 25 },
      speedX: { min: -20, max: 20 },
      scale: { start: 0.7, end: 0 },
      alpha: { start: 0.45, end: 0 },
      tint: theme.particle,
      frequency: 180
    });

    // 2. Physics Groups
    this.platforms = this.physics.add.staticGroup();
    this.spikes = this.physics.add.staticGroup();
    this.crushers = this.physics.add.group();
    this.trampolines = this.physics.add.staticGroup();
    this.fallingPlatforms = [];
    this.popSpikes = [];
    this.customTriggers = [];

    // 3. Build Level Layout
    this.buildLevelData(this.currentLevel);

    // 4. Create Animated Cartoon Hero
    this.player = this.physics.add.sprite(this.spawnX, this.spawnY, "hero_idle_1");
    this.player.setCollideWorldBounds(true);
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

    // 5. Input Controls (Keyboard)
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.keyShift = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.keyF = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);

    // 6. HUD UI
    this.createHUD();

    // 7. On-Screen Mobile Touch Gamepad
    this.createMobileGamepad();

    // 8. Sliding World & Level Intro Banner
    this.showLevelBanner();
  }

  showLevelBanner() {
    const { width, height } = this.scale;
    const theme = getTheme(this.currentLevel);

    const bannerContainer = this.add.container(width / 2, -60).setDepth(200);

    const bgGfx = this.add.graphics();
    bgGfx.fillStyle(0x000000, 0.85);
    bgGfx.fillRoundedRect(-220, -25, 440, 50, 8);
    bgGfx.lineStyle(2, theme.platformTop, 1);
    bgGfx.strokeRoundedRect(-220, -25, 440, 50, 8);

    const wText = this.add.text(0, -7, `${theme.name} · LEVEL ${this.currentLevel + 1}`, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "11px",
      color: "#ffd32a"
    }).setOrigin(0.5);

    const subText = this.add.text(0, 10, theme.subtitle, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "7.5px",
      color: "#cccccc"
    }).setOrigin(0.5);

    bannerContainer.add([bgGfx, wText, subText]);

    // Slide in from top, hold, then slide out
    this.tweens.add({
      targets: bannerContainer,
      y: 50,
      duration: 400,
      ease: "Back.easeOut",
      onComplete: () => {
        this.time.delayedCall(1600, () => {
          this.tweens.add({
            targets: bannerContainer,
            y: -70,
            duration: 350,
            ease: "Back.easeIn",
            onComplete: () => bannerContainer.destroy()
          });
        });
      }
    });
  }

  createHUD() {
    const { width } = this.scale;
    this.hudGroup = this.add.group();

    this.levelText = this.add.text(25, 20, `LEVEL ${this.currentLevel + 1}`, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "11px",
      color: "#ffffff"
    }).setDepth(100);

    this.deathText = this.add.text(width / 2, 20, `💀 ${this.deaths}`, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "11px",
      color: "#ff4757"
    }).setOrigin(0.5, 0).setDepth(100);

    // Home button
    const homeBtn = this.add.text(width - 35, 20, "🏡", {
      fontSize: "18px"
    }).setOrigin(0.5).setDepth(100).setInteractive({ cursor: "pointer" });

    homeBtn.on("pointerdown", () => {
      AudioEngine.stopMusic();
      this.scene.start("WorldSelectScene");
    });
  }

  createMobileGamepad() {
    const { width, height } = this.scale;
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 1024);
    if (!isTouch) return;

    const padY = height - 55;

    const makeTouchBtn = (x, y, radius, label, onPress, onRelease) => {
      const g = this.add.graphics().setDepth(150);
      g.fillStyle(0xffffff, 0.22);
      g.fillCircle(x, y, radius);
      g.lineStyle(2, 0xffffff, 0.45);
      g.strokeCircle(x, y, radius);

      this.add.text(x, y, label, {
        fontFamily: "'Press Start 2P', monospace",
        fontSize: radius > 30 ? "14px" : "10px",
        color: "#ffffff"
      }).setOrigin(0.5).setDepth(151);

      const zone = this.add.zone(x, y, radius * 2, radius * 2).setDepth(152).setInteractive();

      zone.on("pointerdown", () => {
        g.clear();
        g.fillStyle(0xff4757, 0.65);
        g.fillCircle(x, y, radius);
        if (onPress) onPress();
      });

      const release = () => {
        g.clear();
        g.fillStyle(0xffffff, 0.22);
        g.fillCircle(x, y, radius);
        g.lineStyle(2, 0xffffff, 0.45);
        g.strokeCircle(x, y, radius);
        if (onRelease) onRelease();
      };

      zone.on("pointerup", release);
      zone.on("pointerout", release);
    };

    // D-Pad Left / Right
    makeTouchBtn(60, padY, 34, "◀", () => { this.touchLeft = true; }, () => { this.touchLeft = false; });
    makeTouchBtn(140, padY, 34, "▶", () => { this.touchRight = true; }, () => { this.touchRight = false; });

    // Jump & Restart Action Buttons
    makeTouchBtn(width - 65, padY, 40, "▲", () => { this.touchJump = true; }, () => { this.touchJump = false; });
    makeTouchBtn(width - 150, padY + 10, 24, "↺", () => { this.restartLevel(); }, null);

    // Gravity Flip button (World 4 only)
    if (this.currentLevel >= 18 && this.currentLevel <= 23) {
      makeTouchBtn(width - 150, padY - 45, 26, "⇄", () => { this.flipGravity(); }, null);
    }
  }

  update(time, delta) {
    if (this.isDead || this.isComplete) return;
    const dt = delta / 1000;
    this.levelTime += dt;

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

      // Jump stretch effect
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

    // 6. Interactive Hazards (Crushers, Fleeing Gates, Falling Floors)
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
    this.player.setVelocity(0, -300);

    // Comic comic poof particles
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

    // Save next level progression
    const nextLvl = this.currentLevel + 1;
    SaveManager.save(nextLvl, this.deaths);

    // Victory Confetti
    this.add.particles(this.exitGate.x, this.exitGate.y, "part_dot", {
      speed: { min: 100, max: 320 },
      scale: { start: 1.3, end: 0 },
      lifespan: 800,
      quantity: 36,
      tint: [0xffd32a, 0x2ed573, 0xff4757, 0x70a1ff]
    });

    this.time.delayedCall(700, () => {
      if (nextLvl >= 30) {
        this.scene.start("WorldSelectScene");
      } else {
        this.scene.start("GameScene", { level: nextLvl, deaths: this.deaths });
      }
    });
  }

  // ─── 8. Handcrafted 30 Troll Levels Builder ────────────────
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

    // Default Spawn
    this.spawnX = 60;
    this.spawnY = 440;

    // ── LEVEL 1: First Steps (World 1 - Desert Ruins) ────────
    if (lvl === 0) {
      addPlat(0, 480, 260, 60);
      addPlat(340, 480, 260, 60);
      addPlat(680, 480, 280, 60);
      // Spike in gap 1
      addSpike(300, 470);
      addSpike(640, 470);

      // Elevated escape platform
      addPlat(820, 320, 140, 20);

      // Exit Door moves away when approached!
      this.exitGate = this.physics.add.sprite(890, 445, "door_tex");
      this.exitGate.fleeOnProximity = true;
      this.exitGate.targetX = 890;
      this.exitGate.targetY = 285;
      this.exitGate.fleeMessage = "Too slow! Jump up! 😜";
    }

    // ── LEVEL 2: Watch Your Head (Desert Crushers) ───────────
    else if (lvl === 1) {
      addPlat(0, 480, width, 60);
      addCrusher(300, 70);
      addCrusher(600, 70);
      this.exitGate = this.physics.add.sprite(900, 445, "door_tex");
    }

    // ── LEVEL 3: Crumbling Trust (Falling Bridges) ───────────
    else if (lvl === 2) {
      addPlat(0, 480, 160, 60);
      addFallingPlat(220, 480, 120, 20);
      addFallingPlat(420, 480, 120, 20);
      addFallingPlat(620, 480, 120, 20);
      addPlat(800, 480, 160, 60);

      // Spikes below
      for (let sx = 200; sx <= 780; sx += 40) addSpike(sx, 530);
      this.exitGate = this.physics.add.sprite(900, 445, "door_tex");
    }

    // ── LEVEL 4: Pop-Up Floor Spikes ─────────────────────────
    else if (lvl === 3) {
      addPlat(0, 480, width, 60);
      // Hidden trigger: when player walks to X: 400, spikes pop up at X: 480
      this.customTriggers.push({
        triggered: false,
        condition: (scene) => scene.player.x > 380,
        action: (scene) => {
          for (let i = 0; i < 4; i++) {
            const sp = scene.spikes.create(480 + i * 22, 470, "spike_up").setTint(theme.spike);
            scene.tweens.add({ targets: sp, y: 460, duration: 100, yoyo: true });
          }
          AudioEngine.sfxTrap();
          scene.showTrollToast("Surprise! 😈");
        }
      });
      this.exitGate = this.physics.add.sprite(900, 445, "door_tex");
    }

    // ── LEVEL 5: Super Trampoline Leap ───────────────────────
    else if (lvl === 4) {
      addPlat(0, 480, 180, 60);
      addTrampoline(130, 472);
      addPlat(760, 320, 200, 220);
      for (let sx = 200; sx < 740; sx += 30) addSpike(sx, 530);
      this.exitGate = this.physics.add.sprite(880, 285, "door_tex");
    }

    // ── LEVEL 6: Desert Gauntlet (World 1 Climax) ────────────
    else if (lvl === 5) {
      addPlat(0, 480, 140, 60);
      addFallingPlat(200, 480, 100, 20);
      addCrusher(360, 70);
      addFallingPlat(480, 480, 100, 20);
      addCrusher(640, 70);
      addPlat(780, 360, 180, 180);
      this.exitGate = this.physics.add.sprite(880, 325, "door_tex");
      this.exitGate.fleeOnProximity = true;
      this.exitGate.targetX = 880;
      this.exitGate.targetY = 160;
      addPlat(820, 195, 140, 20);
    }

    // ── LEVELS 7 to 12 (World 2: Frost Spire) ────────────────
    else if (lvl >= 6 && lvl <= 11) {
      const sub = lvl - 6;
      addPlat(0, 480, 160, 60);
      addPlat(220 + sub * 10, 440 - sub * 20, 120, 20);
      addFallingPlat(420, 380 - sub * 10, 100, 20);
      addCrusher(580, 60);
      addPlat(740, 320 - sub * 15, 220, 240);
      for (let sx = 180; sx < 720; sx += 40) addSpike(sx, 530);
      this.exitGate = this.physics.add.sprite(880, 280 - sub * 15, "door_tex");
    }

    // ── LEVELS 13 to 18 (World 3: Shadow Crypt) ──────────────
    else if (lvl >= 12 && lvl <= 17) {
      const sub = lvl - 12;
      addPlat(0, 480, 180, 60);
      addPlat(260, 420 - sub * 10, 90, 20);
      addPlat(440, 360 - sub * 10, 90, 20);
      addFallingPlat(600, 300 - sub * 10, 90, 20);
      addCrusher(300 + sub * 30, 60);
      addPlat(760, 240, 200, 300);
      this.exitGate = this.physics.add.sprite(880, 200, "door_tex");
    }

    // ── LEVELS 19 to 24 (World 4: Gravity Nexus) ─────────────
    else if (lvl >= 18 && lvl <= 23) {
      addPlat(0, 480, 200, 60);
      addPlat(0, 0, width, 50); // Ceiling platform
      addPlat(300, 480, 120, 60);
      addPlat(500, 120, 140, 20);
      addPlat(740, 480, 220, 60);

      // Floor and ceiling spikes
      for (let sx = 220; sx < 720; sx += 40) addSpike(sx, 530);
      this.exitGate = this.physics.add.sprite(880, 445, "door_tex");
    }

    // ── LEVELS 25 to 30 (World 5: Glitch Core & Finale) ──────
    else {
      const sub = lvl - 24;
      addPlat(0, 480, 160, 60);
      addFallingPlat(220, 420 - sub * 8, 100, 20);
      addCrusher(360, 60);
      addFallingPlat(500, 340 - sub * 8, 100, 20);
      addCrusher(640, 60);
      addPlat(780, 240, 180, 300);
      this.exitGate = this.physics.add.sprite(880, 200, "door_tex");
    }
  }
}

// ─── 9. Phaser Game Engine Configuration ────────────────────
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
  scene: [BootScene, MenuScene, WorldSelectScene, GameScene]
};

// Start the game instance
try {
  window.game = new Phaser.Game(config);
} catch (err) {
  console.error("Critical: Failed to launch Phaser Game:", err);
}
'''

with open('/Users/khalidabdullah/AntiGravity/Oops!/game.js', 'w') as f:
    f.write(code)

print("game.js generated successfully! Size:", len(code))
