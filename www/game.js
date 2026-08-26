// ═══════════════════════════════════════════════════════════════
//  Oops! – Multiverse Platformer Edition (v6.0.0 Master Engine)
//  5 Worlds x 30 Handcrafted Unique Levels (150 Total Levels)
//  Comedic 7-Second Intro, True Dual-Orientation (Portrait/Landscape),
//  and Complete Handcrafted Level Progression
// ═══════════════════════════════════════════════════════════════

"use strict";

// ─── 0. Universal Safe Storage & Global Utilities ─────────────
var _memoryStore = {};
var SafeStorage = {
  getItem: function(key) {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch(e) {}
    return _memoryStore[key] || null;
  },
  setItem: function(key, val) {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, val);
      }
    } catch(e) {}
    _memoryStore[key] = val;
  }
};

function toggleFullScreen() {
  try {
    var doc = document.documentElement;
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      if (doc.requestFullscreen && typeof doc.requestFullscreen === "function") {
        doc.requestFullscreen().catch(function(){});
      } else if (doc.webkitRequestFullscreen && typeof doc.webkitRequestFullscreen === "function") {
        doc.webkitRequestFullscreen();
      } else if (doc.msRequestFullscreen && typeof doc.msRequestFullscreen === "function") {
        doc.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen && typeof document.exitFullscreen === "function") {
        document.exitFullscreen().catch(function(){});
      } else if (document.webkitExitFullscreen && typeof document.webkitExitFullscreen === "function") {
        document.webkitExitFullscreen();
      }
    }
  } catch(e) {}
}

function syncBodyBackground(theme) {
  try {
    var canvas = document.querySelector("canvas");
    if (canvas && theme) {
      var accentHex = "#" + (theme.accent || 0xffd32a).toString(16).padStart(6, "0");
      canvas.style.borderColor = "rgba(255, 255, 255, 0.22)";
      canvas.style.boxShadow = "0 0 0 1px rgba(0, 0, 0, 0.95), 0 12px 45px rgba(0, 0, 0, 0.88), 0 0 30px " + accentHex + "40";
    }
  } catch(e) {}
}

function removeLoaderSplash() {
  try {
    var loader = document.getElementById("game-loader");
    if (loader) {
      loader.style.opacity = "0";
      loader.style.pointerEvents = "none";
      setTimeout(function() {
        if (loader && loader.parentNode) loader.parentNode.removeChild(loader);
      }, 200);
    }
  } catch(e) {}
}

setTimeout(removeLoaderSplash, 1200);

// ─── 1. Save Manager (Bulletproof Storage) ───────────────────
var SAVE_KEY = "oops_multiverse_v9";

var SaveManager = {
  getInitialState: function() {
    return {
      worlds: {
        0: { maxUnlocked: 0, cleared: [] },
        1: { maxUnlocked: 0, cleared: [] },
        2: { maxUnlocked: 0, cleared: [] },
        3: { maxUnlocked: 0, cleared: [] },
        4: { maxUnlocked: 0, cleared: [] }
      },
      deaths: 0,
      currentWorld: 0,
      introSeen: false
    };
  },

  load: function() {
    try {
      var raw = SafeStorage.getItem(SAVE_KEY);
      if (!raw) return this.getInitialState();
      var data = JSON.parse(raw);
      if (!data || !data.worlds) return this.getInitialState();
      return data;
    } catch(e) {
      return this.getInitialState();
    }
  },

  saveLevelClear: function(worldIdx, levelIdx, deaths) {
    try {
      var data = this.load();
      if (!data.worlds[worldIdx]) {
        data.worlds[worldIdx] = { maxUnlocked: 0, cleared: [] };
      }
      var w = data.worlds[worldIdx];
      if (!w.cleared.includes(levelIdx)) {
        w.cleared.push(levelIdx);
      }
      w.maxUnlocked = Math.max(w.maxUnlocked, Math.min(levelIdx + 1, 29));
      data.deaths = deaths;
      data.currentWorld = worldIdx;
      SafeStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch(e) {}
  },

  saveDeaths: function(deaths) {
    try {
      var data = this.load();
      data.deaths = deaths;
      SafeStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch(e) {}
  },

  getWorldUnlocked: function(worldIdx) {
    var data = this.load();
    var w = data.worlds[worldIdx];
    return w ? (w.maxUnlocked || 0) : 0;
  },

  isLevelCleared: function(worldIdx, levelIdx) {
    var data = this.load();
    var w = data.worlds[worldIdx];
    return w && w.cleared && w.cleared.includes(levelIdx);
  },

  getTotalDeaths: function() {
    var data = this.load();
    return data.deaths || 0;
  },

  hasSeenIntro: function() {
    var data = this.load();
    return !!data.introSeen;
  },

  setIntroSeen: function() {
    try {
      var data = this.load();
      data.introSeen = true;
      SafeStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch(e) {}
  }
};

// ─── 2. Web Audio Synthesizer ────────────────────────────────
var AudioEngine = {
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

  init: function() {
    try {
      if (!this.ctx) {
        var AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().catch(function(){});
      }
    } catch(e) {}
  },

  playTone: function(freq, type, duration, vol, delay) {
    if (!type) type = "square";
    if (duration === undefined) duration = 0.08;
    if (vol === undefined) vol = 0.15;
    if (delay === undefined) delay = 0;

    if (!this.ctx || this.muted) return;
    try {
      var t = this.ctx.currentTime + delay;
      var osc = this.ctx.createOscillator();
      var gain = this.ctx.createGain();
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

  sfxJump: function() {
    this.playTone(320, "square", 0.08, 0.16);
    this.playTone(480, "square", 0.06, 0.14, 0.025);
  },
  sfxLand: function() {
    this.playTone(130, "sawtooth", 0.04, 0.12);
  },
  sfxDie: function() {
    for (var i = 0; i < 5; i++) {
      this.playTone(460 - i * 75, "sawtooth", 0.1, 0.2, i * 0.05);
    }
  },
  sfxWin: function() {
    var self = this;
    [523, 659, 784, 1047, 1318].forEach(function(f, i) { self.playTone(f, "square", 0.14, 0.2, i * 0.08); });
  },
  sfxTrap: function() {
    this.playTone(240, "sawtooth", 0.12, 0.2);
    this.playTone(150, "sawtooth", 0.1, 0.16, 0.06);
  },
  sfxPortal: function() {
    for (var i = 0; i < 6; i++) {
      this.playTone(320 + i * 85, "sine", 0.06, 0.14, i * 0.03);
    }
  },
  sfxIcicle: function() {
    this.playTone(600, "sine", 0.08, 0.2);
    this.playTone(400, "triangle", 0.1, 0.15, 0.04);
  },
  sfxLaser: function() {
    this.playTone(750, "sawtooth", 0.08, 0.18);
    this.playTone(950, "square", 0.06, 0.15, 0.03);
  },
  sfxGlitch: function() {
    for (var i = 0; i < 4; i++) {
      this.playTone(180 + Math.random() * 600, "sawtooth", 0.04, 0.18, i * 0.03);
    }
  },
  sfxCrush: function() {
    this.playTone(95, "sawtooth", 0.25, 0.35);
    this.playTone(65, "square", 0.3, 0.4, 0.03);
  },
  sfxBounce: function() {
    this.playTone(280, "sine", 0.12, 0.2);
    this.playTone(580, "sine", 0.15, 0.25, 0.04);
  },

  startMusic: function() {
    var self = this;
    if (this.musicTimer || this.muted) return;
    this.musicStep = 0;
    this.musicTimer = setInterval(function() {
      if (self.muted || !self.ctx) return;
      var freq = self.melody[self.musicStep % self.melody.length];
      self.playTone(freq, "triangle", 0.16, 0.025);
      self.musicStep++;
    }, 220);
  },

  stopMusic: function() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  },

  toggleMute: function() {
    this.muted = !this.muted;
    if (this.muted) this.stopMusic();
    else this.startMusic();
    return this.muted;
  }
};

// ─── 3. Mobile Gamepad Controller Bridge ─────────────────────
var MobileGamepad = {
  initialized: false,
  activeScene: null,

  init: function() {
    var self = this;
    if (this.initialized) return;
    this.initialized = true;

    var btnLeft = document.getElementById("btn-left");
    var btnRight = document.getElementById("btn-right");
    var btnJump = document.getElementById("btn-jump");
    var btnFlip = document.getElementById("btn-flip");
    var btnRestart = document.getElementById("btn-restart");

    var bindButton = function(el, onDown, onUp) {
      if (!el) return;

      var press = function(e) {
        if (e.cancelable) e.preventDefault();
        el.classList.add("pressed");
        AudioEngine.init();
        if (onDown && self.activeScene) onDown(self.activeScene);
      };

      var release = function(e) {
        if (e.cancelable) e.preventDefault();
        el.classList.remove("pressed");
        if (onUp && self.activeScene) onUp(self.activeScene);
      };

      el.addEventListener("pointerdown", press, { passive: false });
      el.addEventListener("pointerup", release, { passive: false });
      el.addEventListener("pointercancel", release, { passive: false });
      el.addEventListener("pointerleave", release, { passive: false });

      el.addEventListener("touchstart", press, { passive: false });
      el.addEventListener("touchend", release, { passive: false });
      el.addEventListener("touchcancel", release, { passive: false });
    };

    bindButton(btnLeft, function(s) { s.touchLeft = true; }, function(s) { s.touchLeft = false; });
    bindButton(btnRight, function(s) { s.touchRight = true; }, function(s) { s.touchRight = false; });
    bindButton(btnJump, function(s) { s.touchJump = true; }, function(s) { s.touchJump = false; });
    bindButton(btnFlip, function(s) { s.touchFlip = true; }, function(s) { s.touchFlip = false; });
    bindButton(btnRestart, function(s) { s.touchRestart = true; }, function(s) { s.touchRestart = false; });
  },

  show: function(scene) {
    this.init();
    this.activeScene = scene;
    var gamepad = document.getElementById("mobile-gamepad");
    if (!gamepad) return;

    var isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 1024);
    if (isTouch) {
      gamepad.style.display = "flex";
      gamepad.classList.remove("hidden");
    } else {
      gamepad.style.display = "none";
      gamepad.classList.add("hidden");
    }

    var btnFlip = document.getElementById("btn-flip");
    if (btnFlip) {
      if (scene && scene.currentWorld === 3) {
        btnFlip.classList.remove("hidden");
        btnFlip.style.display = "flex";
      } else {
        btnFlip.classList.add("hidden");
        btnFlip.style.display = "none";
      }
    }
  },

  hide: function() {
    this.activeScene = null;
    var gamepad = document.getElementById("mobile-gamepad");
    if (gamepad) {
      gamepad.style.display = "none";
      gamepad.classList.add("hidden");
    }
  }
};

// ─── 4. In-Game Player Feedback Manager ──────────────────────
var FeedbackManager = {
  initialized: false,
  attachedImage: null,

  init: function() {
    var self = this;
    if (this.initialized) return;
    this.initialized = true;

    var modal = document.getElementById("feedback-modal");
    var btnClose = document.getElementById("btn-close-feedback");
    var btnCancel = document.getElementById("btn-cancel-feedback");
    var form = document.getElementById("feedback-form");

    var fileInput = document.getElementById("fb-image-input");
    var btnSnap = document.getElementById("btn-snap-screen");
    var btnRemove = document.getElementById("btn-remove-preview");

    if (modal) {
      modal.style.display = "none";
      modal.classList.add("hidden");
    }

    if (btnClose) {
      btnClose.addEventListener("click", function() { self.close(); });
    }
    if (btnCancel) {
      btnCancel.addEventListener("click", function() { self.close(); });
    }

    if (modal) {
      modal.addEventListener("click", function(e) {
        if (e.target === modal) self.close();
      });
    }

    if (fileInput) {
      fileInput.addEventListener("change", function(e) {
        var file = e.target.files && e.target.files[0];
        if (file) {
          var reader = new FileReader();
          reader.onload = function(re) {
            self.setImagePreview(re.target.result, file.name);
          };
          reader.readAsDataURL(file);
        }
      });
    }

    if (btnSnap) {
      btnSnap.addEventListener("click", function() {
        self.snapGameScreen();
      });
    }

    if (btnRemove) {
      btnRemove.addEventListener("click", function() {
        self.clearImagePreview();
      });
    }

    if (form) {
      form.addEventListener("submit", function(e) {
        e.preventDefault();
        self.submit();
      });
    }
  },

  snapGameScreen: function() {
    var self = this;
    try {
      var canvas = (window.game && window.game.canvas) || document.querySelector("canvas");
      if (canvas) {
        var dataUrl = canvas.toDataURL("image/png");
        this.setImagePreview(dataUrl, "oops_snap_" + Date.now() + ".png");
      } else if (window.game && window.game.renderer) {
        window.game.renderer.snapshot(function(image) {
          if (image && image.src) {
            self.setImagePreview(image.src, "oops_snap_" + Date.now() + ".png");
          }
        });
      }
    } catch(e) {
      console.warn("Could not snapshot canvas:", e);
    }
  },

  setImagePreview: function(dataUrl, name) {
    this.attachedImage = { name: name, dataUrl: dataUrl };
    var container = document.getElementById("fb-preview-container");
    var imgEl = document.getElementById("fb-preview-img");
    var textEl = document.getElementById("fb-preview-name");
    if (imgEl) imgEl.src = dataUrl;
    if (textEl) textEl.textContent = name || "Attached Image";
    if (container) {
      container.classList.remove("hidden");
      container.style.display = "flex";
    }
  },

  clearImagePreview: function() {
    this.attachedImage = null;
    var container = document.getElementById("fb-preview-container");
    var imgEl = document.getElementById("fb-preview-img");
    var fileInput = document.getElementById("fb-image-input");
    if (imgEl) imgEl.src = "";
    if (fileInput) fileInput.value = "";
    if (container) {
      container.classList.add("hidden");
      container.style.display = "none";
    }
  },

  open: function() {
    this.init();
    var modal = document.getElementById("feedback-modal");
    if (!modal) return;

    var worldName = "World 1 (Desert Ruins)";
    var levelNum = 1;
    var deathsCount = SaveManager.getTotalDeaths();

    if (window.game && window.game.scene) {
      var wsScene = window.game.scene.getScene("WorldSelectScene");
      if (wsScene && window.game.scene.isActive("WorldSelectScene")) {
        var theme = getTheme(wsScene.currentWorldIdx);
        worldName = theme.badge + " (" + theme.name + ")";
        levelNum = SaveManager.getWorldUnlocked(wsScene.currentWorldIdx) + 1;
      } else {
        var gScene = window.game.scene.getScene("GameScene");
        if (gScene && window.game.scene.isActive("GameScene")) {
          var theme = getTheme(gScene.currentWorld);
          worldName = theme.badge + " (" + theme.name + ")";
          levelNum = gScene.currentLevel + 1;
          deathsCount = gScene.deaths;
        }
      }
    }

    var currWorldEl = document.getElementById("fb-curr-world");
    var currLevelEl = document.getElementById("fb-curr-level");
    var currDeathsEl = document.getElementById("fb-curr-deaths");
    if (currWorldEl) currWorldEl.textContent = worldName;
    if (currLevelEl) currLevelEl.textContent = "Level " + levelNum;
    if (currDeathsEl) currDeathsEl.textContent = "" + deathsCount;

    modal.style.display = "flex";
    modal.classList.remove("hidden");
    var msgInput = document.getElementById("fb-message");
    if (msgInput) msgInput.focus();
  },

  close: function() {
    var modal = document.getElementById("feedback-modal");
    if (modal) {
      modal.style.display = "none";
      modal.classList.add("hidden");
    }
  },

  submit: function() {
    var catEl = document.getElementById("fb-category");
    var nameEl = document.getElementById("fb-name");
    var msgEl = document.getElementById("fb-message");
    var cwEl = document.getElementById("fb-curr-world");
    var clEl = document.getElementById("fb-curr-level");
    var cdEl = document.getElementById("fb-curr-deaths");

    var category = (catEl && catEl.value) ? catEl.value : "General Feedback";
    var name = (nameEl && nameEl.value) ? nameEl.value.trim() : "Anonymous Player";
    var message = (msgEl && msgEl.value) ? msgEl.value.trim() : "";

    var worldName = (cwEl && cwEl.textContent) ? cwEl.textContent : "World 1";
    var levelName = (clEl && clEl.textContent) ? clEl.textContent : "Level 1";
    var deaths = (cdEl && cdEl.textContent) ? cdEl.textContent : "0";

    if (!message) return;

    var imageSection = "";
    if (this.attachedImage) {
      imageSection = "\\n\\n### 📸 Attached Screenshot\\n> *Screenshot file: " + this.attachedImage.name + "*\\n*(💡 Tip: You can also paste or drop your image directly here on GitHub!)*";
    }

    var issueTitle = encodeURIComponent("[" + category + "] Feedback from " + name + " on " + worldName + " " + levelName);
    var issueBody = encodeURIComponent("### 👤 Player Information\\n- **Player Name / Nickname:** " + name + "\\n- **Feedback Category:** " + category + "\\n\\n### 🎮 Game Context\\n- **World & Level:** " + worldName + " · " + levelName + "\\n- **Total Deaths:** 💀 " + deaths + "\\n- **Device / Screen:** " + window.innerWidth + "x" + window.innerHeight + " (" + (('ontouchstart' in window) ? 'Touch Device' : 'Desktop') + ")\\n- **Submission Time:** " + new Date().toISOString() + "\\n\\n### 💡 Feedback & Improvement Suggestions\\n" + message + imageSection + "\\n\\n---\\n*Submitted via Oops! In-Game Feedback System*");

    var githubIssueUrl = "https://github.com/khalidabdullahh/Oops/issues/new?title=" + issueTitle + "&body=" + issueBody;

    try {
      var logs = JSON.parse(SafeStorage.getItem("oops_feedback_logs") || "[]");
      logs.push({
        name: name,
        category: category,
        message: message,
        hasImage: !!this.attachedImage,
        imageName: this.attachedImage ? this.attachedImage.name : null,
        worldName: worldName,
        levelName: levelName,
        deaths: deaths,
        timestamp: new Date().toISOString()
      });
      SafeStorage.setItem("oops_feedback_logs", JSON.stringify(logs));
    } catch(e) {}

    window.open(githubIssueUrl, "_blank");
    this.close();

    if (msgEl) msgEl.value = "";
    this.clearImagePreview();
  }
};

// ─── 5. 5 Multiverse Worlds Configuration ────────────────────
var WORLD_THEMES = [
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
    doorWood: 0x9c4118,
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
    doorWood: 0x225577,
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
    doorWood: 0x481d60,
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
    doorWood: 0x185c42,
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
    doorWood: 0x6e1b4c,
    island: 0x7d2358,
    islandBorder: 0x5c143e,
    accent: 0xff3838
  }
];

function getTheme(worldIdx) {
  var idx = Math.max(0, Math.min(worldIdx, WORLD_THEMES.length - 1));
  return WORLD_THEMES[idx];
}

// ─── 6. BootScene: Assets & Animations ───────────────────────
class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create() {
    try {
      this.createCartoonHero();
      this.createWorldAssets();
      this.createAnimations();
    } catch(err) {
      console.warn("Texture creation notice:", err);
    }

    try {
      FeedbackManager.init();
    } catch(e) {}

    removeLoaderSplash();

    // Route to 7-Second Intro if first time, else directly to WorldSelectScene
    if (!SaveManager.hasSeenIntro()) {
      this.scene.start("IntroScene");
    } else {
      this.scene.start("WorldSelectScene");
    }
  }

  createCartoonHero() {
    var self = this;
    var drawHeroFrame = function(key, options) {
      if (!options) options = {};
      var g = self.make.graphics({ x: 0, y: 0, add: false });
      var blink = options.blink || false;
      var legOffset = options.legOffset || 0;
      var bobY = options.bobY || 0;
      var armsUp = options.armsUp || false;
      var panicked = options.panicked || false;
      var dead = options.dead || false;
      var eyeLookX = (options.eyeLookX !== undefined) ? options.eyeLookX : 1;

      var yOff = bobY;

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
        g.destroy();
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
        var px = eyeLookX;
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
      var leg1X = 10 + legOffset;
      var leg2X = 18 - legOffset;
      g.fillRect(leg1X, 31 + yOff, 4, 4);
      g.fillRect(leg2X, 31 + yOff, 4, 4);

      g.fillStyle(0xe17055, 1);
      g.fillRoundedRect(leg1X - 1, 34 + yOff, 6, 5, 2);
      g.fillRoundedRect(leg2X - 1, 34 + yOff, 6, 5, 2);

      g.generateTexture(key, 32, 40);
      g.destroy();
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
    var platGfx = this.make.graphics({ x: 0, y: 0, add: false });
    platGfx.fillStyle(0xffffff, 1);
    platGfx.fillRect(0, 0, 32, 32);
    platGfx.fillStyle(0x000000, 0.12);
    platGfx.fillRect(0, 0, 32, 3);
    platGfx.generateTexture("plat_tex", 32, 32);
    platGfx.destroy();

    var spkGfx = this.make.graphics({ x: 0, y: 0, add: false });
    spkGfx.fillStyle(0xffffff, 1);
    spkGfx.beginPath();
    spkGfx.moveTo(0, 20);
    spkGfx.lineTo(10, 0);
    spkGfx.lineTo(20, 20);
    spkGfx.closePath();
    spkGfx.fill();
    spkGfx.generateTexture("spike_up", 20, 20);
    spkGfx.destroy();

    var iciGfx = this.make.graphics({ x: 0, y: 0, add: false });
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
    iciGfx.destroy();

    var crushGfx = this.make.graphics({ x: 0, y: 0, add: false });
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
    crushGfx.destroy();

    // ── 🚪 3-PART DOORWAY ASSETS (Interior, Swing Panel, Outer Frame) ──
    var dIntGfx = this.make.graphics({ x: 0, y: 0, add: false });
    dIntGfx.fillStyle(0x0a0b12, 1);
    dIntGfx.fillRoundedRect(4, 6, 28, 44, 6);
    dIntGfx.fillStyle(0xffd32a, 0.2);
    dIntGfx.fillCircle(18, 20, 10);
    dIntGfx.generateTexture("door_interior_tex", 36, 50);
    dIntGfx.destroy();

    var dPanGfx = this.make.graphics({ x: 0, y: 0, add: false });
    dPanGfx.fillStyle(0xffffff, 1);
    dPanGfx.fillRoundedRect(0, 0, 26, 42, 4);
    dPanGfx.fillStyle(0x1e272e, 1);
    dPanGfx.fillRect(2, 2, 22, 38);
    dPanGfx.fillStyle(0xffd32a, 1);
    dPanGfx.fillCircle(20, 22, 2.5); // Golden knob
    dPanGfx.generateTexture("door_panel_tex", 26, 42);
    dPanGfx.destroy();

    var dFrmGfx = this.make.graphics({ x: 0, y: 0, add: false });
    dFrmGfx.lineStyle(4, 0xffffff, 1);
    dFrmGfx.strokeRoundedRect(2, 4, 32, 46, 8);
    dFrmGfx.fillStyle(0xffffff, 1);
    dFrmGfx.fillRect(0, 48, 36, 4);
    dFrmGfx.generateTexture("door_frame_tex", 36, 52);
    dFrmGfx.destroy();

    var trampGfx = this.make.graphics({ x: 0, y: 0, add: false });
    trampGfx.fillStyle(0x2ed573, 1);
    trampGfx.fillRoundedRect(0, 8, 32, 8, 3);
    trampGfx.fillStyle(0xff4757, 1);
    trampGfx.fillRoundedRect(4, 2, 24, 6, 2);
    trampGfx.generateTexture("tramp_tex", 32, 16);
    trampGfx.destroy();

    var dotGfx = this.make.graphics({ x: 0, y: 0, add: false });
    dotGfx.fillStyle(0xffffff, 1);
    dotGfx.fillCircle(4, 4, 4);
    dotGfx.generateTexture("part_dot", 8, 8);
    dotGfx.destroy();

    var lsrGfx = this.make.graphics({ x: 0, y: 0, add: false });
    lsrGfx.fillStyle(0xe056fd, 1);
    lsrGfx.fillRect(0, 0, 4, 60);
    lsrGfx.fillStyle(0xffffff, 0.85);
    lsrGfx.fillRect(1, 0, 2, 60);
    lsrGfx.generateTexture("laser_tex", 4, 60);
    lsrGfx.destroy();
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

// ─── 7. IntroScene: 7-Second Comedic Demonstration ───────────
class IntroScene extends Phaser.Scene {
  constructor() {
    super("IntroScene");
  }

  create() {
    var self = this;
    var size = this.scale;
    var width = size.width;
    var height = size.height;

    AudioEngine.init();
    MobileGamepad.hide();
    removeLoaderSplash();

    // Dark retro backdrop
    var bg = this.add.graphics();
    bg.fillStyle(0x140602, 1);
    bg.fillRect(0, 0, width, height);

    // Particle dust
    this.add.particles(0, 0, "part_dot", {
      x: { min: 0, max: width },
      y: { min: 0, max: height },
      lifespan: 2000,
      speedY: { min: -10, max: 10 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.3, end: 0 },
      tint: 0xffa502,
      frequency: 180
    });

    // Floor platform
    var floor = this.add.tileSprite(width / 2, 450, width + 100, 80, "plat_tex");
    floor.setTint(0xe5825b);

    // Exit Gate (starts on right)
    var door = this.add.container(720, 390);
    var dInt = this.add.image(0, 0, "door_interior_tex");
    var dPan = this.add.image(-13, 2, "door_panel_tex").setOrigin(0, 0.5).setTint(0x9c4118);
    var dFrm = this.add.image(0, 0, "door_frame_tex");
    door.add([dInt, dPan, dFrm]);

    // Hero sprite
    var hero = this.add.sprite(180, 390, "hero_idle_1");
    hero.anims.play("hero_anim_run");

    // Caption Banner at Top
    var caption = this.add.text(width / 2, 50, "JUST REACH THE EXIT... RIGHT? 😉", {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "14px",
      color: "#ffd32a",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5);

    // Skip Button in Top Right
    var skipBtn = this.add.container(width - 90, 45);
    var skGfx = this.add.graphics();
    skGfx.fillStyle(0x1e202c, 0.85);
    skGfx.fillRoundedRect(-45, -14, 90, 28, 6);
    skGfx.lineStyle(1.5, 0xffffff, 0.6);
    skGfx.strokeRoundedRect(-45, -14, 90, 28, 6);
    var skTxt = this.add.text(0, 0, "SKIP ▶", {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "8.5px",
      color: "#ffffff"
    }).setOrigin(0.5);
    var skZone = this.add.zone(0, 0, 90, 28).setInteractive({ cursor: "pointer" });
    skipBtn.add([skGfx, skTxt, skZone]);

    var endIntro = function() {
      SaveManager.setIntroSeen();
      self.scene.start("WorldSelectScene");
    };

    skZone.on("pointerdown", endIntro);
    this.input.keyboard.on("keydown-SPACE", endIntro);
    this.input.keyboard.on("keydown-ENTER", endIntro);

    // ── Phase 1 (0 - 2.2s): Walk toward exit ──
    this.tweens.add({
      targets: hero,
      x: 440,
      duration: 2000,
      ease: "Linear",
      onComplete: function() {
        // ── Phase 2 (2.2s - 3.8s): The Hilarious Troll Drop ──
        caption.setText("OOPS! FLOOR WAS A TRAP! 😈");
        caption.setColor("#ff4757");

        AudioEngine.sfxTrap();
        hero.anims.stop();
        hero.setTexture("hero_fall");

        // Trap Floor Drops
        var fakeHole = self.add.rectangle(440, 450, 90, 80, 0x140602);
        self.cameras.main.shake(200, 0.025);

        // Giant Comical Hammer drops from ceiling
        var hammer = self.add.image(440, 100, "crusher_tex");
        self.tweens.add({
          targets: hammer,
          y: 380,
          duration: 250,
          ease: "Quad.easeIn",
          onComplete: function() {
            AudioEngine.sfxCrush();
            AudioEngine.sfxDie();
            self.cameras.main.shake(300, 0.04);
            hero.setTexture("hero_dead");
            hero.y = 410;

            // Comic "OOPS!" popup bubble
            var oopsText = self.add.text(440, 320, "💥 OOPS! 💀", {
              fontFamily: "'Press Start 2P', monospace",
              fontSize: "20px",
              color: "#ffd32a",
              stroke: "#000000",
              strokeThickness: 6
            }).setOrigin(0.5);

            self.tweens.add({
              targets: [hammer, oopsText],
              alpha: 0,
              delay: 800,
              duration: 300
            });

            // ── Phase 3 (3.8s - 5.8s): Respawn, Learn & Door Runs Away! ──
            self.time.delayedCall(1100, function() {
              oopsText.destroy();
              hammer.destroy();
              fakeHole.destroy();

              caption.setText("NEVER TRUST ANYTHING! 🤣");
              caption.setColor("#2ed573");

              // Hero respawns
              hero.x = 220;
              hero.y = 390;
              hero.setTexture("hero_idle_1");
              hero.anims.play("hero_anim_run");
              AudioEngine.sfxPortal();

              // Hero runs and leaps over trap
              self.tweens.add({
                targets: hero,
                x: 440,
                y: 300,
                duration: 600,
                ease: "Quad.easeOut",
                onComplete: function() {
                  hero.anims.play("hero_anim_jump");
                  AudioEngine.sfxJump();
                  self.tweens.add({
                    targets: hero,
                    x: 640,
                    y: 390,
                    duration: 500,
                    ease: "Quad.easeIn",
                    onComplete: function() {
                      // Exit door sprouts legs & hops away!
                      AudioEngine.sfxTrap();
                      self.tweens.add({
                        targets: door,
                        x: 820,
                        y: 320,
                        duration: 350,
                        ease: "Back.easeOut",
                        onComplete: function() {
                          // Hero dives straight into the fleeing door!
                          AudioEngine.sfxWin();
                          dPan.scaleX = 0.08;
                          hero.x = door.x;
                          hero.y = door.y + 4;
                          hero.setDepth(dFrm.depth - 1);
                          hero.alpha = 0;

                          // ── Phase 4 (5.8s - 7.5s): Title Slam & Start Prompt ──
                          caption.destroy();
                          var titleCard = self.add.container(width / 2, height / 2 - 20);

                          var tMain = self.add.text(0, -30, "Oops!", {
                            fontFamily: "'Press Start 2P', monospace",
                            fontSize: "44px",
                            color: "#ffd32a",
                            stroke: "#000000",
                            strokeThickness: 8
                          }).setOrigin(0.5);

                          var tSub = self.add.text(0, 25, "A TOTALLY FAIR MULTIVERSE", {
                            fontFamily: "'Press Start 2P', monospace",
                            fontSize: "12px",
                            color: "#ff4757",
                            stroke: "#000000",
                            strokeThickness: 4
                          }).setOrigin(0.5);

                          var tTip = self.add.text(0, 65, "TAP ANYWHERE TO PLAY ▶", {
                            fontFamily: "'Press Start 2P', monospace",
                            fontSize: "10px",
                            color: "#ffffff"
                          }).setOrigin(0.5);

                          self.tweens.add({
                            targets: tTip,
                            alpha: 0.3,
                            duration: 400,
                            yoyo: true,
                            repeat: -1
                          });

                          titleCard.add([tMain, tSub, tTip]);

                          var bgClick = self.add.zone(width / 2, height / 2, width, height).setInteractive({ cursor: "pointer" });
                          bgClick.on("pointerdown", endIntro);

                          self.time.delayedCall(2200, endIntro);
                        }
                      });
                    }
                  });
                }
              });
            });
          }
        });
      }
    });
  }
}

// ─── 8. WorldSelectScene: 30 Levels per World Island Map ─────
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
    var self = this;
    var size = this.scale;
    var width = size.width;
    var height = size.height;

    AudioEngine.init();
    MobileGamepad.hide();
    removeLoaderSplash();

    var theme = getTheme(this.currentWorldIdx);
    syncBodyBackground(theme);

    this.bgGfx = this.add.graphics();
    this.drawBackground();

    this.islandContainer = this.add.container(0, 0);
    this.renderWorldIsland();
  }

  drawBackground() {
    var size = this.scale;
    var width = size.width;
    var height = size.height;

    var theme = getTheme(this.currentWorldIdx);
    syncBodyBackground(theme);

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
    var self = this;
    this.islandContainer.removeAll(true);
    var size = this.scale;
    var width = size.width;
    var height = size.height;

    var theme = getTheme(this.currentWorldIdx);
    var maxUnlocked = SaveManager.getWorldUnlocked(this.currentWorldIdx);

    var titleText = this.add.text(width / 2, 34, "Oops! - WORLD MAP", {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "18px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 6
    }).setOrigin(0.5);
    this.islandContainer.add(titleText);

    // ── TOP-RIGHT BUTTON CLUSTER: [ 🎬 INTRO ]  [ 💬 FEEDBACK ]  [ 🔊 SOUND ]  [ ⛶ FULLSCREEN ] ──
    var fsText = this.add.text(width - 28, 34, "⛶", {
      fontSize: "17px"
    }).setOrigin(0.5).setInteractive({ cursor: "pointer" });
    fsText.on("pointerdown", function() {
      toggleFullScreen();
    });
    this.islandContainer.add(fsText);

    var sndText = this.add.text(width - 60, 34, AudioEngine.muted ? "🔇" : "🔊", {
      fontSize: "17px"
    }).setOrigin(0.5).setInteractive({ cursor: "pointer" });
    sndText.on("pointerdown", function() {
      AudioEngine.init();
      var muted = AudioEngine.toggleMute();
      sndText.setText(muted ? "🔇" : "🔊");
    });
    this.islandContainer.add(sndText);

    // [ 🎬 INTRO ] Button
    var introBtn = this.add.container(width - 136, 34);
    var inGfx = this.add.graphics();
    inGfx.fillStyle(0x161822, 0.9);
    inGfx.fillRoundedRect(-40, -13, 80, 26, 13);
    inGfx.lineStyle(1.5, 0xffd32a, 0.8);
    inGfx.strokeRoundedRect(-40, -13, 80, 26, 13);
    var inLabel = this.add.text(0, 0, "🎬 INTRO", {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "7px",
      color: "#ffd32a"
    }).setOrigin(0.5);
    var inZone = this.add.zone(0, 0, 80, 26).setInteractive({ cursor: "pointer" });
    inZone.on("pointerdown", function() {
      AudioEngine.init();
      AudioEngine.sfxJump();
      self.scene.start("IntroScene");
    });
    introBtn.add([inGfx, inLabel, inZone]);
    this.islandContainer.add(introBtn);

    // [ 💬 FEEDBACK ] Button
    var fbBtn = this.add.container(width - 232, 34);
    var fbGfx = this.add.graphics();
    fbGfx.fillStyle(0x161822, 0.9);
    fbGfx.fillRoundedRect(-46, -13, 92, 26, 13);
    fbGfx.lineStyle(1.5, 0xff4757, 0.85);
    fbGfx.strokeRoundedRect(-46, -13, 92, 26, 13);
    var fbLabel = this.add.text(0, 0, "💬 REPORT", {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "7px",
      color: "#ffffff"
    }).setOrigin(0.5);
    var fbZone = this.add.zone(0, 0, 92, 26).setInteractive({ cursor: "pointer" });
    fbZone.on("pointerdown", function() {
      AudioEngine.init();
      AudioEngine.sfxJump();
      FeedbackManager.open();
    });
    fbBtn.add([fbGfx, fbLabel, fbZone]);
    this.islandContainer.add(fbBtn);

    var islandW = 820, islandH = 370;
    var islandX = width / 2, islandY = height / 2 + 25;

    var islGfx = this.add.graphics();
    islGfx.fillStyle(0x000000, 0.4);
    islGfx.fillRoundedRect(islandX - islandW / 2 + 10, islandY - islandH / 2 + 15, islandW, islandH, 24);
    islGfx.fillStyle(theme.island, 1);
    islGfx.fillRoundedRect(islandX - islandW / 2, islandY - islandH / 2, islandW, islandH, 24);
    islGfx.lineStyle(4, theme.islandBorder, 1);
    islGfx.strokeRoundedRect(islandX - islandW / 2, islandY - islandH / 2, islandW, islandH, 24);
    this.islandContainer.add(islGfx);

    var worldBadge = this.add.text(islandX, islandY - islandH / 2 + 28, theme.badge + ": " + theme.name, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "14px",
      color: "#ffd32a",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5);
    this.islandContainer.add(worldBadge);

    var subText = this.add.text(islandX, islandY - islandH / 2 + 48, "✦ GIMMICK: " + theme.gimmickName + " ✦", {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "8px",
      color: "#ffffff"
    }).setOrigin(0.5);
    this.islandContainer.add(subText);

    var tabLabels = ["LEVELS 1 - 10", "LEVELS 11 - 20", "LEVELS 21 - 30"];
    var tabW = 160, tabGap = 12;
    var tabStartX = islandX - (3 * tabW + 2 * tabGap) / 2 + tabW / 2;
    var tabY = islandY - islandH / 2 + 78;

    tabLabels.forEach(function(label, p) {
      var tx = tabStartX + p * (tabW + tabGap);
      var isSelected = (self.pageIdx === p);

      var tabGfx = self.add.graphics();
      tabGfx.fillStyle(isSelected ? 0xffd32a : 0x111111, isSelected ? 1 : 0.6);
      tabGfx.fillRoundedRect(tx - tabW / 2, tabY - 14, tabW, 28, 6);
      tabGfx.lineStyle(2, isSelected ? 0xffffff : theme.islandBorder, 1);
      tabGfx.strokeRoundedRect(tx - tabW / 2, tabY - 14, tabW, 28, 6);

      var tText = self.add.text(tx, tabY, label, {
        fontFamily: "'Press Start 2P', monospace",
        fontSize: "8px",
        color: isSelected ? "#000000" : "#ffffff"
      }).setOrigin(0.5);

      var tabZone = self.add.zone(tx, tabY, tabW, 28).setInteractive({ cursor: "pointer" });
      tabZone.on("pointerdown", function() {
        AudioEngine.init();
        AudioEngine.sfxJump();
        self.pageIdx = p;
        self.renderWorldIsland();
      });

      self.islandContainer.add([tabGfx, tText, tabZone]);
    });

    var pageOffset = this.pageIdx * 10;
    var nodeSize = 52, gapX = 36, gapY = 24;
    var gridCols = 5, gridRows = 2;
    var totalNodesW = gridCols * nodeSize + (gridCols - 1) * gapX;
    var nodesStartX = islandX - totalNodesW / 2 + nodeSize / 2;
    var nodesStartY = islandY + 12;

    for (var r = 0; r < gridRows; r++) {
      for (var c = 0; c < gridCols; c++) {
        (function(row, col) {
          var localIdx = row * gridCols + col;
          var lvlIdx = pageOffset + localIdx;
          var nx = nodesStartX + col * (nodeSize + gapX);
          var ny = nodesStartY + row * (nodeSize + gapY);

          var isCleared = SaveManager.isLevelCleared(self.currentWorldIdx, lvlIdx);
          var isCurrent = lvlIdx === maxUnlocked;
          var isLocked  = (lvlIdx > maxUnlocked) && (lvlIdx > 0);

          var nodeContainer = self.add.container(nx, ny);

          var nodeGfx = self.add.graphics();
          var fillCol = isCleared ? 0x2ed573 : isCurrent ? 0xffd32a : 0x222226;
          var borderCol = isCleared ? 0x26af5f : isCurrent ? 0xffffff : 0x444444;

          nodeGfx.fillStyle(fillCol, isLocked ? 0.4 : 1);
          nodeGfx.fillCircle(0, 0, nodeSize / 2);
          nodeGfx.lineStyle(3, borderCol, 1);
          nodeGfx.strokeCircle(0, 0, nodeSize / 2);

          var numText = self.add.text(0, -3, "" + (lvlIdx + 1), {
            fontFamily: "'Press Start 2P', monospace",
            fontSize: "12px",
            color: isLocked ? "#666666" : isCurrent ? "#000000" : "#ffffff",
            stroke: "#000000",
            strokeThickness: isCurrent ? 0 : 3
          }).setOrigin(0.5);

          var statusText = self.add.text(0, 14, isCleared ? "✓" : isCurrent ? "★" : "🔒", {
            fontFamily: "'Press Start 2P', monospace",
            fontSize: "7px",
            color: isCleared ? "#ffffff" : isCurrent ? "#000000" : "#777777"
          }).setOrigin(0.5);

          nodeContainer.add([nodeGfx, numText, statusText]);

          if (isCurrent) {
            var arrow = self.add.text(0, -nodeSize / 2 - 14, "▼", {
              fontFamily: "'Press Start 2P', monospace",
              fontSize: "14px",
              color: "#ffd32a"
            }).setOrigin(0.5);
            self.tweens.add({
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
            var hitZone = self.add.zone(0, 0, nodeSize + 8, nodeSize + 8).setInteractive({ cursor: "pointer" });
            hitZone.on("pointerover", function() {
              nodeContainer.setScale(1.12);
            });
            hitZone.on("pointerout", function() {
              nodeContainer.setScale(1);
            });
            hitZone.on("pointerdown", function() {
              AudioEngine.init();
              AudioEngine.sfxJump();
              self.scene.start("GameScene", { world: self.currentWorldIdx, level: lvlIdx, deaths: SaveManager.getTotalDeaths() });
            });
            nodeContainer.add(hitZone);
          }

          self.islandContainer.add(nodeContainer);
        })(r, c);
      }
    }

    if (this.currentWorldIdx > 0) {
      var prevBtn = this.add.container(islandX - islandW / 2 + 70, islandY + islandH / 2 - 32);
      var pbGfx = this.add.graphics();
      pbGfx.fillStyle(0x111111, 0.85);
      pbGfx.fillRoundedRect(-55, -16, 110, 32, 6);
      pbGfx.lineStyle(2, 0xffffff, 0.8);
      pbGfx.strokeRoundedRect(-55, -16, 110, 32, 6);
      var pbLabel = this.add.text(0, 0, "◀ PREV", {
        fontFamily: "'Press Start 2P', monospace",
        fontSize: "8.5px",
        color: "#ffffff"
      }).setOrigin(0.5);
      var pZone = this.add.zone(0, 0, 110, 32).setInteractive({ cursor: "pointer" });
      pZone.on("pointerdown", function() {
        AudioEngine.init();
        AudioEngine.sfxJump();
        self.currentWorldIdx--;
        self.pageIdx = 0;
        self.drawBackground();
        self.renderWorldIsland();
      });
      prevBtn.add([pbGfx, pbLabel, pZone]);
      this.islandContainer.add(prevBtn);
    }

    if (this.currentWorldIdx < WORLD_THEMES.length - 1) {
      var nextBtn = this.add.container(islandX + islandW / 2 - 70, islandY + islandH / 2 - 32);
      var nbGfx = this.add.graphics();
      nbGfx.fillStyle(0x111111, 0.85);
      nbGfx.fillRoundedRect(-55, -16, 110, 32, 6);
      nbGfx.lineStyle(2, 0xffffff, 0.8);
      nbGfx.strokeRoundedRect(-55, -16, 110, 32, 6);
      var nbLabel = this.add.text(0, 0, "NEXT ▶", {
        fontFamily: "'Press Start 2P', monospace",
        fontSize: "8.5px",
        color: "#ffffff"
      }).setOrigin(0.5);
      var nZone = this.add.zone(0, 0, 110, 32).setInteractive({ cursor: "pointer" });
      nZone.on("pointerdown", function() {
        AudioEngine.init();
        AudioEngine.sfxJump();
        self.currentWorldIdx++;
        self.pageIdx = 0;
        self.drawBackground();
        self.renderWorldIsland();
      });
      nextBtn.add([nbGfx, nbLabel, nZone]);
      this.islandContainer.add(nextBtn);
    }

    var playBtn = this.add.container(islandX, islandY + islandH / 2 - 32);
    var plGfx = this.add.graphics();
    plGfx.fillStyle(0x2ed573, 1);
    plGfx.fillRoundedRect(-130, -16, 260, 32, 8);
    plGfx.lineStyle(2, 0xffffff, 1);
    plGfx.strokeRoundedRect(-130, -16, 260, 32, 8);

    var plLabel = this.add.text(0, 0, "▶ PLAY LEVEL " + (maxUnlocked + 1), {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "9.5px",
      color: "#ffffff"
    }).setOrigin(0.5);

    var plZone = this.add.zone(0, 0, 260, 32).setInteractive({ cursor: "pointer" });
    plZone.on("pointerdown", function() {
      AudioEngine.init();
      AudioEngine.sfxJump();
      self.scene.start("GameScene", { world: self.currentWorldIdx, level: maxUnlocked, deaths: SaveManager.getTotalDeaths() });
    });
    playBtn.add([plGfx, plLabel, plZone]);
    this.islandContainer.add(playBtn);
  }
}

// ─── 9. GameScene: Core Platformer & Handcrafted Multiverse ──
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
    var size = this.scale;
    var width = size.width;
    var height = size.height;

    var theme = getTheme(this.currentWorld);
    syncBodyBackground(theme);

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
    this.player.setDepth(100);
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
    var size = this.scale;
    this.add.particles(0, 0, "part_dot", {
      x: { min: 0, max: size.width },
      y: { min: 0, max: size.height },
      lifespan: 2500,
      speedY: { min: -20, max: 20 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.5, end: 0 },
      tint: [0xe056fd, 0xbe2edd, 0xffffff],
      frequency: 140
    });
  }

  createBlizzardParticles() {
    var size = this.scale;
    this.add.particles(0, 0, "part_dot", {
      x: { min: 0, max: size.width },
      y: { min: -20, max: size.height },
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
    var size = this.scale;
    var theme = getTheme(this.currentWorld);

    var banner = this.add.text(size.width / 2, 60, theme.badge + ": LEVEL " + (this.currentLevel + 1), {
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
      onComplete: function() { banner.destroy(); }
    });
  }

  createHUD() {
    var self = this;
    var size = this.scale;
    var width = size.width;
    var theme = getTheme(this.currentWorld);

    this.levelText = this.add.text(25, 20, theme.badge + " · LV " + (this.currentLevel + 1), {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "10px",
      color: "#ffffff"
    }).setDepth(200);

    this.deathText = this.add.text(width - 120, 20, "💀 " + this.deaths, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "10px",
      color: "#ff4757"
    }).setDepth(200);

    var fsBtn = this.add.text(width - 60, 20, "⛶", {
      fontSize: "17px"
    }).setOrigin(0.5).setDepth(200).setInteractive({ cursor: "pointer" });
    fsBtn.on("pointerdown", function() {
      toggleFullScreen();
    });

    var mapBtn = this.add.text(width - 25, 20, "🗺️", {
      fontSize: "18px"
    }).setOrigin(0.5).setDepth(200).setInteractive({ cursor: "pointer" });

    mapBtn.on("pointerdown", function() {
      AudioEngine.stopMusic();
      MobileGamepad.hide();
      self.scene.start("WorldSelectScene", { world: self.currentWorld });
    });
  }

  update(time, delta) {
    if (this.isDead || this.isComplete) return;
    var dt = delta / 1000;
    this.levelTime += dt;
    var size = this.scale;
    var width = size.width;
    var height = size.height;

    // ── 🛡️ LEFT BOUNDARY WALL ──
    if (this.player.x < 18) {
      this.player.x = 18;
      if (this.player.body.velocity.x < 0) {
        this.player.setVelocityX(0);
        this.iceVelocityX = 0;
      }
    }

    // ── 🚪 EXIT GATE PROXIMITY & RIGHT BOUNDARY PROTECTION ──
    if (this.exitGate) {
      var maxGateX = this.exitGate.x + 14;
      if (this.player.x > maxGateX) {
        this.player.x = maxGateX;
        if (this.player.body.velocity.x > 0) {
          this.player.setVelocityX(0);
          this.iceVelocityX = 0;
        }
      }

      if (this.exitGate.fleeOnProximity && !this.exitGate.hasFled) {
        var dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.exitGate.x, this.exitGate.y);
        if (dist < 80) {
          this.exitGate.hasFled = true;
          AudioEngine.sfxTrap();
          var tX = this.exitGate.targetX || this.exitGate.x;
          var tY = this.exitGate.targetY || (this.exitGate.y - 70);
          
          this.tweens.add({
            targets: [this.exitGate, this.exitGate.interior, this.exitGate.doorPanel, this.exitGate.doorFrame],
            x: tX,
            y: tY,
            duration: 350,
            ease: "Back.easeOut"
          });
          if (this.exitGate.doorPanel) {
            this.tweens.add({
              targets: this.exitGate.doorPanel,
              x: tX - 13,
              y: tY + 2,
              duration: 350,
              ease: "Back.easeOut"
            });
          }
          this.showTrollToast(this.exitGate.fleeMessage || "Oops! 😃");
        }
      } else {
        var dx = Math.abs(this.player.x - this.exitGate.x);
        var dy = Math.abs(this.player.y - this.exitGate.y);
        if (dx < 20 && dy < 32) {
          this.onReachExit();
          return;
        }
      }
    }

    if (this.player.y > height + 40 || (this.gravityDir === -1 && this.player.y < -40) || this.player.x > width + 70) {
      this.onPlayerDie();
      return;
    }

    var moveLeft = this.cursors.left.isDown || this.keyA.isDown || this.touchLeft;
    var moveRight = this.cursors.right.isDown || this.keyD.isDown || this.touchRight;

    if (this.controlsInverted) {
      var temp = moveLeft;
      moveLeft = moveRight;
      moveRight = temp;
    }

    if (this.currentWorld === 1) {
      var targetSpeed = moveLeft ? -240 : (moveRight ? 240 : 0);
      var accel = 600 * dt;
      if (this.iceVelocityX < targetSpeed) {
        this.iceVelocityX = Math.min(this.iceVelocityX + accel, targetSpeed);
      } else if (this.iceVelocityX > targetSpeed) {
        this.iceVelocityX = Math.max(this.iceVelocityX - accel, targetSpeed);
      }
      this.player.setVelocityX(this.iceVelocityX);
      if (moveLeft) this.player.setFlipX(true);
      else if (moveRight) this.player.setFlipX(false);
    } else {
      var walkSpeed = 220;
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

    var onFloor = (this.gravityDir === 1) ? this.player.body.blocked.down : this.player.body.blocked.up;
    if (onFloor) {
      this.coyoteTimer = 0.12;
    } else {
      this.coyoteTimer -= dt;
    }

    var jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
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
    var self = this;
    this.crushers.getChildren().forEach(function(crusher) {
      var dist = Math.abs(self.player.x - crusher.x);
      if (!crusher.isDropping && !crusher.isRetracting && dist < 75 && self.player.y > crusher.y) {
        crusher.isDropping = true;
        crusher.setVelocityY(850);
        AudioEngine.sfxCrush();
      }
      if (crusher.isDropping && crusher.body.blocked.down) {
        crusher.isDropping = false;
        crusher.isRetracting = true;
        crusher.setVelocityY(0);
        self.cameras.main.shake(160, 0.022);
        self.time.delayedCall(400, function() {
          if (crusher && crusher.body) crusher.setVelocityY(-140);
        });
      }
      if (crusher.isRetracting && crusher.y <= crusher.startY) {
        crusher.setVelocityY(0);
        crusher.y = crusher.startY;
        crusher.isRetracting = false;
      }
    });

    this.icicles.getChildren().forEach(function(icicle) {
      var dist = Math.abs(self.player.x - icicle.x);
      if (!icicle.hasFallen && dist < 65 && self.player.y > icicle.y) {
        icicle.hasFallen = true;
        icicle.body.setGravityY(1500);
        AudioEngine.sfxIcicle();
        self.tweens.add({ targets: icicle, angle: 10, duration: 60, yoyo: true });
      }
    });

    this.lasers.getChildren().forEach(function(laser) {
      if (laser.isPulsing) {
        laser.pulseTimer = (laser.pulseTimer || 0) + dt;
        if (laser.pulseTimer > 1.8) {
          laser.pulseTimer = 0;
          laser.setActive(!laser.active);
          laser.setVisible(laser.active);
        }
      }
    });

    this.glitchBlocks.forEach(function(gb) {
      gb.flickerTimer = (gb.flickerTimer || 0) + dt;
      if (gb.flickerTimer > gb.period) {
        gb.flickerTimer = 0;
        gb.isSolid = !gb.isSolid;
        gb.setAlpha(gb.isSolid ? 1 : 0.2);
        if (gb.body) gb.body.enable = gb.isSolid;
      }
    });

    for (var i = this.fallingPlatforms.length - 1; i >= 0; i--) {
      (function(idx) {
        var p = self.fallingPlatforms[idx];
        if (p.stepped && !p.hasFallen) {
          p.shakeTimer -= dt;
          p.x += (Math.random() - 0.5) * 3;
          if (p.shakeTimer <= 0) {
            p.hasFallen = true;
            if (p.body) p.body.enable = false;
            self.tweens.add({
              targets: p,
              y: p.y + 350,
              alpha: 0,
              duration: 450,
              ease: "Quad.easeIn",
              onComplete: function() {
                self.platforms.remove(p, true, true);
              }
            });
            self.fallingPlatforms.splice(idx, 1);
          }
        }
      })(i);
    }

    this.customTriggers.forEach(function(t) {
      if (!t.triggered && t.condition(self)) {
        t.triggered = true;
        t.action(self);
      }
    });
  }

  showTrollToast(msg) {
    var size = this.scale;
    var toast = this.add.text(size.width / 2, 70, msg, {
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
      onComplete: function() { toast.destroy(); }
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
    var self = this;
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

    this.time.delayedCall(500, function() {
      self.restartLevel();
    });
  }

  restartLevel() {
    this.scene.restart({ world: this.currentWorld, level: this.currentLevel, deaths: this.deaths });
  }

  // ── 🚪 AUTHENTIC DOORWAY ENTRANCE ───────────────────────────
  onReachExit() {
    var self = this;
    if (this.isComplete || this.isDead) return;
    this.isComplete = true;

    this.player.setVelocity(0, 0);
    if (this.player.body) {
      this.player.body.setEnable(false);
      this.player.body.moves = false;
    }

    SaveManager.saveLevelClear(this.currentWorld, this.currentLevel, this.deaths);

    AudioEngine.playTone(380, "sine", 0.09, 0.16);
    AudioEngine.playTone(540, "triangle", 0.12, 0.22, 0.04);

    if (this.exitGate.doorPanel) {
      this.tweens.add({
        targets: this.exitGate.doorPanel,
        scaleX: 0.06,
        duration: 160,
        ease: "Cubic.easeOut"
      });
    }

    this.player.setDepth(45);
    this.player.setFlipX(false);
    this.player.anims.play("hero_anim_run", true);

    this.tweens.add({
      targets: this.player,
      x: this.exitGate.x,
      y: this.exitGate.y + 4,
      scaleX: 0.85,
      scaleY: 0.85,
      duration: 320,
      ease: "Linear",
      onComplete: function() {
        self.player.anims.play("hero_anim_idle", true);

        if (self.exitGate.doorPanel) {
          self.tweens.add({
            targets: self.exitGate.doorPanel,
            scaleX: 1,
            duration: 140,
            ease: "Back.easeOut",
            onComplete: function() {
              AudioEngine.sfxLand();
              AudioEngine.sfxWin();

              self.add.particles(self.exitGate.x, self.exitGate.y, "part_dot", {
                speed: { min: 70, max: 220 },
                scale: { start: 1.2, end: 0 },
                lifespan: 550,
                quantity: 26,
                tint: [0xffd32a, 0x2ed573, 0xffffff]
              });

              self.time.delayedCall(450, function() {
                var nextLvl = self.currentLevel + 1;
                if (nextLvl >= 30) {
                  MobileGamepad.hide();
                  self.scene.start("WorldSelectScene", { world: self.currentWorld });
                } else {
                  self.scene.restart({ world: self.currentWorld, level: nextLvl, deaths: self.deaths });
                }
              });
            }
          });
        } else {
          AudioEngine.sfxWin();
          self.time.delayedCall(400, function() {
            var nextLvl = self.currentLevel + 1;
            if (nextLvl >= 30) {
              MobileGamepad.hide();
              self.scene.start("WorldSelectScene", { world: self.currentWorld });
            } else {
              self.scene.restart({ world: self.currentWorld, level: nextLvl, deaths: self.deaths });
            }
          });
        }
      }
    });
  }

  createExitDoor(x, y) {
    var theme = getTheme(this.currentWorld);

    var interior = this.add.image(x, y, "door_interior_tex").setDepth(30);

    var trigger = this.physics.add.sprite(x, y, "door_interior_tex");
    trigger.setVisible(false);
    trigger.body.setSize(30, 44);
    trigger.body.setImmovable(true);

    var panel = this.add.image(x - 13, y + 2, "door_panel_tex").setDepth(60);
    panel.setOrigin(0, 0.5);
    panel.setTint(theme.doorWood || 0x9c4118);

    var frame = this.add.image(x, y, "door_frame_tex").setDepth(70);

    trigger.interior = interior;
    trigger.doorPanel = panel;
    trigger.doorFrame = frame;

    return trigger;
  }

  // ─── Handcrafted Level Builder ──────────────────────────────
  buildWorldLevel(wIdx, lvl) {
    var self = this;
    var size = this.scale;
    var width = size.width;
    var height = size.height;
    var theme = getTheme(wIdx);

    var addPlat = function(x, y, w, h) {
      var p = self.add.tileSprite(x + w/2, y + h/2, w, h, "plat_tex");
      p.setTint(theme.platform);
      self.platforms.add(p);
      return p;
    };

    var addFallingPlat = function(x, y, w, h) {
      var p = self.add.tileSprite(x + w/2, y + h/2, w, h, "plat_tex");
      p.setTint(theme.platform);
      p.isFallingPlat = true;
      p.stepped = false;
      p.hasFallen = false;
      self.platforms.add(p);
      self.fallingPlatforms.push(p);
      return p;
    };

    var addSpike = function(x, y) {
      var s = self.spikes.create(x, y, "spike_up");
      s.setTint(theme.spike);
      s.body.setSize(18, 14).setOffset(1, 6);
      return s;
    };

    var addCrusher = function(x, startY) {
      var c = self.crushers.create(x, startY, "crusher_tex");
      c.startY = startY;
      c.isDropping = false;
      c.isRetracting = false;
      c.body.setImmovable(true);
      c.body.setSize(52, 60);
      return c;
    };

    var addIcicle = function(x, y) {
      var ic = self.icicles.create(x, y, "icicle_tex");
      ic.hasFallen = false;
      ic.body.setImmovable(true);
      ic.body.setSize(18, 26);
      return ic;
    };

    var addLaser = function(x, y, isPulsing) {
      if (isPulsing === undefined) isPulsing = false;
      var lz = self.lasers.create(x, y, "laser_tex");
      lz.body.setImmovable(true);
      lz.isPulsing = isPulsing;
      lz.pulseTimer = 0;
      return lz;
    };

    var addTrampoline = function(x, y) {
      var tr = self.trampolines.create(x, y, "tramp_tex");
      tr.body.setSize(32, 12).setOffset(0, 4);
      return tr;
    };

    var addGlitchBlock = function(x, y, w, h, period) {
      var gb = self.add.tileSprite(x + w/2, y + h/2, w, h, "plat_tex");
      gb.setTint(theme.platform);
      self.platforms.add(gb);
      gb.period = period || 1.5;
      gb.isSolid = true;
      self.glitchBlocks.push(gb);
      return gb;
    };

    this.spawnX = 60;
    this.spawnY = 410;

    // 🏜️ WORLD 1: DESERT RUINS (Sand Crumble, Pop-up Spikes, Sinking Steps, Fleeing Doors)
    if (wIdx === 0) {
      if (lvl === 0) {
        addPlat(-80, 460, 340, 80);
        addPlat(320, 460, 260, 80);
        addPlat(640, 460, 400, 80);
        addSpike(290, 450);
        addSpike(610, 450);
        addPlat(800, 400, 240, 60);

        this.exitGate = this.createExitDoor(750, 435);
        this.exitGate.fleeOnProximity = true;
        this.exitGate.targetX = 880;
        this.exitGate.targetY = 375;
        this.exitGate.fleeMessage = "Oops! Just a little hop! 😃";
      } else if (lvl === 1) {
        addPlat(-80, 460, width + 150, 80);
        addCrusher(360, 60);
        addCrusher(640, 60);
        this.exitGate = this.createExitDoor(900, 435);
      } else if (lvl === 2) {
        addPlat(-80, 460, 260, 80);
        addFallingPlat(220, 460, 100, 25);
        addFallingPlat(380, 460, 100, 25);
        addFallingPlat(540, 460, 100, 25);
        addPlat(700, 460, 340, 80);
        for (var sx = 190; sx <= 690; sx += 40) addSpike(sx, 520);
        this.exitGate = this.createExitDoor(900, 435);
      } else if (lvl === 3) {
        addPlat(-80, 460, width + 150, 80);
        this.customTriggers.push({
          triggered: false,
          condition: function(sc) { return sc.player.x > 380; },
          action: function(sc) {
            for (var i = 0; i < 4; i++) {
              var sp = sc.spikes.create(480 + i * 22, 450, "spike_up").setTint(theme.spike);
              sc.tweens.add({ targets: sp, y: 440, duration: 100, yoyo: true });
            }
            AudioEngine.sfxTrap();
            sc.showTrollToast("Surprise! 😈");
          }
        });
        this.exitGate = this.createExitDoor(900, 435);
      } else if (lvl === 4) {
        addPlat(-80, 460, 240, 80);
        addTrampoline(130, 452);
        addPlat(270, 390, 120, 25);
        addPlat(450, 360, 120, 25);
        addTrampoline(510, 352);
        addPlat(630, 340, 100, 25);
        addPlat(780, 320, 260, 220);
        for (var sx = 170; sx < 770; sx += 35) addSpike(sx, 520);
        this.exitGate = this.createExitDoor(880, 295);
      } else if (lvl === 5) {
        // Level 6: The Fake Exit Door Trap
        addPlat(-80, 460, 420, 80);
        addPlat(560, 460, 480, 80);
        addSpike(460, 450);
        addSpike(520, 450);
        // Decoy Door on floor triggers ceiling drop
        var decoy = this.add.image(380, 435, "door_interior_tex").setTint(0x888888);
        this.customTriggers.push({
          triggered: false,
          condition: function(sc) { return sc.player.x > 340 && sc.player.x < 420; },
          action: function(sc) {
            AudioEngine.sfxTrap();
            sc.showTrollToast("Fake Door! Real door is high above! 🤣");
            var spk = sc.spikes.create(380, 450, "spike_up").setTint(theme.spike);
          }
        });
        addTrampoline(280, 452);
        addPlat(420, 310, 140, 25);
        addPlat(680, 260, 280, 280);
        this.exitGate = this.createExitDoor(820, 235);
      } else if (lvl === 6) {
        // Level 7: Sinking Sand Staircase
        addPlat(-80, 460, 200, 80);
        addFallingPlat(180, 430, 90, 24);
        addFallingPlat(310, 390, 90, 24);
        addFallingPlat(440, 350, 90, 24);
        addFallingPlat(570, 310, 90, 24);
        addPlat(700, 270, 340, 270);
        for (var sx = 150; sx < 690; sx += 35) addSpike(sx, 520);
        this.exitGate = this.createExitDoor(860, 245);
      } else if (lvl === 7) {
        // Level 8: Double Crusher Trampoline Leap
        addPlat(-80, 460, 260, 80);
        addCrusher(380, 60);
        addTrampoline(220, 452);
        addPlat(460, 380, 120, 25);
        addCrusher(600, 60);
        addPlat(660, 330, 380, 210);
        for (var sx = 270; sx < 650; sx += 35) addSpike(sx, 520);
        this.exitGate = this.createExitDoor(880, 305);
      } else if (lvl === 8) {
        // Level 9: Pop-up Spike Maze & Fleeing Door
        addPlat(-80, 460, 300, 80);
        addPlat(300, 460, 300, 80);
        addPlat(600, 460, 440, 80);
        this.customTriggers.push({
          triggered: false,
          condition: function(sc) { return sc.player.x > 240; },
          action: function(sc) {
            sc.spikes.create(340, 450, "spike_up").setTint(theme.spike);
            sc.spikes.create(520, 450, "spike_up").setTint(theme.spike);
            AudioEngine.sfxTrap();
          }
        });
        addTrampoline(420, 452);
        addPlat(520, 330, 110, 25);
        this.exitGate = this.createExitDoor(720, 435);
        this.exitGate.fleeOnProximity = true;
        this.exitGate.targetX = 860;
        this.exitGate.targetY = 435;
        this.exitGate.fleeMessage = "Catch me if you can! 🏃";
      } else {
        // Level 10-30: Procedural Master Desert Gauntlets
        var sub = lvl % 10;
        addPlat(-80, 460, 220, 80);
        addFallingPlat(200, 430 - sub * 4, 100, 25);
        if (sub % 2 === 0) addCrusher(350, 60);
        addFallingPlat(360, 390 - sub * 4, 100, 25);
        if (sub % 3 === 0) addTrampoline(480, 382 - sub * 4);
        addFallingPlat(520, 350 - sub * 4, 100, 25);
        addPlat(680, 300 - sub * 3, 360, 240);
        for (var sx = 150; sx < 670; sx += 35) addSpike(sx, 520);
        this.exitGate = this.createExitDoor(860, 275 - sub * 3);
        if (sub === 9) {
          this.exitGate.fleeOnProximity = true;
          this.exitGate.targetY = 205;
        }
      }
    }

    // ❄️ WORLD 2: FROST SPIRE (Ice Sliding, Falling Icicles, Blizzard Gusts, Glacier Gaps)
    else if (wIdx === 1) {
      if (lvl === 0) {
        addPlat(-80, 460, 480, 80);
        addPlat(480, 460, 560, 80);
        addSpike(440, 450);
        this.exitGate = this.createExitDoor(900, 435);
      } else if (lvl === 1) {
        addPlat(-80, 460, width + 150, 80);
        addIcicle(320, 100);
        addIcicle(580, 100);
        this.exitGate = this.createExitDoor(900, 435);
      } else if (lvl === 2) {
        addPlat(-80, 460, 240, 80);
        addPlat(220, 430, 120, 25);
        addIcicle(280, 90);
        addPlat(400, 390, 120, 25);
        addIcicle(460, 90);
        addPlat(580, 360, 120, 25);
        addPlat(760, 340, 280, 200);
        for (var sx = 170; sx < 750; sx += 35) addSpike(sx, 520);
        this.exitGate = this.createExitDoor(880, 315);
      } else if (lvl === 3) {
        addPlat(-80, 460, width + 150, 80);
        for (var ix = 240; ix <= 760; ix += 130) {
          addIcicle(ix, 80);
        }
        this.exitGate = this.createExitDoor(900, 435);
      } else if (lvl === 4) {
        addPlat(-80, 460, 240, 80);
        addTrampoline(130, 452);
        addPlat(270, 390, 120, 25);
        addIcicle(330, 90);
        addPlat(450, 360, 120, 25);
        addTrampoline(510, 352);
        addPlat(630, 340, 100, 25);
        addPlat(780, 320, 260, 220);
        for (var sx = 170; sx < 770; sx += 35) addSpike(sx, 520);
        this.exitGate = this.createExitDoor(880, 295);
      } else if (lvl === 5) {
        // Level 6: The Slippery Staircase with Falling Icicles (REPETITION FIX!)
        addPlat(-80, 460, 220, 80);
        addPlat(200, 420, 100, 25);
        addIcicle(250, 80);
        addPlat(340, 380, 100, 25);
        addIcicle(390, 80);
        addPlat(480, 340, 100, 25);
        addIcicle(530, 80);
        addPlat(620, 300, 100, 25);
        addPlat(760, 260, 280, 280);
        for (var sx = 160; sx < 750; sx += 35) addSpike(sx, 520);
        this.exitGate = this.createExitDoor(880, 235);
      } else if (lvl === 6) {
        // Level 7: Blizzard Wind Gust Zone
        addPlat(-80, 460, width + 150, 80);
        this.customTriggers.push({
          triggered: false,
          condition: function(sc) { return sc.player.x > 320 && sc.player.x < 650; },
          action: function(sc) {
            sc.showTrollToast("BLIZZARD GUST! 💨 Hold Forward!");
            AudioEngine.sfxIcicle();
          }
        });
        for (var ix = 300; ix <= 700; ix += 100) addIcicle(ix, 70);
        this.exitGate = this.createExitDoor(900, 435);
      } else if (lvl === 7) {
        // Level 8: Melting Ice Floes over Spike Pit
        addPlat(-80, 460, 240, 80);
        addFallingPlat(220, 440, 90, 24);
        addFallingPlat(360, 410, 90, 24);
        addFallingPlat(500, 380, 90, 24);
        addTrampoline(610, 372);
        addPlat(720, 320, 320, 220);
        for (var sx = 180; sx < 710; sx += 35) addSpike(sx, 520);
        this.exitGate = this.createExitDoor(880, 295);
      } else if (lvl === 8) {
        // Level 9: Ice Cavern Drop-Through & Runaway Ice Gate
        addPlat(-80, 460, 320, 80);
        addPlat(320, 460, 260, 80);
        addPlat(640, 460, 400, 80);
        addIcicle(450, 70);
        addIcicle(750, 70);
        this.exitGate = this.createExitDoor(720, 435);
        this.exitGate.fleeOnProximity = true;
        this.exitGate.targetX = 880;
        this.exitGate.targetY = 435;
        this.exitGate.fleeMessage = "Brrr! Slipping away! ❄️";
      } else {
        // Level 10-30: Frost Apex Gauntlets
        var sub = lvl % 10;
        addPlat(-80, 460, 220, 80);
        addFallingPlat(200, 420 - sub * 3, 100, 25);
        addIcicle(250, 70);
        addFallingPlat(350, 380 - sub * 3, 100, 25);
        addIcicle(400, 70);
        addFallingPlat(500, 340 - sub * 3, 100, 25);
        addIcicle(550, 70);
        addPlat(660, 300 - sub * 2, 380, 240);
        for (var sx = 150; sx < 650; sx += 35) addSpike(sx, 520);
        this.exitGate = this.createExitDoor(880, 275 - sub * 2);
      }
    }

    // 🔮 WORLD 3: SHADOW CRYPT (Laser Tripwires, Rhythm Lasers, Phantom Steps, Crushers)
    else if (wIdx === 2) {
      if (lvl === 0) {
        addPlat(-80, 460, 460, 80);
        addPlat(460, 460, 580, 80);
        addSpike(420, 450);
        this.exitGate = this.createExitDoor(900, 435);
      } else if (lvl === 1) {
        addPlat(-80, 460, width + 150, 80);
        addLaser(480, 430, false);
        this.exitGate = this.createExitDoor(900, 435);
      } else if (lvl === 2) {
        addPlat(-80, 460, 240, 80);
        addPlat(220, 420, 110, 25);
        addPlat(390, 380, 110, 25);
        addLaser(445, 350, true);
        addPlat(560, 350, 110, 25);
        addPlat(730, 340, 310, 200);
        for (var sx = 170; sx < 720; sx += 35) addSpike(sx, 520);
        this.exitGate = this.createExitDoor(880, 315);
      } else if (lvl === 3) {
        addPlat(-80, 460, width + 150, 80);
        addLaser(340, 430, true);
        addLaser(620, 430, true);
        this.exitGate = this.createExitDoor(900, 435);
      } else if (lvl === 4) {
        // Level 5: Laser Crusher Chamber
        addPlat(-80, 460, 260, 80);
        addLaser(300, 430, true);
        addCrusher(420, 60);
        addLaser(540, 430, true);
        addPlat(620, 460, 420, 80);
        this.exitGate = this.createExitDoor(880, 435);
      } else if (lvl === 5) {
        // Level 6: Phantom Disappearing Platforms
        addPlat(-80, 460, 220, 80);
        addGlitchBlock(200, 420, 100, 25, 1.4);
        addLaser(320, 390, true);
        addGlitchBlock(380, 370, 100, 25, 1.8);
        addLaser(500, 340, true);
        addGlitchBlock(560, 320, 100, 25, 1.4);
        addPlat(720, 280, 320, 260);
        for (var sx = 150; sx < 710; sx += 35) addSpike(sx, 520);
        this.exitGate = this.createExitDoor(880, 255);
      } else if (lvl === 6) {
        // Level 7: Crossfire Laser Corridor
        addPlat(-80, 460, width + 150, 80);
        addLaser(250, 430, true);
        addLaser(400, 430, false);
        addLaser(550, 430, true);
        addLaser(700, 430, false);
        this.exitGate = this.createExitDoor(900, 435);
      } else if (lvl === 7) {
        // Level 8: Trampoline over Lethal Laser Grid
        addPlat(-80, 460, 220, 80);
        addTrampoline(140, 452);
        for (var lx = 260; lx <= 600; lx += 80) addLaser(lx, 440, false);
        addPlat(680, 340, 360, 200);
        this.exitGate = this.createExitDoor(880, 315);
      } else if (lvl === 8) {
        // Level 9: Fleeing Crypt Portal
        addPlat(-80, 460, 320, 80);
        addLaser(360, 430, true);
        addPlat(420, 460, 220, 80);
        addLaser(660, 430, true);
        addPlat(720, 460, 320, 80);
        this.exitGate = this.createExitDoor(780, 435);
        this.exitGate.fleeOnProximity = true;
        this.exitGate.targetX = 900;
        this.exitGate.targetY = 435;
        this.exitGate.fleeMessage = "Into the shadows! 🔮";
      } else {
        // Level 10-30: Shadow Master Puzzles
        var sub = lvl % 10;
        addPlat(-80, 460, 220, 80);
        addGlitchBlock(200, 420 - sub * 3, 100, 25, 1.5);
        addLaser(320, 390 - sub * 3, true);
        addGlitchBlock(380, 360 - sub * 3, 100, 25, 1.3);
        if (sub % 2 === 0) addCrusher(480, 60);
        addGlitchBlock(540, 320 - sub * 3, 100, 25, 1.5);
        addPlat(700, 280 - sub * 2, 340, 260);
        for (var sx = 150; sx < 690; sx += 35) addSpike(sx, 520);
        this.exitGate = this.createExitDoor(880, 255 - sub * 2);
      }
    }

    // ⚡ WORLD 4: GRAVITY NEXUS (Ceiling Walking, Inverted Gravity, Mid-Air Flips)
    else if (wIdx === 3) {
      if (lvl === 0) {
        addPlat(-80, 460, 400, 80);
        addPlat(-80, 0, width + 150, 50);
        addPlat(320, 240, 80, 300);
        addPlat(400, 460, 640, 80);
        this.exitGate = this.createExitDoor(900, 435);
      } else if (lvl === 1) {
        addPlat(-80, 460, 440, 80);
        addPlat(-80, 0, width + 150, 50);
        addPlat(500, 460, 540, 80);
        for (var sx = 360; sx < 500; sx += 30) addSpike(sx, 520);
        this.exitGate = this.createExitDoor(900, 435);
      } else if (lvl === 2) {
        // Level 3: Ceiling Spikes & Alternating Flips
        addPlat(-80, 460, 280, 80);
        addPlat(-80, 0, width + 150, 50);
        for (var sx = 260; sx <= 680; sx += 60) addSpike(sx, 520);
        for (var cx = 300; cx <= 640; cx += 80) addSpike(cx, 50);
        addPlat(720, 460, 320, 80);
        this.exitGate = this.createExitDoor(880, 435);
      } else if (lvl === 3) {
        // Level 4: Mid-Air Inversion Gap
        addPlat(-80, 460, 240, 80);
        addPlat(-80, 0, width + 150, 50);
        addPlat(340, 180, 140, 25);
        addPlat(560, 360, 140, 25);
        addPlat(760, 460, 280, 80);
        for (var sx = 180; sx < 750; sx += 35) addSpike(sx, 520);
        this.exitGate = this.createExitDoor(880, 435);
      } else if (lvl === 4) {
        // Level 5: Inverted Ceiling Trampoline
        addPlat(-80, 460, 260, 80);
        addPlat(-80, 0, width + 150, 50);
        addTrampoline(360, 452);
        addPlat(500, 160, 140, 25);
        addPlat(700, 460, 340, 80);
        this.exitGate = this.createExitDoor(880, 435);
      } else {
        // Level 6-30: Master Gravity Puzzles
        var sub = lvl % 10;
        addPlat(-80, 460, 240, 80);
        addPlat(-80, 0, width + 150, 50);
        addPlat(220, 180 + sub * 8, 110, 25);
        addPlat(400, 340 - sub * 8, 110, 25);
        addPlat(580, 180 + sub * 8, 110, 25);
        addPlat(760, 460, 280, 80);
        for (var sx = 180; sx < 750; sx += 35) addSpike(sx, 520);
        this.exitGate = this.createExitDoor(880, 435);
      }
    }

    // 🌌 WORLD 5: GLITCH CORE (Reality Glitches, Inverted Controls, Paradox Rifts, Phase Blocks)
    else {
      if (lvl === 0) {
        addPlat(-80, 460, 360, 80);
        addGlitchBlock(340, 460, 240, 80, 1.6);
        addPlat(640, 460, 400, 80);
        addSpike(300, 450);
        addSpike(600, 450);
        this.exitGate = this.createExitDoor(900, 435);
      } else if (lvl === 1) {
        addPlat(-80, 460, width + 150, 80);
        this.customTriggers.push({
          triggered: false,
          condition: function(sc) { return sc.player.x > 320; },
          action: function(sc) {
            sc.controlsInverted = true;
            AudioEngine.sfxGlitch();
            sc.showTrollToast("GLITCH! Controls Inverted! 💫");
          }
        });
        this.exitGate = this.createExitDoor(900, 435);
      } else if (lvl === 2) {
        // Level 3: Phase-Cycling Bridge
        addPlat(-80, 460, 240, 80);
        addGlitchBlock(200, 440, 110, 25, 1.3);
        addGlitchBlock(360, 400, 110, 25, 1.6);
        addGlitchBlock(520, 360, 110, 25, 1.3);
        addPlat(680, 320, 360, 220);
        for (var sx = 160; sx < 670; sx += 35) addSpike(sx, 520);
        this.exitGate = this.createExitDoor(880, 295);
      } else if (lvl === 3) {
        // Level 4: Teleporting Glitch Crusher Storm
        addPlat(-80, 460, width + 150, 80);
        addCrusher(300, 60);
        addCrusher(500, 60);
        addCrusher(700, 60);
        this.customTriggers.push({
          triggered: false,
          condition: function(sc) { return sc.player.x > 400; },
          action: function(sc) {
            AudioEngine.sfxGlitch();
            sc.showTrollToast("REALITY DISTORTION! 🌌");
          }
        });
        this.exitGate = this.createExitDoor(900, 435);
      } else if (lvl === 4) {
        // Level 5: Paradox Fleeing Decoy Door
        addPlat(-80, 460, 320, 80);
        addGlitchBlock(300, 460, 220, 80, 1.5);
        addPlat(560, 460, 480, 80);
        this.exitGate = this.createExitDoor(700, 435);
        this.exitGate.fleeOnProximity = true;
        this.exitGate.targetX = 880;
        this.exitGate.targetY = 435;
        this.exitGate.fleeMessage = "GLITCH HOP! 🌀";
      } else {
        // Level 6-30: Multiverse Singularity Climax
        var sub = lvl % 10;
        addPlat(-80, 460, 220, 80);
        addGlitchBlock(200, 420 - sub * 3, 100, 25, 1.6 - sub * 0.05);
        if (sub % 2 === 0) addCrusher(330, 60);
        addGlitchBlock(360, 380 - sub * 3, 100, 25, 1.4 - sub * 0.05);
        if (sub % 3 === 0) addTrampoline(480, 372 - sub * 3);
        addGlitchBlock(520, 340 - sub * 3, 100, 25, 1.6 - sub * 0.05);
        addPlat(680, 300 - sub * 2, 360, 240);
        for (var sx = 150; sx < 670; sx += 35) addSpike(sx, 520);
        this.exitGate = this.createExitDoor(880, 275 - sub * 2);
      }
    }
  }
}

// ─── 10. Phaser Game Configuration & Dynamic Scale Engine ────
var config = {
  type: Phaser.AUTO,
  parent: "game-container",
  width: 960,
  height: 540,
  banner: false,
  render: {
    pixelArt: true,
    antialias: false,
    roundPixels: true,
    powerPreference: "default"
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
  scene: [BootScene, IntroScene, WorldSelectScene, GameScene]
};

// Dynamic Viewport & Orientation Listener
window.addEventListener("resize", function() {
  if (window.game && window.game.scale) {
    window.game.scale.refresh();
  }
  var isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 1024);
  var gamepad = document.getElementById("mobile-gamepad");
  if (gamepad && window.game && window.game.scene.isActive("GameScene")) {
    if (isTouch) {
      gamepad.style.display = "flex";
      gamepad.classList.remove("hidden");
    } else {
      gamepad.style.display = "none";
      gamepad.classList.add("hidden");
    }
  }
});

window.addEventListener("orientationchange", function() {
  setTimeout(function() {
    if (window.game && window.game.scale) {
      window.game.scale.refresh();
    }
  }, 150);
});

// Fast Direct Boot with WebGL-to-Canvas Auto-Failover
function launchOopsGame() {
  if (typeof Phaser === "undefined") {
    setTimeout(launchOopsGame, 30);
    return;
  }
  var container = document.getElementById("game-container");
  if (!container) {
    setTimeout(launchOopsGame, 30);
    return;
  }
  if (!window.game) {
    try {
      window.game = new Phaser.Game(config);
    } catch (err) {
      console.warn("Retrying with Canvas 2D renderer:", err);
      try {
        config.type = Phaser.CANVAS;
        window.game = new Phaser.Game(config);
      } catch (canvasErr) {
        console.error("Fatal game boot error:", canvasErr);
      }
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", launchOopsGame);
} else {
  launchOopsGame();
}
