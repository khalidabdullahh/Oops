import os

with open("/Users/khalidabdullah/AntiGravity/Oops!/scripts/build_fair_playable_multiverse.py", "w") as f:
    f.write('''// ═══════════════════════════════════════════════════════════════
//  Oops! – Multiverse Platformer Edition (v6.0.0 Master Engine)
//  5 Worlds x 30 Handcrafted Unique Levels (150 Total Levels)
//  Comedic 7-Second Intro, True Dual-Orientation (Portrait/Landscape),
//  and Complete Troll Puzzle Variety
// ═══════════════════════════════════════════════════════════════

"use strict";

// ─── 0. Safe Storage & Utility Wrappers ──────────────────────
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

// ─── 1. Save Manager ─────────────────────────────────────────
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
''')
print("Base generator template initialized.")
