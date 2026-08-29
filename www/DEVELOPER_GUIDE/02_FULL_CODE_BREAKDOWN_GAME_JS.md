# Complete Code Breakdown: game.js (3,429 Lines Analyzed)
### *A Section-by-Section, Function-by-Function Engineering Deep Dive into OOPS!*

---

## 📌 File Overview

* **File Path**: [`/Users/khalidabdullah/AntiGravity/Oops!/game.js`](file:///Users/khalidabdullah/AntiGravity/Oops!/game.js)
* **Total Length**: 3,429 lines of strict-mode modern JavaScript (`"use strict"`).
* **Dependencies**: Phaser 3.80.1 (loaded locally via `phaser.min.js`). Zero external runtime libraries.
* **Core Philosophy**: Single-file monolithic architecture designed for instant script execution, zero build-step overhead, and 100% offline portability across browsers and Android WebViews.

---

## 📑 Master Architecture Map of `game.js`

```
Lines 0001 – 0009: Version Constant & Strict Mode Header
Lines 0010 – 0105: ── Section 0: Universal SafeStorage & Global Utilities
Lines 0106 – 0188: ── Section 1: SaveManager (Progression & Death Tallies)
Lines 0189 – 0301: ── Section 2: Web Audio Synthesizer (AudioEngine)
Lines 0302 – 0442: ── Section 3: Mobile Gamepad Controller Bridge (MobileGamepad)
Lines 0443 – 0641: ── Section 4: In-Game Player Feedback Manager
Lines 0642 – 0908: ── Section 4.5: Modular Monetization & Rewarded Ads (MonetizationManager)
Lines 0909 – 0930: ── Section 5: World 1 Configuration (Desert Ruins Theme)
Lines 0931 – 1266: ── Section 6: BootScene (2.5D Procedural Texture Generation)
Lines 1267 – 1661: ── Section 7: IntroScene (Interactive 3-Trap Troll Showcase)
Lines 1662 – 1962: ── Section 8: WorldSelectScene (30-Level Island Map)
Lines 1963 – 2648: ── Section 9: GameScene Core Platformer Engine
Lines 2649 – 3166: ── Section 9.1: buildWorld1Level() (30 Handcrafted Stage Builders)
Lines 3167 – 3340: ── Section 9.5: WorldCompleteScene (Victory Climax)
Lines 3341 – 3429: ── Section 10: Phaser Game Configuration & Engine Bootstrap
```

---

## 🔍 Detailed Walkthrough by Section

---

### Section 0: Universal SafeStorage & Global Utilities (Lines 10 – 105)

#### 1. `SafeStorage` (Lines 11 – 29)
```javascript
var _memoryStore = {};
var SafeStorage = {
  getItem: function(key) { ... },
  setItem: function(key, val) { ... }
};
```
* **Why it exists**: If a player opens the game in Safari Private Browsing, Firefox Incognito, or an Android in-app WebView (like Facebook or Instagram's internal browser), standard calls to `window.localStorage.setItem()` throw a fatal `SecurityError: The operation is insecure`. A normal game will crash immediately on startup!
* **How it works**:
  - Tries to read/write from `window.localStorage`.
  - If a security error is thrown, it gracefully catches the error (`catch(e){}`) and falls back to saving data in `_memoryStore` (a JavaScript object in RAM).
  - The game never crashes; progress is retained during the active session.

#### 2. `toggleFullScreen()` (Lines 31 – 50)
* **What it does**: Handles vendor-prefixed full-screen APIs (`requestFullscreen`, `webkitRequestFullscreen`, `msRequestFullscreen`) to expand the canvas across the entire device screen on both desktop and Android devices.

#### 3. `syncBodyBackground(theme)` (Lines 52 – 88)
* **What it does**: Eliminates black border letterboxing! When World 1 (Desert Ruins) loads, this function dynamically reads the world theme background color (`#8a2c14`), sets the CSS custom property `--world-bg`, and applies it to the HTML body, container, and `<meta name="theme-color">`. On mobile portrait screens, it adds a polished retro border and drop shadow.

#### 4. `removeLoaderSplash()` (Lines 90 – 105)
* **What it does**: Smoothly fades out and deletes the HTML `#game-loader` element once the Phaser canvas begins rendering, ensuring the player never stares at a frozen loading screen.

---

### Section 1: SaveManager (Lines 106 – 188)

* **Key Constant**: `SAVE_KEY = "oops_world1_master_v1"`
* **Core Data Schema**:
  ```json
  {
    "worlds": {
      "0": {
        "maxUnlocked": 0,
        "cleared": []
      }
    },
    "deaths": 0,
    "currentWorld": 0,
    "introSeen": false
  }
  ```
* **Functions**:
  - `getInitialState()`: Returns a brand-new player profile starting at Stage 0 with 0 deaths.
  - `load()`: Safely loads and parses JSON from `SafeStorage`. If corrupted or empty, returns initial state.
  - `saveLevelClear(worldIdx, levelIdx, deaths)`: Adds `levelIdx` to `cleared`, increments `maxUnlocked` (capped at 29 for the 30 levels of World 1), updates total deaths, and writes back to storage.
  - `saveDeaths(deaths)`: Persists the cumulative death count.
  - `isLevelUnlocked(worldIdx, levelIdx)`: Returns boolean `true` if `levelIdx <= maxUnlocked`.
  - `resetProgress()`: Clears the save key for players who want a clean fresh run.

---

### Section 2: Web Audio Synthesizer — `AudioEngine` (Lines 189 – 301)

* **Design Decision**: Instead of loading 20 separate `.mp3` or `.wav` sound files over the network (which introduces loading delays, 404 errors, and mobile audio lag), **every sound in OOPS! is mathematically generated in real time** using the browser's built-in `AudioContext`!
* **Key Methods**:
  - `init()`: Creates `new (window.AudioContext || window.webkitAudioContext)()`.
  - `playTone(freq, duration, type, startVol, endVol)`: Creates an `OscillatorNode` (square, sine, or triangle wave) connected to a `GainNode` (volume envelope).
  - `sfxJump()`: Ramps a square wave from **150 Hz to 450 Hz** over 0.12 seconds, producing a classic punchy 8-bit jump sound.
  - `sfxDeath()`: Rapidly drops pitch from **300 Hz down to 60 Hz** over 0.35 seconds, mimicking a classic cartoon defeat.
  - `sfxCrusher()`: Generates a buffer of white noise combined with a deep 50 Hz sub-bass drop to simulate a heavy stone slab smashing into the ground.
  - `sfxSpring()`: Rapidly oscillates frequency between **200 Hz and 600 Hz** like a coiled mechanical trampoline.
  - `sfxLevelClear()`: Plays a fast ascending major-triad arpeggio (C5 $\rightarrow$ E5 $\rightarrow$ G5 $\rightarrow$ C6).

---

### Section 3: Mobile Gamepad Controller Bridge (Lines 302 – 442)

* **Object**: `MobileGamepad`
* **Boolean State Flags**:
  ```javascript
  MobileGamepad.keys = {
    left: false,
    right: false,
    jump: false,
    restart: false
  };
  ```
* **Why this is engineered as a bridge**: In Phaser, you could create touch buttons inside the canvas using sprites. However, DOM-based touch buttons (`#mobile-gamepad` in HTML) are superior because:
  1. They exist outside the Phaser rendering loop, eliminating touch-input latency.
  2. Players can slide their thumb smoothly across the directional cluster without losing focus.
  3. They adapt automatically to phone notches and home-indicator bars via CSS `env(safe-area-inset-bottom)`.
* **Thumb-Sliding Math** (`updateDirectionFromTouch`):
  - Measures the touch coordinate `(clientX, clientY)` relative to the center of the directional cluster.
  - If the touch is to the left of the midpoint, `keys.left = true, keys.right = false`.
  - If the touch slides to the right of the midpoint, it instantly flips `keys.left = false, keys.right = true`.

---

### Section 4.5: Monetization & Rewarded Ads — `MonetizationManager` (Lines 642 – 908)

* **Monetization Partner**: Official Google AdSense / H5 Games Ads Placement API (`ca-pub-7942277005068512`).
* **The 7-Death Trigger State Machine**:
  ```
  Deaths on Current Level:
  0 to 6 Deaths  ──► Normal respawn; no popup; uninterrupted gameplay.
       │
  7th Death      ──► showDeathSkipOfferModal():
                     Displays custom dark modal: "Skip this tough level?"
                     ├── User clicks "Watch Ad" ──► Triggers adBreak(rewarded)
                     │                              ├── Ad Watched ──► Skips level & resets death counter
                     │                              └── Ad Failed  ──► Stays on level; death count intact
                     └── User clicks "No Thanks"──► Closes modal; permanently unlocks
                                                    discreet [📺 SKIP] button on top HUD.
       │
  8+ Deaths      ──► Popup NEVER pesters the player again; [📺 SKIP] remains on HUD.
  ```
* **AdSense Placement API Integration**:
  ```javascript
  adBreak({
    type: "reward",
    name: "skip_level_death_threshold",
    beforeReward: function(showAdFn) { showAdFn(); },
    adDismissed: function() { /* User closed early: NO reward */ },
    adViewed: function() {
      // 🌟 VALID REWARD: Trigger level skip callback!
      onSuccessCallback();
    }
  });
  ```
* **Built-in Ad Simulator**: If the game is run on `localhost` or in an offline test environment where Google's ad servers are unreachable, `MonetizationManager` automatically simulates a 3-second test ad with a progress countdown so developers can test the complete reward callback flow without real ads!

---

### Section 6: `BootScene` — Procedural 2.5D Texture Generator (Lines 931 – 1266)

* **Why procedural texture generation?**: Instead of downloading 50 separate image PNGs over the network, `BootScene` draws all game textures dynamically into Phaser's internal `TextureManager` using `this.make.graphics()`!
* **Generated Textures**:
  1. **`player_ninja`**: Cartoon hero with yellow body, black ninja cowl, green glowing headband, expressive eyes, and glowing belt buckle.
  2. **`ground_25d` & `platform_25d`**: Handcrafted sandstone blocks rendered with:
     - Sunlit top rim (bright orange highlight).
     - Sandy front face with subtle crack detailing.
     - **3D Bottom Bevel**: Extruded darker sandstone beneath the block creating visual depth.
     - Ambient drop-shadow gradient.
  3. **`spike_faceted`**: 3D faceted metallic hazard spikes with left-side shadow and right-side specular glint.
  4. **`crusher_stone`**: Heavy stone crusher with carved demonic warning eye slits.
  5. **`spring_trampoline`**: Metallic base plate with a bouncy coiled spring mechanism.
  6. **`exit_portal`**: 3D doorway with physical stone frame, glowing interior portal vortex, and swinging door panel.

---

### Section 7: `IntroScene` — Interactive 3-Trap Troll Showcase (Lines 1267 – 1661)

* **Purpose**: Serves as a 15-second high-energy playable demonstration showing new players the comedic spirit of *Oops!*.
* **The 3 Troll Acts**:
  - **Act 1**: Hero runs toward the first coin $\rightarrow$ The sandstone block vanishes $\rightarrow$ Hero plummets onto spikes with narrator commentary: *"Oops! Watch your step..."*
  - **Act 2**: Hero respawns, leaps over the pit $\rightarrow$ An overhead stone crusher drops at 800 px/s with a screen-shake slam $\rightarrow$ *"Oops! Did you look up?"*
  - **Act 3**: Hero avoids both, approaches the exit door $\rightarrow$ The door sprouts rocket thrusters and zooms into the sky laughing!
* **User Control**: Includes an immediate `[ ⏭️ SKIP ]` button in the top-right corner to jump straight to the World Select screen.

---

### Section 8: `WorldSelectScene` — 30-Level Island Map (Lines 1662 – 1962)

* **Features**:
  - Renders all 30 handcrafted levels of World 1 (Desert Ruins) in a responsive grid.
  - Locked levels display a metallic lock icon (`🔒`).
  - Unlocked levels display the level number, clear badge (`⭐`), and lowest death record.
  - Smooth camera panning and mouse-wheel/touch scrolling across the 30-stage archipelago.

---

### Section 9 & 9.1: `GameScene` & `buildWorld1Level()` (Lines 1963 – 3166)

This is the beating heart of the game. It controls physics, trap triggers, camera tracking, and level construction.

#### 1. Player Physics & Feel Engineering
* **Coyote Time (0.10s)**: When the player walks off a ledge into mid-air, a 100ms timer starts. If the player presses jump during this window, the jump still succeeds! This eliminates the frustrating feeling of "I pressed jump right at the edge but fell anyway".
* **Jump Buffering (0.10s)**: If the player presses jump 100ms before touching the ground, the engine remembers the press and fires the jump the exact millisecond the player's feet touch down.

#### 2. The 30 Handcrafted Level Builders (`buildWorld1Level`)
Every single level from 1 to 30 is individually constructed with custom coordinates:
* **Levels 1–5 (Fundamentals)**: Basic running, jump buffering, small 1-tile spike hazards, and the first disappearing sandstone ledge.
* **Levels 6–10 (Crushers & Springs)**: Introduces heavy drop crushers triggered by player X-proximity, deep spike pits, and bouncy spring trampolines.
* **Levels 11–20 (Deceptive Traps & Fleeing Doors)**:
  - Sandstone floors that crumble only on the second footstep.
  - Ceiling spikes that drop when jumped beneath.
  - **The Fleeing Exit Door**: When `player.x` gets within 160 pixels of the door, the door accelerates backward or launches upward into the clouds!
* **Levels 21–30 (The Master Singularity)**:
  - Staggered falling columns, dual-crusher pincher corridors, blind faith leaps onto moving platforms, and the grand Stage 30 climax!

#### 3. Comic Death & Soul Ascent
When the player touches a hazard:
1. `AudioEngine.sfxDeath()` fires.
2. The player body explodes into a comic dust puff.
3. A transparent ghost soul ascends gently toward the top of the screen.
4. The level deaths counter increments (`levelDeaths++`).
5. After 400ms, the level instantly reloads with zero loading screen lag!

---

### Section 9.5: `WorldCompleteScene` (Lines 3167 – 3340)

* **Trigger**: Unlocked when the player completes Stage 30.
* **Celebration Elements**:
  - Gold confetti particle fountain across the screen.
  - Ascending victory fanfare arpeggio from `AudioEngine`.
  - Full statistical breakdown: Total World 1 Deaths, Completion Time, and Master Rating.
  - **Teaser Screen**: A sneak peek preview of **World 2: Frost Spire** (icy momentum physics and falling icicles)!

---

### Section 10: Phaser Game Configuration (Lines 3341 – 3429)

* Master initialization configuration linking `VW = 960`, `VH = 540`, Arcade Physics gravity `y = 1550`, the 5 Scene classes, and bootstrapping the engine via `new Phaser.Game(config)`.
