# Oops! — AI Agent Development Guidelines & Project Documentation

This documentation serves as the master engineering guide for any AI coding agent (Claude, Gemini, Antigravity, etc.) that interacts with, debugs, or extends this project. Do not modify, rewrite, or break the core systems of this codebase without fully understanding this document.

---

## 1. Project Overview & Current Version
* **Game Name**: **Oops!** (formerly *Chaos Realm*)
* **Current Version**: **v1.03 (Stable Baseline Release)**
* **Genre**: Deceptive, troll puzzle-platformer inspired by *Level Devil*.
* **Core Philosophy**: Hidden surprise traps, vanishing platforms, pop-up spikes, mechanical crushers, and fleeing exit portals designed to comically challenge the player.
* **Target Platforms**:
  - **Modern Web Browsers** (Desktop, Mobile, Tablet) hosted on Vercel: [https://oops-snowy-three.vercel.app/](https://oops-snowy-three.vercel.app/)
  - **Progressive Web App (PWA)** for offline homescreen play.
  - **Android Shell** packaged using Capacitor 5 (`com.chaosrealm.game`).

---

## 2. Core Architecture & Tech Stack

### Game Engine: Phaser 3.80.1
* The game is built using **Phaser 3.80.1** with **Arcade Physics**.
* **Local Engine Loading**: `phaser.min.js` (1.18 MB) is stored locally at the root and loaded directly in `index.html` to eliminate external CDN latency and offline stalls.
* **Virtual Canvas Resolution**: Fixed logical resolution of **`960x540`** (`VW` / `VH`).
* **Scale Manager**: Configured with `Phaser.Scale.FIT` and `Phaser.Scale.CENTER_BOTH`. The engine automatically letterboxes and scales the viewport cleanly to any screen aspect ratio without distortion.

### 2.5D Stylized Visual Rendering
The game utilizes a **2.5D depth architecture** built entirely using procedural graphics textures in `BootScene.createWorldAssets()`:
1. **Platform Tiles (`plat_tex`)**: Multi-layer 3D top sunlit rim highlight (`#ffffff`, 45% opacity) + bottom front bevel extrusion (`#000000`, 28% opacity) + subtle horizontal strata lines.
2. **Faceted Danger Spikes (`spike_up`)**: 3D faceted geometry with illuminated left facet (`#ff4757`), shadowed right facet (`#9c1000`), metallic ridge highlight (`#ffd32a`), and tip glint.
3. **Riveted Steel Crushers (`crusher_tex`)**: Recessed inner eye cavity with menacing glowing red eye slits, steel rivets, and heavy bottom teeth.
4. **3-Part Depth Portal Doorways**: Recessed dark chamber interior, depth-extruded outer archway frame, and pivoting animated door panel.
5. **Spring Trampoline (`tramp_tex`)**: Metallic base plate, compressed mechanical coils, and bouncy rubber top pad.
6. **Multi-Layer Parallax Desert**: In `GameScene.update()`, procedural far dunes and mid ruins scroll horizontally in real-time based on the player's position relative to the center (`-pRatio * 20` and `-pRatio * 50`).

---

## 3. Scene Pipeline & Lifecycle

The game runs on 5 sequential Phaser scenes defined in `game.js`:

```
BootScene ──► IntroScene ──► WorldSelectScene ◄──► GameScene ──► WorldCompleteScene
```

| Scene | Class | Responsibility |
|:---|:---|:---|
| `BootScene` | [`BootScene`](file:///Users/khalidabdullah/AntiGravity/Oops!/game.js#L933) | Generates all procedural 2.5D textures, registers animations, safely dismisses `#game-loader`, and transitions to `IntroScene`. |
| `IntroScene` | [`IntroScene`](file:///Users/khalidabdullah/AntiGravity/Oops!/game.js#L1269) | High-octane 3-trap interactive troll showcase demonstrating floor vanish, crusher smash, trampoline ceiling spikes, and fleeing rocket door. Features instant `[ SKIP ⏩ ]` and touch-to-start. |
| `WorldSelectScene` | [`WorldSelectScene`](file:///Users/khalidabdullah/AntiGravity/Oops!/game.js#L1664) | 30-level interactive island selector with 3 pages (1–10, 11–20, 21–30), death tally, audio toggle, and direct stage launching. |
| `GameScene` | [`GameScene`](file:///Users/khalidabdullah/AntiGravity/Oops!/game.js#L1965) | Core platformer physics loop, trap state machines, boundaries, HUD overlays, mobile bridge sync, and 7-death ad monetization triggers. |
| `WorldCompleteScene` | [`WorldCompleteScene`](file:///Users/khalidabdullah/AntiGravity/Oops!/game.js#L3169) | Grand World 1 victory screen triggered after clearing Level 30. Shows total run deaths, trophy animations, confetti blasters, and roadmap teaser. |

---

## 4. World 1 Status: FROZEN BASELINE (30 Levels)

> [!IMPORTANT]
> **World 1 (Desert Ruins) is 100% COMPLETE, TESTED, and FROZEN.**
> Under NO circumstances should any AI agent redesign, renumber, delete, or alter the 30 handcrafted levels of World 1.

* **Level Range**: Levels 1 to 30 (zero-indexed internally as `lvl = 0` to `lvl = 29`).
* **Implementation Location**: [`buildWorld1Level(lvl)`](file:///Users/khalidabdullah/AntiGravity/Oops!/game.js#L2650-L3165).
* **Trap Variety Across the 30 Stages**:
  - *Levels 1–5*: Introductory deceptive physics, vanishing sandstones, and pop-up spikes.
  - *Levels 6–10*: Mechanical drop crushers, surprise trampolines, and precision leaps.
  - *Levels 11–20*: Shifting floors, fleeing exit doors (`fleeOnProximity`), and double-fake triggers.
  - *Levels 21–29*: Master troll gauntlets, hidden ceiling spikes, decoy pathways, and multi-stage traps.
  - *Level 30*: The Master Desert Singularity (Final World 1 Climax) transitioning to `WorldCompleteScene`.
* **World 2 Status**: Planned for future releases (Frost Spire). Do NOT start implementing World 2 until explicitly directed.

---

## 5. Monetization & Rewarded Ad System

* **Ad Network**: Official **Google AdSense / H5 Games Ads Placement API** (`adBreak`).
* **Publisher ID**: `ca-pub-7942277005068512`
* **`ads.txt`**: Hosted live at `https://oops-snowy-three.vercel.app/ads.txt`:
  ```
  google.com, pub-7942277005068512, DIRECT, f08c47fec0942fa0
  ```
* **Configuration (`MONETIZATION_CONFIG`)**:
  - `enabled`: `true`
  - `testMode`: `false` (Uses official Google `window.adBreak`; falls back safely to simulator in local dev/testing)
  - `deathsThreshold`: `7`

### 7-Death Gameplay Flow:
```
Player Enters Level ──► Dies 1..6 Times (Normal Respawn)
                                 │
                            7th Death
                                 ▼
                     One-Time Rewarded Ad Popup Offer
                                 │
           ┌─────────────────────┴─────────────────────┐
           ▼                                           ▼
      [ WATCH AD ]                               [ NO THANKS ]
           │                                           │
  Ad Views Successfully                     Modal Closes (No popup on 8+)
           │                                           │
  Level Cleared & Skipped!                  Persistent [ 📺 SKIP ] Unlocked
  Deaths Reset to 0 for Next Level          on Deck Bar & HUD for Later Use
```

---

## 6. Mobile & Desktop Responsive Controls

* **Responsive Viewports**: Tested across Mobile Portrait, Mobile Landscape, Tablet, and Desktop.
* **No Forced Landscape**: Players can play comfortably in both portrait and landscape modes.
* **Mobile Touch Gamepad (`#mobile-gamepad`)**:
  - Left Cluster: Directional buttons (`◀`, `▶`) with touch-sliding support.
  - Right Cluster: Large jump button (`▲ JUMP`) and quick restart (`↺`).
  - Top Deck Bar (Portrait): Displays `WORLD 1 · LV X  💀 Y`, quick restart, world map, and persistent `[ 📺 SKIP ]`.
* **Desktop Controls**:
  - Move: `←` / `→` or `A` / `D`
  - Jump: `↑` / `W` / `Space`
  - Restart: `R`
  - Fullscreen Toggle: `⛶` button in HUD.

---

## 7. Sound & Audio Synthesis

* **Engine**: Pure procedural **Web Audio API** (`AudioEngine`).
* **No External Audio Assets**: All chiptune music, jump bleeps, death thuds, spring bounces, and portal chimes are synthesized mathematically in real-time.
* **Audio Methods**:
  - `AudioEngine.init()`: Unlocks audio context on first user interaction.
  - `AudioEngine.sfxJump()`, `AudioEngine.sfxDie()`, `AudioEngine.sfxBounce()`, `AudioEngine.sfxSpring()`, `AudioEngine.sfxTrap()`, `AudioEngine.sfxWin()`, `AudioEngine.sfxPortal()`.
  - `AudioEngine.startMusic()`, `AudioEngine.stopMusic()`, `AudioEngine.toggleMute()`.

---

## 8. Important Files & File Structure

| File / Directory | Description |
|:---|:---|
| [`index.html`](file:///Users/khalidabdullah/AntiGravity/Oops!/index.html) | Main HTML shell, AdSense SDK loader, loader splash, modal overlays, mobile gamepad. |
| [`game.js`](file:///Users/khalidabdullah/AntiGravity/Oops!/game.js) | Core game script: Phaser scenes, 2.5D assets, 30 levels, physics, monetization manager. |
| [`style.css`](file:///Users/khalidabdullah/AntiGravity/Oops!/style.css) | Responsive UI styling, modal cards, mobile gamepad layout, policy footer. |
| [`ads.txt`](file:///Users/khalidabdullah/AntiGravity/Oops!/ads.txt) | Google AdSense authorized digital seller verification file. |
| [`privacy.html`](file:///Users/khalidabdullah/AntiGravity/Oops!/privacy.html) | Google AdSense GDPR/CCPA privacy policy compliance page. |
| [`terms.html`](file:///Users/khalidabdullah/AntiGravity/Oops!/terms.html) | Terms of Service compliance page. |
| [`about.html`](file:///Users/khalidabdullah/AntiGravity/Oops!/about.html) | Game info, developer contact, and bug report guidelines. |
| [`manifest.json`](file:///Users/khalidabdullah/AntiGravity/Oops!/manifest.json) | PWA web app manifest. |
| [`sw.js`](file:///Users/khalidabdullah/AntiGravity/Oops!/sw.js) | Self-purging service worker preventing stale caching. |
| [`package.json`](file:///Users/khalidabdullah/AntiGravity/Oops!/package.json) | Project metadata, dependencies, and Capacitor build scripts. |
| [`CHANGELOG.md`](file:///Users/khalidabdullah/AntiGravity/Oops!/CHANGELOG.md) | Official release history and version tracking. |
| [`www/`](file:///Users/khalidabdullah/AntiGravity/Oops!/www) | **Required Sync Location** for Capacitor Android builds. Must mirror web assets. |

---

## 9. Rules for AI Agents Working on This Codebase

1. **World 1 is FROZEN**: Never alter World 1 level layouts, traps, or difficulty curves.
2. **Preserve Phaser 3 & 2.5D**: Never revert to plain 2D or rewrite the rendering pipeline.
3. **Preserve Rewarded Ad Logic**: The 7-death trigger, decline persistent unlock, and reward skip flow must remain intact.
4. **Always Sync `www/`**: Whenever changes are made to `index.html`, `style.css`, `game.js`, `manifest.json`, or icons, immediately copy them to `www/`.
5. **No Fake Credentials**: Always preserve the verified AdSense publisher ID (`ca-pub-7942277005068512`).
6. **No Breaking Framework Migrations**: Keep the code vanilla JavaScript + Phaser 3. Do not introduce Webpack, Vite, React, or unnecessary bundlers.
