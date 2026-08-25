// ═══════════════════════════════════════════════════════════════
//  Oops! – Ultra-Sharp Phaser 3 Edition
//  5 Multiverse Worlds x 30 Levels (150 Handcrafted Stages)
// ═══════════════════════════════════════════════════════════════

"use strict";

// ─── 1. Save Manager (Progress per World) ────────────────────
const SAVE_KEY = "oops_multiworld_v4";

const SaveManager = {
  getInitialState() {
    return {
      worlds: {
        0: { maxUnlocked: 0, cleared: [] },
        1: { maxUnlocked: 0, cleared: [] },
        2: { maxUnlocked: 0, cleared: [] },
        3: { maxUnlocked: 0, cleared: [] },
        4: { maxUnlocked: 0, cleared: [] }
      },
      deaths: 0,
      currentWorld: 0
    };
  },

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return this.getInitialState();
      const data = JSON.parse(raw);
      if (!data.worlds) return this.getInitialState();
      return data;
    } catch(e) {
      return this.getInitialState();
    }
  },

  saveLevelClear(worldIdx, levelIdx, deaths) {
    const data = this.load();
    if (!data.worlds[worldIdx]) {
      data.worlds[worldIdx] = { maxUnlocked: 0, cleared: [] };
    }
    const w = data.worlds[worldIdx];
    if (!w.cleared.includes(levelIdx)) {
      w.cleared.push(levelIdx);
    }
    w.maxUnlocked = Math.max(w.maxUnlocked, Math.min(levelIdx + 1, 29));
    data.deaths = deaths;
    data.currentWorld = worldIdx;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch(e) {}
  },

  saveDeaths(deaths) {
    const data = this.load();
    data.deaths = deaths;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch(e) {}
  },

  getWorldUnlocked(worldIdx) {
    const data = this.load();
    const w = data.worlds[worldIdx];
    return w ? (w.maxUnlocked || 0) : 0;
  },

  isLevelCleared(worldIdx, levelIdx) {
    const data = this.load();
    const w = data.worlds[worldIdx];
    return w && w.cleared && w.cleared.includes(levelIdx);
  },

  getTotalDeaths() {
    const data = this.load();
    return data.deaths || 0;
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

// ─── 3. 5 Multiverse Worlds Configuration ────────────────────
const WORLD_THEMES = [
  {
    id: 0,
    name: "DESERT RUINS",
    badge: "WORLD 1",
    subtitle: "Ancient sandstone cavern & crumbling steps",
    bg: 0x8a2c14,
    platform: 0xe5825b,
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
    bg: 0x12364c,
    platform: 0x5fa8c8,
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
    bg: 0x280e3d,
    platform: 0x8a5ca8,
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
    bg: 0x0a2f22,
    platform: 0x38b88c,
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
    bg: 0x3d0a28,
    platform: 0xb84a82,
    platformTop: 0xd86aa2,
    spike: 0xff4757,
    door: 0xffffff,
    island: 0x7d2358,
    islandBorder: 0x5c143e,
    accent: 0xff3838
  }
];

function getTheme(worldIdx) {
  const idx = Math.max(0, Math.min(worldIdx, WORLD_THEMES.length - 1));
  return WORLD_THEMES[idx];
}

// ─── 4. BootScene: Assets & Animations ───────────────────────
class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create() {
    this.createCartoonHero();
    this.createWorldAssets();
    this.createAnimations();

    // Start in Overworld Island Map
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

      // Eyes
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

      // Shirt / Tunic
      g.fillStyle(0x0984e3, 1);
      g.fillRoundedRect(8, 20 + yOff, 16, 10, 3);

      // Gold Belt
      g.fillStyle(0xf1c40f, 1);
      g.fillRect(8, 28 + yOff, 16, 3);
      g.fillStyle(0xe67e22, 1);
      g.fillRect(14, 27 + yOff, 4, 5);

      // Arms
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

      // Legs & Boots
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
    // 1. Platform Texture
    const platGfx = this.make.graphics({ x: 0, y: 0, add: false });
    platGfx.fillStyle(0xffffff, 1);
    platGfx.fillRect(0, 0, 32, 32);
    platGfx.fillStyle(0x000000, 0.12);
    platGfx.fillRect(0, 0, 32, 3);
    platGfx.generateTexture("plat_tex", 32, 32);

    // 2. Sharp Spikes
    const spkGfx = this.make.graphics({ x: 0, y: 0, add: false });
    spkGfx.fillStyle(0xffffff, 1);
    spkGfx.beginPath();
    spkGfx.moveTo(0, 20);
    spkGfx.lineTo(10, 0);
    spkGfx.lineTo(20, 20);
    spkGfx.closePath();
    spkGfx.fill();
    spkGfx.generateTexture("spike_up", 20, 20);

    // 3. Crusher Block
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

    // 4. White/Grey Arch Exit Door
    const doorGfx = this.make.graphics({ x: 0, y: 0, add: false });
    doorGfx.fillStyle(0xffffff, 1);
    doorGfx.fillRoundedRect(0, 0, 32, 46, 10);
    doorGfx.fillStyle(0x2d3436, 1);
    doorGfx.fillRoundedRect(4, 8, 24, 38, 8);
    doorGfx.generateTexture("door_tex", 32, 46);

    // 5. Particle Dot
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

// ─── 5. WorldSelectScene: 30 Levels per World Island Map ─────
class WorldSelectScene extends Phaser.Scene {
  constructor() {
    super("WorldSelectScene");
    this.currentWorldIdx = 0;
    this.pageIdx = 0; // 0: Lv 1-10, 1: Lv 11-20, 2: Lv 21-30
  }

  init(data) {
    if (typeof data.world === "number") {
      this.currentWorldIdx = data.world;
    }
  }

  create() {
    const { width, height } = this.scale;
    AudioEngine.init();

    this.bgGfx = this.add.graphics();
    this.drawBackground();

    this.islandContainer = this.add.container(0, 0);
    this.renderWorldIsland();
  }

  drawBackground() {
    const { width, height } = this.scale;
    const theme = getTheme(this.currentWorldIdx);
    this.bgGfx.clear();
    this.bgGfx.fillStyle(theme.bg, 1);
    this.bgGfx.fillRect(0, 0, width, height);

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
    const theme = getTheme(this.currentWorldIdx);
    const maxUnlocked = SaveManager.getWorldUnlocked(this.currentWorldIdx);

    // 1. Top Header Title
    const titleText = this.add.text(width / 2, 34, "Oops! - WORLD MAP", {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "22px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 6
    }).setOrigin(0.5);
    this.islandContainer.add(titleText);

    // Sound Toggle (Top-Right)
    const sndText = this.add.text(width - 40, 34, AudioEngine.muted ? "🔇" : "🔊", {
      fontSize: "22px"
    }).setOrigin(0.5).setInteractive({ cursor: "pointer" });
    sndText.on("pointerdown", () => {
      AudioEngine.init();
      const muted = AudioEngine.toggleMute();
      sndText.setText(muted ? "🔇" : "🔊");
    });
    this.islandContainer.add(sndText);

    // 2. Large Pixel Organic World Island
    const islandW = 820, islandH = 370;
    const islandX = width / 2, islandY = height / 2 + 25;

    const islGfx = this.add.graphics();
    islGfx.fillStyle(0x000000, 0.4);
    islGfx.fillRoundedRect(islandX - islandW / 2 + 10, islandY - islandH / 2 + 15, islandW, islandH, 24);
    islGfx.fillStyle(theme.island, 1);
    islGfx.fillRoundedRect(islandX - islandW / 2, islandY - islandH / 2, islandW, islandH, 24);
    islGfx.lineStyle(4, theme.islandBorder, 1);
    islGfx.strokeRoundedRect(islandX - islandW / 2, islandY - islandH / 2, islandW, islandH, 24);
    this.islandContainer.add(islGfx);

    // World Banner & Navigation Bar
    const worldBadge = this.add.text(islandX, islandY - islandH / 2 + 30, `${theme.badge}: ${theme.name}`, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "14px",
      color: "#ffd32a",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5);
    this.islandContainer.add(worldBadge);

    const subText = this.add.text(islandX, islandY - islandH / 2 + 52, `${theme.subtitle} (30 Levels)`, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "8.5px",
      color: "#ffffff"
    }).setOrigin(0.5);
    this.islandContainer.add(subText);

    // 3. Level Pagination Tabs on Island (1-10 | 11-20 | 21-30)
    const tabLabels = ["LEVELS 1 - 10", "LEVELS 11 - 20", "LEVELS 21 - 30"];
    const tabW = 160, tabGap = 12;
    const tabStartX = islandX - (3 * tabW + 2 * tabGap) / 2 + tabW / 2;
    const tabY = islandY - islandH / 2 + 82;

    tabLabels.forEach((label, p) => {
      const tx = tabStartX + p * (tabW + tabGap);
      const isSelected = (this.pageIdx === p);

      const tabGfx = this.add.graphics();
      tabGfx.fillStyle(isSelected ? 0xffd32a : 0x111111, isSelected ? 1 : 0.6);
      tabGfx.fillRoundedRect(tx - tabW / 2, tabY - 14, tabW, 28, 6);
      tabGfx.lineStyle(2, isSelected ? 0xffffff : theme.islandBorder, 1);
      tabGfx.strokeRoundedRect(tx - tabW / 2, tabY - 14, tabW, 28, 6);

      const tText = this.add.text(tx, tabY, label, {
        fontFamily: "'Press Start 2P', monospace",
        fontSize: "8px",
        color: isSelected ? "#000000" : "#ffffff"
      }).setOrigin(0.5);

      const tabZone = this.add.zone(tx, tabY, tabW, 28).setInteractive({ cursor: "pointer" });
      tabZone.on("pointerdown", () => {
        AudioEngine.init();
        AudioEngine.sfxJump();
        this.pageIdx = p;
        this.renderWorldIsland();
      });

      this.islandContainer.add([tabGfx, tText, tabZone]);
    });

    // 4. 10 Large Circular Level Nodes for Current Page (2 rows of 5 nodes)
    const pageOffset = this.pageIdx * 10;
    const nodeSize = 52, gapX = 36, gapY = 24;
    const gridCols = 5, gridRows = 2;
    const totalNodesW = gridCols * nodeSize + (gridCols - 1) * gapX;
    const nodesStartX = islandX - totalNodesW / 2 + nodeSize / 2;
    const nodesStartY = islandY + 12;

    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        const localIdx = r * gridCols + c;
        const lvlIdx = pageOffset + localIdx;
        const nx = nodesStartX + c * (nodeSize + gapX);
        const ny = nodesStartY + r * (nodeSize + gapY);

        const isCleared = SaveManager.isLevelCleared(this.currentWorldIdx, lvlIdx);
        const isCurrent = lvlIdx === maxUnlocked;
        const isLocked  = (lvlIdx > maxUnlocked) && (lvlIdx > 0);

        // Self-contained container centered at (nx, ny) to fix scale offset bug!
        const nodeContainer = this.add.container(nx, ny);

        const nodeGfx = this.add.graphics();
        const fillCol = isCleared ? 0x2ed573 : isCurrent ? 0xffd32a : 0x222226;
        const borderCol = isCleared ? 0x26af5f : isCurrent ? 0xffffff : 0x444444;

        nodeGfx.fillStyle(fillCol, isLocked ? 0.4 : 1);
        nodeGfx.fillCircle(0, 0, nodeSize / 2);
        nodeGfx.lineStyle(3, borderCol, 1);
        nodeGfx.strokeCircle(0, 0, nodeSize / 2);

        const numText = this.add.text(0, -3, `${lvlIdx + 1}`, {
          fontFamily: "'Press Start 2P', monospace",
          fontSize: "12px",
          color: isLocked ? "#666666" : isCurrent ? "#000000" : "#ffffff",
          stroke: "#000000",
          strokeThickness: isCurrent ? 0 : 3
        }).setOrigin(0.5);

        const statusText = this.add.text(0, 14, isCleared ? "✓" : isCurrent ? "★" : "🔒", {
          fontFamily: "'Press Start 2P', monospace",
          fontSize: "7px",
          color: isCleared ? "#ffffff" : isCurrent ? "#000000" : "#777777"
        }).setOrigin(0.5);

        nodeContainer.add([nodeGfx, numText, statusText]);

        // Active level bouncing arrow cursor
        if (isCurrent) {
          const arrow = this.add.text(0, -nodeSize / 2 - 14, "▼", {
            fontFamily: "'Press Start 2P', monospace",
            fontSize: "14px",
            color: "#ffd32a"
          }).setOrigin(0.5);
          this.tweens.add({
            targets: arrow,
            y: -nodeSize / 2 - 8,
            duration: 400,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut"
          });
          nodeContainer.add(arrow);
        }

        if (!isLocked) {
          const hitZone = this.add.zone(0, 0, nodeSize + 8, nodeSize + 8).setInteractive({ cursor: "pointer" });
          hitZone.on("pointerover", () => {
            nodeContainer.setScale(1.12);
          });
          hitZone.on("pointerout", () => {
            nodeContainer.setScale(1);
          });
          hitZone.on("pointerdown", () => {
            AudioEngine.init();
            AudioEngine.sfxJump();
            this.scene.start("GameScene", { world: this.currentWorldIdx, level: lvlIdx, deaths: SaveManager.getTotalDeaths() });
          });
          nodeContainer.add(hitZone);
        }

        this.islandContainer.add(nodeContainer);
      }
    }

    // 5. World Switching Navigation (◀ PREV WORLD / NEXT WORLD ▶)
    if (this.currentWorldIdx > 0) {
      const prevBtn = this.add.container(islandX - islandW / 2 + 70, islandY + islandH / 2 - 32);
      const pbGfx = this.add.graphics();
      pbGfx.fillStyle(0x111111, 0.85);
      pbGfx.fillRoundedRect(-55, -16, 110, 32, 6);
      pbGfx.lineStyle(2, 0xffffff, 0.8);
      pbGfx.strokeRoundedRect(-55, -16, 110, 32, 6);
      const pbLabel = this.add.text(0, 0, "◀ PREV", {
        fontFamily: "'Press Start 2P', monospace",
        fontSize: "8.5px",
        color: "#ffffff"
      }).setOrigin(0.5);
      const pZone = this.add.zone(0, 0, 110, 32).setInteractive({ cursor: "pointer" });
      pZone.on("pointerdown", () => {
        AudioEngine.init();
        AudioEngine.sfxJump();
        this.currentWorldIdx--;
        this.pageIdx = 0;
        this.drawBackground();
        this.renderWorldIsland();
      });
      prevBtn.add([pbGfx, pbLabel, pZone]);
      this.islandContainer.add(prevBtn);
    }

    if (this.currentWorldIdx < WORLD_THEMES.length - 1) {
      const nextBtn = this.add.container(islandX + islandW / 2 - 70, islandY + islandH / 2 - 32);
      const nbGfx = this.add.graphics();
      nbGfx.fillStyle(0x111111, 0.85);
      nbGfx.fillRoundedRect(-55, -16, 110, 32, 6);
      nbGfx.lineStyle(2, 0xffffff, 0.8);
      nbGfx.strokeRoundedRect(-55, -16, 110, 32, 6);
      const nbLabel = this.add.text(0, 0, "NEXT ▶", {
        fontFamily: "'Press Start 2P', monospace",
        fontSize: "8.5px",
        color: "#ffffff"
      }).setOrigin(0.5);
      const nZone = this.add.zone(0, 0, 110, 32).setInteractive({ cursor: "pointer" });
      nZone.on("pointerdown", () => {
        AudioEngine.init();
        AudioEngine.sfxJump();
        this.currentWorldIdx++;
        this.pageIdx = 0;
        this.drawBackground();
        this.renderWorldIsland();
      });
      nextBtn.add([nbGfx, nbLabel, nZone]);
      this.islandContainer.add(nextBtn);
    }

    // Direct Play Button for Active Level
    const playBtn = this.add.container(islandX, islandY + islandH / 2 - 32);
    const plGfx = this.add.graphics();
    plGfx.fillStyle(0x2ed573, 1);
    plGfx.fillRoundedRect(-130, -16, 260, 32, 8);
    plGfx.lineStyle(2, 0xffffff, 1);
    plGfx.strokeRoundedRect(-130, -16, 260, 32, 8);

    const plLabel = this.add.text(0, 0, `▶ PLAY LEVEL ${maxUnlocked + 1}`, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "9.5px",
      color: "#ffffff"
    }).setOrigin(0.5);

    const plZone = this.add.zone(0, 0, 260, 32).setInteractive({ cursor: "pointer" });
    plZone.on("pointerdown", () => {
      AudioEngine.init();
      AudioEngine.sfxJump();
      this.scene.start("GameScene", { world: this.currentWorldIdx, level: maxUnlocked, deaths: SaveManager.getTotalDeaths() });
    });
    playBtn.add([plGfx, plLabel, plZone]);
    this.islandContainer.add(playBtn);
  }
}

// ─── 6. GameScene: Core Platformer (30 Levels per World) ─────
class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  init(data) {
    this.currentWorld = (typeof data.world === "number") ? data.world : 0;
    this.currentLevel = (typeof data.level === "number") ? data.level : 0;
    this.deaths = (typeof data.deaths === "number") ? data.deaths : SaveManager.getTotalDeaths();
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
    const theme = getTheme(this.currentWorld);

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

    // 3. Build Level Layout (1 of 30 in this world)
    this.buildLevelData(this.currentWorld, this.currentLevel);

    // 4. Create Animated Cartoon Hero
    this.player = this.physics.add.sprite(this.spawnX, this.spawnY, "hero_idle_1");
    this.player.setCollideWorldBounds(false); // No bottom collision so pit falls trigger death!
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
    const theme = getTheme(this.currentWorld);

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
    const theme = getTheme(this.currentWorld);

    // Top-Left: Level Title
    this.levelText = this.add.text(25, 20, `${theme.badge} · LV ${this.currentLevel + 1}`, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "10px",
      color: "#ffffff"
    }).setDepth(100);

    // Top-Right: Deaths & World Map Return
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
      this.scene.start("WorldSelectScene", { world: this.currentWorld });
    });
  }

  createMobileGamepad() {
    const { width, height } = this.scale;
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 1024);
    if (!isTouch) return;

    const padY = height - 50;

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

    makeTouchBtn(70, padY, 80, 52, "◀", () => { this.touchLeft = true; }, () => { this.touchLeft = false; });
    makeTouchBtn(165, padY, 80, 52, "▶", () => { this.touchRight = true; }, () => { this.touchRight = false; });

    makeTouchBtn(width - 75, padY, 95, 52, "▲", () => { this.touchJump = true; }, () => { this.touchJump = false; });
    makeTouchBtn(width - 160, padY, 50, 42, "↺", () => { this.restartLevel(); }, null);

    if (this.currentWorld === 3) {
      makeTouchBtn(width - 225, padY, 50, 42, "⇄", () => { this.flipGravity(); }, null);
    }
  }

  update(time, delta) {
    if (this.isDead || this.isComplete) return;
    const dt = delta / 1000;
    this.levelTime += dt;
    const { width, height } = this.scale;

    // Pit fall death check
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
    if (this.currentWorld === 3) {
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

    if (this.exitGate && this.exitGate.fleeOnProximity && !this.exitGate.hasFled) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.exitGate.x, this.exitGate.y);
      if (dist < 100) {
        this.exitGate.hasFled = true;
        AudioEngine.sfxTrap();
        this.tweens.add({
          targets: this.exitGate,
          x: this.exitGate.targetX || this.exitGate.x,
          y: this.exitGate.targetY || (this.exitGate.y - 70),
          duration: 350,
          ease: "Back.easeOut"
        });
        this.showTrollToast(this.exitGate.fleeMessage || "Oops! 😇");
      }
    }

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

    SaveManager.saveDeaths(this.deaths);

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
    this.scene.restart({ world: this.currentWorld, level: this.currentLevel, deaths: this.deaths });
  }

  onReachExit() {
    if (this.isComplete || this.isDead) return;
    this.isComplete = true;
    AudioEngine.sfxWin();

    SaveManager.saveLevelClear(this.currentWorld, this.currentLevel, this.deaths);

    this.add.particles(this.exitGate.x, this.exitGate.y, "part_dot", {
      speed: { min: 100, max: 320 },
      scale: { start: 1.3, end: 0 },
      lifespan: 800,
      quantity: 36,
      tint: [0xffd32a, 0x2ed573, 0xff4757, 0x70a1ff]
    });

    this.time.delayedCall(700, () => {
      const nextLvl = this.currentLevel + 1;
      if (nextLvl >= 30) {
        // World completed!
        this.scene.start("WorldSelectScene", { world: this.currentWorld });
      } else {
        this.scene.start("GameScene", { world: this.currentWorld, level: nextLvl, deaths: this.deaths });
      }
    });
  }

  // ─── 7. 30 Distinct Handcrafted Levels Per World ───────────
  buildLevelData(wIdx, lvl) {
    const { width, height } = this.scale;
    const theme = getTheme(wIdx);

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

    // ── LEVEL 1 (All Worlds): Fair, Fun Introduction ────────
    if (lvl === 0) {
      // Solid floor with 2 small, easily jumpable 50px gaps
      addPlat(0, 460, 260, 80);
      addPlat(320, 460, 260, 80);
      addPlat(640, 460, 320, 80);

      // Spikes in bottom of gap
      addSpike(290, 450);
      addSpike(610, 450);

      // Gentle low step next to exit door
      addPlat(800, 400, 160, 60);

      // Exit Door starts on lower ground and does a cute 50px hop onto the step!
      this.exitGate = this.physics.add.sprite(750, 437, "door_tex");
      this.exitGate.fleeOnProximity = true;
      this.exitGate.targetX = 880;
      this.exitGate.targetY = 377; // Easily reachable!
      this.exitGate.fleeMessage = "Oops! Just a little hop! 😃";
    }

    // ── LEVEL 2: Watch Your Head (Crushers) ─────────────────
    else if (lvl === 1) {
      addPlat(0, 460, width, 80);
      addCrusher(320, 60);
      addCrusher(620, 60);
      this.exitGate = this.physics.add.sprite(900, 437, "door_tex");
    }

    // ── LEVEL 3: Crumbling Stepping Stones ───────────────────
    else if (lvl === 2) {
      addPlat(0, 460, 180, 80);
      addFallingPlat(240, 460, 100, 25);
      addFallingPlat(420, 460, 100, 25);
      addFallingPlat(600, 460, 100, 25);
      addPlat(780, 460, 180, 80);
      for (let sx = 200; sx <= 760; sx += 40) addSpike(sx, 520);
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
      addPlat(760, 340, 200, 200);
      for (let sx = 200; sx < 740; sx += 30) addSpike(sx, 520);
      this.exitGate = this.physics.add.sprite(880, 317, "door_tex");
    }

    // ── LEVEL 6: Gauntlet ────────────────────────────────────
    else if (lvl === 5) {
      addPlat(0, 460, 140, 80);
      addFallingPlat(200, 460, 100, 25);
      addCrusher(360, 60);
      addFallingPlat(480, 460, 100, 25);
      addCrusher(640, 60);
      addPlat(780, 380, 180, 160);
      this.exitGate = this.physics.add.sprite(880, 357, "door_tex");
    }

    // ── LEVELS 7 to 30: Escalating Traps & Challenge ─────────
    else {
      const seg = lvl % 5;
      const tier = Math.floor(lvl / 5);

      if (seg === 1) {
        // Multi Crusher Alley
        addPlat(0, 460, width, 80);
        addCrusher(240, 50);
        addCrusher(480, 50);
        addCrusher(720, 50);
        this.exitGate = this.physics.add.sprite(900, 437, "door_tex");
      } else if (seg === 2) {
        // Stairway of Falling Tiles
        addPlat(0, 460, 140, 80);
        addFallingPlat(190, 420 - tier * 4, 80, 25);
        addFallingPlat(330, 380 - tier * 4, 80, 25);
        addFallingPlat(470, 340 - tier * 4, 80, 25);
        addFallingPlat(610, 300 - tier * 4, 80, 25);
        addPlat(750, 260 - tier * 4, 210, 300);
        for (let sx = 160; sx < 740; sx += 40) addSpike(sx, 520);
        this.exitGate = this.physics.add.sprite(880, 237 - tier * 4, "door_tex");
      } else if (seg === 3) {
        // Trampoline over Spikes with Crusher
        addPlat(0, 460, 160, 80);
        addTrampoline(120, 452);
        addCrusher(450, 50);
        addPlat(740, 360, 220, 180);
        for (let sx = 180; sx < 720; sx += 35) addSpike(sx, 520);
        this.exitGate = this.physics.add.sprite(880, 337, "door_tex");
      } else if (seg === 4) {
        // Fleeing Gate Maze
        addPlat(0, 460, 200, 80);
        addPlat(280, 400, 120, 25);
        addPlat(480, 340, 120, 25);
        addPlat(680, 280, 120, 25);
        addPlat(820, 220, 140, 320);
        for (let sx = 220; sx < 800; sx += 40) addSpike(sx, 520);
        this.exitGate = this.physics.add.sprite(880, 197, "door_tex");
        this.exitGate.fleeOnProximity = true;
        this.exitGate.targetX = 880;
        this.exitGate.targetY = 197;
      } else {
        // World Climax Chamber
        addPlat(0, 460, 140, 80);
        addFallingPlat(190, 460, 90, 25);
        addCrusher(340, 50);
        addFallingPlat(460, 460, 90, 25);
        addCrusher(600, 50);
        addFallingPlat(710, 460, 90, 25);
        addPlat(830, 460, 130, 80);
        this.exitGate = this.physics.add.sprite(900, 437, "door_tex");
      }
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
