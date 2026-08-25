// ═══════════════════════════════════════════════════════════════
//  Oops! – Multiverse Platformer Edition
//  5 Unique Worlds x 30 Handcrafted Stages (150 Total)
//  100% Responsive Viewport & In-Game GitHub Feedback System
// ═══════════════════════════════════════════════════════════════

"use strict";

// ─── 1. Save Manager ─────────────────────────────────────────
const SAVE_KEY = "oops_multiverse_v9";

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
  sfxIcicle() {
    this.playTone(600, "sine", 0.08, 0.2);
    this.playTone(400, "triangle", 0.1, 0.15, 0.04);
  },
  sfxLaser() {
    this.playTone(750, "sawtooth", 0.08, 0.18);
    this.playTone(950, "square", 0.06, 0.15, 0.03);
  },
  sfxGlitch() {
    for (let i = 0; i < 4; i++) {
      this.playTone(180 + Math.random() * 600, "sawtooth", 0.04, 0.18, i * 0.03);
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

// ─── 3. Mobile Gamepad Controller Bridge (Ergonomic & Anchored)
const MobileGamepad = {
  initialized: false,
  activeScene: null,

  init() {
    if (this.initialized) return;
    this.initialized = true;

    const btnLeft = document.getElementById("btn-left");
    const btnRight = document.getElementById("btn-right");
    const btnJump = document.getElementById("btn-jump");
    const btnFlip = document.getElementById("btn-flip");
    const btnRestart = document.getElementById("btn-restart");

    const bindButton = (el, onDown, onUp) => {
      if (!el) return;

      const press = (e) => {
        if (e.cancelable) e.preventDefault();
        el.classList.add("pressed");
        AudioEngine.init();
        if (onDown && this.activeScene) onDown(this.activeScene);
      };

      const release = (e) => {
        if (e.cancelable) e.preventDefault();
        el.classList.remove("pressed");
        if (onUp && this.activeScene) onUp(this.activeScene);
      };

      el.addEventListener("pointerdown", press, { passive: false });
      el.addEventListener("pointerup", release, { passive: false });
      el.addEventListener("pointercancel", release, { passive: false });
      el.addEventListener("pointerleave", release, { passive: false });

      el.addEventListener("touchstart", press, { passive: false });
      el.addEventListener("touchend", release, { passive: false });
      el.addEventListener("touchcancel", release, { passive: false });
    };

    bindButton(btnLeft, (s) => { s.touchLeft = true; }, (s) => { s.touchLeft = false; });
    bindButton(btnRight, (s) => { s.touchRight = true; }, (s) => { s.touchRight = false; });
    bindButton(btnJump, (s) => { s.touchJump = true; }, (s) => { s.touchJump = false; });
    bindButton(btnFlip, (s) => { s.touchFlip = true; }, (s) => { s.touchFlip = false; });
    bindButton(btnRestart, (s) => { s.touchRestart = true; }, (s) => { s.touchRestart = false; });
  },

  show(scene) {
    this.init();
    this.activeScene = scene;
    const gamepad = document.getElementById("mobile-gamepad");
    if (!gamepad) return;

    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 1024);
    if (isTouch) {
      gamepad.classList.remove("hidden");
    } else {
      gamepad.classList.add("hidden");
    }

    const btnFlip = document.getElementById("btn-flip");
    if (btnFlip) {
      if (scene && scene.currentWorld === 3) {
        btnFlip.classList.remove("hidden");
      } else {
        btnFlip.classList.add("hidden");
      }
    }
  },

  hide() {
    this.activeScene = null;
    const gamepad = document.getElementById("mobile-gamepad");
    if (gamepad) gamepad.classList.add("hidden");
  }
};

// ─── 4. In-Game Player Feedback & GitHub Report Manager ───────
const FeedbackManager = {
  initialized: false,

  init() {
    if (this.initialized) return;
    this.initialized = true;

    const modal = document.getElementById("feedback-modal");
    const btnOpen = document.getElementById("btn-open-feedback");
    const btnClose = document.getElementById("btn-close-feedback");
    const btnCancel = document.getElementById("btn-cancel-feedback");
    const form = document.getElementById("feedback-form");

    if (btnOpen) {
      btnOpen.addEventListener("click", () => this.open());
    }
    if (btnClose) {
      btnClose.addEventListener("click", () => this.close());
    }
    if (btnCancel) {
      btnCancel.addEventListener("click", () => this.close());
    }

    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) this.close();
      });
    }

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.submit();
      });
    }
  },

  open() {
    this.init();
    const modal = document.getElementById("feedback-modal");
    if (!modal) return;

    let worldName = "World 1 (Desert Ruins)";
    let levelNum = 1;
    let deathsCount = SaveManager.getTotalDeaths();

    if (window.game && window.game.scene) {
      const gScene = window.game.scene.getScene("GameScene");
      if (gScene && window.game.scene.isActive("GameScene")) {
        const theme = getTheme(gScene.currentWorld);
        worldName = `${theme.badge} (${theme.name})`;
        levelNum = gScene.currentLevel + 1;
        deathsCount = gScene.deaths;
      } else {
        const wsScene = window.game.scene.getScene("WorldSelectScene");
        if (wsScene) {
          const theme = getTheme(wsScene.currentWorldIdx);
          worldName = `${theme.badge} (${theme.name})`;
          levelNum = SaveManager.getWorldUnlocked(wsScene.currentWorldIdx) + 1;
        }
      }
    }

    const currWorldEl = document.getElementById("fb-curr-world");
    const currLevelEl = document.getElementById("fb-curr-level");
    const currDeathsEl = document.getElementById("fb-curr-deaths");
    if (currWorldEl) currWorldEl.textContent = worldName;
    if (currLevelEl) currLevelEl.textContent = `Level ${levelNum}`;
    if (currDeathsEl) currDeathsEl.textContent = `${deathsCount}`;

    modal.classList.remove("hidden");
    const msgInput = document.getElementById("fb-message");
    if (msgInput) msgInput.focus();
  },

  close() {
    const modal = document.getElementById("feedback-modal");
    if (modal) modal.classList.add("hidden");
  },

  submit() {
    const category = document.getElementById("fb-category")?.value || "General Feedback";
    const name = document.getElementById("fb-name")?.value?.trim() || "Anonymous Player";
    const message = document.getElementById("fb-message")?.value?.trim() || "";

    const worldName = document.getElementById("fb-curr-world")?.textContent || "World 1";
    const levelName = document.getElementById("fb-curr-level")?.textContent || "Level 1";
    const deaths = document.getElementById("fb-curr-deaths")?.textContent || "0";

    if (!message) return;

    // 1. Format Markdown Issue for GitHub
    const issueTitle = encodeURIComponent(`[${category}] Feedback from ${name} on ${worldName} ${levelName}`);
    const issueBody = encodeURIComponent(`### 👤 Player Information
- **Player Name / Nickname:** ${name}
- **Feedback Category:** ${category}

### 🎮 Game Context
- **World & Level:** ${worldName} · ${levelName}
- **Total Deaths:** 💀 ${deaths}
- **Device / Screen:** ${window.innerWidth}x${window.innerHeight} (${('ontouchstart' in window) ? 'Touch Device' : 'Desktop'})
- **Submission Time:** ${new Date().toISOString()}

### 💡 Feedback & Improvement Suggestions
${message}

---
*Submitted via Oops! In-Game Feedback System*`);

    const githubIssueUrl = `https://github.com/khalidabdullahh/Oops/issues/new?title=${issueTitle}&body=${issueBody}`;

    // 2. Save locally in localStorage for backup
    try {
      const logs = JSON.parse(localStorage.getItem("oops_feedback_logs") || "[]");
      logs.push({
        name,
        category,
        message,
        worldName,
        levelName,
        deaths,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem("oops_feedback_logs", JSON.stringify(logs));
    } catch(e) {}

    // 3. Open GitHub issue in a new window/tab
    window.open(githubIssueUrl, "_blank");

    this.close();

    const gScene = window.game?.scene?.getScene("GameScene");
    if (gScene && window.game?.scene?.isActive("GameScene")) {
      gScene.showTrollToast("Feedback Prepared! Opening GitHub... 🚀");
    }

    const msgInput = document.getElementById("fb-message");
    if (msgInput) msgInput.value = "";
  }
};

// ─── 5. 5 Multiverse Worlds Configuration ────────────────────
const WORLD_THEMES = [
  {
    id: 0,
    name: "DESERT RUINS",
    badge: "WORLD 1",
    subtitle: "Collapsing sandstone, pop-up spikes & fleeing gates",
    gimmickName: "SAND CRUMBLE & TROLL TRAPS",
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
    subtitle: "Slippery glacier floes, falling icicles & blizzards",
    gimmickName: "ICE SLIDING & FALLING ICICLES",
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
    subtitle: "Mystic obsidian cavern, phantom traps & laser tripwires",
    gimmickName: "OBSIDIAN CRYPT & LASER TRIPWIRES",
    bg: 0x240e34,
    platform: 0x7b449b,
    platformTop: 0x9d5ebd,
    spike: 0xe056fd,
    door: 0xffffff,
    island: 0x5a2d78,
    islandBorder: 0x401c59,
    accent: 0xe056fd
  },
  {
    id: 3,
    name: "GRAVITY NEXUS",
    badge: "WORLD 4",
    subtitle: "Active ceiling walking, inverted hazards & matrix beams",
    gimmickName: "GRAVITY FLIP & CEILING WALKING",
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
    subtitle: "Flickering reality, control inversion & paradox rifts",
    gimmickName: "REALITY GLITCH & CONTROL FLIP",
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

// ─── 6. BootScene: Assets & Animations ───────────────────────
class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create() {
    this.createCartoonHero();
    this.createWorldAssets();
    this.createAnimations();

    FeedbackManager.init();
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

      g.fillStyle(0xd63031, 1);
      g.fillRect(2, 8 + yOff, 5, 4);
      g.fillStyle(0xff3838, 1);
      g.fillRect(0, 10 + yOff, 4, 4);

      g.fillStyle(0xffdbac, 1);
      g.fillCircle(16, 12 + yOff, 10);

      g.fillStyle(0xff3838, 1);
      g.fillRect(6, 6 + yOff, 20, 4);
      g.fillStyle(0xf1c40f, 1);
      g.fillRect(15, 6 + yOff, 2, 4);

      g.fillStyle(0xff7675, 0.75);
      g.fillCircle(10, 15 + yOff, 2);
      g.fillCircle(22, 15 + yOff, 2);

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

      g.fillStyle(0x0984e3, 1);
      g.fillRoundedRect(8, 20 + yOff, 16, 10, 3);

      g.fillStyle(0xf1c40f, 1);
      g.fillRect(8, 28 + yOff, 16, 3);
      g.fillStyle(0xe67e22, 1);
      g.fillRect(14, 27 + yOff, 4, 5);

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
    const platGfx = this.make.graphics({ x: 0, y: 0, add: false });
    platGfx.fillStyle(0xffffff, 1);
    platGfx.fillRect(0, 0, 32, 32);
    platGfx.fillStyle(0x000000, 0.12);
    platGfx.fillRect(0, 0, 32, 3);
    platGfx.generateTexture("plat_tex", 32, 32);

    const spkGfx = this.make.graphics({ x: 0, y: 0, add: false });
    spkGfx.fillStyle(0xffffff, 1);
    spkGfx.beginPath();
    spkGfx.moveTo(0, 20);
    spkGfx.lineTo(10, 0);
    spkGfx.lineTo(20, 20);
    spkGfx.closePath();
    spkGfx.fill();
    spkGfx.generateTexture("spike_up", 20, 20);

    const iciGfx = this.make.graphics({ x: 0, y: 0, add: false });
    iciGfx.fillStyle(0x70a1ff, 1);
    iciGfx.beginPath();
    iciGfx.moveTo(0, 0);
    iciGfx.lineTo(20, 0);
    iciGfx.lineTo(10, 28);
    iciGfx.closePath();
    iciGfx.fill();
    iciGfx.fillStyle(0xffffff, 0.7);
    iciGfx.fillRect(8, 2, 4, 16);
    iciGfx.generateTexture("icicle_tex", 20, 28);

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

    const doorGfx = this.make.graphics({ x: 0, y: 0, add: false });
    doorGfx.fillStyle(0xffffff, 1);
    doorGfx.fillRoundedRect(0, 0, 32, 46, 10);
    doorGfx.fillStyle(0x2d3436, 1);
    doorGfx.fillRoundedRect(4, 8, 24, 38, 8);
    doorGfx.generateTexture("door_tex", 32, 46);

    const trampGfx = this.make.graphics({ x: 0, y: 0, add: false });
    trampGfx.fillStyle(0x2ed573, 1);
    trampGfx.fillRoundedRect(0, 8, 32, 8, 3);
    trampGfx.fillStyle(0xff4757, 1);
    trampGfx.fillRoundedRect(4, 2, 24, 6, 2);
    trampGfx.generateTexture("tramp_tex", 32, 16);

    const dotGfx = this.make.graphics({ x: 0, y: 0, add: false });
    dotGfx.fillStyle(0xffffff, 1);
    dotGfx.fillCircle(4, 4, 4);
    dotGfx.generateTexture("part_dot", 8, 8);

    const lsrGfx = this.make.graphics({ x: 0, y: 0, add: false });
    lsrGfx.fillStyle(0xe056fd, 1);
    lsrGfx.fillRect(0, 0, 4, 60);
    lsrGfx.fillStyle(0xffffff, 0.85);
    lsrGfx.fillRect(1, 0, 2, 60);
    lsrGfx.generateTexture("laser_tex", 4, 60);
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

// ─── 7. WorldSelectScene: 30 Levels per World Island Map ─────
class WorldSelectScene extends Phaser.Scene {
  constructor() {
    super("WorldSelectScene");
    this.currentWorldIdx = 0;
    this.pageIdx = 0;
  }

  init(data) {
    if (typeof data.world === "number") {
      this.currentWorldIdx = data.world;
    }
  }

  create() {
    const { width, height } = this.scale;
    AudioEngine.init();
    MobileGamepad.hide();

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

    const titleText = this.add.text(width / 2, 34, "Oops! - WORLD MAP", {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "22px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 6
    }).setOrigin(0.5);
    this.islandContainer.add(titleText);

    const sndText = this.add.text(width - 40, 34, AudioEngine.muted ? "🔇" : "🔊", {
      fontSize: "22px"
    }).setOrigin(0.5).setInteractive({ cursor: "pointer" });
    sndText.on("pointerdown", () => {
      AudioEngine.init();
      const muted = AudioEngine.toggleMute();
      sndText.setText(muted ? "🔇" : "🔊");
    });
    this.islandContainer.add(sndText);

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

    const worldBadge = this.add.text(islandX, islandY - islandH / 2 + 28, `${theme.badge}: ${theme.name}`, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "14px",
      color: "#ffd32a",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5);
    this.islandContainer.add(worldBadge);

    const subText = this.add.text(islandX, islandY - islandH / 2 + 48, `✦ GIMMICK: ${theme.gimmickName} ✦`, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "8px",
      color: "#ffffff"
    }).setOrigin(0.5);
    this.islandContainer.add(subText);

    const tabLabels = ["LEVELS 1 - 10", "LEVELS 11 - 20", "LEVELS 21 - 30"];
    const tabW = 160, tabGap = 12;
    const tabStartX = islandX - (3 * tabW + 2 * tabGap) / 2 + tabW / 2;
    const tabY = islandY - islandH / 2 + 78;

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

// ─── 8. GameScene: Core Platformer & 5 World Engines ─────────
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
    this.touchFlip = false;
    this.touchRestart = false;
    this.controlsInverted = false;
    this.iceVelocityX = 0;
  }

  create() {
    const { width, height } = this.scale;
    const theme = getTheme(this.currentWorld);

    AudioEngine.init();
    AudioEngine.startMusic();
    MobileGamepad.show(this);

    this.bgGfx = this.add.graphics();
    this.bgGfx.fillStyle(theme.bg, 1);
    this.bgGfx.fillRect(0, 0, width, height);

    this.platforms = this.physics.add.staticGroup();
    this.spikes = this.physics.add.staticGroup();
    this.crushers = this.physics.add.group();
    this.icicles = this.physics.add.group();
    this.lasers = this.physics.add.group();
    this.glitchBlocks = [];
    this.trampolines = this.physics.add.staticGroup();
    this.fallingPlatforms = [];
    this.customTriggers = [];

    this.buildWorldLevel(this.currentWorld, this.currentLevel);

    this.player = this.physics.add.sprite(this.spawnX, this.spawnY, "hero_idle_1");
    this.player.setCollideWorldBounds(false);
    this.player.body.setSize(22, 34);
    this.player.body.setOffset(5, 4);
    this.player.body.setGravityY(1400);
    this.player.anims.play("hero_anim_idle");

    this.physics.add.collider(this.player, this.platforms, this.onPlatformCollide, null, this);
    this.physics.add.collider(this.player, this.trampolines, this.onTrampolineCollide, null, this);
    this.physics.add.overlap(this.player, this.spikes, this.onPlayerDie, null, this);
    this.physics.add.overlap(this.player, this.crushers, this.onPlayerDie, null, this);
    this.physics.add.overlap(this.player, this.icicles, this.onPlayerDie, null, this);
    this.physics.add.overlap(this.player, this.lasers, this.onPlayerDie, null, this);

    if (this.exitGate) {
      this.physics.add.overlap(this.player, this.exitGate, this.onReachExit, null, this);
    }

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.keyShift = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.keyF = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);

    if (this.currentWorld === 1) {
      this.createBlizzardParticles();
    }

    if (this.currentWorld === 2) {
      this.createShadowAmbiance();
    }

    this.createHUD();
    this.showLevelBanner();
  }

  createShadowAmbiance() {
    const { width, height } = this.scale;
    this.add.particles(0, 0, "part_dot", {
      x: { min: 0, max: width },
      y: { min: 0, max: height },
      lifespan: 2500,
      speedY: { min: -20, max: 20 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.5, end: 0 },
      tint: [0xe056fd, 0xbe2edd, 0xffffff],
      frequency: 140
    });
  }

  createBlizzardParticles() {
    const { width, height } = this.scale;
    this.add.particles(0, 0, "part_dot", {
      x: { min: 0, max: width },
      y: { min: -20, max: height },
      lifespan: 2200,
      speedX: { min: -180, max: -80 },
      speedY: { min: 80, max: 200 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.6, end: 0 },
      tint: 0xffffff,
      frequency: 90
    });
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

    this.levelText = this.add.text(25, 20, `${theme.badge} · LV ${this.currentLevel + 1}`, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "10px",
      color: "#ffffff"
    }).setDepth(200);

    this.deathText = this.add.text(width - 90, 20, `💀 ${this.deaths}`, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "11px",
      color: "#ff4757"
    }).setDepth(200);

    const mapBtn = this.add.text(width - 32, 20, "🗺️", {
      fontSize: "20px"
    }).setOrigin(0.5).setDepth(200).setInteractive({ cursor: "pointer" });

    mapBtn.on("pointerdown", () => {
      AudioEngine.stopMusic();
      MobileGamepad.hide();
      this.scene.start("WorldSelectScene", { world: this.currentWorld });
    });
  }

  update(time, delta) {
    if (this.isDead || this.isComplete) return;
    const dt = delta / 1000;
    this.levelTime += dt;
    const { width, height } = this.scale;

    if (this.player.y > height + 25 || this.player.y < -120 || this.player.x < -60 || this.player.x > width + 60) {
      this.onPlayerDie();
      return;
    }

    let moveLeft = this.cursors.left.isDown || this.keyA.isDown || this.touchLeft;
    let moveRight = this.cursors.right.isDown || this.keyD.isDown || this.touchRight;

    if (this.controlsInverted) {
      const temp = moveLeft;
      moveLeft = moveRight;
      moveRight = temp;
    }

    if (this.currentWorld === 1) {
      const targetSpeed = moveLeft ? -240 : (moveRight ? 240 : 0);
      const accel = 600 * dt;
      if (this.iceVelocityX < targetSpeed) {
        this.iceVelocityX = Math.min(this.iceVelocityX + accel, targetSpeed);
      } else if (this.iceVelocityX > targetSpeed) {
        this.iceVelocityX = Math.max(this.iceVelocityX - accel, targetSpeed);
      }
      this.player.setVelocityX(this.iceVelocityX);
      if (moveLeft) this.player.setFlipX(true);
      else if (moveRight) this.player.setFlipX(false);
    } else {
      const walkSpeed = 220;
      if (moveLeft) {
        this.player.setVelocityX(-walkSpeed);
        this.player.setFlipX(true);
      } else if (moveRight) {
        this.player.setVelocityX(walkSpeed);
        this.player.setFlipX(false);
      } else {
        this.player.setVelocityX(0);
      }
    }

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

    if (this.currentWorld === 3) {
      if (Phaser.Input.Keyboard.JustDown(this.keyShift) || Phaser.Input.Keyboard.JustDown(this.keyF) || this.touchFlip) {
        this.touchFlip = false;
        this.flipGravity();
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyR) || this.touchRestart) {
      this.touchRestart = false;
      this.restartLevel();
    }

    this.updateWorldHazards(dt);
  }

  flipGravity() {
    this.gravityDir *= -1;
    this.player.body.setGravityY(1400 * this.gravityDir);
    this.player.setFlipY(this.gravityDir === -1);
    AudioEngine.sfxPortal();
    this.cameras.main.shake(120, 0.015);
  }

  updateWorldHazards(dt) {
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

    this.icicles.getChildren().forEach(icicle => {
      const dist = Math.abs(this.player.x - icicle.x);
      if (!icicle.hasFallen && dist < 65 && this.player.y > icicle.y) {
        icicle.hasFallen = true;
        icicle.body.setGravityY(1500);
        AudioEngine.sfxIcicle();
        this.tweens.add({ targets: icicle, angle: 10, duration: 60, yoyo: true });
      }
    });

    this.lasers.getChildren().forEach(laser => {
      if (laser.isPulsing) {
        laser.pulseTimer = (laser.pulseTimer || 0) + dt;
        if (laser.pulseTimer > 1.8) {
          laser.pulseTimer = 0;
          laser.setActive(!laser.active);
          laser.setVisible(laser.active);
        }
      }
    });

    this.glitchBlocks.forEach(gb => {
      gb.flickerTimer = (gb.flickerTimer || 0) + dt;
      if (gb.flickerTimer > gb.period) {
        gb.flickerTimer = 0;
        gb.isSolid = !gb.isSolid;
        gb.setAlpha(gb.isSolid ? 1 : 0.2);
        if (gb.body) gb.body.enable = gb.isSolid;
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

    // ── ROCK-SOLID FALLING PLATFORMS ──
    for (let i = this.fallingPlatforms.length - 1; i >= 0; i--) {
      const p = this.fallingPlatforms[i];
      if (p.stepped && !p.hasFallen) {
        p.shakeTimer -= dt;
        p.x += (Math.random() - 0.5) * 3;
        if (p.shakeTimer <= 0) {
          p.hasFallen = true;
          if (p.body) p.body.enable = false;
          this.tweens.add({
            targets: p,
            y: p.y + 350,
            alpha: 0,
            duration: 450,
            ease: "Quad.easeIn",
            onComplete: () => {
              this.platforms.remove(p, true, true);
            }
          });
          this.fallingPlatforms.splice(i, 1);
        }
      }
    }

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
    }).setOrigin(0.5).setDepth(300);

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
    player.setVelocityY(-760 * this.gravityDir);
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

  // ── SIGNATURE "ENTER DOOR" ANIMATION & ADVANCEMENT ──────────
  onReachExit() {
    if (this.isComplete || this.isDead) return;
    this.isComplete = true;
    AudioEngine.sfxWin();
    AudioEngine.sfxPortal();

    this.player.setVelocity(0, 0);
    if (this.player.body) {
      this.player.body.setEnable(false);
      this.player.body.moves = false;
    }

    SaveManager.saveLevelClear(this.currentWorld, this.currentLevel, this.deaths);

    // Door Portal Aura Flare
    const aura = this.add.graphics().setDepth(150);
    aura.fillStyle(0xffffff, 0.7);
    aura.fillCircle(this.exitGate.x, this.exitGate.y, 22);
    this.tweens.add({
      targets: aura,
      scaleX: 1.8,
      scaleY: 1.8,
      alpha: 0,
      duration: 400,
      onComplete: () => aura.destroy()
    });

    // Enter Door Tween: Hero moves to doorway and shrinks inside
    this.tweens.add({
      targets: this.player,
      x: this.exitGate.x,
      y: this.exitGate.y + 6,
      scaleX: 0.05,
      scaleY: 0.05,
      alpha: 0,
      duration: 380,
      ease: "Cubic.easeIn",
      onComplete: () => {
        this.add.particles(this.exitGate.x, this.exitGate.y, "part_dot", {
          speed: { min: 80, max: 280 },
          scale: { start: 1.2, end: 0 },
          lifespan: 600,
          quantity: 28,
          tint: [0xffd32a, 0x2ed573, 0xff4757, 0x70a1ff]
        });

        this.time.delayedCall(450, () => {
          const nextLvl = this.currentLevel + 1;
          if (nextLvl >= 30) {
            MobileGamepad.hide();
            this.scene.start("WorldSelectScene", { world: this.currentWorld });
          } else {
            this.scene.restart({ world: this.currentWorld, level: nextLvl, deaths: this.deaths });
          }
        });
      }
    });
  }

  // ─── 9. Handcrafted & Guaranteed Beatable Level Layouts ───────
  buildWorldLevel(wIdx, lvl) {
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

    const addIcicle = (x, y) => {
      const ic = this.icicles.create(x, y, "icicle_tex");
      ic.hasFallen = false;
      ic.body.setImmovable(true);
      ic.body.setSize(18, 26);
      return ic;
    };

    const addLaser = (x, y, isPulsing = false) => {
      const lz = this.lasers.create(x, y, "laser_tex");
      lz.body.setImmovable(true);
      lz.isPulsing = isPulsing;
      lz.pulseTimer = 0;
      return lz;
    };

    const addTrampoline = (x, y) => {
      const tr = this.trampolines.create(x, y, "tramp_tex");
      tr.body.setSize(32, 12).setOffset(0, 4);
      return tr;
    };

    this.spawnX = 60;
    this.spawnY = 410;

    // ─────────────────────────────────────────────────────────────
    // 🏜️ WORLD 1: DESERT RUINS (Sandstone Crumble & Troll Traps)
    // ─────────────────────────────────────────────────────────────
    if (wIdx === 0) {
      if (lvl === 0) { // Level 1 (Gentle Intro)
        addPlat(0, 460, 260, 80);
        addPlat(320, 460, 260, 80);
        addPlat(640, 460, 320, 80);
        addSpike(290, 450);
        addSpike(610, 450);
        addPlat(800, 400, 160, 60);

        this.exitGate = this.physics.add.sprite(750, 437, "door_tex");
        this.exitGate.fleeOnProximity = true;
        this.exitGate.targetX = 880;
        this.exitGate.targetY = 377;
        this.exitGate.fleeMessage = "Oops! Just a little hop! 😃";
      } else if (lvl === 1) { // Level 2: Boulder Crusher
        addPlat(0, 460, width, 80);
        addCrusher(360, 60);
        addCrusher(640, 60);
        this.exitGate = this.physics.add.sprite(900, 437, "door_tex");
      } else if (lvl === 2) { // Level 3: Crumbling Sandstone Bridge
        addPlat(0, 460, 180, 80);
        addFallingPlat(220, 460, 100, 25);
        addFallingPlat(380, 460, 100, 25);
        addFallingPlat(540, 460, 100, 25);
        addPlat(700, 460, 260, 80);
        for (let sx = 190; sx <= 690; sx += 40) addSpike(sx, 520);
        this.exitGate = this.physics.add.sprite(900, 437, "door_tex");
      } else if (lvl === 3) { // Level 4: Pop-Up Sand Spikes
        addPlat(0, 460, width, 80);
        this.customTriggers.push({
          triggered: false,
          condition: (sc) => sc.player.x > 380,
          action: (sc) => {
            for (let i = 0; i < 4; i++) {
              const sp = sc.spikes.create(480 + i * 22, 450, "spike_up").setTint(theme.spike);
              sc.tweens.add({ targets: sp, y: 440, duration: 100, yoyo: true });
            }
            AudioEngine.sfxTrap();
            sc.showTrollToast("Surprise! 😈");
          }
        });
        this.exitGate = this.physics.add.sprite(900, 437, "door_tex");
      } else if (lvl === 4) { // Level 5: Spring Trampoline & Stepping Pillars
        addPlat(0, 460, 160, 80);
        addTrampoline(130, 452);
        addPlat(270, 390, 120, 25);
        addPlat(450, 360, 120, 25);
        addTrampoline(510, 352);
        addPlat(630, 340, 100, 25);
        addPlat(780, 320, 180, 220);
        for (let sx = 170; sx < 770; sx += 35) addSpike(sx, 520);
        this.exitGate = this.physics.add.sprite(880, 297, "door_tex");
      } else { // Levels 6 - 30: Progressive Escalating Desert Gauntlets
        const tier = Math.min(Math.floor(lvl / 5), 4);
        addPlat(0, 460, 150, 80);
        addFallingPlat(210, 440 - tier * 4, 100, 25);
        if (lvl % 2 === 0) addCrusher(360, 60);
        addFallingPlat(370, 400 - tier * 4, 100, 25);
        if (lvl % 3 === 0) addCrusher(520, 60);
        addFallingPlat(530, 360 - tier * 4, 100, 25);
        addPlat(690, 320, 270, 220);
        for (let sx = 160; sx < 680; sx += 35) addSpike(sx, 520);
        this.exitGate = this.physics.add.sprite(880, 297, "door_tex");
      }
    }

    // ─────────────────────────────────────────────────────────────
    // ❄️ WORLD 2: FROST SPIRE (Ice Sliding & Falling Icicles)
    // ─────────────────────────────────────────────────────────────
    else if (wIdx === 1) {
      if (lvl === 0) { // Level 1 (Ice Intro)
        addPlat(0, 460, 400, 80);
        addPlat(480, 460, 480, 80);
        addSpike(440, 450);
        this.exitGate = this.physics.add.sprite(900, 437, "door_tex");
      } else if (lvl === 1) { // Level 2: Falling Icicles
        addPlat(0, 460, width, 80);
        addIcicle(320, 120);
        addIcicle(580, 120);
        this.exitGate = this.physics.add.sprite(900, 437, "door_tex");
      } else if (lvl === 2) { // Level 3: Glacier Floes & Icicle Drop
        addPlat(0, 460, 160, 80);
        addPlat(220, 430, 120, 25);
        addIcicle(280, 100);
        addPlat(400, 390, 120, 25);
        addIcicle(460, 100);
        addPlat(580, 360, 120, 25);
        addPlat(760, 340, 200, 200);
        for (let sx = 170; sx < 750; sx += 35) addSpike(sx, 520);
        this.exitGate = this.physics.add.sprite(880, 317, "door_tex");
      } else if (lvl === 3) { // Level 4: Ice Avalanche Row
        addPlat(0, 460, width, 80);
        for (let ix = 240; ix <= 760; ix += 130) {
          addIcicle(ix, 80);
        }
        this.exitGate = this.physics.add.sprite(900, 437, "door_tex");
      } else if (lvl === 4) { // Level 5: Trampoline Glacier Leap
        addPlat(0, 460, 160, 80);
        addTrampoline(130, 452);
        addPlat(270, 390, 120, 25);
        addIcicle(330, 90);
        addPlat(450, 360, 120, 25);
        addTrampoline(510, 352);
        addPlat(630, 340, 100, 25);
        addPlat(780, 320, 180, 220);
        for (let sx = 170; sx < 770; sx += 35) addSpike(sx, 520);
        this.exitGate = this.physics.add.sprite(880, 297, "door_tex");
      } else { // Levels 6 - 30: Blizzard Chasm & Ice Spires
        const tier = Math.min(Math.floor(lvl / 5), 4);
        addPlat(0, 460, 150, 80);
        addFallingPlat(210, 430 - tier * 3, 100, 25);
        addIcicle(260, 80);
        addFallingPlat(370, 390 - tier * 3, 100, 25);
        addIcicle(420, 80);
        addFallingPlat(530, 350 - tier * 3, 100, 25);
        addPlat(690, 320, 270, 220);
        for (let sx = 160; sx < 680; sx += 35) addSpike(sx, 520);
        this.exitGate = this.physics.add.sprite(880, 297, "door_tex");
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 🔮 WORLD 3: SHADOW CRYPT (Mystic Obsidian & Laser Tripwires)
    // ─────────────────────────────────────────────────────────────
    else if (wIdx === 2) {
      if (lvl === 0) { // Level 1 (Obsidian Crypt Intro)
        addPlat(0, 460, 380, 80);
        addPlat(460, 460, 500, 80);
        addSpike(420, 450);
        this.exitGate = this.physics.add.sprite(900, 437, "door_tex");
      } else if (lvl === 1) { // Level 2: Laser Tripwire Beam
        addPlat(0, 460, width, 80);
        addLaser(480, 430, false);
        this.exitGate = this.physics.add.sprite(900, 437, "door_tex");
      } else if (lvl === 2) { // Level 3: Crypt Stepping Stones & Laser
        addPlat(0, 460, 160, 80);
        addPlat(220, 420, 110, 25);
        addPlat(390, 380, 110, 25);
        addLaser(445, 350, true);
        addPlat(560, 350, 110, 25);
        addPlat(730, 340, 230, 200);
        for (let sx = 170; sx < 720; sx += 35) addSpike(sx, 520);
        this.exitGate = this.physics.add.sprite(880, 317, "door_tex");
      } else if (lvl === 3) { // Level 4: Dual Pulsing Lasers
        addPlat(0, 460, width, 80);
        addLaser(340, 430, true);
        addLaser(620, 430, true);
        this.exitGate = this.physics.add.sprite(900, 437, "door_tex");
      } else { // Levels 5 - 30: Pulsing Lasers & Shadow Crypt Labyrinth
        const tier = Math.min(Math.floor(lvl / 5), 4);
        addPlat(0, 460, 150, 80);
        addFallingPlat(210, 420 - tier * 3, 100, 25);
        if (lvl % 2 === 0) addLaser(330, 390 - tier * 3, true);
        addFallingPlat(370, 380 - tier * 3, 100, 25);
        if (lvl % 3 === 0) addLaser(490, 350 - tier * 3, true);
        addFallingPlat(530, 340 - tier * 3, 100, 25);
        addPlat(690, 300, 270, 240);
        for (let sx = 160; sx < 680; sx += 35) addSpike(sx, 520);
        this.exitGate = this.physics.add.sprite(880, 277, "door_tex");
      }
    }

    // ─────────────────────────────────────────────────────────────
    // ⚡ WORLD 4: GRAVITY NEXUS (Ceiling Walking & Inversion Mazes)
    // ─────────────────────────────────────────────────────────────
    else if (wIdx === 3) {
      if (lvl === 0) { // Level 1 (Gravity Intro)
        addPlat(0, 460, 320, 80);
        addPlat(0, 0, width, 50);
        addPlat(320, 240, 80, 300);
        addPlat(400, 460, 560, 80);
        this.exitGate = this.physics.add.sprite(900, 437, "door_tex");
      } else if (lvl === 1) { // Level 2: Inverted Spikes on Floor & Ceiling
        addPlat(0, 460, 360, 80);
        addPlat(0, 0, width, 50);
        addPlat(500, 460, 460, 80);
        for (let sx = 360; sx < 500; sx += 30) addSpike(sx, 520);
        this.exitGate = this.physics.add.sprite(900, 437, "door_tex");
      } else { // Levels 3 - 30: Gravity Maze Chambers
        addPlat(0, 460, 180, 80);
        addPlat(0, 0, width, 50);
        addPlat(240, 180, 120, 25);
        addPlat(420, 360, 120, 25);
        addPlat(600, 180, 120, 25);
        addPlat(780, 460, 180, 80);
        for (let sx = 190; sx < 770; sx += 35) addSpike(sx, 520);
        this.exitGate = this.physics.add.sprite(900, 437, "door_tex");
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 🌌 WORLD 5: GLITCH CORE (Reality Distortions & Control Flips)
    // ─────────────────────────────────────────────────────────────
    else {
      if (lvl === 0) { // Level 1 (Glitch Intro - Flickering Platform)
        addPlat(0, 460, 280, 80);
        const gb = addPlat(340, 460, 240, 80);
        gb.period = 1.6;
        this.glitchBlocks.push(gb);
        addPlat(640, 460, 320, 80);
        addSpike(300, 450);
        addSpike(600, 450);
        this.exitGate = this.physics.add.sprite(900, 437, "door_tex");
      } else if (lvl === 1) { // Level 2: Control Flip Zone!
        addPlat(0, 460, width, 80);
        this.customTriggers.push({
          triggered: false,
          condition: (sc) => sc.player.x > 320,
          action: (sc) => {
            sc.controlsInverted = true;
            AudioEngine.sfxGlitch();
            sc.showTrollToast("GLITCH! Controls Inverted! 💫");
          }
        });
        this.exitGate = this.physics.add.sprite(900, 437, "door_tex");
      } else { // Levels 3 - 30: Singularity Finale
        const tier = Math.min(Math.floor(lvl / 5), 4);
        addPlat(0, 460, 150, 80);
        const gb1 = addFallingPlat(210, 420 - tier * 3, 100, 25);
        gb1.period = 1.8;
        this.glitchBlocks.push(gb1);
        if (lvl % 2 === 0) addCrusher(340, 60);
        const gb2 = addFallingPlat(370, 380 - tier * 3, 100, 25);
        gb2.period = 1.4;
        this.glitchBlocks.push(gb2);
        const gb3 = addFallingPlat(530, 340 - tier * 3, 100, 25);
        gb3.period = 1.6;
        this.glitchBlocks.push(gb3);
        addPlat(690, 300, 270, 240);
        for (let sx = 160; sx < 680; sx += 35) addSpike(sx, 520);
        this.exitGate = this.physics.add.sprite(880, 277, "door_tex");
      }
    }
  }
}

// ─── 10. Phaser Game Configuration & Dynamic Scale Manager ───
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
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 960,
    height: 540
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

// Global Orientation & Resize Listeners
window.addEventListener("resize", () => {
  if (window.game && window.game.scale) {
    window.game.scale.refresh();
  }
  const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 1024);
  const gamepad = document.getElementById("mobile-gamepad");
  if (gamepad && window.game && window.game.scene.isActive("GameScene")) {
    if (isTouch) gamepad.classList.remove("hidden");
    else gamepad.classList.add("hidden");
  }
});

window.addEventListener("orientationchange", () => {
  setTimeout(() => {
    if (window.game && window.game.scale) {
      window.game.scale.refresh();
    }
  }, 200);
});

// Launch Game Instance
try {
  window.game = new Phaser.Game(config);
} catch (err) {
  console.error("Critical: Failed to launch Phaser Game:", err);
}
