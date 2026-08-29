# Chapter 01 — The Game Loop, Phaser 3 Architecture & The Anatomy of a Single Frame

---

## 1. Concept: The Illusion of Life

Every video game you have ever played—from *Pong* and *Super Mario Bros.* to *Level Devil* and *Oops!*—is fundamentally an optical illusion. 

A computer game does not move. Instead, it is an infinite loop that runs 60 times every second (60 Frames Per Second / FPS). In every single frame (lasting approximately **16.6 milliseconds**), the computer performs three sequential tasks:
1. **Reads Input**: Did the player press a key, touch a button, or move a mouse?
2. **Updates State**: Moves objects, runs physics calculations, detects collisions, and advances timers.
3. **Renders Graphics**: Clears the previous screen drawing and paints the newly calculated positions onto the screen canvas.

In Phaser 3, this continuous heartbeat is known as the **Game Loop**.

```
┌────────────────────────────────────────────────────────┐
│                   THE 60 FPS GAME LOOP                 │
│                                                        │
│   ┌──────────────┐     ┌──────────────┐     ┌───────┐  │
│   │ 1. Process   │ ──► │  2. Update   │ ──► │ 3.    │  │
│   │    Inputs    │     │ Game Physics │     │ Render│  │
│   └──────────────┘     └──────────────┘     └───────┘  │
│          ▲                                      │      │
│          └────────────── Loop Every 16.6ms ─────┘      │
└────────────────────────────────────────────────────────┘
```

---

## 2. Why This Matters

If you write a standard web application (like a blog or an online store), your code is **event-driven**. The browser sits idle doing nothing until a user clicks a button, which triggers a callback function.

Games **cannot** wait for user clicks. Even if the player is standing completely still and not touching a single key:
- An overhead steel crusher is accelerating downward under gravity.
- A crumbling sandstone platform is counting down its 300ms vanishing timer.
- Parallax desert dunes are gently shifting.
- Particle glints are sparkling on the tips of hazard spikes.

Understanding the Game Loop is the dividing line between an ordinary web programmer and a true game developer.

---

## 3. Prerequisites

Before diving into the code, ensure you understand:
- **HTML5 `<canvas>`**: An HTML element that exposes an API for drawing 2D pixels via JavaScript.
- **JavaScript Objects & Functions**: How properties and methods are organized in key-value pairs.
- **Coordinates (`x`, `y`)**: In computer graphics, `(0, 0)` is the **top-left** corner of the screen. Increasing `x` moves **right**; increasing `y` moves **down**.

---

## 4. Theory: The 3 Core Lifecycle Methods in Phaser 3

In Phaser 3, games are divided into **Scenes** (e.g., Title Screen, Gameplay Scene, Game Over Screen). Every Phaser Scene class provides three primary lifecycle methods:

### A. `init(data)`
- **When it runs**: Exactly once, the moment the Scene is launched.
- **Purpose**: Receives data passed from a previous scene (like current level index, death count, or score) and resets variables.

### B. `preload()` or procedural texture generation
- **When it runs**: Before the scene displays anything.
- **Purpose**: Loads external assets (images, audio) into memory or draws procedural graphics into Phaser's Texture Manager.

### C. `create()`
- **When it runs**: Exactly once, immediately after assets are loaded.
- **Purpose**: Spawns game objects into the world: creates the player sprite, builds platforms, sets up collision rules, and registers keyboard listeners.

### D. `update(time, delta)`
- **When it runs**: **Continuously, 60 times per second**.
- **Arguments**:
  - `time`: Total milliseconds elapsed since the game started.
  - `delta` (or `dt`): Milliseconds elapsed since the **previous** frame (usually ~16.6ms at 60 FPS).
- **Purpose**: Checks continuous input (is the left arrow currently held down?), updates sprite velocities, checks proximity triggers, and shifts parallax backgrounds.

---

## 5. OOPS! Application: How `game.js` Boots the Engine

Open [`game.js`](file:///Users/khalidabdullah/AntiGravity/Oops!/game.js#L3342-L3420) and navigate to the bottom. You will find the master configuration object that initializes the entire game:

```javascript
// Virtual Canvas Dimensions
var VW = 960;
var VH = 540;

var config = {
  type: Phaser.AUTO,
  parent: "game-container",
  width: VW,
  height: VH,
  backgroundColor: "#0a0000",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 1550 },
      debug: false
    }
  },
  scene: [
    BootScene,
    IntroScene,
    WorldSelectScene,
    GameScene,
    WorldCompleteScene
  ]
};

var game = new Phaser.Game(config);
```

---

## 6. Code Walkthrough: Line-by-Line Breakdown

Let's dissect every property in that configuration object so nothing remains a mystery:

### 1. `type: Phaser.AUTO`
- **What it means**: Tells Phaser to check if the player's device supports **WebGL** (hardware-accelerated GPU rendering). If supported, it uses WebGL for blazing-fast 60 FPS rendering. If the player is on an older device where WebGL is disabled or crashes, Phaser automatically falls back to **HTML5 Canvas 2D**.
- **Transferable Skill**: Professional game engines always have a rendering fallback to ensure 100% device compatibility.

### 2. `parent: "game-container"`
- **What it means**: Specifies the ID of the HTML `<div>` in `play.html` where Phaser will inject the `<canvas>` element. Without this, Phaser would append the canvas to the very bottom of the `<body>`.

### 3. `width: VW (960)` and `height: VH (540)`
- **What it means**: This is the **internal virtual resolution** (a 16:9 aspect ratio). All physics coordinates, level layouts, spike placements, and player speeds are calculated against this fixed 960x540 box.
- **Why this is brilliant**: You never have to write different physics for an iPhone, an iPad, a 1080p monitor, or a 4K TV. The game logic always thinks the screen is 960x540!

### 4. `scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }`
- **What it means**: The **Scale Manager** takes our 960x540 virtual canvas and expands it to fill whatever screen size the player has, maintaining the exact 16:9 aspect ratio and centering it with letterboxing if necessary.

### 5. `physics: { default: "arcade", arcade: { gravity: { y: 1550 } } }`
- **What it means**: Enables **Phaser Arcade Physics**, a high-performance 2D physics engine optimized for fast platformers. It sets vertical gravity to `1550` pixels per second squared ($px/s^2$). Every frame, Phaser automatically pulls the player downward according to real Newtonian acceleration ($v = v_0 + g \cdot dt$).

### 6. `scene: [ BootScene, IntroScene, WorldSelectScene, GameScene, WorldCompleteScene ]`
- **What it means**: The Scene Pipeline array. Phaser automatically boots the **first** scene in the list (`BootScene`), while registering the others so they can be launched later using `this.scene.start("SceneKey")`.

---

## 7. Execution Flow: From Browser Load to First Jump

```
1. Browser loads play.html
   │
2. Loads phaser.min.js (Engine ready in memory)
   │
3. Loads game.js (Executes "new Phaser.Game(config)")
   │
4. Launches BootScene
   ├── preload() / createWorldAssets(): Generates 2.5D textures in memory
   └── Transitions to IntroScene
         │
5. IntroScene plays 3-trap troll demo
   └── User clicks "SKIP" or demo finishes -> Launches WorldSelectScene
         │
6. User selects Level 1 -> Launches GameScene({ level: 0 })
   ├── create(): Builds platforms, spikes, spawns player at (x: 100, y: 440)
   └── update(): Runs 60 times/sec reading arrow keys & running physics!
```

---

## 8. Common Mistakes Game Beginners Make

### ❌ Mistake 1: Moving sprites inside `update()` without using physics velocity
```javascript
// WRONG:
update() {
  if (this.cursors.right.isDown) {
    this.player.x += 5; // Direct coordinate teleportation!
  }
}
```
**Why it fails**: Direct coordinate assignment bypasses the physics engine. The player will teleport straight through walls and floor colliders!  
**The Professional Way**: Use `this.player.setVelocityX(260)`. Let the physics engine handle the movement so collisions are properly detected.

### ❌ Mistake 2: Creating objects inside `update()`
```javascript
// CATASTROPHIC ERROR:
update() {
  this.add.sprite(100, 100, 'coin'); // Spawns 60 coins every second!
}
```
**Why it fails**: `update()` runs 60 times per second. In 10 seconds, you will spawn 600 sprites, crashing the browser with an out-of-memory error. Object creation belongs in `create()`, never in `update()`.

---

## 9. Hands-On Exercise: Create Your First Standalone Phaser Scene

Now it is time to write code with your own hands! Do not copy-paste from `game.js`.

### Objective
Create a standalone HTML file named `practice_01_game_loop.html` in your workspace that:
1. Loads `phaser.min.js`.
2. Creates an 800x450 Phaser canvas.
3. In `create()`, spawns a simple colored rectangle for the player with Arcade Physics enabled.
4. Adds floor collision.
5. In `update()`, reads the keyboard arrow keys and moves the player left, right, and jumps with Space!

### Step-by-Step Template to Complete:
```html
<!DOCTYPE html>
<html>
<head>
  <title>Practice 01 — My First Phaser Game Loop</title>
  <script src="phaser.min.js"></script>
</head>
<body style="margin:0; background:#111; display:flex; justify-content:center; align-items:center; height:100vh;">
  <div id="practice-container"></div>
  <script>
    class MyFirstScene extends Phaser.Scene {
      constructor() {
        super({ key: "MyFirstScene" });
      }

      create() {
        // 1. Create a platform static group
        var platforms = this.physics.add.staticGroup();
        
        // Generate a simple floor texture: 800 wide, 32 high
        var gfx = this.make.graphics();
        gfx.fillStyle(0x2ed573, 1);
        gfx.fillRect(0, 0, 800, 32);
        gfx.generateTexture("floor_tex", 800, 32);

        // Add floor at bottom
        platforms.create(400, 434, "floor_tex");

        // 2. Generate a player box texture: 32x32 yellow box
        var pGfx = this.make.graphics();
        pGfx.fillStyle(0xffd32a, 1);
        pGfx.fillRect(0, 0, 32, 32);
        pGfx.generateTexture("player_tex", 32, 32);

        // 3. Create physics player
        this.player = this.physics.add.sprite(100, 200, "player_tex");
        this.player.setCollideWorldBounds(true);

        // 4. Add collider between player and platforms
        this.physics.add.collider(this.player, platforms);

        // 5. Setup keyboard cursors
        this.cursors = this.input.keyboard.createCursorKeys();
      }

      update(time, delta) {
        // TODO FOR YOU:
        // If left arrow held down -> setVelocityX(-200)
        // Else if right arrow held down -> setVelocityX(200)
        // Else -> setVelocityX(0)
        // If up arrow or space pressed AND player is touching floor -> setVelocityY(-500)
      }
    }

    var config = {
      type: Phaser.AUTO,
      parent: "practice-container",
      width: 800,
      height: 450,
      physics: {
        default: "arcade",
        arcade: { gravity: { y: 1200 }, debug: false }
      },
      scene: MyFirstScene
    };

    var game = new Phaser.Game(config);
  </script>
</body>
</html>
```

---

## 10. Knowledge Check & Diagnostic Quiz

Test your understanding by answering these questions:

1. **Question 1**: If the game is running at 60 FPS, approximately how many milliseconds elapse between consecutive calls to `update(time, delta)`?
2. **Question 2**: What is the difference between `this.physics.add.collider` and `this.physics.add.overlap`?
3. **Question 3**: Why does `Oops!` use a fixed virtual resolution of `960x540` rather than setting the game width to `window.innerWidth`?
4. **Question 4**: In the coordinate system of Phaser, if you increase an object's `y` property, does the object move up or down?
5. **Question 5**: What critical bug would happen if you wrote `this.add.text(...)` inside the `update()` method?

---

## 11. What You Should Be Able To Do Now

After completing this chapter, you should be able to:
- Explain what the 60 FPS game loop does in every 16.6ms frame.
- Read and understand the `config` object at the bottom of `game.js`.
- Explain the role of `init`, `preload`, `create`, and `update` in a Phaser Scene.
- Launch your own standalone Phaser 3 test scene without relying on AI prompts.

**Next Lesson**: Chapter 02 — *Player Physics, Bounding Boxes vs Visual Sprites, and Why Coyote Time Feels Great*.
