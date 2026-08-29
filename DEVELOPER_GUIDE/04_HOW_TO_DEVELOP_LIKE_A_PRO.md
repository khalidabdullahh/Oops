# Professional Game Developer Manual
### *How to Manually Add Levels, Code New Traps, and Debug OOPS! Without AI*

---

## 📌 Introduction

The true measure of a game developer is the ability to open a code editor, understand how the pieces connect, write new features, and diagnose bugs **with your own hands and intellect**.

This practical handbook teaches you the exact workflows to extend and maintain **OOPS!** independently.

---

## 🏗️ 1. How to Add a New Level Manually

All level layouts are constructed inside the `buildWorld1Level(lvl)` method in [`game.js`](file:///Users/khalidabdullah/AntiGravity/Oops!/game.js#L2649-L3166).

### Anatomy of a Level Definition
A level builder receives two arguments:
- `lvl`: The 0-indexed stage number (e.g. `0` = Stage 1, `29` = Stage 30).
- `data`: An object containing helper groups and coordinates.

### The 5 Essential Building Blocks
Inside `buildWorld1Level`, you construct the stage using five simple helper calls:

#### 1. Spawn Point
```javascript
this.playerSpawn = { x: 100, y: 440 };
```
* Sets the starting coordinates for the ninja hero.

#### 2. Solid Ground & Platforms
```javascript
// createPlatform(x, y, width, height, isCrumbling)
this.createPlatform(100, 480, 200, 32, false); // Solid sandstone floor
this.createPlatform(400, 380, 120, 24, true);  // Vanishing sandstone ledge!
```
* Setting the last parameter to `true` marks the platform as **crumbling sandstone**: it shakes for 200ms when touched, then drops through the floor!

#### 3. Hazard Spikes
```javascript
// createSpike(x, y, width, isHidden)
this.createSpike(300, 470, 48, false); // Visible ground spike
this.createSpike(550, 470, 32, true);  // Sneaky pop-up spike!
```
* If `isHidden` is `true`, the spike is invisible until the player walks within 80 pixels, then springs upward with a metallic click!

#### 4. Heavy Drop Crushers
```javascript
// createCrusher(x, y, width, height, dropSpeed)
this.createCrusher(450, 60, 80, 100, 850);
```
* Hangs high near the ceiling. When `player.x` passes beneath, it accelerates downward at 850 px/s to crush the hero, then slowly retracts back to the ceiling.

#### 5. Exit Door
```javascript
// createDoor(x, y, isFleeing)
this.createDoor(880, 440, false); // Standard exit door
```
* If `isFleeing` is set to `true`, the door accelerates away as soon as the player jumps toward it, requiring an athletic aerial intercept!

---

## 🧩 2. Step-by-Step: Adding a Custom "Stage 31"

Want to add a 31st level? Here is the exact process:

1. Open [`game.js`](file:///Users/khalidabdullah/AntiGravity/Oops!/game.js).
2. Locate `buildWorld1Level(lvl)` around line 2650.
3. Find the `switch(lvl)` statement and add `case 30:` (remember, index 30 is Stage 31):
```javascript
case 30: // STAGE 31: THE SKY HOP
  this.playerSpawn = { x: 80, y: 440 };

  // Starting safe platform
  this.createPlatform(80, 480, 160, 32, false);

  // Middle island with pop-up spike
  this.createPlatform(360, 400, 140, 24, false);
  this.createSpike(360, 388, 32, true);

  // Overhead crusher over the middle gap
  this.createCrusher(240, 60, 80, 120, 800);

  // Bouncy spring trampoline to launch across the chasm
  this.createSpring(400, 388);

  // Final landing ledge with exit door
  this.createPlatform(780, 320, 140, 24, false);
  this.createDoor(800, 280, false);
  break;
```
4. Save `game.js`, refresh your browser, and play your new stage!

---

## 🛠️ 3. How to Debug Game Bugs Like a Pro

When something breaks, **do not panic and do not immediately ask AI to rewrite everything**. Use this scientific diagnostic routine:

### Problem 1: Player Falls Right Through a Platform
* **Hypothesis 1**: Did you use `physics.add.sprite()` instead of `physics.add.staticGroup()` for the platform?
  - Dynamic sprites fall under gravity! Static bodies never move.
* **Hypothesis 2**: Is the platform marked as immovable?
  - Check `platform.body.setImmovable(true)`.
* **Hypothesis 3**: Did you forget to add the collider?
  - Verify that `this.physics.add.collider(this.player, this.platforms)` exists in `create()`.

### Problem 2: Jumping Feels "Heavy" or "Floaty"
* Platformer jumping is controlled by two numbers: **Gravity** and **Jump Velocity**.
* In `config`: `gravity: { y: 1550 }`.
* In `GameScene.js`: `player.setVelocityY(-560)`.
* **Rule of Thumb**:
  - If jumps feel too floaty (like the moon): Increase gravity ($1800$) and increase jump velocity ($-620$).
  - If jumps feel too abrupt: Decrease gravity ($1300$) and decrease jump velocity ($-480$).

### Problem 3: Sound Doesn't Play on Mobile Browsers
* **Why it happens**: Apple iOS and Google Chrome block all Web Audio until the user interacts with the screen (touch or click).
* **The Fix**: In your sound triggering code, always check:
```javascript
if (AudioEngine.ctx && AudioEngine.ctx.state === "suspended") {
  AudioEngine.ctx.resume();
}
```

### Problem 4: Resetting Corrupted Save Data
If you ever test levels and want to reset your progress back to Stage 1:
1. Press `F12` (or `Cmd + Option + I` on Mac) to open **Chrome DevTools**.
2. Click the **Application** tab at the top.
3. In the left sidebar, expand **Storage** $\rightarrow$ **Local Storage** $\rightarrow$ select your game URL.
4. Right-click `oops_world1_master_v1` $\rightarrow$ click **Delete**.
5. Refresh the page. You now have a clean, fresh game!

---

## 🚀 4. Safe Git & Deployment Workflow

Whenever you modify any game files, follow this professional 4-step deployment cycle:

```bash
# Step 1: Test locally via Python HTTP server
cd /Users/khalidabdullah/AntiGravity/Oops!
python3 -m http.server 8000
# Open http://localhost:8000/play.html in your browser and test!

# Step 2: Always mirror your web assets to www/ for Android builds
cp index.html play.html game.js style.css portal.css about.html privacy.html terms.html www/

# Step 3: Run the automated test suite
python3 scripts/test_complete_seo_suite.py

# Step 4: Commit cleanly and push to Vercel
git add -A
git commit -m "feat(level): add custom stage layout and tune jump physics"
git push origin main
```
Within 20 seconds, Vercel automatically deploys your updates live to the world!
