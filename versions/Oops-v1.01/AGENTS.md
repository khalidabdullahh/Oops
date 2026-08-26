# Oops! — AI Agent Development Guidelines & Project Documentation

This documentation serves as a guide for any AI coding agent (such as Claude, Gemini, etc.) that interacts with, debugs, or extends this project. Do not modify, rewrite, or break the core systems of this codebase without fully understanding this document.

---

## 1. Project Overview
**Oops!** (formerly *Chaos Realm*) is a deceptive puzzle-platformer inspired by games like *Level Devil*. It features hidden traps, vanishing platforms, shifting spikes, and teleportation portals designed to surprise the player.

*   **Platform**: HTML5 Canvas (PWA-compliant for offline gameplay).
*   **Mobile Shell**: Packaged for Android using **Capacitor 5**.
*   **Visual Style**: Minimalist, flat, and monochromatic, featuring 3 unique world themes (Desert, Shadow, Void) and a cartoon-style player character.

---

## 2. Architecture & Design Pattern
The project uses a monolithic, zero-dependency, vanilla JavaScript game engine.

*   **Virtual Canvas Resolution**: The internal game physics and coordinates run on a virtual size of **960x540** pixels (`VW` and `VH` constants). A resizing listener automatically letterboxes and scales the rendering viewport to fit the user's screen device ratio.
*   **Single-File Core**: All gameplay loop controls, physical definitions, level maps, input readers, sound engines, and state updates reside in **`game.js`**.
*   **State Coordination**: Managed globally via `gameState` (`"start"` $\rightarrow$ `"playing"` $\rightarrow$ `"dead"` / `"levelcomplete"` $\rightarrow$ `"gamecomplete"`).
*   **HUD & Screens Overlay**: Managed via overlay HTML components inside `index.html`. Screen transitions are triggered by adding or removing the CSS class `.hidden`.

---

## 3. Important Files & Responsibilities

| File | Type | Responsibility |
|:---|:---|:---|
| [`index.html`](file:///Users/khalidabdullah/AntiGravity/Oops!/index.html) | View | The PWA DOM shell. Holds the viewport canvas, HTML menus, HUD elements, and touch button divs. |
| [`game.js`](file:///Users/khalidabdullah/AntiGravity/Oops!/game.js) | Controller / Model | Core script. Houses physics, chiptune sound synthesis, level builders, update cycles, and rendering logic. |
| [`style.css`](file:///Users/khalidabdullah/AntiGravity/Oops!/style.css) | Style | Holds UI layouts, start-screen styling, HUD positioning, and custom touch button layouts. |
| [`manifest.json`](file:///Users/khalidabdullah/AntiGravity/Oops!/manifest.json) | Config | Configuration specifying landscape fullscreen orientation and PWA descriptors. |
| [`sw.js`](file:///Users/khalidabdullah/AntiGravity/Oops!/sw.js) | Service | basic caching worker allowing offline gameplay support. |
| [`capacitor.config.json`](file:///Users/khalidabdullah/AntiGravity/Oops!/capacitor.config.json) | Config | Capacitor mapping configuration. Points to the sync directory (`www`). |
| [`package.json`](file:///Users/khalidabdullah/AntiGravity/Oops!/package.json) | Config | Contains script build configurations and Capacitor core dependencies. |
| [`build_apk.sh`](file:///Users/khalidabdullah/AntiGravity/Oops!/build_apk.sh) | Script | Downloads external developer binaries (JDK, Node, Android CLI) to `/tmp` and packages the APK. |
| [`www/`](file:///Users/khalidabdullah/AntiGravity/Oops!/www) | Folder | **Required Sync Location**. Built HTML files must be cloned here for Capacitor to construct Android assets. |

---

## 4. Existing Gameplay Systems

### Physics & Input
*   **Update Loop**: Driven by `requestAnimationFrame`. Physics updates use a variable delta time `dt` clamped to a maximum step of `0.05` to prevent collision tunneling at low frame rates.
*   **Platformer Engine**: Features coyote time ($0.1\text{s}$ grace period to jump after falling off platforms) and jump buffering ($0.1\text{s}$ window to queue jumps before landing).
*   **Input Translation**: Both virtual touch listeners and standard keyboard keydown events write flags directly to the global `keys` object.

### Platform Components
Classified under the `TILE` enum mapping inside `Platform`:
*   `SOLID` & `PLATFORM` (One-way top collisions)
*   `VANISH` (Disappears shortly after player stands on it; respawns after $2.5\text{s}$)
*   `FAKE` (Visually solid, collides with nothing, reveals on collision overlap)
*   `TRAMPOLINE` (Gives player a high upward bounce velocity)
*   `ICE` (Applies reduced friction values)
*   `LAVA` (Triggers player instadeath)

---

## 5. Development & Packaging Commands

All terminal packaging triggers are defined inside `package.json`:

*   **Synchronize assets to Capacitor**:
    ```bash
    npm run cap-sync
    ```
*   **Open the project inside Android Studio**:
    ```bash
    npm run cap-open
    ```
*   **Run Automated Android APK Build (via wrapper)**:
    ```bash
    ./build_apk.sh
    ```

### Package Config:
*   **Capacitor App Name**: `"Chaos Realm"`
*   **Package Domain Identifier**: `com.chaosrealm.game`
*   **Target SDK version**: Android API 34.
*   **Gradle Compiler version**: 8.0.2.

---

## 6. Coding Conventions & Standards
*   **Vanilla JS only**: Do not introduce compiler steps, bundling wrappers, or third-party engines (like Phaser/Pixi).
*   **Sound Synthesis**: Keep SFX inside the procedural Web Audio API code structure (`playTone`). Do not attempt to import large static audio files.
*   **PWA Cache Consistency**: Any newly introduced assets or configuration files must be appended to the cached assets array `ASSETS` in `sw.js`.
*   **Save Key Persistence**: Do not modify the local storage save key `"chaosRealm_save_v1"`. Doing so will wipe the player's saved levels and death counts.

---

## 7. Current Project Features
*   **Multiverse Selector Dashboard**: Screen selection enabling access to three parallel universes (`Classic Realm`, `Gravity Nexus`, `Glitch Realm`) with independent level unlocks and death logs.
*   **Gravity Inversion Physics**: Responsive upside-down gravity flips (triggered via Shift or mobile FLIP button) including inverted jumping mechanics, ceiling platform landing states, and ceiling boundaries.
*   **Glitch Cycle Blocks**: Time-flickering platforms with active collision switches and chromatic wireframe rendering during inactive phases.
*   **Opening Cinematic/Intro Animation**: Custom sequential entry animation featuring evil eyes opening in darkness, title slam with bounce, and crossfading overlays.
*   **20 Handcrafted Levels**: 10 Classic, 5 Gravity-inversion, and 5 Glitch-speed levels.
*   **Visual Themes**: 9 distinct universe themes (`DESERT`, `SHADOW`, `VOID`, `FROST`, `MATRIX`, `OBSIDIAN`, `SUNRISE`, `LAVA`, `TWILIGHT`) dynamically shifting every 3 levels.
*   **Procedural Chiptune Background Music**: Sequenced retro minor key arpeggios that automatically toggle matching start/dead/win transitions.
*   **Sound Control Integration**: HUD utility buttons featuring a `🔇/🔊` mute button to instantly override sound nodes.
*   **Narrator Humorous Death Commentaries**: Dynamic, custom-tuned comments in place of simple death alerts.
*   **Victory Confetti Blasters**: Confetti sprays of multiple colors on exit reach actions.
*   **Logo Interaction Sandbox**: Clicking the main menu logo triggers comical squashes and bounces alongside sound effect alerts.
*   **Persistant Progress saving**: Loads cumulative deaths and highest unlocked level index independently for each multiverse.
*   **Responsive Joystick UI**: Multi-touch, circular joystick controls with haptic touch feedbacks.

---

## 8. Current TODO / In-Progress Features
*   **App Config Naming**: `capacitor.config.json` and `package.json` configurations still reference the old name `"Chaos Realm"`.

---

## 9. Rules for Code Modification & Safety

> [!IMPORTANT]
> **Inspect Existing Implementations First**: Always search `game.js` for existing structures before implementing a feature. Do not write duplicate class wrappers or render configurations.

> [!WARNING]
> **Preserve Core Gameplay Behavior**: Do not modify the core gravity ($1400$), walk speed ($220$), jump velocity ($-560$), or collision resolution algorithms (`resolveX` / `resolveY`) unless explicitly requested. Doing so will break level designs and timing.

> [!WARNING]
> **No Unnecessary Rewrites**: Under no circumstances should this codebase be migrated to framework engines (React, Vue, Phaser, PixiJS). It must remain simple, lightweight vanilla HTML5/Canvas-based code.

> [!IMPORTANT]
> **Sync the `www/` Folder**: Always copy changes made to `index.html`, `style.css`, and `game.js` into the `www/` directory before building the APK. Capacitor reads exclusively from `www/`.
