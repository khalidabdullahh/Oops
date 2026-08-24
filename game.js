// ═══════════════════════════════════════════════════════════
//  Oops! – Main Game Engine
//  A deceptive platformer. Nothing is what it seems.
// ═══════════════════════════════════════════════════════════

"use strict";

// ─── Canvas Setup ───────────────────────────────────────────
const canvas = document.getElementById("gameCanvas");
const ctx    = canvas.getContext("2d");

// Virtual resolution – all game logic runs at this size
const VW = 960, VH = 540;
let scaleX = 1, scaleY = 1, offsetX = 0, offsetY = 0;

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

// ─── Audio Engine ───────────────────────────────────────────
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let musicMuted = false;
let musicInterval = null;
let musicStep = 0;

// Upbeat retro minor arpeggio melody loop
const MELODY = [
  196, 233, 293, 392, 196, 233, 293, 392, // Gm
  174, 220, 261, 349, 174, 220, 261, 349, // F
  155, 196, 233, 311, 155, 196, 233, 311, // Eb
  174, 220, 261, 349, 196, 233, 293, 392  // F -> Gm transition
];

function playMusicStep() {
  if (musicMuted || !audioCtx || gameState !== "playing") return;
  const freq = MELODY[musicStep % MELODY.length];
  playTone(freq, "triangle", 0.18, 0.035);
  musicStep++;
}

function startMusic() {
  if (musicInterval) clearInterval(musicInterval);
  musicStep = 0;
  musicInterval = setInterval(playMusicStep, 240); // 125 BPM
}

function stopMusic() {
  if (musicInterval) {
    clearInterval(musicInterval);
    musicInterval = null;
  }
}

function initAudio() {
  if (!audioCtx) {
    audioCtx = new AudioCtx();
    startMusic();
  }
}

function playTone(freq, type = "square", duration = 0.08, vol = 0.15, delay = 0) {
  if (!audioCtx || musicMuted) return;
  const t   = audioCtx.currentTime + delay;
  const osc = audioCtx.createOscillator();
  const gain= audioCtx.createGain();
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.start(t); osc.stop(t + duration);
}

const SFX = {
  jump()   { playTone(300, "square", 0.1, 0.18); playTone(420, "square", 0.07, 0.1, 0.04); },
  land()   { playTone(120, "sawtooth", 0.06, 0.12); },
  die()    { for (let i=0;i<5;i++) playTone(400-i*60,"sawtooth",0.12,0.18,i*0.07); },
  win()    { [523,659,784,1047].forEach((f,i)=>playTone(f,"square",0.15,0.2,i*0.1)); },
  trap()   { playTone(200,"sawtooth",0.15,0.2); playTone(150,"sawtooth",0.1,0.15,0.08); },
  portal() { for(let i=0;i<6;i++) playTone(300+i*80,"sine",0.08,0.15,i*0.05); },
  collect(){ playTone(880,"square",0.06,0.14); playTone(1100,"square",0.05,0.12,0.06); },
};

// ─── Input ──────────────────────────────────────────────────
const keys = {};
document.addEventListener("keydown", e => { keys[e.code] = true; e.preventDefault?.(); });
document.addEventListener("keyup",   e => { keys[e.code] = false; });

// Mobile touch controls & gamepad
function setupMobileControls() {
  const mc = document.getElementById("mobile-controls");
  const toggleBtn = document.getElementById("btn-touch-toggle");
  if (!mc) return;

  function isTouchDevice() {
    return ('ontouchstart' in window) || 
           (navigator.maxTouchPoints > 0) || 
           (window.innerWidth <= 1024);
  }

  // Set initial visibility
  let controlsVisible = isTouchDevice();
  if (controlsVisible) {
    mc.classList.remove("hidden");
  } else {
    mc.classList.add("hidden");
  }

  // Toggle button in HUD
  if (toggleBtn) {
    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      controlsVisible = !controlsVisible;
      mc.classList.toggle("hidden", !controlsVisible);
    });
  }

  // Sound toggle button in HUD
  const soundBtn = document.getElementById("btn-sound-toggle");
  if (soundBtn) {
    soundBtn.textContent = musicMuted ? "🔇" : "🔊";
    soundBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      musicMuted = !musicMuted;
      soundBtn.textContent = musicMuted ? "🔇" : "🔊";
      initAudio();
      if (musicMuted) {
        stopMusic();
      } else {
        if (gameState === "playing") {
          startMusic();
        }
      }
    });
  }

  function bindBtn(id, code) {
    const btn = document.getElementById(id);
    if (!btn) return;

    const press = (e) => {
      if (e) e.preventDefault();
      keys[code] = true;
      btn.classList.add("active");
      initAudio();
      if (navigator.vibrate) try { navigator.vibrate(12); } catch (_) {}
    };

    const release = (e) => {
      if (e) e.preventDefault();
      keys[code] = false;
      btn.classList.remove("active");
    };

    btn.addEventListener("touchstart", press, { passive: false });
    btn.addEventListener("touchend", release, { passive: false });
    btn.addEventListener("touchcancel", release, { passive: false });
    btn.addEventListener("mousedown", press);
    btn.addEventListener("mouseup", release);
    btn.addEventListener("mouseleave", release);
  }

  bindBtn("btn-left",    "ArrowLeft");
  bindBtn("btn-right",   "ArrowRight");
  bindBtn("btn-jump",    "Space");
  bindBtn("btn-restart", "KeyR");
}

document.addEventListener("DOMContentLoaded", setupMobileControls);
setTimeout(setupMobileControls, 50);
setTimeout(setupMobileControls, 300);
window.addEventListener("resize", () => {
  const mc = document.getElementById("mobile-controls");
  if (mc && (window.innerWidth <= 1024 || 'ontouchstart' in window || navigator.maxTouchPoints > 0)) {
    mc.classList.remove("hidden");
  }
});

function pressed(...codes) { return codes.some(c => keys[c]); }

// ─── Math Utils ─────────────────────────────────────────────
const lerp = (a,b,t) => a + (b-a)*t;
const clamp = (v,lo,hi) => Math.max(lo, Math.min(hi, v));
const rand = (min,max) => Math.random()*(max-min)+min;
const randInt = (min,max) => Math.floor(rand(min,max+1));

// ─── Color Palette ──────────────────────────────────────────
const PALETTE = {
  sky1: "#1a0533", sky2: "#2d1b69",
  ground: "#3d2b1f", groundTop: "#5a3e28",
  player: "#e8e8e8", playerEye: "#ff4757",
  platform: "#4a7c59", platformTop: "#6ab87a",
  danger: "#ff4757", dangerGlow: "rgba(255,71,87,0.4)",
  exit: "#ffd32a", exitGlow: "rgba(255,211,42,0.5)",
  portal1: "#a855f7", portal2: "#ec4899",
  coin: "#ffd32a",
  spike: "#c0c0d0",
  saw: "#ff6b35",
  fake: "#4a4a6a",
};

// ─── World Themes ────────────────────────────────────────────
const WORLD_THEMES = [
  { name:"DESERT", bg1:"#7a2000", bg2:"#b03800",
    ground:"#c8601a", groundTop:"#e07820",
    platform:"#c8601a", platformTop:"#d87020", fake:"#a04018",
    danger:"#cc2200", spike:"#cc2200", saw:"#ff6600",
    exit:"#e8c060", exitGlow:"rgba(232,192,96,0.5)",
    portal1:"#ff8800", portal2:"#cc4400",
    fog:"rgba(120,32,0,0.15)", crackColor:"rgba(0,0,0,0.18)" },
  { name:"SHADOW", bg1:"#180c06", bg2:"#2a1508",
    ground:"#58301e", groundTop:"#7a4028",
    platform:"#58301e", platformTop:"#6a3820", fake:"#381808",
    danger:"#882200", spike:"#aa3300", saw:"#cc4400",
    exit:"#c8a030", exitGlow:"rgba(200,160,48,0.5)",
    portal1:"#c04000", portal2:"#802000",
    fog:"rgba(24,12,6,0.28)", crackColor:"rgba(0,0,0,0.3)" },
  { name:"VOID", bg1:"#180540", bg2:"#2a0f60",
    ground:"#5a3898", groundTop:"#6a48a8",
    platform:"#5a3898", platformTop:"#6848a0", fake:"#3a1870",
    danger:"#8820c0", spike:"#9030d0", saw:"#a040e0",
    exit:"#e0a000", exitGlow:"rgba(224,160,0,0.5)",
    portal1:"#a040e0", portal2:"#6020a0",
    fog:"rgba(24,5,64,0.25)", crackColor:"rgba(80,40,160,0.12)" },
];
function getTheme(idx) {
  return idx <= 2 ? WORLD_THEMES[0] : idx <= 5 ? WORLD_THEMES[1] : WORLD_THEMES[2];
}
let activeTheme = WORLD_THEMES[0];

// ─── Particle System ────────────────────────────────────────
class Particle {
  constructor(x, y, vx, vy, color, life, size = 4) {
    this.x=x; this.y=y; this.vx=vx; this.vy=vy;
    this.color=color; this.life=life; this.maxLife=life;
    this.size=size;
  }
  update(dt) {
    this.x += this.vx * dt; this.y += this.vy * dt;
    this.vy += 400 * dt; // gravity on particles
    this.life -= dt;
  }
  draw(ctx) {
    const a = this.life / this.maxLife;
    ctx.globalAlpha = a * a;
    ctx.fillStyle = this.color;
    const s = this.size * a;
    ctx.fillRect(this.x - s/2, this.y - s/2, s, s);
    ctx.globalAlpha = 1;
  }
}

const particles = [];
function spawnParticles(x, y, color, n=12, speed=180) {
  for (let i=0;i<n;i++) {
    const angle = rand(0, Math.PI*2);
    const spd   = rand(speed*0.3, speed);
    particles.push(new Particle(x, y,
      Math.cos(angle)*spd, Math.sin(angle)*spd - rand(0,50),
      color, rand(0.3, 0.7), rand(3,7)));
  }
}

function spawnConfetti(x, y, n=36) {
  const colors = ["#ff4757", "#2ed573", "#ffa502", "#1e90ff", "#ff6b81", "#ffd32a", "#a855f7"];
  for (let i=0;i<n;i++) {
    const angle = rand(0, Math.PI*2);
    const spd   = rand(120, 260);
    const col   = colors[Math.floor(Math.random()*colors.length)];
    particles.push(new Particle(x, y,
      Math.cos(angle)*spd, Math.sin(angle)*spd - rand(30,100),
      col, rand(0.5, 1.1), rand(3,6)));
  }
}

// ─── Screen Shake ───────────────────────────────────────────
let shakeAmt = 0, shakeDur = 0;
function shake(amount, dur) { shakeAmt = amount; shakeDur = dur; }

// ─── Game State ─────────────────────────────────────────────
let gameState  = "start";   // start | playing | dead | levelcomplete | gamecomplete
let currentLevel = 0;
let deaths = 0;
let levelTimer = 0;

// ─── Player ─────────────────────────────────────────────────
const PLAYER_W = 24, PLAYER_H = 36;
const GRAVITY  = 1400;
const JUMP_VEL = -560;
const WALK_SPD = 220;
const MAX_FALL = 900;
const COYOTE_TIME = 0.1;
const JUMP_BUFFER = 0.1;

class Player {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.w = PLAYER_W; this.h = PLAYER_H;
    this.onGround = false;
    this.coyoteTimer = 0;
    this.jumpBuffer  = 0;
    this.alive = true;
    this.blinkTimer = 0;
    this.walkFrame = 0;
    this.walkTimer = 0;
    this.facingRight = true;
    this.squishX = 1; this.squishY = 1;
    // Animation state
    this.animState  = "idle";
    this.landTimer  = 0;
    this.idleBob    = 0;
    this.runLegAng  = 0;
    this.armSwing   = 0;
    this.time       = 0;
    // Portal exit animation properties
    this.exitingPortal = false;
    this.exitRotation = 0;
  }

  get left()   { return this.x; }
  get right()  { return this.x + this.w; }
  get top()    { return this.y; }
  get bottom() { return this.y + this.h; }
  get cx()     { return this.x + this.w/2; }
  get cy()     { return this.y + this.h/2; }

  update(dt, level) {
    if (!this.alive) return;
    if (this.exitingPortal) return;

    this.time += dt;

    // Squish recovery
    this.squishX = lerp(this.squishX, 1, dt * 14);
    this.squishY = lerp(this.squishY, 1, dt * 14);

    // Input
    let moveX = 0;
    if (pressed("ArrowLeft","KeyA"))  { moveX = -1; this.facingRight = false; }
    if (pressed("ArrowRight","KeyD")) { moveX =  1; this.facingRight = true;  }

    // Horizontal movement
    this.vx = moveX * WALK_SPD;

    // Animation state machine
    if (!this.onGround) {
      this.animState = this.vy < 0 ? "jump" : "fall";
    } else if (this.landTimer > 0) {
      this.animState = "land";
      this.landTimer -= dt;
    } else if (Math.abs(moveX) > 0) {
      this.animState = "run";
    } else {
      this.animState = "idle";
    }

    // Leg & arm swing for run
    if (this.animState === "run") {
      this.runLegAng += dt * 14;
      this.armSwing  += dt * 14;
    } else {
      this.runLegAng = lerp(this.runLegAng, 0, dt * 8);
      this.armSwing  = lerp(this.armSwing,  0, dt * 8);
    }

    this.idleBob = Math.sin(this.time * 2.5) * 1.2;
    this.walkTimer += dt;

    // Coyote time
    if (this.onGround) this.coyoteTimer = COYOTE_TIME;
    else if (this.coyoteTimer > 0) this.coyoteTimer -= dt;

    // Jump buffer
    if (pressed("ArrowUp","KeyW","Space")) this.jumpBuffer = JUMP_BUFFER;
    else if (this.jumpBuffer > 0) this.jumpBuffer -= dt;

    // Jump
    if (this.jumpBuffer > 0 && this.coyoteTimer > 0) {
      this.vy = JUMP_VEL;
      this.coyoteTimer = 0;
      this.jumpBuffer  = 0;
      this.squishX = 0.62; this.squishY = 1.5;
      SFX.jump();
    }

    // Variable jump height
    if (this.vy < -200 && !pressed("ArrowUp","KeyW","Space")) {
      this.vy += 1600 * dt;
    }

    // Gravity
    this.vy = Math.min(this.vy + GRAVITY * dt, MAX_FALL);

    // Move & collide
    const wasOnGround = this.onGround;
    this.onGround = false;

    this.x += this.vx * dt;
    level.resolveX(this);

    this.y += this.vy * dt;
    level.resolveY(this);

    // Land squish
    if (!wasOnGround && this.onGround) {
      this.squishX = 1.4; this.squishY = 0.65;
      this.landTimer = 0.12;
      if (Math.abs(this.vy) > 200) SFX.land();
    }

    this.blinkTimer += dt;

    // Kill if fell off
    if (this.y > VH + 100) this.die("fell off");
  }

  die(reason) {
    if (!this.alive) return;
    this.alive = false;
    spawnParticles(this.cx, this.cy, "#ff9f43", 20, 260);
    spawnParticles(this.cx, this.cy, "#ee5a24", 14, 190);
    spawnParticles(this.cx, this.cy, "#fff", 8, 130);
    shake(10, 0.45);
    SFX.die();
  }

  // ── Cartoon Character Renderer ───────────────────────────────
  draw(ctx) {
    if (!this.alive) return;
    const state = this.animState;
    const t     = this.time;

    ctx.save();
    if (this.exitingPortal) {
      ctx.translate(this.cx, this.cy);
      ctx.rotate(this.exitRotation);
      ctx.scale(this.squishX, this.squishY);
    } else {
      ctx.translate(this.cx, this.y + this.h); // pivot at feet
      if (!this.facingRight) ctx.scale(-1, 1);
      ctx.scale(this.squishX, this.squishY);
    }

    const bob = (state === "idle") ? this.idleBob : 0;

    // Shadow
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.ellipse(0, 1, 12 * this.squishX, 3.5, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // 1. Legs & Shoes
    const legSwing = Math.sin(this.runLegAng) * 0.45;
    if (state === "jump") {
      this._drawLeg(ctx, -5, bob, -0.55);
      this._drawLeg(ctx,  5, bob,  0.50);
    } else if (state === "fall") {
      this._drawLeg(ctx, -5, bob, -0.2);
      this._drawLeg(ctx,  5, bob,  0.2);
    } else if (state === "land") {
      this._drawLeg(ctx, -6, bob, -0.65);
      this._drawLeg(ctx,  6, bob,  0.65);
    } else if (state === "run") {
      this._drawLeg(ctx, -4, bob,  legSwing);
      this._drawLeg(ctx,  4, bob, -legSwing);
    } else {
      const il = Math.sin(t*2.5)*0.04;
      this._drawLeg(ctx, -4, bob,  il);
      this._drawLeg(ctx,  4, bob, -il);
    }

    // 2. Torso (Pink hoodie with zipper and pocket)
    const bodyY = bob - 22;
    ctx.fillStyle = "#ff4757"; // cute red/pink hoodie
    this._roundRect(ctx, -9, bodyY, 18, 14, 4); ctx.fill();
    // Pocket
    ctx.fillStyle = "#e84118";
    this._roundRect(ctx, -5, bodyY+7, 10, 5, 2); ctx.fill();
    // Zipper
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, bodyY+1); ctx.lineTo(0, bodyY+13); ctx.stroke();
    // Hoodie strings
    ctx.strokeStyle = "#f5f6fa"; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-3, bodyY+3); ctx.lineTo(-3, bodyY+10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(3, bodyY+3); ctx.lineTo(3, bodyY+9); ctx.stroke();
    // Knots
    ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.arc(-3, bodyY+10, 1.2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(3, bodyY+9, 1.2, 0, Math.PI*2); ctx.fill();

    // 3. Arms
    const aSwing = Math.sin(this.armSwing) * 0.4;
    if (state === "jump") {
      this._drawArm(ctx, -9, bob-18, -0.9);
      this._drawArm(ctx,  9, bob-18,  0.9);
    } else if (state === "fall") {
      this._drawArm(ctx, -9, bob-18, -0.5);
      this._drawArm(ctx,  9, bob-18,  0.5);
    } else if (state === "land") {
      this._drawArm(ctx, -9, bob-18, -0.8);
      this._drawArm(ctx,  9, bob-18,  0.8);
    } else if (state === "run") {
      this._drawArm(ctx, -9, bob-18, -aSwing-0.3);
      this._drawArm(ctx,  9, bob-18,  aSwing+0.3);
    } else {
      const ia = Math.sin(t*2.5)*0.08;
      this._drawArm(ctx, -9, bob-18, -0.15+ia);
      this._drawArm(ctx,  9, bob-18,  0.15-ia);
    }

    // 4. Head, Face & Ears
    const headY = bob - 34;
    const headR = 10;
    
    // Ears
    ctx.fillStyle = "#ffd6a5";
    ctx.beginPath(); ctx.arc(-headR, headY, 2.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc( headR, headY, 2.5, 0, Math.PI*2); ctx.fill();
    
    // Face
    ctx.beginPath(); ctx.arc(0, headY, headR, 0, Math.PI*2); ctx.fill();

    // Blush Cheeks
    ctx.globalAlpha = 0.45; ctx.fillStyle = "#ff7979";
    ctx.beginPath(); ctx.ellipse(-5, headY+3, 3, 2, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse( 5, headY+3, 3, 2, 0, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;

    // Hair (Detailed brown hair)
    ctx.fillStyle = "#2d1a00";
    ctx.beginPath(); ctx.arc(0, headY-2, headR+1.2, Math.PI, Math.PI*2); ctx.fill();
    // Tufts / spikes
    ctx.beginPath(); ctx.arc(-headR+1, headY-3, 4.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc( headR-1, headY-3, 3.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(2, headY-headR, 4, 0, Math.PI*2); ctx.fill();

    // Hoodie Collar
    ctx.fillStyle = "#e84118";
    ctx.beginPath(); ctx.arc(0, headY+8, 6.5, Math.PI*1.1, Math.PI*1.9); ctx.fill();

    // Eyebrows
    ctx.strokeStyle = "#2d1a00"; ctx.lineWidth = 1.2; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-6, headY-5); ctx.lineTo(-2, headY-4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo( 2, headY-4); ctx.lineTo( 6, headY-5); ctx.stroke();

    // Eyes (detailed blue eyes)
    const blink = this.blinkTimer % 3.5 > 3.2;
    if (blink) {
      ctx.strokeStyle = "#2d1a00"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-5, headY-1); ctx.lineTo(-2, headY-1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo( 2, headY-1); ctx.lineTo( 5, headY-1); ctx.stroke();
    } else {
      const lookY = state === "jump" ? -0.8 : (state === "fall" ? 0.8 : 0);
      
      // Sclera (White)
      ctx.fillStyle = "#ffffff";
      ctx.beginPath(); ctx.ellipse(-4, headY-1, 3.5, 4, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse( 4, headY-1, 3.5, 4, 0, 0, Math.PI*2); ctx.fill();
      
      // Iris (Blue)
      ctx.fillStyle = "#3498db";
      ctx.beginPath(); ctx.ellipse(-4+0.5, headY-1+lookY, 2.4, 2.6, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse( 4+0.5, headY-1+lookY, 2.4, 2.6, 0, 0, Math.PI*2); ctx.fill();
      
      // Pupil (Black)
      ctx.fillStyle = "#2c3e50";
      ctx.beginPath(); ctx.ellipse(-4+0.9, headY-1+lookY, 1.2, 1.4, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse( 4+0.9, headY-1+lookY, 1.2, 1.4, 0, 0, Math.PI*2); ctx.fill();
      
      // Highlights (White glint)
      ctx.fillStyle = "#ffffff";
      ctx.beginPath(); ctx.arc(-3.4, headY-1.8+lookY, 0.7, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc( 4.6, headY-1.8+lookY, 0.7, 0, Math.PI*2); ctx.fill();
    }

    // Mouth
    ctx.strokeStyle = "#2d1a00"; ctx.lineWidth = 1.2; ctx.lineCap = "round";
    if (state === "jump" || state === "fall") {
      ctx.fillStyle = "#2d1a00";
      ctx.beginPath(); ctx.ellipse(0, headY+4.5, 2.2, 2.8, 0, 0, Math.PI*2); ctx.fill();
    } else if (state === "land") {
      ctx.beginPath(); ctx.moveTo(-2.5, headY+4.5); ctx.lineTo(2.5, headY+4.5); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(0, headY+2.5, 3.5, 0.25, Math.PI - 0.25); ctx.stroke();
    }

    ctx.restore();
  }

  _drawLeg(ctx, xOff, bob, angle) {
    ctx.save();
    ctx.translate(xOff, bob-10); ctx.rotate(angle);
    // Pants
    ctx.fillStyle = "#2e86de"; // Blue jeans
    this._roundRect(ctx, -3.5, 0, 7, 8, 2.5); ctx.fill();
    ctx.translate(0, 7); ctx.rotate(angle * 0.35);
    this._roundRect(ctx, -3, 0, 6, 7, 2); ctx.fill();
    // Shoe base
    ctx.translate(0, 6);
    ctx.fillStyle = "#ffffff";
    this._roundRect(ctx, -3.8, 0, 8, 4.5, 1.5); ctx.fill();
    // Sneaker detail
    ctx.fillStyle = "#ff4757";
    ctx.fillRect(-3.8, 0, 8, 1.8);
    ctx.restore();
  }

  _drawArm(ctx, xOff, yOff, angle) {
    ctx.save();
    ctx.translate(xOff, yOff); ctx.rotate(angle);
    ctx.fillStyle = "#ff4757"; // Hoodie sleeve
    this._roundRect(ctx, -2.8, 0, 5.6, 8, 2.5); ctx.fill();
    ctx.translate(0, 7); ctx.rotate(angle * 0.3);
    ctx.fillStyle = "#ffd6a5"; // Hand skin
    this._roundRect(ctx, -2.2, 0, 4.4, 6, 2); ctx.fill();
    ctx.translate(0, 5);
    ctx.beginPath(); ctx.arc(0, 0, 2.6, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w, y,   x+w, y+r);
    ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h); ctx.quadraticCurveTo(x,   y+h, x,   y+h-r);
    ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x,   y,   x+r, y);
    ctx.closePath();
  }
}


// ─── Tile / Platform Types ───────────────────────────────────
const TILE = {
  SOLID:     1,
  PLATFORM:  2, // one-way
  SPIKE:     3,
  SAW:       4,
  VANISH:    5, // disappears when stood on
  FAKE:      6, // looks solid, isn't
  TRAMPOLINE:7,
  ICE:       8,
  LAVA:      9,
};

// ─── Level Definition ────────────────────────────────────────
// Each level = { playerStart, exitPos, platforms[], hazards[], traps[], bg }
// Traps: { type, trigger, ... }

class Platform {
  constructor(x, y, w, h, type=TILE.SOLID, opts={}) {
    this.x=x; this.y=y; this.w=w; this.h=h; this.type=type;
    // Moving
    this.moveX = opts.moveX||0; this.moveY = opts.moveY||0;
    this.moveRange = opts.moveRange||0;
    this.moveSpeed = opts.moveSpeed||0;
    this.moveDir   = 1;
    this.startX    = x; this.startY = y;
    // Vanish
    this.vanishTimer = 0; this.vanished = false; this.vanishDelay = opts.vanishDelay||0.8;
    this.respawnTimer= 0;
    // Fake
    this.revealed = false;
    // Trampoline bounce
    this.bounceVel = opts.bounceVel || -900;
    // Ice friction
    this.friction  = type===TILE.ICE ? 0.02 : 1;
    // Visual
    this.color     = opts.color || null;
    this.label     = opts.label || null;
    // Lava
    this.lavaPhase = rand(0, Math.PI*2);
    this.active    = true; // for timed traps
  }

  get left()   { return this.x; }
  get right()  { return this.x + this.w; }
  get top()    { return this.y; }
  get bottom() { return this.y + this.h; }

  update(dt) {
    if (!this.active) return;
    // Moving platform
    if (this.moveRange > 0) {
      const dist = this.moveDir * this.moveSpeed * dt;
      if (this.moveX !== 0) {
        this.x += dist;
        if (Math.abs(this.x - this.startX) >= this.moveRange) this.moveDir *= -1;
      }
      if (this.moveY !== 0) {
        this.y += dist;
        if (Math.abs(this.y - this.startY) >= this.moveRange) this.moveDir *= -1;
      }
    }

    // Vanish
    if (this.type === TILE.VANISH) {
      if (this.vanishTimer > 0) {
        this.vanishTimer -= dt;
        if (this.vanishTimer <= 0) { this.vanished = true; this.respawnTimer = 2.5; }
      }
      if (this.vanished) {
        this.respawnTimer -= dt;
        if (this.respawnTimer <= 0) { this.vanished = false; }
      }
    }

    this.lavaPhase += dt * 2;
  }

  draw(ctx, time) {
    if (this.vanished && this.type===TILE.VANISH) {
      // ghost outline
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = "#88f";
      ctx.lineWidth = 1;
      ctx.strokeRect(this.x, this.y, this.w, this.h);
      ctx.globalAlpha = 1;
      return;
    }
    if (this.type===TILE.VANISH && this.vanishTimer > 0 && this.vanishTimer < 0.5) {
      ctx.globalAlpha = this.vanishTimer / 0.5;
    }

    if (!this.active) return;

    switch(this.type) {
      case TILE.SOLID:
      case TILE.PLATFORM:
        this._drawSolidPlatform(ctx);
        break;
      case TILE.VANISH:
        this._drawVanishPlatform(ctx, time);
        break;
      case TILE.FAKE:
        this._drawFakePlatform(ctx);
        break;
      case TILE.TRAMPOLINE:
        this._drawTrampoline(ctx);
        break;
      case TILE.ICE:
        this._drawIce(ctx);
        break;
      case TILE.LAVA:
        this._drawLava(ctx, time);
        break;
    }
    ctx.globalAlpha = 1;
  }

  _drawSolidPlatform(ctx) {
    const col = this.color || activeTheme.platform;
    ctx.fillStyle = col;
    ctx.fillRect(this.x, this.y, this.w, this.h);
    // top highlight
    ctx.fillStyle = this.color ? lighten(col,30) : activeTheme.platformTop;
    ctx.fillRect(this.x, this.y, this.w, 5);
    // side shadow
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(this.x+this.w-4, this.y+5, 4, this.h-5);
    ctx.fillRect(this.x, this.y+this.h-4, this.w, 4);
    // label
    if (this.label) {
      ctx.save();
      ctx.fillStyle="#fff"; ctx.font="bold 9px monospace";
      ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.fillText(this.label, this.x+this.w/2, this.y+this.h/2);
      ctx.restore();
    }
  }

  _drawVanishPlatform(ctx, time) {
    const flash = this.vanishTimer < 0.5 && this.vanishTimer > 0;
    ctx.fillStyle = flash ? (Math.sin(time*30)>0?"#88f":"#446") : "#556699";
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.fillStyle = "#7788bb";
    ctx.fillRect(this.x, this.y, this.w, 4);
    // Dashed outline
    ctx.setLineDash([4,4]);
    ctx.strokeStyle = "#aac";
    ctx.lineWidth = 1;
    ctx.strokeRect(this.x+0.5, this.y+0.5, this.w-1, this.h-1);
    ctx.setLineDash([]);
  }

  _drawFakePlatform(ctx) {
    ctx.fillStyle = this.revealed ? "rgba(80,80,120,0.3)" : activeTheme.fake;
    ctx.fillRect(this.x, this.y, this.w, this.h);
    if (!this.revealed) {
      ctx.fillStyle = lighten(activeTheme.fake, 20);
      ctx.fillRect(this.x, this.y, this.w, 5);
    }
  }

  _drawTrampoline(ctx) {
    ctx.fillStyle = "#2c2c4a";
    ctx.fillRect(this.x, this.y, this.w, this.h);
    // Elastic band
    ctx.fillStyle = "#ff6b35";
    ctx.fillRect(this.x+4, this.y+2, this.w-8, 8);
    // springs
    for (let i=0;i<3;i++) {
      ctx.fillStyle = "#888";
      ctx.fillRect(this.x+8+i*(this.w/3-4), this.y+10, 6, this.h-10);
    }
  }

  _drawIce(ctx) {
    ctx.fillStyle = "#a8d8ea";
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.fillStyle = "#c8eef8";
    ctx.fillRect(this.x, this.y, this.w, 5);
    // Ice crystals
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = "#fff";
    for (let i=0;i<Math.floor(this.w/20);i++) {
      ctx.fillRect(this.x+i*20+5, this.y+2, 3, 10);
    }
    ctx.globalAlpha = 1;
  }

  _drawLava(ctx, time) {
    // Lava base
    const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y+this.h);
    grad.addColorStop(0, "#ff4500");
    grad.addColorStop(1, "#c00000");
    ctx.fillStyle = grad;
    ctx.fillRect(this.x, this.y, this.w, this.h);
    // Lava bubbles
    ctx.fillStyle = "#ff6a00";
    for (let i=0;i<Math.floor(this.w/30);i++) {
      const bx = this.x + i*30 + 10 + Math.sin(time*2+i)*5;
      const by = this.y + 5 + Math.sin(time*3+i*1.5)*3;
      ctx.beginPath();
      ctx.arc(bx, by, 5, 0, Math.PI*2);
      ctx.fill();
    }
    // Glow
    ctx.save();
    ctx.globalAlpha=0.15;
    ctx.shadowBlur=20; ctx.shadowColor="#ff4500";
    ctx.fillStyle="#ff4500";
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.restore();
  }
}

class Spike {
  constructor(x, y, dir="up", opts={}) {
    this.x=x; this.y=y; this.dir=dir;
    this.w=16; this.h=16;
    this.hidden = opts.hidden||false;
    this.revealTimer = opts.revealTimer||0;
    this.revealDelay = opts.revealDelay||0;
    this.revealed = !this.hidden;
    this.triggerDist= opts.triggerDist||120;
    this.active = true;
  }

  update(dt, playerX, playerY) {
    if (this.hidden && !this.revealed) {
      this.revealTimer -= dt;
      if (this.revealTimer <= 0) this.revealed = true;
    }
  }

  get left()   { return this.x; }
  get right()  { return this.x + this.w; }
  get top()    { return this.y; }
  get bottom() { return this.y + this.h; }

  draw(ctx) {
    if (!this.revealed) {
      // Hidden spike — subtle hint
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = activeTheme.spike;
      ctx.fillRect(this.x, this.y, this.w, this.h);
      ctx.globalAlpha = 1;
      return;
    }

    ctx.save();
    ctx.translate(this.x+this.w/2, this.y+this.h/2);

    const rotMap = { up:0, down:Math.PI, left:-Math.PI/2, right:Math.PI/2 };
    ctx.rotate(rotMap[this.dir]||0);

    // Spike triangle(s)
    ctx.fillStyle = activeTheme.spike;
    const n = Math.floor(this.w/8);
    for (let i=0;i<n;i++) {
      ctx.beginPath();
      ctx.moveTo(-this.w/2+i*8,     this.h/2);
      ctx.lineTo(-this.w/2+i*8+4,  -this.h/2);
      ctx.lineTo(-this.w/2+i*8+8,   this.h/2);
      ctx.closePath();
      ctx.fill();
    }
    // Glow
    ctx.shadowBlur = 8; ctx.shadowColor = activeTheme.danger;
    ctx.restore();
  }
}

class Saw {
  constructor(x, y, opts={}) {
    this.x=x; this.y=y;
    this.r = opts.r||18;
    this.angle=0;
    this.speed = opts.speed||3;
    // Path
    this.pathX=opts.pathX||0; this.pathY=opts.pathY||0;
    this.pathRange=opts.pathRange||0; this.pathSpeed=opts.pathSpeed||80;
    this.startX=x; this.startY=y;
    this.pathDir=1;
  }

  get left()   { return this.x-this.r; }
  get right()  { return this.x+this.r; }
  get top()    { return this.y-this.r; }
  get bottom() { return this.y+this.r; }

  update(dt) {
    this.angle += this.speed * dt * 5;
    if (this.pathRange>0) {
      const d = this.pathDir * this.pathSpeed * dt;
      if (this.pathX!==0) {
        this.x += d;
        if (Math.abs(this.x-this.startX)>=this.pathRange) this.pathDir*=-1;
      }
      if (this.pathY!==0) {
        this.y += d;
        if (Math.abs(this.y-this.startY)>=this.pathRange) this.pathDir*=-1;
      }
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Glow
    ctx.shadowBlur=16; ctx.shadowColor=activeTheme.saw;

    // Teeth
    const teeth = 12;
    ctx.fillStyle = activeTheme.saw;
    ctx.beginPath();
    for (let i=0;i<teeth;i++) {
      const a1 = (i/teeth)*Math.PI*2;
      const a2 = ((i+0.5)/teeth)*Math.PI*2;
      const a3 = ((i+1)/teeth)*Math.PI*2;
      ctx.lineTo(Math.cos(a1)*(this.r-4), Math.sin(a1)*(this.r-4));
      ctx.lineTo(Math.cos(a2)*this.r,     Math.sin(a2)*this.r);
      ctx.lineTo(Math.cos(a3)*(this.r-4), Math.sin(a3)*(this.r-4));
    }
    ctx.closePath();
    ctx.fill();

    // Center
    ctx.fillStyle = "#333";
    ctx.beginPath(); ctx.arc(0,0,this.r*0.35,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = "#555";
    ctx.beginPath(); ctx.arc(0,0,this.r*0.15,0,Math.PI*2); ctx.fill();

    ctx.restore();
  }
}

class Portal {
  constructor(x, y, targetX, targetY, opts={}) {
    this.x=x; this.y=y;
    this.tx=targetX; this.ty=targetY;
    this.w=30; this.h=50;
    this.phase=rand(0,Math.PI*2);
    this.color=opts.color||PALETTE.portal1;
  }

  get left()   { return this.x; }
  get right()  { return this.x+this.w; }
  get top()    { return this.y; }
  get bottom() { return this.y+this.h; }

  update(dt) { this.phase += dt*3; }

  draw(ctx) {
    // Outer glow
    const grad = ctx.createRadialGradient(
      this.x+this.w/2, this.y+this.h/2, 0,
      this.x+this.w/2, this.y+this.h/2, this.w*1.5
    );
    grad.addColorStop(0, this.color);
    grad.addColorStop(1, "transparent");
    ctx.save();
    ctx.globalAlpha=0.4+Math.sin(this.phase)*0.1;
    ctx.fillStyle=grad;
    ctx.beginPath();
    ctx.ellipse(this.x+this.w/2, this.y+this.h/2, this.w*1.5, this.h*0.9, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.globalAlpha=1;

    // Portal oval
    ctx.fillStyle=this.color;
    ctx.beginPath();
    ctx.ellipse(this.x+this.w/2, this.y+this.h/2, this.w/2, this.h/2, 0, 0, Math.PI*2);
    ctx.fill();

    // Inner swirl
    ctx.fillStyle="rgba(0,0,0,0.6)";
    ctx.beginPath();
    ctx.ellipse(this.x+this.w/2, this.y+this.h/2, this.w/2-4, this.h/2-4, 0, 0, Math.PI*2);
    ctx.fill();

    ctx.restore();

    // Spinning lines
    ctx.save();
    ctx.translate(this.x+this.w/2, this.y+this.h/2);
    ctx.rotate(this.phase);
    ctx.globalAlpha=0.7;
    for (let i=0;i<3;i++) {
      ctx.rotate(Math.PI*2/3);
      ctx.fillStyle=this.color;
      ctx.fillRect(-2, -this.h/2+4, 4, this.h/2-4);
    }
    ctx.globalAlpha=1;
    ctx.restore();
  }
}

class Exit {
  constructor(x, y) {
    this.x=x; this.y=y;
    this.w=40; this.h=50;
    this.phase=0;
    this.reached=false;
  }

  get left()   { return this.x; }
  get right()  { return this.x+this.w; }
  get top()    { return this.y; }
  get bottom() { return this.y+this.h; }

  update(dt) { this.phase+=dt*2; }

  draw(ctx) {
    const theme = activeTheme;
    ctx.save();
    ctx.translate(this.x + this.w/2, this.y + this.h);

    // 1. Draw outer stone arch structure
    ctx.fillStyle = "#4b4b53"; // dark stone gray
    ctx.strokeStyle = "#718093"; // light stone grout
    ctx.lineWidth = 1.5;
    
    ctx.beginPath();
    ctx.moveTo(-this.w/2 - 4, 0);
    ctx.lineTo(-this.w/2 - 4, -this.h + this.w/2);
    ctx.arcTo(0, -this.h - this.w/2 - 5, this.w/2 + 4, -this.h + this.w/2, this.w/2 + 4);
    ctx.lineTo(this.w/2 + 4, 0);
    ctx.lineTo(this.w/2, 0);
    ctx.lineTo(this.w/2, -this.h + this.w/2);
    ctx.arcTo(0, -this.h - this.w/2 + 3, -this.w/2, -this.h + this.w/2, this.w/2);
    ctx.lineTo(-this.w/2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Keystone/gem at the top of the arch
    ctx.fillStyle = theme.exit;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -this.h - 6);
    ctx.lineTo(-5, -this.h + 1);
    ctx.lineTo(0, -this.h + 5);
    ctx.lineTo(5, -this.h + 1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 2. Swirling glowing portal interior
    ctx.fillStyle = "#0c0a10";
    ctx.beginPath();
    ctx.moveTo(-this.w/2, 0);
    ctx.lineTo(-this.w/2, -this.h + this.w/2);
    ctx.arcTo(0, -this.h - this.w/2 + 3, this.w/2, -this.h + this.w/2, this.w/2);
    ctx.lineTo(this.w/2, 0);
    ctx.closePath();
    ctx.fill();

    // Swirling nebula
    ctx.save();
    ctx.translate(0, -this.h/2 - 2);
    ctx.rotate(-this.phase * 1.5);
    ctx.globalAlpha = 0.25;
    const portalGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.h/2);
    portalGrad.addColorStop(0, theme.exit);
    portalGrad.addColorStop(0.5, theme.portal1 || "#ff007f");
    portalGrad.addColorStop(1, "transparent");
    ctx.fillStyle = portalGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, this.w/2 + 2, this.h/2 + 2, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();

    // Portal ring star swirls
    ctx.save();
    ctx.translate(0, -this.h/2 - 2);
    ctx.rotate(this.phase);
    ctx.globalAlpha = 0.75 + Math.sin(this.phase * 2) * 0.15;
    ctx.fillStyle = theme.exit;
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.beginPath();
      ctx.arc(this.w/3, 0, 2.5, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.restore();

    ctx.restore();
  }
}

// ─── Level Definitions ────────────────────────────────────────
// Each level is a function that returns a fresh level object
function buildLevel(index) {
  switch(index) {
    case 0: return level_tutorial();
    case 1: return level_vanishing();
    case 2: return level_saws();
    case 3: return level_iceAge();
    case 4: return level_portalMadness();
    case 5: return level_trampolineTrap();
    case 6: return level_fakePlatforms();
    case 7: return level_movingMayhem();
    case 8: return level_spikeGauntlet();
    case 9: return level_chaosRealm();
    default: return level_tutorial();
  }
}

const TOTAL_LEVELS = 10;

function mkSolid(x,y,w,h,opts={}) { return new Platform(x,y,w,h,TILE.SOLID,opts); }
function mkVanish(x,y,w,h,opts={}) { return new Platform(x,y,w,h,TILE.VANISH,opts); }
function mkFake(x,y,w,h,opts={}) { return new Platform(x,y,w,h,TILE.FAKE,opts); }
function mkTrampo(x,y,w,h,opts={}) { return new Platform(x,y,w,h,TILE.TRAMPOLINE,opts); }
function mkIce(x,y,w,h,opts={}) { return new Platform(x,y,w,h,TILE.ICE,opts); }
function mkLava(x,y,w,h,opts={}) { return new Platform(x,y,w,h,TILE.LAVA,opts); }
function mkMoving(x,y,w,h,axis,range,speed,opts={}) {
  return new Platform(x,y,w,h,TILE.SOLID,{...opts,
    moveX: axis==="x"?1:0, moveY: axis==="y"?1:0,
    moveRange: range, moveSpeed: speed
  });
}

function level_tutorial() {
  return {
    name: "Welcome :)",
    bg: ["#1a0533","#2d1b69"],
    playerStart: [60, 430],
    platforms: [
      // Ground
      mkSolid(0, 480, 960, 60),
      // Stepping stones
      mkSolid(200, 380, 120, 20),
      mkSolid(380, 310, 120, 20),
      mkSolid(560, 380, 120, 20),
      // Deception: this platform drops out
      mkVanish(700, 290, 100, 20, {vanishDelay:0.6}),
      mkSolid(820, 240, 140, 20),
    ],
    hazards: [],
    saws:    [],
    spikes:  [
      new Spike(220,464,"up"),new Spike(236,464,"up"),new Spike(252,464,"up"),
    ],
    portals: [],
    exit: new Exit(870, 190),
    trapMessage: "The floor won't always be there for you.",
  };
}

function level_vanishing() {
  return {
    name: "Now You See It",
    bg: ["#0d1b2a","#1b3a5c"],
    playerStart: [30, 420],
    platforms: [
      mkSolid(0,460,120,60),
      mkVanish(150,390,100,16,{vanishDelay:0.5}),
      mkVanish(290,330,80,16,{vanishDelay:0.4}),
      mkSolid(420,350,30,16),
      mkVanish(500,290,120,16,{vanishDelay:0.7}),
      mkVanish(660,240,80,16,{vanishDelay:0.3}),
      mkSolid(790,200,40,16),
      mkVanish(870,160,90,16,{vanishDelay:0.6}),
      // Safe island at end
      mkSolid(850, 400, 110, 16),
    ],
    hazards: [],
    saws: [],
    spikes: [
      new Spike(420,344,"up"),
    ],
    portals: [],
    exit: new Exit(900, 350),
    trapMessage: "Trust the dashed platforms? Brave.",
  };
}

function level_saws() {
  return {
    name: "Buzzsaw Ballet",
    bg: ["#1a0f00","#3d2000"],
    playerStart: [30, 420],
    platforms: [
      mkSolid(0,460,200,60),
      mkSolid(240,380,160,20),
      mkSolid(460,300,160,20),
      mkSolid(680,220,160,20),
      mkSolid(850,380,110,20),
      mkSolid(0,240,120,20),
      mkSolid(850,140,110,60),
    ],
    hazards: [],
    saws: [
      new Saw(320, 440, {speed:4, pathX:1, pathRange:80, pathSpeed:100}),
      new Saw(550, 260, {speed:-5, pathY:1, pathRange:60, pathSpeed:70}),
      new Saw(770, 180, {speed:3, pathX:1, pathRange:100, pathSpeed:120}),
      new Saw(100, 200, {speed:-4, pathY:1, pathRange:80, pathSpeed:90}),
    ],
    spikes: [
      new Spike(460,284,"up"), new Spike(476,284,"up"),
      new Spike(600,284,"up"), new Spike(616,284,"up"),
    ],
    portals: [],
    exit: new Exit(870, 90),
    trapMessage: "The saws are hungry.",
  };
}

function level_iceAge() {
  return {
    name: "Slippery Slope",
    bg: ["#0d1f3c","#1a4080"],
    playerStart: [30, 410],
    platforms: [
      mkSolid(0,450,200,60),
      mkIce(180,370,200,16),
      mkIce(360,310,160,16),
      mkSolid(500,330,30,16),
      mkIce(580,260,180,16),
      mkIce(750,200,200,16),
      mkSolid(900,220,60,16),
    ],
    hazards: [],
    saws: [
      new Saw(500, 290, {speed:3}),
    ],
    spikes: [
      new Spike(360,294,"up"),new Spike(376,294,"up"),
      new Spike(700,184,"up"),new Spike(716,184,"up"),new Spike(732,184,"up"),
    ],
    portals: [],
    exit: new Exit(900, 170),
    trapMessage: "Ice is slippery. Who knew?",
  };
}

function level_portalMadness() {
  return {
    name: "Portal Problems",
    bg: ["#1a0040","#3d008f"],
    playerStart: [30, 430],
    platforms: [
      mkSolid(0,460,200,60),
      mkSolid(270,380,120,20),
      mkSolid(500,300,120,20),
      mkSolid(730,380,120,20),
      mkSolid(850,200,110,20),
      mkSolid(0,200,120,20),
    ],
    hazards: [],
    saws: [new Saw(620,260,{speed:4})],
    spikes: [new Spike(500,284,"up"),new Spike(516,284,"up"),
             new Spike(596,284,"up"),new Spike(612,284,"up")],
    portals: [
      // Portal that looks like it helps but dumps you near spikes
      new Portal(420,350,510,400,{color:"#a855f7"}),
      // Helpful portal
      new Portal(740,350,60,170,{color:"#ec4899"}),
    ],
    exit: new Exit(60, 150),
    trapMessage: "Where does this portal go? One way to find out.",
  };
}

function level_trampolineTrap() {
  return {
    name: "Bounce House of Pain",
    bg: ["#1a001a","#400040"],
    playerStart: [30, 430],
    platforms: [
      mkSolid(0,460,200,60),
      mkTrampo(240,420,80,20,{bounceVel:-950}),
      mkSolid(380,320,120,20),
      mkTrampo(560,310,80,20,{bounceVel:-1100}),
      // The trampoline that launches you into spikes
      mkTrampo(740,420,100,20,{bounceVel:-1050}),
      mkSolid(860,280,100,20),
    ],
    hazards: [],
    saws:[new Saw(380,300,{speed:3,pathX:1,pathRange:80,pathSpeed:100})],
    spikes:[
      // Ceiling spikes above the last trampoline
      new Spike(730,100,"down"),new Spike(746,100,"down"),
      new Spike(762,100,"down"),new Spike(778,100,"down"),
      new Spike(794,100,"down"),new Spike(810,100,"down"),
      new Spike(826,100,"down"),
    ],
    portals:[],
    exit: new Exit(880,230),
    trapMessage: "Trampolines are fun! (They're not.)",
  };
}

function level_fakePlatforms() {
  return {
    name: "Trust Issues",
    bg: ["#001a00","#003300"],
    playerStart: [30, 430],
    platforms: [
      mkSolid(0,460,200,60),
      // Row of platforms — some fake
      mkSolid(240,370,80,16),
      mkFake(360,370,80,16),
      mkSolid(480,370,80,16),
      mkFake(600,370,80,16),
      mkFake(720,370,80,16),
      mkSolid(820,370,80,16),
      // Upper row
      mkFake(240,280,80,16),
      mkSolid(360,280,80,16),
      mkFake(480,280,80,16),
      mkSolid(600,280,80,16),
      mkSolid(720,280,80,16),
    ],
    hazards: [],
    saws: [],
    spikes:[
      new Spike(360,444,"up"),new Spike(376,444,"up"),
      new Spike(600,444,"up"),new Spike(616,444,"up"),
      new Spike(720,444,"up"),new Spike(736,444,"up"),
    ],
    portals:[],
    exit: new Exit(720,230),
    trapMessage: "Not every platform is what it seems.",
  };
}

function level_movingMayhem() {
  return {
    name: "Everything Moves",
    bg: ["#001a1a","#003344"],
    playerStart: [30, 420],
    platforms: [
      mkSolid(0,460,130,60),
      mkMoving(200,380,100,16,"x",120,90),
      mkMoving(420,300,90,16,"y",80,70),
      mkMoving(600,360,100,16,"x",150,110),
      mkMoving(760,260,80,16,"y",100,85),
      mkSolid(880,160,80,20),
    ],
    hazards:[],
    saws:[
      new Saw(350,430,{speed:4,pathX:1,pathRange:100,pathSpeed:100}),
      new Saw(640,440,{speed:-4,pathX:1,pathRange:120,pathSpeed:110}),
    ],
    spikes:[
      new Spike(0,444,"up"),new Spike(16,444,"up"),
    ],
    portals:[],
    exit: new Exit(890,110),
    trapMessage: "Nothing stays still. Neither should you.",
  };
}

function level_spikeGauntlet() {
  return {
    name: "The Gauntlet",
    bg: ["#1a0000","#330000"],
    playerStart: [30, 410],
    platforms: [
      mkSolid(0,450,100,60),
      // Long corridor with spikes overhead
      mkSolid(100,450,700,30),
      mkSolid(800,380,160,20),
      mkSolid(880,280,80,20),
    ],
    hazards:[],
    saws:[
      new Saw(280,420,{speed:3,pathX:1,pathRange:60,pathSpeed:80}),
      new Saw(500,420,{speed:-4,pathX:1,pathRange:50,pathSpeed:100}),
      new Saw(700,420,{speed:5,pathX:1,pathRange:40,pathSpeed:90}),
    ],
    spikes:[
      // Floor spikes in corridor
      new Spike(160,434,"up"),new Spike(176,434,"up"),
      new Spike(240,434,"up"),new Spike(256,434,"up"),
      new Spike(340,434,"up"),new Spike(356,434,"up"),
      new Spike(440,434,"up"),new Spike(456,434,"up"),
      new Spike(560,434,"up"),new Spike(576,434,"up"),
      new Spike(640,434,"up"),new Spike(656,434,"up"),
      // Ceiling spikes
      new Spike(200,330,"down"),new Spike(216,330,"down"),
      new Spike(300,330,"down"),new Spike(316,330,"down"),
      new Spike(400,330,"down"),new Spike(416,330,"down"),
      new Spike(500,330,"down"),new Spike(516,330,"down"),
      new Spike(600,330,"down"),new Spike(616,330,"down"),
    ],
    portals:[],
    exit: new Exit(900,230),
    trapMessage: "Precision or death.",
  };
}

function level_chaosRealm() {
  return {
    name: "CHAOS REALM",
    bg: ["#0f0000","#1a0020"],
    playerStart: [30, 420],
    platforms: [
      mkSolid(0,460,120,60),
      mkVanish(160,390,80,16,{vanishDelay:0.4}),
      mkFake(280,340,80,16),
      mkIce(400,300,120,16),
      mkMoving(560,280,80,16,"x",100,100),
      mkMoving(720,240,80,16,"y",80,90),
      mkTrampo(860,420,80,16,{bounceVel:-1000}),
      mkSolid(880,100,80,20),
      // Hidden safe path
      mkSolid(200,200,60,16),
      mkSolid(300,160,60,16),
      mkSolid(400,120,60,16),
    ],
    hazards:[],
    saws:[
      new Saw(350,430,{speed:5,pathX:1,pathRange:80,pathSpeed:110}),
      new Saw(600,440,{speed:-5,pathX:1,pathRange:60,pathSpeed:100}),
      new Saw(200,260,{speed:4,pathY:1,pathRange:40,pathSpeed:80}),
    ],
    spikes:[
      new Spike(160,374,"up"),new Spike(176,374,"up"),
      new Spike(560,444,"up"),new Spike(576,444,"up"),
      // Ceiling traps
      new Spike(860,130,"down",{hidden:true, revealTimer:0}),
      new Spike(876,130,"down",{hidden:true, revealTimer:0}),
      new Spike(892,130,"down",{hidden:true, revealTimer:0}),
    ],
    portals:[
      new Portal(280,300,210,170,{color:"#a855f7"}),
    ],
    exit: new Exit(890,50),
    trapMessage: "CHAOS. WELCOMES. YOU.",
  };
}

// ─── Color Utility ───────────────────────────────────────────
function lighten(hex, amt) {
  const n = parseInt(hex.replace("#",""),16);
  const r=Math.min(255,((n>>16)&0xff)+amt);
  const g=Math.min(255,((n>>8)&0xff)+amt);
  const b=Math.min(255,(n&0xff)+amt);
  return `rgb(${r},${g},${b})`;
}

// ─── Background Renderer ─────────────────────────────────────
class Background {
  constructor(col1, col2) {
    this.col1=col1; this.col2=col2;
    this.stars = Array.from({length:80},()=>({
      x:rand(0,VW), y:rand(0,VH),
      r:rand(0.5,2), twinkle:rand(0,Math.PI*2)
    }));
    this.clouds = Array.from({length:5},()=>({
      x:rand(0,VW), y:rand(20,150),
      w:rand(60,180), spd:rand(8,20)
    }));
  }

  update(dt) {
    this.clouds.forEach(c => {
      c.x += c.spd*dt;
      if (c.x > VW+200) c.x = -200;
    });
  }

  draw(ctx, time) {
    // Sky gradient — use current world theme
    const th = activeTheme;
    const grad = ctx.createLinearGradient(0,0,0,VH);
    grad.addColorStop(0, th.bg1);
    grad.addColorStop(1, th.bg2);
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,VW,VH);

    // Background crack decorations (like Level Devil)
    ctx.strokeStyle = th.crackColor;
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const x = (VW * (i+1)) / 9;
      const len = 30 + (i*37) % 60;
      ctx.beginPath();
      ctx.moveTo(x, 60 + (i*47)%120);
      ctx.lineTo(x + 8*(i%2?1:-1), 60 + (i*47)%120 + len);
      ctx.stroke();
    }

    // Bottom fog
    const fog = ctx.createLinearGradient(0, VH-80, 0, VH);
    fog.addColorStop(0, "rgba(0,0,0,0)");
    fog.addColorStop(1, th.fog);
    ctx.fillStyle = fog;
    ctx.fillRect(0, VH-80, VW, 80);

    ctx.globalAlpha=1;
  }
}

// ─── Level Runtime ───────────────────────────────────────────
class LevelRuntime {
  constructor(levelData) {
    this.data = levelData;
    this.bg = new Background(...levelData.bg);
    this.player = new Player(...levelData.playerStart);
    this.platforms = [...levelData.platforms];
    this.spikes = [...levelData.spikes];
    this.saws = [...levelData.saws];
    this.portals = [...levelData.portals];
    this.exit = levelData.exit;
    this.time = 0;
    // Trap state
    this.playerWasOnPlatform = new Map();
    this.portalCooldown = 0;
    // Level complete
    this.complete = false;
    // Death
    this.dead = false;
    this.deathTimer = 0;
    // Exit suction properties
    this.exitPhase = false;
    this.exitTimer = 0;
    // Flash
    this.flashColor = null;
    this.flashTimer  = 0;
    // Message
    this.msgTimer = 0;
    this.showMsg = false;
  }

  flash(color, dur=0.4) { this.flashColor=color; this.flashTimer=dur; }

  resolveX(player) {
    for (const p of this.platforms) {
      if (p.type===TILE.FAKE || p.vanished || !p.active) continue;
      if (player.right > p.left && player.left < p.right &&
          player.bottom > p.top && player.top < p.bottom) {
        if (player.vx > 0) player.x = p.left - player.w;
        else               player.x = p.right;
        player.vx = 0;
      }
    }
    // Clamp to screen
    player.x = clamp(player.x, 0, VW - player.w);
  }

  resolveY(player) {
    for (const p of this.platforms) {
      if (p.type===TILE.FAKE || p.vanished || !p.active) continue;

      // One-way platform
      if (p.type===TILE.PLATFORM && player.vy < 0) continue;

      if (player.right > p.left+2 && player.left < p.right-2 &&
          player.bottom > p.top && player.top < p.bottom) {

        if (player.vy >= 0) {
          // Land on top
          player.y = p.top - player.h;
          player.vy = 0;
          player.onGround = true;

          // Trampoline
          if (p.type===TILE.TRAMPOLINE) {
            player.vy = p.bounceVel;
            player.onGround = false;
            spawnParticles(player.cx, player.bottom, "#ff6b35", 8, 150);
            shake(4, 0.15);
          }

          // Vanish trigger
          if (p.type===TILE.VANISH && p.vanishTimer<=0 && !p.vanished) {
            p.vanishTimer = p.vanishDelay;
          }

          // Ice friction
          if (p.type===TILE.ICE) {
            player.vx *= 0.98; // will be applied as low friction
          }

          // Lava kill
          if (p.type===TILE.LAVA) {
            player.die("lava");
          }

          // Moving platform carry
          if (p.moveRange>0 && p.moveX!==0) {
            player.x += p.moveDir * p.moveSpeed * (1/60);
          }
        } else {
          // Hit from below
          player.y = p.bottom;
          player.vy = 0;
        }
      }
    }
  }

  update(dt) {
    if (this.complete || this.dead) return;

    if (this.exitPhase) {
      this.exitTimer -= dt;
      
      // Pull player smoothly toward portal center
      const ex = this.exit;
      const targetX = ex.x + ex.w/2 - this.player.w/2;
      const targetY = ex.y + ex.h - this.player.h;
      this.player.x = lerp(this.player.x, targetX, dt * 6);
      this.player.y = lerp(this.player.y, targetY, dt * 6);
      
      // Spin and shrink player
      this.player.exitRotation += dt * 8;
      this.player.squishX = lerp(this.player.squishX, 0, dt * 6);
      this.player.squishY = lerp(this.player.squishY, 0, dt * 6);
      
      // Spawn small sparkly trail particles
      if (Math.random() < 0.3) {
        spawnParticles(this.player.cx, this.player.cy, activeTheme.exit, 2, 70);
      }
      
      if (this.exitTimer <= 0) {
        this.complete = true;
      }
      
      // Update particles during transition
      for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update(dt);
        if (particles[i].life <= 0) particles.splice(i, 1);
      }
      return;
    }

    this.time += dt;
    levelTimer += dt;
    if (this.portalCooldown>0) this.portalCooldown-=dt;

    this.bg.update(dt);

    this.platforms.forEach(p => p.update(dt));
    this.spikes.forEach(s => s.update(dt, this.player.cx, this.player.cy));
    this.saws.forEach(s => s.update(dt));
    this.portals.forEach(p => p.update(dt));
    this.exit.update(dt);

    // Flash
    if (this.flashTimer>0) this.flashTimer-=dt;

    this.player.update(dt, this);

    if (!this.player.alive) {
      this.dead = true;
      return;
    }

    // Spike collisions
    for (const s of this.spikes) {
      if (!s.revealed || !s.active) continue;
      if (this.player.right > s.left+2 && this.player.left < s.right-2 &&
          this.player.bottom > s.top+2 && this.player.top < s.bottom-2) {
        this.player.die("spike");
        this.dead = true;
        return;
      }
    }

    // Saw collisions
    for (const s of this.saws) {
      const dx = this.player.cx - s.x, dy = this.player.cy - s.y;
      if (Math.sqrt(dx*dx+dy*dy) < s.r + 8) {
        this.player.die("saw");
        this.dead = true;
        return;
      }
    }

    // Portal collisions
    if (this.portalCooldown<=0) {
      for (const p of this.portals) {
        if (this.player.right > p.left && this.player.left < p.right &&
            this.player.bottom > p.top && this.player.top < p.bottom) {
          // Teleport!
          this.player.x = p.tx - this.player.w/2;
          this.player.y = p.ty - this.player.h;
          this.player.vy = -100;
          this.portalCooldown = 0.8;
          spawnParticles(p.x+p.w/2, p.y+p.h/2, p.color, 16, 200);
          spawnParticles(p.tx, p.ty, p.color, 16, 200);
          SFX.portal();
          shake(5, 0.2);
          break;
        }
      }
    }

    // Fake platform — reveal on overlap
    for (const p of this.platforms) {
      if (p.type!==TILE.FAKE) continue;
      if (this.player.right > p.left && this.player.left < p.right &&
          this.player.bottom > p.top && this.player.top < p.bottom) {
        p.revealed = true;
      }
    }

    // Exit collision
    const ex=this.exit;
    if (!this.exitPhase && this.player.right > ex.left && this.player.left < ex.right &&
        this.player.bottom > ex.top && this.player.top < ex.bottom) {
      this.exitPhase = true;
      this.exitTimer = 0.85;
      this.player.exitingPortal = true;
      this.player.exitRotation = 0;
      spawnConfetti(ex.x+ex.w/2, ex.y+ex.h/2, 45);
      shake(6, 0.3);
      SFX.win();
    }

    // Update particles
    for (let i=particles.length-1;i>=0;i--) {
      particles[i].update(dt);
      if (particles[i].life<=0) particles.splice(i,1);
    }
  }

  draw(ctx, time) {
    // Shake transform
    let sx=0, sy=0;
    if (shakeDur>0) {
      sx = rand(-shakeAmt,shakeAmt);
      sy = rand(-shakeAmt,shakeAmt);
      shakeDur -= 1/60;
      if (shakeDur<=0) { shakeAmt=0; sx=0; sy=0; }
    }

    ctx.save();
    ctx.translate(sx, sy);

    // Background
    this.bg.draw(ctx, time);

    // Platforms
    this.platforms.forEach(p => p.draw(ctx, time));

    // Spikes
    this.spikes.forEach(s => s.draw(ctx));

    // Saws
    this.saws.forEach(s => s.draw(ctx));

    // Portals
    this.portals.forEach(p => p.draw(ctx));

    // Exit
    this.exit.draw(ctx);

    // Player
    this.player.draw(ctx);

    // Particles
    particles.forEach(p => p.draw(ctx));

    // Screen flash
    if (this.flashTimer>0) {
      ctx.globalAlpha = (this.flashTimer/0.4)*0.4;
      ctx.fillStyle = this.flashColor || "#ff0000";
      ctx.fillRect(0,0,VW,VH);
      ctx.globalAlpha=1;
    }

    // Level name watermark
    ctx.save();
    ctx.globalAlpha=0.12;
    ctx.fillStyle="#fff";
    ctx.font="bold 48px monospace";
    ctx.textAlign="center";
    ctx.fillText(this.data.name, VW/2, VH/2+20);
    ctx.restore();

    ctx.restore();
  }
}

// ─── Save Manager (localStorage) ────────────────────────────
const SAVE_KEY = "chaosRealm_save_v1";

const SaveManager = {
  // Save current progress
  save(levelIndex, totalDeaths) {
    const data = {
      level: levelIndex,          // highest unlocked level index
      deaths: totalDeaths,
      savedAt: Date.now(),
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch(e) { /* private/incognito mode may block */ }
  },

  // Load saved progress — returns null if nothing saved
  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch(e) { return null; }
  },

  // Wipe progress (new game)
  clear() {
    try { localStorage.removeItem(SAVE_KEY); } catch(e) {}
  },

  // Check if saved data exists and is valid
  hasSave() {
    const d = this.load();
    return d !== null && d.level >= 0 && d.level < TOTAL_LEVELS;
  },
};

// ─── UI Controller ───────────────────────────────────────────
const screens = {
  start:         document.getElementById("start-screen"),
  death:         document.getElementById("death-screen"),
  levelComplete: document.getElementById("level-complete"),
  gameComplete:  document.getElementById("game-complete"),
};
const hud = document.getElementById("hud");

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.add("hidden"));
  hud.classList.add("hidden");
  if (name && screens[name]) screens[name].classList.remove("hidden");
  if (name === "playing") hud.classList.remove("hidden");
}

// Update start screen — show Continue button if save exists
function refreshStartScreen() {
  const saveSection  = document.getElementById("continue-section");
  const savedLvlTxt  = document.getElementById("saved-level-text");
  const savedDthTxt  = document.getElementById("saved-deaths-text");

  if (SaveManager.hasSave()) {
    const d = SaveManager.load();
    const lvl = Math.min(d.level, TOTAL_LEVELS - 1);
    const levelData = buildLevel(lvl);
    savedLvlTxt.textContent = `Level ${lvl + 1} – ${levelData.name}`;
    savedDthTxt.textContent  = d.deaths;
    saveSection.classList.remove("hidden");
  } else {
    saveSection.classList.add("hidden");
  }
}

// Update HUD level progress bar
function updateProgressBar(lvl) {
  const fill = document.getElementById("level-progress-fill");
  if (fill) fill.style.width = ((lvl + 1) / TOTAL_LEVELS * 100) + "%";
}

const DEATH_MSGS = [
  "So close!", "Skill issue 😂", "Almost!", "Try again bestie",
  "The floor betrayed you", "Physics hates you", "lmaooo",
  "You'll get it (maybe)", "365 more tries to go!", "RIP 💀",
  "Getting warmer!", "Not like that", "Interesting strategy",
];

function updateHUD() {
  document.getElementById("level-num").textContent  = currentLevel + 1;
  document.getElementById("death-count").textContent = deaths;
  document.getElementById("timer-val").textContent   = levelTimer.toFixed(1);
  updateProgressBar(currentLevel);
}

// ─── Main Game Loop ──────────────────────────────────────────
let runtime = null;
let lastTime = 0;

function showWorldTitle(name) {
  const el = document.createElement("div");
  el.style.cssText = [
    "position:fixed","inset:0","display:flex","align-items:center",
    "justify-content:center","z-index:9999","pointer-events:none",
    `font-family:'Press Start 2P',monospace`,
    "font-size:clamp(28px,6vw,56px)",
    "color:rgba(255,180,80,0.95)",
    "text-shadow:0 0 40px rgba(255,100,0,0.7),0 0 80px rgba(200,50,0,0.4)",
    "animation:worldTitleAnim 2.2s ease forwards",
    "letter-spacing:8px",
  ].join(";");
  el.textContent = name;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2300);
}

function startLevel(idx) {
  particles.length = 0;
  levelTimer = 0;

  // Update world theme
  const prevTheme = activeTheme;
  activeTheme = getTheme(idx);

  // Show world title when entering a new world
  if (idx === 0 || idx === 3 || idx === 6) {
    if (idx > 0 || prevTheme !== activeTheme) {
      showWorldTitle(activeTheme.name);
    }
  }

  const data = buildLevel(idx);
  runtime = new LevelRuntime(data);
  gameState = "playing";
  showScreen("playing");
  updateProgressBar(idx);
  startMusic();
}

const DEATH_COMMENTARIES = {
  1: "First step is always the hardest. Or is it? 😈",
  3: "Gravity works! Physics test passed.",
  5: "Only 5 deaths! You are doing great (not).",
  8: "The developer smiled just now.",
  10: "Double digits! Absolute skill issue.",
  15: "15 deaths. Maybe trust nothing?",
  20: "20 deaths! Definitely not a fair game.",
  25: "25 deaths... Let's try harder!",
  30: "30 deaths. Level Devil would be proud.",
  50: "50 DEATHS! Legend has it you are still trying.",
  75: "75 deaths. Are you mapping the traps with your body?",
  100: "100 DEATHS! Dedicated or stubborn? You decide."
};

function loop(ts) {
  requestAnimationFrame(loop);
  const dt = Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;

  ctx.clearRect(0, 0, VW, VH);

  if (gameState === "playing" && runtime) {
    runtime.update(dt);
    runtime.draw(ctx, ts / 1000);
    updateHUD();

    if (runtime.dead) {
      stopMusic();
      deaths++;
      gameState = "dead";
      // Save progress even on death so death count is persisted
      SaveManager.save(currentLevel, deaths);
      const msg = DEATH_COMMENTARIES[deaths] || DEATH_MSGS[Math.floor(Math.random() * DEATH_MSGS.length)];
      document.getElementById("death-title").textContent = "Oops!";
      document.getElementById("death-msg").textContent   = msg;
      document.getElementById("death-big").textContent   = deaths;
      document.getElementById("death-count").textContent = deaths;
      setTimeout(() => showScreen("death"), 600);
    }

    if (runtime.complete) {
      stopMusic();
      gameState = "levelcomplete";
      const t = levelTimer.toFixed(1);
      document.getElementById("win-time").textContent = t + "s";
      const stars = t < 5 ? "⭐⭐⭐" : t < 12 ? "⭐⭐" : "⭐";
      document.getElementById("win-rating").textContent = stars;

      // ✅ SAVE PROGRESS — next level unlocked
      const nextLevel = currentLevel + 1;
      if (nextLevel < TOTAL_LEVELS) {
        SaveManager.save(nextLevel, deaths);
      }

      setTimeout(() => showScreen("levelComplete"), 800);
    }
  } else {
    // Draw background during menus
    if (runtime) runtime.draw(ctx, ts / 1000);
    else { ctx.fillStyle = "#0a0a0f"; ctx.fillRect(0, 0, VW, VH); }
  }

  // R to restart current level
  if (keys["KeyR"] && gameState !== "start") {
    deaths++;
    SaveManager.save(currentLevel, deaths);
    startLevel(currentLevel);
    showScreen("playing");
  }
}

// ─── Button Handlers ─────────────────────────────────────────

// Logo Click animation and SFX trigger
const logoSpan = document.querySelector(".title-oops");
if (logoSpan) {
  logoSpan.addEventListener("click", () => {
    initAudio();
    SFX.trap();
    logoSpan.classList.add("bounce-click");
    setTimeout(() => {
      logoSpan.classList.remove("bounce-click");
    }, 450);
  });
}

// NEW GAME — wipe save and start from level 1
document.getElementById("start-btn").addEventListener("click", () => {
  initAudio();
  SaveManager.clear();
  deaths = 0;
  currentLevel = 0;
  startLevel(0);
});

// CONTINUE — load saved level
document.getElementById("continue-btn")?.addEventListener("click", () => {
  initAudio();
  const saved = SaveManager.load();
  if (saved) {
    deaths       = saved.deaths || 0;
    currentLevel = Math.min(saved.level, TOTAL_LEVELS - 1);
  }
  startLevel(currentLevel);
});

// START OVER link inside continue section
document.getElementById("new-game-link")?.addEventListener("click", () => {
  if (confirm("Start over? Your saved progress will be deleted.")) {
    SaveManager.clear();
    refreshStartScreen();
  }
});

// RETRY after death
document.getElementById("retry-btn").addEventListener("click", (e) => {
  e.stopPropagation();
  initAudio();
  startLevel(currentLevel);
});

// Click anywhere on death screen to retry
document.getElementById("death-screen").addEventListener("click", () => {
  initAudio();
  startLevel(currentLevel);
});

// NEXT LEVEL after completing a level
document.getElementById("next-btn").addEventListener("click", () => {
  initAudio();
  currentLevel++;
  if (currentLevel >= TOTAL_LEVELS) {
    // Game complete — clear save
    SaveManager.clear();
    gameState = "gamecomplete";
    document.getElementById("final-deaths").textContent = deaths;
    showScreen("gameComplete");
  } else {
    startLevel(currentLevel);
  }
});

// PLAY AGAIN after game complete — full reset
document.getElementById("play-again-btn").addEventListener("click", () => {
  initAudio();
  SaveManager.clear();
  deaths = 0;
  currentLevel = 0;
  startLevel(0);
});

// ─── Opening Cinematic Animation ────────────────────────────
function runOpeningAnimation(onDone) {
  const startTime = performance.now();
  const TOTAL = 5200; // ms

  function frame(now) {
    const elapsed = now - startTime;
    const t = elapsed / TOTAL; // 0 to 1

    ctx.clearRect(0, 0, VW, VH);

    if (elapsed < TOTAL) {
      requestAnimationFrame(frame);
    }

    // Phase 1: black (0 - 1400ms)
    if (elapsed < 1400) {
      ctx.fillStyle = "#0a0000";
      ctx.fillRect(0, 0, VW, VH);
      return;
    }

    // Phase 2: evil eyes open (1400 - 3000ms)
    if (elapsed < 3000) {
      const eyeT = Math.min((elapsed - 1400) / 1000, 1); // 0..1 eye open
      const ease = eyeT * eyeT * (3 - 2 * eyeT); // smoothstep

      // Background
      ctx.fillStyle = "#0a0000";
      ctx.fillRect(0, 0, VW, VH);

      // Draw two eyes
      const eyeY = VH * 0.42;
      const eyeGap = 110;
      const eyeW = 90;
      const eyeH = 40 * ease;

      ctx.save();
      ctx.fillStyle = "#c84010";
      // Left eye
      ctx.beginPath();
      ctx.ellipse(VW/2 - eyeGap, eyeY, eyeW/2, eyeH, 0, 0, Math.PI*2);
      ctx.fill();
      // Right eye  
      ctx.beginPath();
      ctx.ellipse(VW/2 + eyeGap, eyeY, eyeW/2, eyeH, 0, 0, Math.PI*2);
      ctx.fill();

      // Dark pupils
      if (ease > 0.3) {
        const pupilA = (ease - 0.3) / 0.7;
        ctx.globalAlpha = pupilA;
        ctx.fillStyle = "#3a0800";
        ctx.beginPath();
        ctx.ellipse(VW/2 - eyeGap, eyeY + 5, eyeW*0.28, eyeH*0.55, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(VW/2 + eyeGap, eyeY + 5, eyeW*0.28, eyeH*0.55, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.restore();
      return;
    }

    // Phase 3: title slam (3000 - 4500ms)
    if (elapsed < 4500) {
      const titleT = Math.min((elapsed - 3000) / 600, 1);
      const bounce = titleT < 0.6
        ? 1 - Math.pow(1 - titleT/0.6, 3)
        : 1 + Math.sin((titleT - 0.6) * Math.PI / 0.4) * 0.04 * (1 - (titleT - 0.6) / 0.4);
      const subT = Math.max(0, (elapsed - 3600) / 600);

      // Background
      const grad = ctx.createLinearGradient(0, 0, 0, VH);
      grad.addColorStop(0, "#0a0000");
      grad.addColorStop(1, "#1a0500");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, VW, VH);

      // Title
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const titleSize = Math.round(90 * bounce);
      ctx.font = `bold ${titleSize}px 'Press Start 2P', monospace`;
      ctx.fillStyle = "#cc3300";
      ctx.shadowColor = "#ff4400";
      ctx.shadowBlur = 30;
      ctx.fillText("Oops!", VW/2, VH/2 - 20);
      ctx.shadowBlur = 0;

      // Subtitle
      if (subT > 0) {
        ctx.globalAlpha = Math.min(subT, 1);
        ctx.font = `14px 'Press Start 2P', monospace`;
        ctx.fillStyle = "#c84010";
        ctx.fillText("a totally fair game", VW/2, VH/2 + 65);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
      return;
    }

    // Phase 4: fade to start (4500 - 5200ms)
    {
      const fadeT = Math.min((elapsed - 4500) / 700, 1);

      // Background stays
      const grad = ctx.createLinearGradient(0, 0, 0, VH);
      grad.addColorStop(0, "#0a0000");
      grad.addColorStop(1, "#1a0500");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, VW, VH);

      // Title fades
      ctx.save();
      ctx.globalAlpha = 1 - fadeT;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `bold 90px 'Press Start 2P', monospace`;
      ctx.fillStyle = "#cc3300";
      ctx.fillText("Oops!", VW/2, VH/2 - 20);
      ctx.font = `14px 'Press Start 2P', monospace`;
      ctx.fillStyle = "#c84010";
      ctx.fillText("a totally fair game", VW/2, VH/2 + 65);
      ctx.restore();

      // Black overlay fades in
      ctx.globalAlpha = fadeT;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, VW, VH);
      ctx.globalAlpha = 1;

      if (elapsed >= TOTAL) {
        onDone();
      }
    }
  }

  requestAnimationFrame(frame);
}

// ─── Start ───────────────────────────────────────────────────
gameState = "intro";
runOpeningAnimation(() => {
  gameState = "start";
  refreshStartScreen();
  showScreen("start");
  lastTime = performance.now();
  requestAnimationFrame(loop);
});

