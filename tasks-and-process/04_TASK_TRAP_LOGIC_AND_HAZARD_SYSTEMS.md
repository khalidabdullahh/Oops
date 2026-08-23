# Task 04: Deadly Traps, Hazard Systems & Troll Mechanics

## 🎯 Task Objective
Implement modular trap classes including vanishing tiles, deceptive fake platforms, spinning circular saws with path interpolation, directional lethal spikes, jump trampolines, and teleporter portals.

---

## 💻 Implemented Code Snippet

```javascript
// Vanishing Platform Trap
class Platform {
  update(dt) {
    if (this.type === TILE.VANISH) {
      if (this.vanishTimer > 0) {
        this.vanishTimer -= dt;
        if (this.vanishTimer <= 0) { 
          this.vanished = true; 
          this.respawnTimer = 2.5; 
        }
      }
      if (this.vanished) {
        this.respawnTimer -= dt;
        if (this.respawnTimer <= 0) { this.vanished = false; }
      }
    }
  }
}

// Moving Buzzsaw Hazard
class Saw {
  constructor(x, y, opts = {}) {
    this.x = x; this.y = y;
    this.radius = opts.radius || 18;
    this.speed = opts.speed || 3;
    this.angle = 0;
    this.pathX = opts.pathX || 0;
    this.pathRange = opts.pathRange || 0;
    this.pathSpeed = opts.pathSpeed || 80;
  }
  update(dt) {
    this.angle += this.speed * dt;
    if (this.pathRange > 0) {
      this.x += this.dir * this.pathSpeed * dt;
      if (Math.abs(this.x - this.startX) >= this.pathRange) this.dir *= -1;
    }
  }
}
```

---

## 🖼️ Actual Output Screenshot

![Task 4 Output](screenshots/task_03_hazards_and_traps.png)

---

## ⚙️ Implemented Trap Types:
- **VANISH Platforms:** Trigger when stood on and disappear after a short delay (0.4s – 0.8s).
- **FAKE Platforms:** Look identical to solid ground but have no collision, causing the player to fall.
- **SPINNING SAWS:** Circular blades that patrol linear paths with rotational cutting animation.
- **ICE SURFACES:** Reduces player friction to `0.02`, creating treacherous sliding control.
- **TELEPORT PORTALS:** Warp the player instantly to target exit coordinates.
