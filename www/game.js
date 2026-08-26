// ═══════════════════════════════════════════════════════════════
//  Oops! – Version v1.02 (2.5D Stylized Edition)
//  World 1: 30 100% Unique Handcrafted Levels (Zero Repetition)
//  2.5D Parallax Background, Platform Depth, Rewarded Ads System
//  and Complete Troll Puzzle Variety
// ═══════════════════════════════════════════════════════════════
var GAME_VERSION = "1.02";

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
    if (!theme) return;
    var hexBg = (typeof theme.bg === "number")
      ? "#" + theme.bg.toString(16).padStart(6, "0")
      : (theme.bg || "#8a2c14");

    document.documentElement.style.setProperty("--world-bg", hexBg);
    document.documentElement.style.backgroundColor = hexBg;
    document.body.style.backgroundColor = hexBg;
    document.body.style.background = hexBg;

    var gc = document.getElementById("game-container");
    if (gc) {
      gc.style.backgroundColor = hexBg;
      gc.style.background = hexBg;
    }

    var metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute("content", hexBg);

    var canvas = document.querySelector("canvas");
    if (canvas) {
      var isPortrait = window.innerHeight > window.innerWidth;
      if (isPortrait) {
        var accentHex = "#" + (theme.accent || 0xffd32a).toString(16).padStart(6, "0");
        canvas.style.border = "2px solid rgba(255, 255, 255, 0.22)";
        canvas.style.boxShadow = "0 8px 30px rgba(0, 0, 0, 0.8), 0 0 20px " + accentHex + "40";
        canvas.style.borderRadius = "8px";
      } else {
        canvas.style.border = "none";
        canvas.style.boxShadow = "none";
        canvas.style.borderRadius = "0px";
      }
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
var SAVE_KEY = "oops_world1_master_v1";

var SaveManager = {
  getInitialState: function() {
    return {
      worlds: {
        0: { maxUnlocked: 0, cleared: [] }
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
    var deckBtnRestart = document.getElementById("deck-btn-restart");
    var deckBtnMap = document.getElementById("deck-btn-map");

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
    bindButton(deckBtnRestart, function(s) { s.touchRestart = true; }, function(s) { s.touchRestart = false; });

    if (deckBtnMap) {
      deckBtnMap.addEventListener("click", function(e) {
        if (e.cancelable) e.preventDefault();
        if (self.activeScene) {
          AudioEngine.init();
          AudioEngine.stopMusic();
          self.hide();
          self.activeScene.scene.start("WorldSelectScene");
        }
      });
      deckBtnMap.addEventListener("touchstart", function(e) {
        if (e.cancelable) e.preventDefault();
        if (self.activeScene) {
          AudioEngine.init();
          AudioEngine.stopMusic();
          self.hide();
          self.activeScene.scene.start("WorldSelectScene");
        }
      }, { passive: false });
    }

    // Touch sliding support on directional cluster
    var leftCluster = document.querySelector(".touch-cluster-left");
    if (leftCluster) {
      var handleClusterMove = function(e) {
        if (!self.activeScene) return;
        var touch = e.touches ? e.touches[0] : e;
        if (!touch) return;
        var rectL = btnLeft ? btnLeft.getBoundingClientRect() : null;
        var rectR = btnRight ? btnRight.getBoundingClientRect() : null;
        var tx = touch.clientX, ty = touch.clientY;

        if (rectL && tx >= rectL.left && tx <= rectL.right && ty >= rectL.top && ty <= rectL.bottom) {
          self.activeScene.touchLeft = true;
          self.activeScene.touchRight = false;
          btnLeft.classList.add("pressed");
          if (btnRight) btnRight.classList.remove("pressed");
        } else if (rectR && tx >= rectR.left && tx <= rectR.right && ty >= rectR.top && ty <= rectR.bottom) {
          self.activeScene.touchRight = true;
          self.activeScene.touchLeft = false;
          btnRight.classList.add("pressed");
          if (btnLeft) btnLeft.classList.remove("pressed");
        }
      };

      leftCluster.addEventListener("touchmove", handleClusterMove, { passive: true });
    }
  },

  show: function(scene) {
    this.init();
    this.activeScene = scene;
    var gamepad = document.getElementById("mobile-gamepad");
    if (!gamepad) return;

    var isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 1024);
    if (isTouch) {
      document.body.classList.add("gamepad-visible");
      document.body.classList.remove("gamepad-hidden");
      gamepad.classList.remove("hidden");
    } else {
      document.body.classList.remove("gamepad-visible");
      document.body.classList.add("gamepad-hidden");
      gamepad.classList.add("hidden");
    }

    var deckInfo = document.getElementById("deck-level-info");
    if (deckInfo && scene) {
      deckInfo.textContent = "WORLD 1 · LV " + (scene.currentLevel + 1) + "  💀 " + (scene.levelDeaths || 0);
    }

    if (window.game && window.game.scale) {
      setTimeout(function() { window.game.scale.refresh(); }, 50);
    }
  },

  hide: function() {
    this.activeScene = null;
    document.body.classList.remove("gamepad-visible");
    document.body.classList.add("gamepad-hidden");
    var gamepad = document.getElementById("mobile-gamepad");
    if (gamepad) {
      gamepad.classList.add("hidden");
    }
    if (window.game && window.game.scale) {
      setTimeout(function() { window.game.scale.refresh(); }, 50);
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
      var gScene = window.game.scene.getScene("GameScene");
      if (gScene && window.game.scene.isActive("GameScene")) {
        levelNum = gScene.currentLevel + 1;
        deathsCount = gScene.deaths;
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

// ─── 4.5. Modular Monetization & Rewarded Ads Manager ────────
var MONETIZATION_CONFIG = {
  enabled: true,
  testMode: true,          // Set to false when production Google AdSense / H5 Ads is approved
  publisherId: "ca-pub-0000000000000000",
  deathsThreshold: 7       // Trigger popup offer on 7th death of current level
};

var MonetizationManager = {
  initialized: false,
  activeScene: null,
  isAdPlaying: false,
  countdownInterval: null,
  currentCallbacks: null,

  init: function() {
    var self = this;
    if (this.initialized) return;
    this.initialized = true;

    // Bind Offer Modal buttons
    var btnWatch = document.getElementById("btn-ad-watch");
    var btnDecline = document.getElementById("btn-ad-decline");
    var deckBtnSkip = document.getElementById("deck-btn-skip");

    if (btnWatch) {
      btnWatch.addEventListener("click", function(e) {
        if (e.cancelable) e.preventDefault();
        self.closeOfferModal();
        self.triggerRewardedFlow();
      });
    }

    if (btnDecline) {
      btnDecline.addEventListener("click", function(e) {
        if (e.cancelable) e.preventDefault();
        self.declineOffer();
      });
    }

    if (deckBtnSkip) {
      deckBtnSkip.addEventListener("click", function(e) {
        if (e.cancelable) e.preventDefault();
        self.triggerRewardedFlow();
      });
      deckBtnSkip.addEventListener("touchstart", function(e) {
        if (e.cancelable) e.preventDefault();
        self.triggerRewardedFlow();
      }, { passive: false });
    }

    // Bind Simulated Ad Modal buttons (Test Mode)
    var btnSimComplete = document.getElementById("btn-sim-complete");
    var btnSimCancel = document.getElementById("btn-sim-cancel");

    if (btnSimComplete) {
      btnSimComplete.addEventListener("click", function(e) {
        if (e.cancelable) e.preventDefault();
        self.finishSimulatedAd(true);
      });
    }
    if (btnSimCancel) {
      btnSimCancel.addEventListener("click", function(e) {
        if (e.cancelable) e.preventDefault();
        self.finishSimulatedAd(false);
      });
    }
  },

  setActiveScene: function(scene) {
    this.activeScene = scene;
  },

  // Analytics event dispatcher hook
  logEvent: function(eventName, params) {
    try {
      console.log("[Monetization Event]", eventName, params || {});
      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", eventName, params);
      }
    } catch(e) {}
  },

  // Called on 7th death on the same level
  onDeathThresholdReached: function(scene) {
    if (!MONETIZATION_CONFIG.enabled) return;
    this.activeScene = scene;
    this.logEvent("rewarded_offer_unlocked", { level: scene.currentLevel + 1, deaths: scene.levelDeaths });
    this.showOfferModal();
  },

  showOfferModal: function() {
    this.init();
    var modal = document.getElementById("rewarded-ad-offer-modal");
    if (modal) {
      modal.classList.remove("hidden");
      modal.style.display = "flex";
    }
  },

  closeOfferModal: function() {
    var modal = document.getElementById("rewarded-ad-offer-modal");
    if (modal) {
      modal.classList.add("hidden");
      modal.style.display = "none";
    }
  },

  declineOffer: function() {
    this.closeOfferModal();
    if (this.activeScene) {
      this.logEvent("rewarded_offer_declined", { level: this.activeScene.currentLevel + 1 });
      this.updateSkipButtonVisibility(true);
      this.activeScene.showTrollToast("No worries! 'Skip Level' unlocked if you change your mind.");
      this.activeScene.restartLevel();
    }
  },

  updateSkipButtonVisibility: function(visible) {
    var deckBtnSkip = document.getElementById("deck-btn-skip");
    if (deckBtnSkip) {
      if (visible) {
        deckBtnSkip.classList.remove("hidden");
        deckBtnSkip.style.display = "inline-flex";
      } else {
        deckBtnSkip.classList.add("hidden");
        deckBtnSkip.style.display = "none";
      }
    }

    if (this.activeScene && this.activeScene.hudSkipBtn) {
      this.activeScene.hudSkipBtn.setVisible(visible);
    }
  },

  triggerRewardedFlow: function() {
    var self = this;
    if (!this.activeScene || this.isAdPlaying) return;
    this.isAdPlaying = true;
    this.logEvent("rewarded_ad_requested", { level: this.activeScene.currentLevel + 1 });

    AudioEngine.stopMusic();

    this.showRewardedAd({
      onRewardEarned: function() {
        self.isAdPlaying = false;
        self.logEvent("rewarded_ad_completed", { level: self.activeScene.currentLevel + 1 });
        self.logEvent("level_skipped_by_rewarded_ad", { level: self.activeScene.currentLevel + 1 });
        
        self.updateSkipButtonVisibility(false);
        if (self.activeScene && typeof self.activeScene.skipCurrentLevel === "function") {
          self.activeScene.skipCurrentLevel();
        }
      },
      onAdDismissed: function() {
        self.isAdPlaying = false;
        self.logEvent("rewarded_ad_dismissed", { level: self.activeScene ? self.activeScene.currentLevel + 1 : 0 });
        AudioEngine.startMusic();
        if (self.activeScene) {
          self.activeScene.showTrollToast("Ad closed without completion. Level not skipped.");
        }
      },
      onAdFailed: function(err) {
        self.isAdPlaying = false;
        self.logEvent("rewarded_ad_failed", { level: self.activeScene ? self.activeScene.currentLevel + 1 : 0, error: err });
        AudioEngine.startMusic();
        if (self.activeScene) {
          self.activeScene.showTrollToast("Ad unavailable. Please try again.");
        }
      }
    });
  },

  // Abstract platform-aware Rewarded Ad Provider
  showRewardedAd: function(callbacks) {
    if (MONETIZATION_CONFIG.testMode || !window.adsbygoogle) {
      // 🧪 TEST MODE / SIMULATOR
      this.playSimulatedRewardedAd(callbacks);
      return;
    }

    // 🌐 WEB: Official Google H5 Games Ad Placement API
    try {
      if (typeof window.adBreak === "function") {
        window.adBreak({
          type: "reward",
          name: "skip_level_reward",
          beforeReward: function(showAdFn) {
            showAdFn();
          },
          adDismissed: function() {
            callbacks.onAdDismissed();
          },
          adViewed: function() {
            callbacks.onRewardEarned();
          },
          adBreakDone: function(placementInfo) {
            if (placementInfo && placementInfo.breakStatus === "notViewed") {
              callbacks.onAdFailed("Not viewed");
            }
          }
        });
      } else {
        this.playSimulatedRewardedAd(callbacks);
      }
    } catch(err) {
      callbacks.onAdFailed(err ? err.message : "Error loading ad");
    }
  },

  // 🧪 Simulated Rewarded Ad Player for Development & Testing
  playSimulatedRewardedAd: function(callbacks) {
    var self = this;
    this.currentCallbacks = callbacks;

    var modal = document.getElementById("simulated-ad-player-modal");
    var timerEl = document.getElementById("sim-ad-countdown");
    if (!modal) {
      setTimeout(function() { callbacks.onRewardEarned(); }, 500);
      return;
    }

    modal.classList.remove("hidden");
    modal.style.display = "flex";

    var timeLeft = 3;
    if (timerEl) timerEl.textContent = "Reward in: " + timeLeft + "s";

    if (this.countdownInterval) clearInterval(this.countdownInterval);
    this.countdownInterval = setInterval(function() {
      timeLeft--;
      if (timerEl) timerEl.textContent = "Reward in: " + timeLeft + "s";
      if (timeLeft <= 0) {
        clearInterval(self.countdownInterval);
        self.countdownInterval = null;
        self.finishSimulatedAd(true);
      }
    }, 1000);
  },

  finishSimulatedAd: function(isSuccess) {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }

    var modal = document.getElementById("simulated-ad-player-modal");
    if (modal) {
      modal.classList.add("hidden");
      modal.style.display = "none";
    }

    var cb = this.currentCallbacks;
    this.currentCallbacks = null;

    if (cb) {
      if (isSuccess) {
        cb.onRewardEarned();
      } else {
        cb.onAdDismissed();
      }
    }
  }
};

// ─── 5. World 1 Configuration (Desert Ruins) ─────────────────
var WORLD_1_THEME = {
  id: 0,
  name: "DESERT RUINS",
  badge: "WORLD 1",
  subtitle: "30 Handcrafted Levels of Sand Crumble, Pop-up Spikes & Fleeing Gates",
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
};

function getTheme(wIdx) {
  return WORLD_1_THEME;
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
      MonetizationManager.init();
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
    // ── 🧱 2.5D PLATFORM TILE WITH 3D TOP HIGHLIGHT & FRONT BEVEL ──
    var platGfx = this.make.graphics({ x: 0, y: 0, add: false });
    platGfx.fillStyle(0xffffff, 1);
    platGfx.fillRect(0, 0, 32, 32);
    // Subtle horizontal strata line
    platGfx.fillStyle(0x000000, 0.08);
    platGfx.fillRect(0, 10, 32, 3);
    platGfx.fillRect(0, 22, 32, 2);
    // 3D Top Sunlit Rim (Light Highlight)
    platGfx.fillStyle(0xffffff, 0.45);
    platGfx.fillRect(0, 0, 32, 3);
    // 3D Bottom Front Bevel (Depth Extrusion)
    platGfx.fillStyle(0x000000, 0.28);
    platGfx.fillRect(0, 27, 32, 5);
    platGfx.generateTexture("plat_tex", 32, 32);
    platGfx.destroy();

    // ── 🔺 3D FACETED DANGER SPIKE WITH METALLIC RIDGE ──
    var spkGfx = this.make.graphics({ x: 0, y: 0, add: false });
    // Left facet (illuminated side)
    spkGfx.fillStyle(0xff4757, 1);
    spkGfx.beginPath();
    spkGfx.moveTo(0, 20);
    spkGfx.lineTo(10, 0);
    spkGfx.lineTo(10, 20);
    spkGfx.closePath();
    spkGfx.fill();
    // Right facet (shadowed side)
    spkGfx.fillStyle(0x9c1000, 1);
    spkGfx.beginPath();
    spkGfx.moveTo(10, 0);
    spkGfx.lineTo(20, 20);
    spkGfx.lineTo(10, 20);
    spkGfx.closePath();
    spkGfx.fill();
    // Ridge highlight
    spkGfx.lineStyle(1, 0xffd32a, 0.9);
    spkGfx.lineBetween(10, 0, 10, 20);
    // Tip glint
    spkGfx.fillStyle(0xffffff, 1);
    spkGfx.fillCircle(10, 1.5, 1.5);
    spkGfx.generateTexture("spike_up", 20, 20);
    spkGfx.destroy();

    // ── 🔨 2.5D CRUSHER WITH RIVETED STEEL & GLOWING EYES ──
    var crushGfx = this.make.graphics({ x: 0, y: 0, add: false });
    crushGfx.fillStyle(0x2f3542, 1);
    crushGfx.fillRoundedRect(0, 0, 60, 60, 6);
    crushGfx.fillStyle(0x747d8c, 1);
    crushGfx.fillRect(2, 2, 56, 4);
    crushGfx.fillStyle(0x1e272e, 1);
    crushGfx.fillRect(6, 8, 48, 44);
    // Glowing red menacing eye slits
    crushGfx.fillStyle(0xff4757, 1);
    crushGfx.fillTriangle(14, 20, 26, 26, 14, 32);
    crushGfx.fillTriangle(46, 20, 34, 26, 46, 32);
    // Heavy bottom teeth
    crushGfx.fillStyle(0xd63031, 1);
    crushGfx.fillTriangle(0, 60, 10, 74, 20, 60);
    crushGfx.fillTriangle(20, 60, 30, 74, 40, 60);
    crushGfx.fillTriangle(40, 60, 50, 74, 60, 60);
    crushGfx.generateTexture("crusher_tex", 60, 74);
    crushGfx.destroy();

    // ── 🚪 3-PART 2.5D PORTAL DOORWAY ASSETS ──
    var dIntGfx = this.make.graphics({ x: 0, y: 0, add: false });
    dIntGfx.fillStyle(0x0a0b12, 1);
    dIntGfx.fillRoundedRect(4, 6, 28, 44, 8);
    dIntGfx.fillStyle(0xffd32a, 0.4);
    dIntGfx.fillCircle(18, 22, 12);
    dIntGfx.fillStyle(0x2ed573, 0.4);
    dIntGfx.fillCircle(18, 22, 6);
    dIntGfx.generateTexture("door_interior_tex", 36, 52);
    dIntGfx.destroy();

    var dPanGfx = this.make.graphics({ x: 0, y: 0, add: false });
    dPanGfx.fillStyle(0xffffff, 1);
    dPanGfx.fillRoundedRect(0, 0, 26, 44, 4);
    dPanGfx.fillStyle(0x1e272e, 1);
    dPanGfx.fillRect(2, 2, 22, 40);
    dPanGfx.fillStyle(0xffd32a, 1);
    dPanGfx.fillCircle(20, 23, 2.5); // Golden knob
    dPanGfx.generateTexture("door_panel_tex", 26, 44);
    dPanGfx.destroy();

    var dFrmGfx = this.make.graphics({ x: 0, y: 0, add: false });
    dFrmGfx.lineStyle(4, 0xffffff, 1);
    dFrmGfx.strokeRoundedRect(2, 4, 32, 48, 8);
    dFrmGfx.fillStyle(0xffd32a, 1);
    dFrmGfx.fillRect(0, 50, 36, 4);
    dFrmGfx.generateTexture("door_frame_tex", 36, 54);
    dFrmGfx.destroy();

    // ── 🌀 2.5D SPRING TRAMPOLINE ──
    var trampGfx = this.make.graphics({ x: 0, y: 0, add: false });
    trampGfx.fillStyle(0x747d8c, 1);
    trampGfx.fillRect(6, 10, 4, 6);
    trampGfx.fillRect(22, 10, 4, 6);
    trampGfx.fillStyle(0x2f3542, 1);
    trampGfx.fillRoundedRect(2, 12, 28, 4, 2);
    trampGfx.fillStyle(0x2ed573, 1);
    trampGfx.fillRoundedRect(0, 2, 32, 9, 3);
    trampGfx.fillStyle(0xffffff, 0.7);
    trampGfx.fillRect(4, 3, 24, 2);
    trampGfx.generateTexture("tramp_tex", 32, 16);
    trampGfx.destroy();

    // ── 💨 SOFT DUST CLOUD PARTICLE ──
    var dustGfx = this.make.graphics({ x: 0, y: 0, add: false });
    dustGfx.fillStyle(0xf5cd79, 0.75);
    dustGfx.fillCircle(6, 6, 6);
    dustGfx.fillStyle(0xffffff, 0.6);
    dustGfx.fillCircle(5, 5, 3);
    dustGfx.generateTexture("dust_puff", 12, 12);
    dustGfx.destroy();

    // ── 👻 CARTOON HERO SOUL GHOST ──
    var soulGfx = this.make.graphics({ x: 0, y: 0, add: false });
    soulGfx.fillStyle(0xffffff, 0.88);
    soulGfx.fillCircle(14, 14, 10);
    soulGfx.fillTriangle(4, 18, 14, 28, 24, 18);
    soulGfx.lineStyle(2, 0xffd32a, 1);
    soulGfx.strokeEllipse(14, 2, 8, 3);
    soulGfx.lineStyle(1.5, 0x2d3436, 1);
    soulGfx.lineBetween(9, 11, 13, 15);
    soulGfx.lineBetween(13, 11, 9, 15);
    soulGfx.lineBetween(15, 11, 19, 15);
    soulGfx.lineBetween(19, 11, 15, 15);
    soulGfx.generateTexture("hero_soul", 28, 30);
    soulGfx.destroy();

    // ── ✨ SPARKS & DOTS ──
    var dotGfx = this.make.graphics({ x: 0, y: 0, add: false });
    dotGfx.fillStyle(0xffffff, 1);
    dotGfx.fillCircle(4, 4, 4);
    dotGfx.generateTexture("part_dot", 8, 8);
    dotGfx.destroy();
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

    var bg = this.add.graphics();
    bg.fillStyle(0x140602, 1);
    bg.fillRect(0, 0, width, height);

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

    var floor = this.add.tileSprite(width / 2, 450, width + 100, 80, "plat_tex");
    floor.setTint(0xe5825b);

    var door = this.add.container(720, 390);
    var dInt = this.add.image(0, 0, "door_interior_tex");
    var dPan = this.add.image(-13, 2, "door_panel_tex").setOrigin(0, 0.5).setTint(0x9c4118);
    var dFrm = this.add.image(0, 0, "door_frame_tex");
    door.add([dInt, dPan, dFrm]);

    var hero = this.add.sprite(180, 390, "hero_idle_1");
    hero.anims.play("hero_anim_run");

    var caption = this.add.text(width / 2, 50, "JUST REACH THE EXIT... RIGHT? 😉", {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "14px",
      color: "#ffd32a",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5);

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

    this.tweens.add({
      targets: hero,
      x: 440,
      duration: 2000,
      ease: "Linear",
      onComplete: function() {
        caption.setText("OOPS! FLOOR WAS A TRAP! 😈");
        caption.setColor("#ff4757");

        AudioEngine.sfxTrap();
        hero.anims.stop();
        hero.setTexture("hero_fall");

        var fakeHole = self.add.rectangle(440, 450, 90, 80, 0x140602);
        self.cameras.main.shake(200, 0.025);

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

            self.time.delayedCall(1100, function() {
              oopsText.destroy();
              hammer.destroy();
              fakeHole.destroy();

              caption.setText("NEVER TRUST ANYTHING! 🤣");
              caption.setColor("#2ed573");

              hero.x = 220;
              hero.y = 390;
              hero.setTexture("hero_idle_1");
              hero.anims.play("hero_anim_run");
              AudioEngine.sfxPortal();

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
                      AudioEngine.sfxTrap();
                      self.tweens.add({
                        targets: door,
                        x: 820,
                        y: 320,
                        duration: 350,
                        ease: "Back.easeOut",
                        onComplete: function() {
                          AudioEngine.sfxWin();
                          dPan.scaleX = 0.08;
                          hero.x = door.x;
                          hero.y = door.y + 4;
                          hero.setDepth(dFrm.depth - 1);
                          hero.alpha = 0;

                          caption.destroy();
                          var titleCard = self.add.container(width / 2, height / 2 - 20);

                          var tMain = self.add.text(0, -30, "Oops!", {
                            fontFamily: "'Press Start 2P', monospace",
                            fontSize: "44px",
                            color: "#ffd32a",
                            stroke: "#000000",
                            strokeThickness: 8
                          }).setOrigin(0.5);

                          var tSub = self.add.text(0, 25, "DESERT RUINS EDITION", {
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

// ─── 8. WorldSelectScene: World 1 30 Handcrafted Levels ────────
class WorldSelectScene extends Phaser.Scene {
  constructor() {
    super("WorldSelectScene");
    this.currentWorldIdx = 0;
    this.pageIdx = 0;
  }

  create() {
    var self = this;
    var size = this.scale;
    var width = size.width;
    var height = size.height;

    AudioEngine.init();
    MobileGamepad.hide();
    removeLoaderSplash();

    var theme = WORLD_1_THEME;
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
    var theme = WORLD_1_THEME;

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
      tint: 0xffa502,
      frequency: 200
    });
  }

  renderWorldIsland() {
    var self = this;
    this.islandContainer.removeAll(true);
    var size = this.scale;
    var width = size.width;
    var height = size.height;

    var theme = WORLD_1_THEME;
    var maxUnlocked = SaveManager.getWorldUnlocked(0);

    var titleText = this.add.text(width / 2, 34, "Oops! - WORLD 1: DESERT RUINS", {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "16px",
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

    var worldBadge = this.add.text(islandX, islandY - islandH / 2 + 28, "WORLD 1: DESERT RUINS (30 UNIQUE LEVELS)", {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "13px",
      color: "#ffd32a",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5);
    this.islandContainer.add(worldBadge);

    var subText = this.add.text(islandX, islandY - islandH / 2 + 48, "✦ ALL 30 LEVELS ARE INDIVIDUALLY HANDCRAFTED (NO REPEATS) ✦", {
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

          var isCleared = SaveManager.isLevelCleared(0, lvlIdx);
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
              self.scene.start("GameScene", { world: 0, level: lvlIdx, deaths: SaveManager.getTotalDeaths() });
            });
            nodeContainer.add(hitZone);
          }

          self.islandContainer.add(nodeContainer);
        })(r, c);
      }
    }

    var playBtn = this.add.container(islandX, islandY + islandH / 2 - 32);
    var plGfx = this.add.graphics();
    plGfx.fillStyle(0x2ed573, 1);
    plGfx.fillRoundedRect(-140, -16, 280, 32, 8);
    plGfx.lineStyle(2, 0xffffff, 1);
    plGfx.strokeRoundedRect(-140, -16, 280, 32, 8);

    var plLabel = this.add.text(0, 0, "▶ PLAY LEVEL " + (maxUnlocked + 1), {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "9.5px",
      color: "#ffffff"
    }).setOrigin(0.5);

    var plZone = this.add.zone(0, 0, 280, 32).setInteractive({ cursor: "pointer" });
    plZone.on("pointerdown", function() {
      AudioEngine.init();
      AudioEngine.sfxJump();
      self.scene.start("GameScene", { world: 0, level: maxUnlocked, deaths: SaveManager.getTotalDeaths() });
    });
    playBtn.add([plGfx, plLabel, plZone]);
    this.islandContainer.add(playBtn);
  }
}

// ─── 9. GameScene: Core Platformer & 30 Unique Handcrafted Levels ──
class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  init(data) {
    this.currentWorld = 0;
    this.currentLevel = (typeof data.level === "number") ? data.level : 0;
    this.deaths = (typeof data.deaths === "number") ? data.deaths : SaveManager.getTotalDeaths();
    this.levelDeaths = (typeof data.levelDeaths === "number") ? data.levelDeaths : 0;
    this.skipOfferUnlocked = (typeof data.skipOfferUnlocked === "boolean") ? data.skipOfferUnlocked : false;
    this.skipOfferUsed = false;
    this.levelTime = 0;
    this.isDead = false;
    this.isComplete = false;
    this.gravityDir = 1;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.touchLeft = false;
    this.touchRight = false;
    this.touchJump = false;
    this.touchRestart = false;
  }

  create() {
    var self = this;
    var size = this.scale;
    var width = size.width;
    var height = size.height;

    var theme = WORLD_1_THEME;
    syncBodyBackground(theme);

    AudioEngine.init();
    AudioEngine.startMusic();
    MobileGamepad.show(this);
    MonetizationManager.setActiveScene(this);

    // ── 🏜️ 2.5D MULTI-LAYER PARALLAX DESERT ATMOSPHERE ──
    this.draw2DParallaxBackground();

    this.platforms = this.physics.add.staticGroup();
    this.spikes = this.physics.add.staticGroup();
    this.crushers = this.physics.add.group();
    this.trampolines = this.physics.add.staticGroup();
    this.fallingPlatforms = [];
    this.customTriggers = [];

    this.buildWorld1Level(this.currentLevel);

    this.player = this.physics.add.sprite(this.spawnX, this.spawnY, "hero_idle_1");
    this.player.setCollideWorldBounds(false);
    this.player.body.setSize(22, 34);
    this.player.body.setOffset(5, 4);
    this.player.body.setGravityY(1400);
    this.player.setDepth(100);
    this.player.setScale(1, 1);
    this.player.anims.play("hero_anim_idle");

    this.physics.add.collider(this.player, this.platforms, this.onPlatformCollide, null, this);
    this.physics.add.collider(this.player, this.trampolines, this.onTrampolineCollide, null, this);
    this.physics.add.overlap(this.player, this.spikes, this.onPlayerDie, null, this);
    this.physics.add.overlap(this.player, this.crushers, this.onPlayerDie, null, this);

    if (this.exitGate) {
      this.physics.add.overlap(this.player, this.exitGate, this.onReachExit, null, this);
    }

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    this.createHUD();
    this.showLevelBanner();
    MonetizationManager.updateSkipButtonVisibility(this.skipOfferUnlocked && !this.skipOfferUsed);

    var deckInfo = document.getElementById("deck-level-info");
    if (deckInfo) {
      deckInfo.textContent = "WORLD 1 · LV " + (this.currentLevel + 1) + "  💀 " + this.levelDeaths;
    }
  }

  draw2DParallaxBackground() {
    var size = this.scale;
    var width = size.width;
    var height = size.height;

    // Layer 0: Warm Desert Sky Gradient
    this.skyGfx = this.add.graphics().setDepth(-20);
    this.skyGfx.fillGradientStyle(0x5c1808, 0x5c1808, 0x8a2c14, 0x8a2c14, 1);
    this.skyGfx.fillRect(0, 0, width, height);

    // Warm Mystic Sun / Oasis Moon Glow
    var sunGlow = this.add.graphics().setDepth(-19);
    sunGlow.fillStyle(0xffa502, 0.18);
    sunGlow.fillCircle(width * 0.74, height * 0.26, 85);
    sunGlow.fillStyle(0xffd32a, 0.35);
    sunGlow.fillCircle(width * 0.74, height * 0.26, 45);
    sunGlow.fillStyle(0xffffff, 0.8);
    sunGlow.fillCircle(width * 0.74, height * 0.26, 20);

    // Layer 1: Far Parallax Dunes & Ancient Pyramids (Slow scroll)
    this.farParallaxGfx = this.add.graphics().setDepth(-18);
    this.drawFarDunes(this.farParallaxGfx, width, height, 0);

    // Layer 2: Mid Parallax Ancient Ruin Columns (Medium scroll)
    this.midParallaxGfx = this.add.graphics().setDepth(-17);
    this.drawMidRuins(this.midParallaxGfx, width, height, 0);
  }

  drawFarDunes(g, width, height, offsetX) {
    g.clear();
    // Silhouette Pyramids in the far distance
    g.fillStyle(0x601a09, 0.85);
    g.fillTriangle(width * 0.16 + offsetX, height * 0.65, width * 0.30 + offsetX, height * 0.34, width * 0.44 + offsetX, height * 0.65);
    g.fillTriangle(width * 0.56 + offsetX, height * 0.68, width * 0.72 + offsetX, height * 0.40, width * 0.88 + offsetX, height * 0.68);
    // Smooth Far Dunes
    g.fillStyle(0x6e200c, 0.9);
    g.beginPath();
    g.moveTo(-40 + offsetX, height * 0.66);
    g.lineTo(width * 0.25 + offsetX, height * 0.58);
    g.lineTo(width * 0.60 + offsetX, height * 0.70);
    g.lineTo(width + 40 + offsetX, height * 0.62);
    g.lineTo(width + 40 + offsetX, height);
    g.lineTo(-40 + offsetX, height);
    g.closePath();
    g.fillPath();
  }

  drawMidRuins(g, width, height, offsetX) {
    g.clear();
    // Ancient Sandstone Columns
    g.fillStyle(0x7e250e, 0.8);
    var colX = [70, 230, 460, 670, 870];
    for (var i = 0; i < colX.length; i++) {
      var cx = colX[i] + offsetX;
      var ch = 110 + (i % 3) * 35;
      g.fillRoundedRect(cx, height * 0.75 - ch, 24, ch, 4);
      g.fillStyle(0x8a2c14, 0.95);
      g.fillRoundedRect(cx - 3, height * 0.75 - ch, 30, 7, 2);
      g.fillStyle(0x7e250e, 0.8);
    }
  }

  showLevelBanner() {
    var size = this.scale;
    var banner = this.add.text(size.width / 2, 60, "WORLD 1 : LEVEL " + (this.currentLevel + 1), {
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

    this.levelText = this.add.text(25, 20, "WORLD 1 · LV " + (this.currentLevel + 1), {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "10px",
      color: "#ffffff"
    }).setDepth(200);

    // Clean Level Death Display
    this.deathText = this.add.text(width - 120, 20, "💀 " + this.levelDeaths, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "10px",
      color: "#ff4757"
    }).setDepth(200);

    // In-game HUD Skip Button (Unlocked after 7 deaths)
    this.hudSkipBtn = this.add.container(width - 220, 20);
    var skGfx = this.add.graphics();
    skGfx.fillStyle(0x161822, 0.9);
    skGfx.fillRoundedRect(-38, -12, 76, 24, 6);
    skGfx.lineStyle(1.5, 0xffd32a, 0.9);
    skGfx.strokeRoundedRect(-38, -12, 76, 24, 6);
    var skTxt = this.add.text(0, 0, "📺 SKIP", {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "7px",
      color: "#ffd32a"
    }).setOrigin(0.5);
    var skZone = this.add.zone(0, 0, 76, 24).setInteractive({ cursor: "pointer" });
    skZone.on("pointerdown", function() {
      MonetizationManager.triggerRewardedFlow();
    });
    this.hudSkipBtn.add([skGfx, skTxt, skZone]);
    this.hudSkipBtn.setDepth(200);
    this.hudSkipBtn.setVisible(this.skipOfferUnlocked && !this.skipOfferUsed);

    var fsBtn = this.add.text(width - 55, 20, "⛶", {
      fontSize: "17px"
    }).setOrigin(0.5).setDepth(200).setInteractive({ cursor: "pointer" });
    fsBtn.on("pointerdown", function() {
      toggleFullScreen();
    });

    var mapBtn = this.add.text(width - 22, 20, "🗺️", {
      fontSize: "18px"
    }).setOrigin(0.5).setDepth(200).setInteractive({ cursor: "pointer" });

    mapBtn.on("pointerdown", function() {
      AudioEngine.stopMusic();
      MobileGamepad.hide();
      self.scene.start("WorldSelectScene");
    });
  }

  update(time, delta) {
    if (this.isDead || this.isComplete) return;
    var dt = delta / 1000;
    this.levelTime += dt;
    var size = this.scale;
    var width = size.width;
    var height = size.height;

    // ── 🏜️ 2.5D PARALLAX SCROLLING DEPTH ──
    if (this.farParallaxGfx && this.midParallaxGfx && this.player) {
      var pRatio = (this.player.x - width / 2) / width;
      this.drawFarDunes(this.farParallaxGfx, width, height, -pRatio * 20);
      this.drawMidRuins(this.midParallaxGfx, width, height, -pRatio * 50);
    }

    // ── 🛡️ BOUNDARIES ──
    if (this.player.x < 18) {
      this.player.x = 18;
      if (this.player.body.velocity.x < 0) this.player.setVelocityX(0);
    }

    if (this.exitGate) {
      var maxGateX = this.exitGate.x + 14;
      if (this.player.x > maxGateX) {
        this.player.x = maxGateX;
        if (this.player.body.velocity.x > 0) this.player.setVelocityX(0);
      }

      if (this.exitGate.fleeOnProximity && !this.exitGate.hasFled) {
        var dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.exitGate.x, this.exitGate.y);
        if (dist < 85) {
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

    if (this.player.y > height + 40 || this.player.x > width + 70) {
      this.onPlayerDie();
      return;
    }

    var moveLeft = this.cursors.left.isDown || this.keyA.isDown || this.touchLeft;
    var moveRight = this.cursors.right.isDown || this.keyD.isDown || this.touchRight;

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

    var onFloor = this.player.body.blocked.down;
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
      this.player.setVelocityY(-560);
      this.jumpBufferTimer = 0;
      this.coyoteTimer = 0;
      AudioEngine.sfxJump();
    }

    if (!onFloor) {
      if (this.player.body.velocity.y < 0) {
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

    if (Phaser.Input.Keyboard.JustDown(this.keyR) || this.touchRestart) {
      this.touchRestart = false;
      this.restartLevel();
    }

    this.updateWorldHazards(dt);
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
    player.setVelocityY(-760);
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
    this.levelDeaths++;
    AudioEngine.sfxDie();
    this.cameras.main.shake(280, 0.038);

    SaveManager.saveDeaths(this.deaths);

    if (this.deathText) {
      this.deathText.setText("💀 " + this.levelDeaths);
    }
    var deckInfo = document.getElementById("deck-level-info");
    if (deckInfo) {
      deckInfo.textContent = "WORLD 1 · LV " + (this.currentLevel + 1) + "  💀 " + this.levelDeaths;
    }

    this.player.anims.stop();
    this.player.setTexture("hero_dead");
    this.player.setVelocity(0, -280);

    // ── 👻 COMIC FLOATING HERO SOUL GHOST ──
    var soul = this.add.image(this.player.x, this.player.y - 12, "hero_soul").setDepth(150);
    this.tweens.add({
      targets: soul,
      y: soul.y - 65,
      alpha: 0,
      scaleX: 1.25,
      scaleY: 1.25,
      duration: 520,
      ease: "Quad.easeOut",
      onComplete: function() { soul.destroy(); }
    });

    // ── ✨ COMIC PARTICLES & DEBRIS ──
    this.add.particles(this.player.x, this.player.y, "part_dot", {
      speed: { min: 90, max: 280 },
      scale: { start: 1.25, end: 0 },
      lifespan: 650,
      quantity: 26,
      tint: [0xff4757, 0xffa502, 0xffd32a, 0xffffff]
    });

    // ── 7-Death Threshold Check: Trigger one-time rewarded ad popup offer! ──
    if (this.levelDeaths === MONETIZATION_CONFIG.deathsThreshold && !this.skipOfferUnlocked && !this.skipOfferUsed) {
      this.skipOfferUnlocked = true;
      this.time.delayedCall(450, function() {
        MonetizationManager.onDeathThresholdReached(self);
      });
      return;
    }

    this.time.delayedCall(500, function() {
      self.restartLevel();
    });
  }

  restartLevel() {
    this.scene.restart({
      world: 0,
      level: this.currentLevel,
      deaths: this.deaths,
      levelDeaths: this.levelDeaths,
      skipOfferUnlocked: this.skipOfferUnlocked
    });
  }

  skipCurrentLevel() {
    var self = this;
    this.isDead = false;
    this.isComplete = true;
    this.skipOfferUsed = true;
    this.skipOfferUnlocked = false;
    MonetizationManager.updateSkipButtonVisibility(false);

    this.player.setVelocity(0, 0);
    if (this.player.body) {
      this.player.body.setEnable(false);
      this.player.body.moves = false;
    }

    SaveManager.saveLevelClear(0, this.currentLevel, this.deaths);
    AudioEngine.sfxWin();
    AudioEngine.sfxPortal();

    this.showTrollToast("🎉 LEVEL SKIPPED! 🚀");

    this.add.particles(this.player.x, this.player.y, "part_dot", {
      speed: { min: 90, max: 280 },
      scale: { start: 1.4, end: 0 },
      lifespan: 650,
      quantity: 36,
      tint: [0xffd32a, 0x2ed573, 0x00d2d3, 0xffffff]
    });

    this.time.delayedCall(700, function() {
      var nextLvl = self.currentLevel + 1;
      if (nextLvl >= 30) {
        MobileGamepad.hide();
        self.scene.start("WorldCompleteScene", { world: 0, totalDeaths: self.deaths });
      } else {
        self.scene.restart({
          world: 0,
          level: nextLvl,
          deaths: self.deaths,
          levelDeaths: 0,
          skipOfferUnlocked: false
        });
      }
    });
  }

  onReachExit() {
    var self = this;
    if (this.isComplete || this.isDead) return;
    this.isComplete = true;

    this.player.setVelocity(0, 0);
    if (this.player.body) {
      this.player.body.setEnable(false);
      this.player.body.moves = false;
    }

    SaveManager.saveLevelClear(0, this.currentLevel, this.deaths);

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
                  self.scene.start("WorldCompleteScene", { world: 0, totalDeaths: self.deaths });
                } else {
                  self.scene.restart({
                    world: 0,
                    level: nextLvl,
                    deaths: self.deaths,
                    levelDeaths: 0,
                    skipOfferUnlocked: false
                  });
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
              self.scene.start("WorldCompleteScene", { world: 0, totalDeaths: self.deaths });
            } else {
              self.scene.restart({
                world: 0,
                level: nextLvl,
                deaths: self.deaths,
                levelDeaths: 0,
                skipOfferUnlocked: false
              });
            }
          });
        }
      }
    });
  }

  createExitDoor(x, y) {
    var theme = WORLD_1_THEME;

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

  // ─── 30 INDIVIDUALLY HANDCRAFTED UNIQUE LEVELS FOR WORLD 1 ───
  buildWorld1Level(lvl) {
    var self = this;
    var size = this.scale;
    var width = size.width;
    var height = size.height;
    var theme = WORLD_1_THEME;

    var addPlat = function(x, y, w, h) {
      // Soft Ambient Occlusion Drop Shadow under floating blocks
      if (y < 420) {
        self.add.rectangle(x + w/2, y + h + 3, w - 2, 6, 0x000000, 0.24).setDepth(2);
      }
      var p = self.add.tileSprite(x + w/2, y + h/2, w, h, "plat_tex");
      p.setTint(theme.platform);
      p.setDepth(10);
      self.platforms.add(p);
      return p;
    };

    var addFallingPlat = function(x, y, w, h) {
      if (y < 420) {
        self.add.rectangle(x + w/2, y + h + 3, w - 2, 6, 0x000000, 0.24).setDepth(2);
      }
      var p = self.add.tileSprite(x + w/2, y + h/2, w, h, "plat_tex");
      p.setTint(theme.platform);
      p.setDepth(10);
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
      s.setDepth(15);
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
      c.setDepth(20);
      return c;
    };

    var addTrampoline = function(x, y) {
      var tr = self.trampolines.create(x, y, "tramp_tex");
      tr.setDepth(12);
      tr.body.setSize(32, 12).setOffset(0, 4);
      return tr;
    };

    this.spawnX = 60;
    this.spawnY = 410;

    // LEVEL 1: First Steps & The Hop
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
    }

    // LEVEL 2: The Double Crusher
    else if (lvl === 1) {
      addPlat(-80, 460, width + 150, 80);
      addCrusher(360, 60);
      addCrusher(640, 60);
      this.exitGate = this.createExitDoor(900, 435);
    }

    // LEVEL 3: Crumbling Sandstone
    else if (lvl === 2) {
      addPlat(-80, 460, 260, 80);
      addFallingPlat(220, 460, 100, 25);
      addFallingPlat(380, 460, 100, 25);
      addFallingPlat(540, 460, 100, 25);
      addPlat(700, 460, 340, 80);
      for (var sx = 190; sx <= 690; sx += 40) addSpike(sx, 520);
      this.exitGate = this.createExitDoor(900, 435);
    }

    // LEVEL 4: Spike Ambush
    else if (lvl === 3) {
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
    }

    // LEVEL 5: Trampoline Valley
    else if (lvl === 4) {
      addPlat(-80, 460, 240, 80);
      addTrampoline(130, 452);
      addPlat(270, 390, 120, 25);
      addPlat(450, 360, 120, 25);
      addTrampoline(510, 352);
      addPlat(630, 340, 100, 25);
      addPlat(780, 320, 260, 220);
      for (var sx = 170; sx < 770; sx += 35) addSpike(sx, 520);
      this.exitGate = this.createExitDoor(880, 295);
    }

    // LEVEL 6: The Fake Exit Door Trap
    else if (lvl === 5) {
      addPlat(-80, 460, 420, 80);
      addPlat(560, 460, 480, 80);
      addSpike(460, 450);
      addSpike(520, 450);
      this.add.image(380, 435, "door_interior_tex").setTint(0x888888);
      this.customTriggers.push({
        triggered: false,
        condition: function(sc) { return sc.player.x > 340 && sc.player.x < 420; },
        action: function(sc) {
          AudioEngine.sfxTrap();
          sc.showTrollToast("Fake Door! Real door is high above! 🤣");
          sc.spikes.create(380, 450, "spike_up").setTint(theme.spike);
        }
      });
      addTrampoline(280, 452);
      addPlat(420, 310, 140, 25);
      addPlat(680, 260, 280, 280);
      this.exitGate = this.createExitDoor(820, 235);
    }

    // LEVEL 7: Sinking Sand Staircase
    else if (lvl === 6) {
      addPlat(-80, 460, 200, 80);
      addFallingPlat(180, 430, 90, 24);
      addFallingPlat(310, 390, 90, 24);
      addFallingPlat(440, 350, 90, 24);
      addFallingPlat(570, 310, 90, 24);
      addPlat(700, 270, 340, 270);
      for (var sx = 150; sx < 690; sx += 35) addSpike(sx, 520);
      this.exitGate = this.createExitDoor(860, 245);
    }

    // LEVEL 8: Double Crusher Trampoline Leap
    else if (lvl === 7) {
      addPlat(-80, 460, 260, 80);
      addCrusher(380, 60);
      addTrampoline(220, 452);
      addPlat(460, 380, 120, 25);
      addCrusher(600, 60);
      addPlat(660, 330, 380, 210);
      for (var sx = 270; sx < 650; sx += 35) addSpike(sx, 520);
      this.exitGate = this.createExitDoor(880, 305);
    }

    // LEVEL 9: Pop-up Spike Maze & Fleeing Door
    else if (lvl === 8) {
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
    }

    // LEVEL 10: The Desert Gauntlet (Climax of Tier 1)
    else if (lvl === 9) {
      addPlat(-80, 460, 220, 80);
      addFallingPlat(200, 430, 100, 25);
      addCrusher(340, 60);
      addFallingPlat(350, 380, 100, 25);
      addTrampoline(470, 372);
      addFallingPlat(530, 330, 100, 25);
      addPlat(700, 280, 340, 260);
      for (var sx = 160; sx < 690; sx += 35) addSpike(sx, 520);
      this.exitGate = this.createExitDoor(880, 255);
      this.exitGate.fleeOnProximity = true;
      this.exitGate.targetY = 195;
    }

    // LEVEL 11: The Floor is Sinking (Continuous Sand Collapse)
    else if (lvl === 10) {
      addPlat(-80, 460, 180, 80);
      for (var fx = 120; fx <= 680; fx += 80) {
        addFallingPlat(fx, 460, 76, 25);
        addSpike(fx + 30, 520);
      }
      addPlat(780, 460, 260, 80);
      this.exitGate = this.createExitDoor(880, 435);
    }

    // LEVEL 12: Triple Crusher Tunnel
    else if (lvl === 11) {
      addPlat(-80, 460, width + 150, 80);
      addCrusher(280, 60);
      addCrusher(480, 60);
      addCrusher(680, 60);
      this.exitGate = this.createExitDoor(900, 435);
    }

    // LEVEL 13: The Blind Leap & Surprise Ledge
    else if (lvl === 12) {
      addPlat(-80, 460, 220, 80);
      for (var sx = 180; sx <= 720; sx += 35) addSpike(sx, 520);
      this.customTriggers.push({
        triggered: false,
        condition: function(sc) { return sc.player.x > 300; },
        action: function(sc) {
          var p1 = addPlat(360, 380, 120, 25);
          var p2 = addPlat(560, 340, 120, 25);
          AudioEngine.sfxPortal();
          sc.showTrollToast("Sand Magic! Ledges Revealed! ✨");
        }
      });
      addPlat(740, 300, 300, 240);
      this.exitGate = this.createExitDoor(880, 275);
    }

    // LEVEL 14: Spike Leapfrog
    else if (lvl === 13) {
      addPlat(-80, 460, 200, 80);
      addPlat(180, 420, 70, 120);
      addSpike(215, 410);
      addPlat(320, 380, 80, 160);
      addPlat(470, 340, 80, 200);
      addSpike(510, 330);
      addPlat(620, 300, 80, 240);
      addPlat(760, 260, 280, 280);
      for (var sx = 140; sx < 760; sx += 35) addSpike(sx, 520);
      this.exitGate = this.createExitDoor(880, 235);
    }

    // LEVEL 15: Double Trampoline Ricochet
    else if (lvl === 14) {
      addPlat(-80, 460, 200, 80);
      addPlat(160, 480, 180, 60);
      addTrampoline(220, 472);
      addPlat(400, 480, 180, 60);
      addTrampoline(460, 472);
      addPlat(660, 240, 40, 300); // Tower barrier
      addPlat(730, 400, 310, 140);
      for (var sx = 140; sx < 730; sx += 35) addSpike(sx, 530);
      this.exitGate = this.createExitDoor(880, 375);
    }

    // LEVEL 16: Crusher Stairway
    else if (lvl === 15) {
      addPlat(-80, 460, 200, 80);
      addPlat(180, 430, 110, 25);
      addCrusher(235, 60);
      addPlat(340, 380, 110, 25);
      addCrusher(395, 60);
      addPlat(500, 330, 110, 25);
      addCrusher(555, 60);
      addPlat(680, 280, 360, 260);
      for (var sx = 150; sx < 680; sx += 35) addSpike(sx, 520);
      this.exitGate = this.createExitDoor(860, 255);
    }

    // LEVEL 17: The Fake Floor Drop
    else if (lvl === 16) {
      addPlat(-80, 460, 320, 80);
      addPlat(640, 460, 400, 80);
      this.customTriggers.push({
        triggered: false,
        condition: function(sc) { return sc.player.x > 260 && sc.player.x < 360; },
        action: function(sc) {
          AudioEngine.sfxTrap();
          sc.showTrollToast("Floor Trap! Jump High! 💀");
          for (var sx = 300; sx <= 620; sx += 30) sc.spikes.create(sx, 520, "spike_up").setTint(theme.spike);
        }
      });
      addTrampoline(240, 452);
      addPlat(400, 320, 150, 25);
      this.exitGate = this.createExitDoor(880, 435);
    }

    // LEVEL 18: Moving Sinking Pillars
    else if (lvl === 17) {
      addPlat(-80, 460, 200, 80);
      addFallingPlat(190, 440, 80, 24);
      addFallingPlat(310, 400, 80, 24);
      addCrusher(420, 60);
      addFallingPlat(450, 360, 80, 24);
      addFallingPlat(570, 320, 80, 24);
      addPlat(710, 280, 330, 260);
      for (var sx = 150; sx < 700; sx += 35) addSpike(sx, 520);
      this.exitGate = this.createExitDoor(870, 255);
    }

    // LEVEL 19: The Teleporting Door
    else if (lvl === 18) {
      addPlat(-80, 460, 240, 80);
      addPlat(240, 460, 240, 80);
      addPlat(480, 460, 240, 80);
      addPlat(720, 460, 320, 80);
      addTrampoline(380, 452);
      addPlat(540, 320, 140, 25);
      this.exitGate = this.createExitDoor(420, 435);
      this.exitGate.fleeOnProximity = true;
      this.exitGate.targetX = 860;
      this.exitGate.targetY = 435;
      this.exitGate.fleeMessage = "Catch the Teleporting Gate! ⚡";
    }

    // LEVEL 20: Sandstorm Leap (Tier 2 Master Climax)
    else if (lvl === 19) {
      addPlat(-80, 460, 180, 80);
      addFallingPlat(160, 440, 90, 24);
      addCrusher(280, 60);
      addFallingPlat(300, 390, 90, 24);
      addTrampoline(420, 382);
      addCrusher(520, 60);
      addFallingPlat(540, 340, 90, 24);
      addPlat(690, 280, 350, 260);
      for (var sx = 140; sx < 680; sx += 35) addSpike(sx, 520);
      this.exitGate = this.createExitDoor(880, 255);
      this.exitGate.fleeOnProximity = true;
      this.exitGate.targetY = 185;
    }

    // LEVEL 21: Precision Sinking Needles
    else if (lvl === 20) {
      addPlat(-80, 460, 180, 80);
      addFallingPlat(180, 440, 60, 24);
      addFallingPlat(290, 410, 60, 24);
      addFallingPlat(400, 380, 60, 24);
      addFallingPlat(510, 350, 60, 24);
      addFallingPlat(620, 320, 60, 24);
      addPlat(740, 280, 300, 260);
      for (var sx = 140; sx < 730; sx += 35) addSpike(sx, 520);
      this.exitGate = this.createExitDoor(880, 255);
    }

    // LEVEL 22: The Double Decoy Chamber
    else if (lvl === 21) {
      addPlat(-80, 460, 300, 80);
      addPlat(300, 460, 300, 80);
      addPlat(600, 460, 440, 80);
      this.add.image(350, 435, "door_interior_tex").setTint(0x666666);
      this.add.image(550, 435, "door_interior_tex").setTint(0x666666);
      this.customTriggers.push({
        triggered: false,
        condition: function(sc) { return sc.player.x > 320 && sc.player.x < 380; },
        action: function(sc) {
          AudioEngine.sfxTrap();
          sc.showTrollToast("Decoy #1! Spikes Spawned! 💀");
          sc.spikes.create(350, 450, "spike_up").setTint(theme.spike);
        }
      });
      this.customTriggers.push({
        triggered: false,
        condition: function(sc) { return sc.player.x > 520 && sc.player.x < 580; },
        action: function(sc) {
          AudioEngine.sfxTrap();
          sc.showTrollToast("Decoy #2! Trampoline to the Ceiling! 🚀");
        }
      });
      addTrampoline(480, 452);
      addPlat(580, 260, 200, 25);
      this.exitGate = this.createExitDoor(720, 235);
    }

    // LEVEL 23: The Ceiling Crusher Maze
    else if (lvl === 22) {
      addPlat(-80, 460, width + 150, 80);
      addPlat(220, 220, 560, 30); // Low ceiling
      addCrusher(300, 250);
      addCrusher(450, 250);
      addCrusher(600, 250);
      this.exitGate = this.createExitDoor(900, 435);
    }

    // LEVEL 24: Trampoline on a Falling Sinking Block
    else if (lvl === 23) {
      addPlat(-80, 460, 200, 80);
      var fp = addFallingPlat(260, 460, 120, 25);
      addTrampoline(320, 452);
      addPlat(560, 320, 140, 25);
      addPlat(760, 460, 280, 80);
      for (var sx = 160; sx < 750; sx += 35) addSpike(sx, 520);
      this.exitGate = this.createExitDoor(880, 435);
    }

    // LEVEL 25: The Sinking Stepped Pyramid
    else if (lvl === 24) {
      addPlat(-80, 460, 180, 80);
      addFallingPlat(180, 430, 90, 24);
      addFallingPlat(290, 370, 90, 24);
      addFallingPlat(400, 310, 110, 24); // Peak
      addFallingPlat(530, 370, 90, 24);
      addFallingPlat(640, 430, 90, 24);
      addPlat(750, 460, 290, 80);
      for (var sx = 140; sx < 740; sx += 35) addSpike(sx, 520);
      this.exitGate = this.createExitDoor(880, 435);
    }

    // LEVEL 26: Reverse Pop-up Spikes
    else if (lvl === 25) {
      addPlat(-80, 460, width + 150, 80);
      this.customTriggers.push({
        triggered: false,
        condition: function(sc) { return sc.player.x > 320; },
        action: function(sc) {
          for (var i = 0; i < 5; i++) {
            sc.spikes.create(200 + i * 40, 450, "spike_up").setTint(theme.spike);
          }
          AudioEngine.sfxTrap();
          sc.showTrollToast("No Turning Back! Spikes Behind! 🔥");
        }
      });
      addCrusher(520, 60);
      addCrusher(720, 60);
      this.exitGate = this.createExitDoor(900, 435);
    }

    // LEVEL 27: The Crusher Stairway to Heaven
    else if (lvl === 26) {
      addPlat(-80, 460, 180, 80);
      for (var ci = 0; ci < 4; ci++) {
        var px = 180 + ci * 130;
        var py = 430 - ci * 40;
        addFallingPlat(px, py, 90, 24);
        addCrusher(px + 45, 60);
      }
      addPlat(720, 250, 320, 290);
      for (var sx = 140; sx < 710; sx += 35) addSpike(sx, 520);
      this.exitGate = this.createExitDoor(860, 225);
    }

    // LEVEL 28: The Speed Sprint Gate
    else if (lvl === 27) {
      addPlat(-80, 460, width + 150, 80);
      this.exitGate = this.createExitDoor(450, 435);
      this.exitGate.fleeOnProximity = true;
      this.exitGate.targetX = 900;
      this.exitGate.targetY = 435;
      this.exitGate.fleeMessage = "FAST SPRINT! Don't slow down! 🏃💨";
      for (var i = 0; i < 3; i++) {
        addCrusher(300 + i * 200, 60);
      }
    }

    // LEVEL 29: The Deceptive Hidden Springs
    else if (lvl === 28) {
      addPlat(-80, 460, 220, 80);
      addPlat(760, 300, 280, 240);
      for (var sx = 180; sx < 750; sx += 35) addSpike(sx, 520);
      this.customTriggers.push({
        triggered: false,
        condition: function(sc) { return sc.player.x > 180; },
        action: function(sc) {
          addPlat(340, 460, 100, 80);
          addTrampoline(390, 452);
          addPlat(540, 400, 100, 140);
          addTrampoline(590, 392);
          AudioEngine.sfxPortal();
          sc.showTrollToast("Secret Springs Emerged! 🌀");
        }
      });
      this.exitGate = this.createExitDoor(880, 275);
    }

    // LEVEL 30: The Master Desert Singularity (Final World 1 Climax)
    else {
      addPlat(-80, 460, 160, 80);
      addFallingPlat(140, 440, 80, 24);
      addCrusher(240, 60);
      addFallingPlat(250, 390, 80, 24);
      addTrampoline(360, 382);
      addFallingPlat(420, 340, 80, 24);
      addCrusher(520, 60);
      addFallingPlat(530, 290, 80, 24);
      addPlat(670, 240, 370, 300);
      for (var sx = 120; sx < 660; sx += 35) addSpike(sx, 520);
      this.exitGate = this.createExitDoor(880, 215);
      this.exitGate.fleeOnProximity = true;
      this.exitGate.targetX = 880;
      this.exitGate.targetY = 165;
      this.exitGate.fleeMessage = "FINAL LEAP TO WORLD 1 VICTORY! 👑";
    }
  }
}

// ─── 9.5. WorldCompleteScene: World 1 Victory & Teaser Screen ──
class WorldCompleteScene extends Phaser.Scene {
  constructor() {
    super("WorldCompleteScene");
  }

  init(data) {
    this.totalDeaths = (typeof data.totalDeaths === "number") ? data.totalDeaths : SaveManager.getTotalDeaths();
  }

  create() {
    var self = this;
    var size = this.scale;
    var width = size.width;
    var height = size.height;

    MobileGamepad.hide();
    AudioEngine.init();
    AudioEngine.sfxWin();

    var theme = WORLD_1_THEME;
    syncBodyBackground(theme);

    // Background
    var bgGfx = this.add.graphics();
    bgGfx.fillStyle(theme.bg, 1);
    bgGfx.fillRect(0, 0, width, height);

    // Confetti Fireworks Particle System
    this.confetti = this.add.particles(0, 0, "part_dot", {
      x: { min: 40, max: width - 40 },
      y: { min: 20, max: height - 80 },
      lifespan: 1800,
      speedY: { min: -60, max: 80 },
      speedX: { min: -70, max: 70 },
      scale: { start: 1.5, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [0xffd32a, 0x2ed573, 0x00d2d3, 0xff4757, 0xffffff, 0xff9ff3],
      frequency: 90
    });

    var panel = this.add.container(width / 2, height / 2);

    // Card background
    var cardGfx = this.add.graphics();
    cardGfx.fillStyle(0x12141e, 0.95);
    cardGfx.fillRoundedRect(-360, -210, 720, 420, 16);
    cardGfx.lineStyle(3, 0xffd32a, 1);
    cardGfx.strokeRoundedRect(-360, -210, 720, 420, 16);

    // Animated Trophy Icon
    var trophy = this.add.text(0, -145, "🏆", {
      fontSize: "44px"
    }).setOrigin(0.5);

    this.tweens.add({
      targets: trophy,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    // Congratulations Title
    var title = this.add.text(0, -90, "CONGRATULATIONS!", {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "19px",
      color: "#ffd32a",
      stroke: "#000000",
      strokeThickness: 6
    }).setOrigin(0.5);

    var subtitle = this.add.text(0, -60, "YOU CONQUERED ALL 30 LEVELS OF WORLD 1!", {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "9.5px",
      color: "#2ed573",
      stroke: "#000000",
      strokeThickness: 3
    }).setOrigin(0.5);

    // Stats bar
    var statsGfx = this.add.graphics();
    statsGfx.fillStyle(0x1c1f2e, 0.9);
    statsGfx.fillRoundedRect(-310, -38, 620, 42, 8);
    statsGfx.lineStyle(1, 0x3d4460, 1);
    statsGfx.strokeRoundedRect(-310, -38, 620, 42, 8);

    var statsText = this.add.text(0, -17, "💀 TOTAL DEATHS: " + this.totalDeaths + "   ⭐ 30/30 LEVELS CLEARED", {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "9px",
      color: "#ffffff"
    }).setOrigin(0.5);

    // Teaser / Welcome Next World Card
    var teaserGfx = this.add.graphics();
    teaserGfx.fillStyle(0x241014, 0.9);
    teaserGfx.fillRoundedRect(-310, 20, 620, 95, 10);
    teaserGfx.lineStyle(2, 0xff4757, 0.9);
    teaserGfx.strokeRoundedRect(-310, 20, 620, 95, 10);

    var teaserHeader = this.add.text(0, 42, "🔥 NEXT WORLD COMING SOON! 🔥", {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "11.5px",
      color: "#ff4757",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5);

    this.tweens.add({
      targets: teaserHeader,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    var teaserBody = this.add.text(0, 80, "World 2: Shadow Crypts is currently in development!\nGet ready for gravity inversion, glitch blocks & devilish new traps.", {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "7.5px",
      color: "#ffcccc",
      align: "center",
      lineSpacing: 8
    }).setOrigin(0.5);

    // Buttons Container
    var btnMap = this.add.container(-130, 160);
    var b1Gfx = this.add.graphics();
    b1Gfx.fillStyle(0x2ed573, 1);
    b1Gfx.fillRoundedRect(-110, -18, 220, 36, 8);
    b1Gfx.lineStyle(2, 0xffffff, 1);
    b1Gfx.strokeRoundedRect(-110, -18, 220, 36, 8);
    var b1Txt = this.add.text(0, 0, "🗺️ WORLD MAP", {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "9px",
      color: "#ffffff"
    }).setOrigin(0.5);
    var b1Zone = this.add.zone(0, 0, 220, 36).setInteractive({ cursor: "pointer" });
    b1Zone.on("pointerdown", function() {
      AudioEngine.sfxJump();
      self.scene.start("WorldSelectScene");
    });
    btnMap.add([b1Gfx, b1Txt, b1Zone]);

    var btnReplay = this.add.container(130, 160);
    var b2Gfx = this.add.graphics();
    b2Gfx.fillStyle(0xffd32a, 1);
    b2Gfx.fillRoundedRect(-110, -18, 220, 36, 8);
    b2Gfx.lineStyle(2, 0x000000, 1);
    b2Gfx.strokeRoundedRect(-110, -18, 220, 36, 8);
    var b2Txt = this.add.text(0, 0, "↺ REPLAY WORLD 1", {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "9px",
      color: "#000000"
    }).setOrigin(0.5);
    var b2Zone = this.add.zone(0, 0, 220, 36).setInteractive({ cursor: "pointer" });
    b2Zone.on("pointerdown", function() {
      AudioEngine.sfxJump();
      self.scene.start("GameScene", { world: 0, level: 0, deaths: self.totalDeaths, levelDeaths: 0 });
    });
    btnReplay.add([b2Gfx, b2Txt, b2Zone]);

    panel.add([
      cardGfx, trophy, title, subtitle,
      statsGfx, statsText,
      teaserGfx, teaserHeader, teaserBody,
      btnMap, btnReplay
    ]);
  }
}

// ─── 10. Phaser Game Configuration ───────────────────────────
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
  scene: [BootScene, IntroScene, WorldSelectScene, GameScene, WorldCompleteScene]
};

window.addEventListener("resize", function() {
  if (window.game && window.game.scale) {
    window.game.scale.refresh();
  }
  syncBodyBackground(WORLD_1_THEME);
  var isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 1024);
  var gamepad = document.getElementById("mobile-gamepad");
  if (gamepad && window.game && window.game.scene && window.game.scene.isActive("GameScene")) {
    if (isTouch) {
      document.body.classList.add("gamepad-visible");
      document.body.classList.remove("gamepad-hidden");
      gamepad.classList.remove("hidden");
    } else {
      document.body.classList.remove("gamepad-visible");
      document.body.classList.add("gamepad-hidden");
      gamepad.classList.add("hidden");
    }
  }
});

window.addEventListener("orientationchange", function() {
  setTimeout(function() {
    if (window.game && window.game.scale) {
      window.game.scale.refresh();
    }
    syncBodyBackground(WORLD_1_THEME);
  }, 150);
});

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
