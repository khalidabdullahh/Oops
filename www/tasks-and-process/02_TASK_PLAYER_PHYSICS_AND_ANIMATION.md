# Task 02: Player Physics, Controls & Procedural Animation

## 🎯 Task Objective
Implement smooth, tight, responsive platformer physics with **Coyote Time**, **Jump Buffering**, horizontal friction, and procedural squish & stretch animations.

---

## 💻 Implemented Code Snippet

```javascript
const PLAYER_W = 22, PLAYER_H = 30;
const GRAVITY  = 1400;
const JUMP_VEL = -560;
const WALK_SPD = 220;
const COYOTE_TIME = 0.10;
const JUMP_BUFFER = 0.10;

class Player {
  update(dt, level) {
    if (!this.alive) return;

    // Coyote Time countdown
    if (this.onGround) {
      this.coyoteTimer = COYOTE_TIME;
    } else {
      this.coyoteTimer -= dt;
    }

    // Jump Buffering
    if (pressed("ArrowUp", "KeyW", "Space")) {
      this.jumpBuffer = JUMP_BUFFER;
    } else {
      this.jumpBuffer -= dt;
    }

    // Execute Jump if buffered and coyote valid
    if (this.jumpBuffer > 0 && this.coyoteTimer > 0) {
      this.vy = JUMP_VEL;
      this.jumpBuffer = 0;
      this.coyoteTimer = 0;
      this.onGround = false;
      this.squishX = 0.7; // Stretch on jump
      this.squishY = 1.3;
      SFX.jump();
    }

    // Gravity and velocity integration
    this.vy = Math.min(this.vy + GRAVITY * dt, 900);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }
}
```

---

## 🖼️ Actual Output Screenshot

![Task 2 Output](screenshots/task_02_player_physics_mechanics.png)

---

## ⚙️ Process & Architecture Breakdown
- **Coyote Time (0.10s):** Allows the player to jump even a fraction of a second after stepping off a ledge.
- **Jump Buffering (0.10s):** Registers a jump input before landing and triggers immediately upon touching the ground.
- **Squish & Stretch:** Procedural sprite deformation during landing impact and jump launches for high game feel.
