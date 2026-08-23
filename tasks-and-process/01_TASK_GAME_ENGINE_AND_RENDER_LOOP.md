# Task 01: Core Game Engine & Canvas Render Loop

## 🎯 Task Objective
Build a lightweight 60 FPS 2D game engine in vanilla JavaScript using HTML5 Canvas (`<canvas id="gameCanvas">`) that handles high-DPI scaling, fixed virtual resolution, delta timing (`dt`), and state machine transitions.

---

## 💻 Implemented Code Snippet

```javascript
// Virtual resolution – all game logic runs at 960x540
const VW = 960, VH = 540;
let scaleX = 1, scaleY = 1;

function resizeCanvas() {
  const ww = window.innerWidth, wh = window.innerHeight;
  const ratio = Math.min(ww / VW, wh / VH);
  canvas.width  = VW;
  canvas.height = VH;
  canvas.style.width  = Math.floor(VW * ratio) + "px";
  canvas.style.height = Math.floor(VH * ratio) + "px";
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Main Game Loop with Delta Timing
let lastTime = 0;
function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;

  update(dt);
  render(ctx);

  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);
```

---

## 🖼️ Actual Output Screenshot

![Task 1 Output](screenshots/task_01_game_engine_init.png)

---

## ⚙️ Process & Architecture Breakdown
1. **Virtual Resolution:** Game dimensions fixed at `960 × 540` ensuring identical gameplay across phones, tablets, and 4K monitors.
2. **Aspect Ratio Preservation:** Scaled using `Math.min(ww/VW, wh/VH)` with CSS pixelated rendering.
3. **State Machine:** Manages states: `start`, `playing`, `dead`, `levelcomplete`, and `gamecomplete`.
