// ═══════════════════════════════════════════════════════════════
//  Oops! – Phaser 3 Game Engine Edition
//  A deceptive platformer inspired by Level Devil. Nothing is fair.
// ═══════════════════════════════════════════════════════════════

"use strict";

// ─── Save Manager (localStorage) ────────────────────────────
const SAVE_KEY = "oops_phaser_save_v1";

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
    return d !== null && typeof d.level === "number";
  },

  getMaxUnlocked() {
    const d = this.load();
    return d ? (d.maxUnlocked || d.level || 0) : 0;
  }
};

// ─── Web Audio Synthesizer ───────────────────────────────────
const AudioEngine = {
  ctx: null,
  muted: false,
  musicTimer: null,
  musicStep: 0,
  melody: [
    196, 233, 293, 392, 196, 233, 293, 392,
    174, 220, 261, 349, 174, 220, 261, 349,
    155, 196, 233, 311, 155, 196, 233, 311,
    174, 220, 261, 349, 196, 233, 293, 392
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
    this.playTone(320, "square", 0.09, 0.16);
    this.playTone(450, "square", 0.06, 0.12, 0.03);
  },
  sfxLand() {
    this.playTone(130, "sawtooth", 0.05, 0.1);
  },
  sfxDie() {
    for (let i = 0; i < 5; i++) {
      this.playTone(420 - i * 65, "sawtooth", 0.12, 0.18, i * 0.06);
    }
  },
  sfxWin() {
    [523, 659, 784, 1047].forEach((f, i) => this.playTone(f, "square", 0.16, 0.22, i * 0.1));
  },
  sfxTrap() {
    this.playTone(220, "sawtooth", 0.14, 0.2);
    this.playTone(140, "sawtooth", 0.1, 0.16, 0.07);
  },
  sfxPortal() {
    for (let i = 0; i < 6; i++) {
      this.playTone(320 + i * 80, "sine", 0.07, 0.14, i * 0.04);
    }
  },
  sfxCrush() {
    this.playTone(90, "sawtooth", 0.22, 0.35);
    this.playTone(60, "square", 0.3, 0.4, 0.04);
  },

  startMusic() {
    if (this.musicTimer || this.muted) return;
    this.musicStep = 0;
    this.musicTimer = setInterval(() => {
      if (this.muted || !this.ctx) return;
      const freq = this.melody[this.musicStep % this.melody.length];
      this.playTone(freq, "triangle", 0.18, 0.03);
      this.musicStep++;
    }, 240);
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

// ─── Multiverse World Themes ─────────────────────────────────
const WORLD_THEMES = [
  {
    name: "DESERT RUINS",
    subtitle: "Collapsing floors & fleeing gates",
    bgTop: 0x7a2000, bgBottom: 0x2e0c00,
    platform: 0xc8601a, platformTop: 0xe07820,
    spike: 0xcc2200, exit: 0xe8c060,
    particle: 0xffa502
  },
  {
    name: "FROST SPIRE",
    subtitle: "Slippery ice & icicle crushers",
    bgTop: 0x0f2a4a, bgBottom: 0x05101f,
    platform: 0x4a7a9e, platformTop: 0x7ab4e8,
    spike: 0x00d2d3, exit: 0x54a0ff,
    particle: 0xecf0f1
  },
  {
    name: "SHADOW CRYPT",
    subtitle: "Dark corridors & crossfire lasers",
    bgTop: 0x1a0c06, bgBottom: 0x080302,
    platform: 0x5c3422, platformTop: 0x824c32,
    spike: 0x991b1b, exit: 0xf59e0b,
    particle: 0x7c3aed
  },
  {
    name: "GRAVITY NEXUS",
    subtitle: "Ceiling walking & inverted loops",
    bgTop: 0x051f1a, bgBottom: 0x010a08,
    platform: 0x106052, platformTop: 0x1ca38c,
    spike: 0x059669, exit: 0x10b981,
    particle: 0x00ffcc
  },
  {
    name: "GLITCH CORE",
    subtitle: "Chromatic flickers & troll finale",
    bgTop: 0x1c063b, bgBottom: 0x090114,
    platform: 0x60269e, platformTop: 0x8b3fd9,
    spike: 0xec4899, exit: 0xf43f5e,
    particle: 0xf43f5e
  }
];

function getTheme(levelIndex) {
  const w = Math.floor(Math.max(0, levelIndex) / 6);
  return WORLD_THEMES[Math.min(w, WORLD_THEMES.length - 1)];
}

// ─── 1. BootScene: Procedural Asset Generator ────────────────
class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create() {
    // Generate Player Sprite Texture (24x34)
    const pGfx = this.make.graphics({ x: 0, y: 0, add: false });
    pGfx.fillStyle(0xffffff, 1);
    pGfx.fillRoundedRect(0, 0, 24, 34, 4);
    // Face eyes
    pGfx.fillStyle(0x111111, 1);
    pGfx.fillRect(5, 10, 4, 7);
    pGfx.fillRect(15, 10, 4, 7);
    pGfx.fillStyle(0xffffff, 1);
    pGfx.fillRect(5, 10, 2, 2);
    pGfx.fillRect(15, 10, 2, 2);
    // Cheek blush
    pGfx.fillStyle(0xff7675, 0.7);
    pGfx.fillRect(3, 19, 4, 3);
    pGfx.fillRect(17, 19, 4, 3);
    pGfx.generateTexture("player_tex", 24, 34);

    // Platform Tile (32x32)
    const platGfx = this.make.graphics({ x: 0, y: 0, add: false });
    platGfx.fillStyle(0x333333, 1);
    platGfx.fillRect(0, 0, 32, 32);
    platGfx.fillStyle(0x555555, 1);
    platGfx.fillRect(0, 0, 32, 4);
    platGfx.generateTexture("plat_tex", 32, 32);

    // Spike Textures (20x20)
    const spkGfx = this.make.graphics({ x: 0, y: 0, add: false });
    spkGfx.fillStyle(0xee2200, 1);
    spkGfx.beginPath();
    spkGfx.moveTo(0, 20);
    spkGfx.lineTo(10, 0);
    spkGfx.lineTo(20, 20);
    spkGfx.closePath();
    spkGfx.fill();
    spkGfx.generateTexture("spike_up", 20, 20);

    // Crusher Stone Block (60x60)
    const crushGfx = this.make.graphics({ x: 0, y: 0, add: false });
    crushGfx.fillStyle(0x3a3a40, 1);
    crushGfx.fillRoundedRect(0, 0, 60, 60, 4);
    crushGfx.fillStyle(0x222226, 1);
    crushGfx.fillRect(6, 6, 48, 48);
    // Evil face eyes
    crushGfx.fillStyle(0xff3300, 1);
    crushGfx.fillTriangle(14, 20, 26, 26, 14, 32);
    crushGfx.fillTriangle(46, 20, 34, 26, 46, 32);
    // Spikes bottom
    crushGfx.fillStyle(0xcc2200, 1);
    crushGfx.fillTriangle(0, 60, 10, 72, 20, 60);
    crushGfx.fillTriangle(20, 60, 30, 72, 40, 60);
    crushGfx.fillTriangle(40, 60, 50, 72, 60, 60);
    crushGfx.generateTexture("crusher_tex", 60, 72);

    // Exit Gateway Portal (32x50)
    const doorGfx = this.make.graphics({ x: 0, y: 0, add: false });
    doorGfx.fillStyle(0x111111, 1);
    doorGfx.fillRoundedRect(0, 0, 32, 50, 10);
    doorGfx.lineStyle(3, 0xffd32a, 1);
    doorGfx.strokeRoundedRect(1, 1, 30, 48, 8);
    doorGfx.fillStyle(0xffaa00, 0.6);
    doorGfx.fillCircle(16, 25, 10);
    doorGfx.generateTexture("door_tex", 32, 50);

    // Particle Dot (8x8)
    const partGfx = this.make.graphics({ x: 0, y: 0, add: false });
    partGfx.fillStyle(0xffffff, 1);
    partGfx.fillCircle(4, 4, 4);
    partGfx.generateTexture("part_dot", 8, 8);

    // Transition immediately to MenuScene
    this.scene.start("MenuScene");
  }
}

// ─── 2. MenuScene: Interactive Title & Navigation ─────────────
class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    const { width, height } = this.scale;

    // Background gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x7a2000, 0x7a2000, 0x180500, 0x180500, 1);
    bg.fillRect(0, 0, width, height);

    // Floating particles
    this.add.particles(0, 0, "part_dot", {
      x: { min: 0, max: width },
      y: height + 20,
      lifespan: 4000,
      speedY: { min: -40, max: -90 },
      speedX: { min: -20, max: 20 },
      scale: { start: 0.8, end: 0.1 },
      alpha: { start: 0.6, end: 0 },
      tint: 0xffaa00,
      quantity: 2,
      frequency: 250
    });

    // Title text with shadow & bounce
    const titleText = this.add.text(width / 2, height * 0.24, "Oops!", {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "64px",
      color: "#cc3300",
      stroke: "#2a0800",
      strokeThickness: 8,
      shadow: { color: "#ff4400", blur: 30, fill: true }
    }).setOrigin(0.5);

    this.tweens.add({
      targets: titleText,
      scaleX: 1.06,
      scaleY: 0.94,
      yoyo: true,
      repeat: -1,
      duration: 1000,
      ease: "Sine.easeInOut"
    });

    // Subtitle
    this.add.text(width / 2, height * 0.36, "a totally fair game 😇", {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "13px",
      color: "#ff9f43"
    }).setOrigin(0.5);

    // Button Creator Helper
    const createBtn = (y, text, color, bgCol, onClick) => {
      const container = this.add.container(width / 2, y);
      
      const btnBg = this.add.graphics();
      btnBg.fillStyle(bgCol, 1);
      btnBg.fillRoundedRect(-170, -22, 340, 44, 8);
      btnBg.lineStyle(2, color, 0.9);
      btnBg.strokeRoundedRect(-170, -22, 340, 44, 8);

      const label = this.add.text(0, 0, text, {
        fontFamily: "'Press Start 2P', monospace",
        fontSize: "12px",
        color: "#ffffff"
      }).setOrigin(0.5);

      const hitZone = this.add.zone(0, 0, 340, 44).setInteractive({ cursor: "pointer" });

      hitZone.on("pointerover", () => {
        container.setScale(1.05);
        btnBg.clear();
        btnBg.fillStyle(color, 1);
        btnBg.fillRoundedRect(-170, -22, 340, 44, 8);
        AudioEngine.init();
      });

      hitZone.on("pointerout", () => {
        container.setScale(1);
        btnBg.clear();
        btnBg.fillStyle(bgCol, 1);
        btnBg.fillRoundedRect(-170, -22, 340, 44, 8);
        btnBg.lineStyle(2, color, 0.9);
        btnBg.strokeRoundedRect(-170, -22, 340, 44, 8);
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

    let btnY = height * 0.52;

    // Continue button if save exists
    if (SaveManager.hasSave()) {
      const save = SaveManager.load();
      createBtn(btnY, `▶ CONTINUE (Lv ${(save && save.level ? save.level : 0) + 1})`, 0x2ed573, 0x1e824c, () => {
        this.scene.start("GameScene", { level: save.level, deaths: save.deaths || 0 });
      });
      btnY += 56;
    }

    // Play Game (Level 0)
    createBtn(btnY, "▶ PLAY GAME", 0xff4757, 0x8b0000, () => {
      this.scene.start("GameScene", { level: 0, deaths: 0 });
    });
    btnY += 56;

    // Select World & Level Map
    createBtn(btnY, "🗺️ SELECT WORLD & LEVEL", 0xffa502, 0x805000, () => {
      this.scene.start("WorldSelectScene");
    });
    btnY += 56;

    // Controls hint
    this.add.text(width / 2, height * 0.93, "PC: Arrow Keys/WASD to Move/Jump | Space: Jump | R: Restart\nMobile: On-Screen Touch Buttons", {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "8px",
      color: "#888888",
      align: "center",
      lineSpacing: 6
    }).setOrigin(0.5);

    // Audio Toggle Button (Top-Right)
    const sndText = this.add.text(width - 30, 25, AudioEngine.muted ? "🔇" : "🔊", {
      fontSize: "22px"
    }).setOrigin(0.5).setInteractive({ cursor: "pointer" });

    sndText.on("pointerdown", () => {
      AudioEngine.init();
      const muted = AudioEngine.toggleMute();
      sndText.setText(muted ? "🔇" : "🔊");
    });
  }
}

// ─── 3. WorldSelectScene: 5 Worlds & 30 Levels Map ───────────
class WorldSelectScene extends Phaser.Scene {
  constructor() {
    super("WorldSelectScene");
  }

  create() {
    const { width, height } = this.scale;
    const maxUnlocked = SaveManager.getMaxUnlocked();

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x180533, 0x180533, 0x050110, 0x050110, 1);
    bg.fillRect(0, 0, width, height);

    // Title
    this.add.text(width / 2, 35, "SELECT WORLD & LEVEL", {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "18px",
      color: "#ffd32a"
    }).setOrigin(0.5);

    // 5 World Quick Jump Buttons
    const worldW = 160, worldGap = 16;
    const startX = (width - (5 * worldW + 4 * worldGap)) / 2 + worldW / 2;

    WORLD_THEMES.forEach((w, i) => {
      const wx = startX + i * (worldW + worldGap);
      const wy = 85;
      const unlocked = maxUnlocked >= (i * 6);

      const wBg = this.add.graphics();
      wBg.fillStyle(unlocked ? w.platform : 0x222222, 0.9);
      wBg.fillRoundedRect(wx - worldW/2, wy - 25, worldW, 50, 6);
      wBg.lineStyle(1.5, unlocked ? w.platformTop : 0x444444, 1);
      wBg.strokeRoundedRect(wx - worldW/2, wy - 25, worldW, 50, 6);

      this.add.text(wx, wy - 8, `W${i+1}: ${w.name.split(" ")[0]}`, {
        fontFamily: "'Press Start 2P', monospace",
        fontSize: "8.5px",
        color: unlocked ? "#ffffff" : "#666666"
      }).setOrigin(0.5);

      this.add.text(wx, wy + 8, `Lv ${i*6 + 1} - ${i*6 + 6}`, {
        fontFamily: "'Press Start 2P', monospace",
        fontSize: "7px",
        color: unlocked ? "#ffd32a" : "#444444"
      }).setOrigin(0.5);

      const wZone = this.add.zone(wx, wy, worldW, 50).setInteractive({ cursor: unlocked ? "pointer" : "default" });
      wZone.on("pointerdown", () => {
        AudioEngine.init();
        AudioEngine.sfxJump();
        this.scene.start("GameScene", { level: i * 6, deaths: 0 });
      });
    });

    // 30 Level Nodes Grid (6 columns x 5 rows)
    const cols = 6, rows = 5;
    const nodeSize = 42, gapX = 18, gapY = 16;
    const gridW = cols * nodeSize + (cols - 1) * gapX;
    const gridH = rows * nodeSize + (rows - 1) * gapY;
    const gridLeft = (width - gridW) / 2 + nodeSize / 2;
    const gridTop = 160 + nodeSize / 2;

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
    const backBtn = this.add.text(width / 2, height - 35, "◀ BACK TO MENU", {
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

// ─── 4. GameScene: Core Platformer & 30 Troll Levels ──────────
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
  }

  create() {
    const { width, height } = this.scale;
    const theme = getTheme(this.currentLevel);

    AudioEngine.init();
    AudioEngine.startMusic();

    // 1. Background Parallax & Atmosphere
    this.bgGfx = this.add.graphics();
    this.bgGfx.fillGradientStyle(theme.bgTop, theme.bgTop, theme.bgBottom, theme.bgBottom, 1);
    this.bgGfx.fillRect(0, 0, width, height);

    // Ambient particle emitter
    this.add.particles(0, 0, "part_dot", {
      x: { min: 0, max: width },
      y: { min: 0, max: height },
      lifespan: 3000,
      speedY: { min: -20, max: 20 },
      speedX: { min: -30, max: 30 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 0.4, end: 0 },
      tint: theme.particle,
      quantity: 1,
      frequency: 200
    });

    // 2. Physics Groups
    this.platforms = this.physics.add.staticGroup();
    this.spikes = this.physics.add.staticGroup();
    this.crushers = this.physics.add.group();
    this.fallingPlatforms = [];
    this.popSpikes = [];
    this.lasers = [];
    this.customTriggers = [];

    // 3. Build Level Layout
    this.buildLevelData(this.currentLevel);

    // 4. Create Player
    this.player = this.physics.add.sprite(this.spawnX, this.spawnY, "player_tex");
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(22, 34);
    this.player.body.setGravityY(1400);

    // Collisions
    this.physics.add.collider(this.player, this.platforms, this.onPlatformCollide, null, this);
    this.physics.add.overlap(this.player, this.spikes, this.onPlayerDie, null, this);
    this.physics.add.overlap(this.player, this.crushers, this.onPlayerDie, null, this);

    if (this.exitGate) {
      this.physics.add.overlap(this.player, this.exitGate, this.onReachExit, null, this);
    }

    // 5. Input Setup (Keyboard)
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

    // 8. World Title Flash Animation
    if (this.currentLevel % 6 === 0) {
      this.showWorldBanner(theme.name);
    }
  }

  showWorldBanner(title) {
    const { width, height } = this.scale;
    const banner = this.add.text(width / 2, height / 2, title, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "28px",
      color: "#ffd32a",
      stroke: "#000000",
      strokeThickness: 8
    }).setOrigin(0.5).setDepth(200);

    this.tweens.add({
      targets: banner,
      alpha: 0,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 1800,
      ease: "Power2",
      onComplete: () => banner.destroy()
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

    // Helper for circular touch buttons
    const makeTouchBtn = (x, y, radius, label, onPress, onRelease) => {
      const g = this.add.graphics().setDepth(150);
      g.fillStyle(0xffffff, 0.2);
      g.fillCircle(x, y, radius);
      g.lineStyle(2, 0xffffff, 0.4);
      g.strokeCircle(x, y, radius);

      const txt = this.add.text(x, y, label, {
        fontFamily: "'Press Start 2P', monospace",
        fontSize: radius > 30 ? "14px" : "10px",
        color: "#ffffff"
      }).setOrigin(0.5).setDepth(151);

      const zone = this.add.zone(x, y, radius * 2, radius * 2).setDepth(152).setInteractive();

      zone.on("pointerdown", () => {
        g.clear();
        g.fillStyle(0xff4757, 0.6);
        g.fillCircle(x, y, radius);
        if (onPress) onPress();
      });

      const release = () => {
        g.clear();
        g.fillStyle(0xffffff, 0.2);
        g.fillCircle(x, y, radius);
        g.lineStyle(2, 0xffffff, 0.4);
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

    // 1. Horizontal Movement
    const left = this.cursors.left.isDown || this.keyA.isDown || this.touchLeft;
    const right = this.cursors.right.isDown || this.keyD.isDown || this.touchRight;
    const walkSpeed = 220;

    if (left) {
      this.player.setVelocityX(-walkSpeed);
      this.player.setFlipX(true);
    } else if (right) {
      this.player.setVelocityX(walkSpeed);
      this.player.setFlipX(false);
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

    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.space) ||
                        Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
                        Phaser.Input.Keyboard.JustDown(this.keyW) ||
                        this.touchJump;

    if (jumpPressed) {
      this.jumpBufferTimer = 0.12;
    } else {
      this.jumpBufferTimer -= dt;
    }

    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.jumpBufferTimer = 0;
      this.coyoteTimer = 0;
      const jumpVel = (this.gravityDir === 1) ? -560 : 560;
      this.player.setVelocityY(jumpVel);
      AudioEngine.sfxJump();
    }

    // 3. World 4 Gravity Inversion (Shift / F)
    if (this.currentLevel >= 18 && this.currentLevel <= 23) {
      if (Phaser.Input.Keyboard.JustDown(this.keyShift) || Phaser.Input.Keyboard.JustDown(this.keyF)) {
        this.flipGravity();
      }
    }

    // 4. R key restart
    if (Phaser.Input.Keyboard.JustDown(this.keyR)) {
      this.restartLevel();
    }

    // 5. Update Interactive Hazards
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
    // A. Crushers logic
    this.crushers.getChildren().forEach(crusher => {
      const dist = Math.abs(this.player.x - crusher.x);
      if (!crusher.isDropping && !crusher.isRetracting && dist < 70 && this.player.y > crusher.y) {
        crusher.isDropping = true;
        crusher.setVelocityY(800);
        AudioEngine.sfxCrush();
      }
      if (crusher.isDropping && crusher.body.blocked.down) {
        crusher.isDropping = false;
        crusher.isRetracting = true;
        crusher.setVelocityY(0);
        this.cameras.main.shake(150, 0.02);
        this.time.delayedCall(400, () => {
          if (crusher && crusher.body) crusher.setVelocityY(-120);
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
      if (dist < 100) {
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

    // D. Custom triggers
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
      y: 50,
      alpha: 0,
      delay: 1500,
      duration: 500,
      onComplete: () => toast.destroy()
    });
  }

  onPlatformCollide(player, platform) {
    if (platform.isFallingPlat && !platform.stepped) {
      platform.stepped = true;
      platform.shakeTimer = 0.28;
    }
  }

  onPlayerDie() {
    if (this.isDead || this.isComplete) return;
    this.isDead = true;
    this.deaths++;
    AudioEngine.sfxDie();
    this.cameras.main.shake(250, 0.035);

    SaveManager.save(this.currentLevel, this.deaths);

    this.player.setVisible(false);
    this.add.particles(this.player.x, this.player.y, "part_dot", {
      speed: { min: 80, max: 240 },
      scale: { start: 1, end: 0 },
      lifespan: 600,
      quantity: 24,
      tint: 0xff4757
    });

    this.time.delayedCall(450, () => {
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

    // Save progression
    const nextLvl = this.currentLevel + 1;
    SaveManager.save(nextLvl, this.deaths);

    // Confetti explosion
    this.add.particles(this.exitGate.x, this.exitGate.y, "part_dot", {
      speed: { min: 100, max: 300 },
      scale: { start: 1.2, end: 0 },
      lifespan: 800,
      quantity: 36,
      tint: [0xff4757, 0x2ed573, 0xffa502, 0x1e90ff, 0xffd32a]
    });

    this.time.delayedCall(700, () => {
      if (nextLvl >= 30) {
        AudioEngine.stopMusic();
        this.scene.start("WorldSelectScene");
      } else {
        this.scene.start("GameScene", { level: nextLvl, deaths: this.deaths });
      }
    });
  }

  // ─── 30 Handcrafted Level Builder ──────────────────────────
  buildLevelData(idx) {
    const addPlat = (x, y, w, h) => {
      const p = this.add.tileSprite(x + w/2, y + h/2, w, h, "plat_tex");
      this.platforms.add(p);
      p.body.setSize(w, h);
      return p;
    };

    const addSpike = (x, y) => {
      const s = this.spikes.create(x + 10, y + 10, "spike_up");
      s.body.setSize(16, 16);
      return s;
    };

    const addCrusher = (x, y) => {
      const c = this.crushers.create(x + 30, y + 36, "crusher_tex");
      c.body.setSize(54, 66);
      c.body.setImmovable(true);
      c.startY = y + 36;
      return c;
    };

    const addFallingPlat = (x, y, w, h) => {
      const fp = addPlat(x, y, w, h);
      fp.isFallingPlat = true;
      this.fallingPlatforms.push(fp);
      return fp;
    };

    // Default Spawn
    this.spawnX = 60;
    this.spawnY = 420;

    // Build levels dynamically
    if (idx === 0) { // Lv 1: First Steps (Fleeing Exit)
      addPlat(0, 470, 320, 70);
      addPlat(400, 470, 560, 70);
      addPlat(220, 370, 120, 20);
      addPlat(460, 320, 120, 20);
      for (let sx = 320; sx < 400; sx += 20) addSpike(sx, 520);
      this.exitGate = this.physics.add.sprite(860, 435, "door_tex");
      this.exitGate.fleeOnProximity = true;
      this.exitGate.targetX = 860;
      this.exitGate.targetY = 275;
      this.exitGate.fleeMessage = "Not so fast! 😇";
      this.customTriggers.push({
        condition: (s) => s.exitGate.hasFled,
        action: (s) => addPlat(780, 320, 160, 20)
      });
    }
    else if (idx === 1) { // Lv 2: Crushing Welcome
      addPlat(0, 470, 240, 70);
      addPlat(240, 470, 480, 70);
      addPlat(720, 470, 240, 70);
      addCrusher(300, 100);
      addCrusher(450, 100);
      addCrusher(600, 100);
      this.exitGate = this.physics.add.sprite(880, 435, "door_tex");
    }
    else if (idx === 2) { // Lv 3: Crumbling Bridge
      addPlat(0, 470, 180, 70);
      addFallingPlat(200, 470, 100, 20);
      addFallingPlat(340, 470, 100, 20);
      addFallingPlat(480, 470, 100, 20);
      addFallingPlat(620, 470, 100, 20);
      addPlat(760, 470, 200, 70);
      for (let sx = 180; sx < 760; sx += 20) addSpike(sx, 520);
      this.exitGate = this.physics.add.sprite(880, 435, "door_tex");
    }
    else if (idx === 3) { // Lv 4: Spike Ambush
      addPlat(0, 470, 960, 70);
      addPlat(300, 360, 160, 20);
      addPlat(550, 300, 160, 20);
      addCrusher(360, 80);
      this.customTriggers.push({
        condition: (s) => s.player.x > 350,
        action: () => {
          for (let sx = 400; sx < 520; sx += 20) addSpike(sx, 450);
        }
      });
      this.exitGate = this.physics.add.sprite(880, 435, "door_tex");
    }
    else if (idx === 4) { // Lv 5: The High Jump
      addPlat(0, 470, 200, 70);
      addPlat(260, 400, 100, 20);
      addPlat(420, 320, 100, 20);
      addPlat(580, 240, 100, 20);
      addPlat(740, 160, 220, 380);
      addCrusher(420, 60);
      this.exitGate = this.physics.add.sprite(880, 125, "door_tex");
    }
    else if (idx === 5) { // Lv 6: World 1 Finale
      addPlat(0, 470, 180, 70);
      addFallingPlat(220, 450, 120, 20);
      addCrusher(240, 80);
      addFallingPlat(400, 390, 120, 20);
      addCrusher(420, 80);
      addFallingPlat(580, 330, 120, 20);
      addPlat(760, 270, 200, 270);
      this.exitGate = this.physics.add.sprite(880, 235, "door_tex");
    }
    else if (idx >= 6 && idx <= 11) { // World 2: Frost Spire (Levels 7 - 12)
      addPlat(0, 470, 200, 70);
      addPlat(220 + (idx - 6) * 40, 450 - (idx - 6) * 30, 140, 20);
      addCrusher(320 + (idx - 6) * 40, 80);
      addFallingPlat(450 + (idx - 6) * 30, 400, 120, 20);
      addPlat(740, 470, 220, 70);
      this.exitGate = this.physics.add.sprite(880, 435, "door_tex");
    }
    else if (idx >= 12 && idx <= 17) { // World 3: Shadow Crypt (Levels 13 - 18)
      addPlat(0, 470, 180, 70);
      addCrusher(240, 80);
      addCrusher(400, 80);
      addCrusher(560, 80);
      addPlat(180, 470, 600, 70);
      addPlat(780, 470, 180, 70);
      this.exitGate = this.physics.add.sprite(880, 435, "door_tex");
      if (idx === 17) {
        this.exitGate.fleeOnProximity = true;
        this.exitGate.targetX = 100;
        this.exitGate.targetY = 435;
        this.exitGate.fleeMessage = "Back to start! 😈";
      }
    }
    else if (idx >= 18 && idx <= 23) { // World 4: Gravity Nexus (Levels 19 - 24)
      addPlat(0, 470, 960, 70);
      addPlat(0, 0, 960, 70);
      // Floor spikes & ceiling spikes requiring mid-air flips
      for (let sx = 200; sx < 400; sx += 20) addSpike(sx, 450);
      addCrusher(500, 80);
      this.exitGate = this.physics.add.sprite(880, 435, "door_tex");
    }
    else { // World 5: Glitch Core (Levels 25 - 30)
      addPlat(0, 470, 160, 70);
      addFallingPlat(200, 430, 100, 20);
      addCrusher(220, 70);
      addFallingPlat(360, 360, 100, 20);
      addCrusher(380, 70);
      addFallingPlat(520, 290, 100, 20);
      addCrusher(540, 70);
      addFallingPlat(680, 220, 100, 20);
      addPlat(820, 160, 140, 380);
      this.exitGate = this.physics.add.sprite(890, 125, "door_tex");
    }
  }
}

// Global error logger
window.addEventListener('error', (e) => {
  console.error('GLOBAL JS ERROR:', e.message, 'at', e.filename, 'line:', e.lineno);
});

// ─── Phaser Game Configuration ───────────────────────────────
const config = {
  type: Phaser.AUTO,
  parent: "game-container",
  width: 960,
  height: 540,
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
  console.log("Initializing Phaser Game with config...");
  window.game = new Phaser.Game(config);
  console.log("Phaser Game instance created successfully!");
} catch (err) {
  console.error("CRITICAL: Failed to create Phaser.Game instance:", err);
}
