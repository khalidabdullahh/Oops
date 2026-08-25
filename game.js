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
  // Slightly smaller (0.92) to make the gameplay look more minimal and centered
  const ratio = Math.min(ww / VW, wh / VH) * 0.92;
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
  bindBtn("btn-flip",    "ShiftLeft");
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
  { // World 1: Desert Ruins (Levels 1-6)
    name: "DESERT RUINS",
    bg1: "#7a2000", bg2: "#b03800",
    bgCrack: "rgba(0,0,0,0.18)",
    ground: "#c8601a", groundTop: "#e07820",
    platform: "#c8601a", platformTop: "#d87020", fake: "#a04018",
    danger: "#cc2200", spike: "#cc2200", saw: "#ff6600",
    exit: "#e8c060", exitGlow: "rgba(232,192,96,0.5)",
    portal1: "#ff8800", portal2: "#cc4400",
    fog: "rgba(120,32,0,0.15)", crackColor: "rgba(0,0,0,0.18)"
  },
  { // World 2: Frost Spire (Levels 7-12)
    name: "FROST SPIRE",
    bg1: "#0b3040", bg2: "#144c66",
    bgCrack: "rgba(255,255,255,0.06)",
    ground: "#237294", groundTop: "#358cb8",
    platform: "#237294", platformTop: "#358cb8", fake: "#154c66",
    danger: "#e74c3c", spike: "#e74c3c", saw: "#00d2d3",
    exit: "#f1c40f", exitGlow: "rgba(241,196,15,0.5)",
    portal1: "#00d2d3", portal2: "#01a3a4",
    fog: "rgba(11,48,64,0.22)", crackColor: "rgba(255,255,255,0.08)"
  },
  { // World 3: Shadow Crypt (Levels 13-18)
    name: "SHADOW CRYPT",
    bg1: "#180c06", bg2: "#2a1508",
    bgCrack: "rgba(0,0,0,0.3)",
    ground: "#58301e", groundTop: "#7a4028",
    platform: "#58301e", platformTop: "#6a3820", fake: "#381808",
    danger: "#882200", spike: "#aa3300", saw: "#cc4400",
    exit: "#c8a030", exitGlow: "rgba(200,160,48,0.5)",
    portal1: "#c04000", portal2: "#802000",
    fog: "rgba(24,12,6,0.28)", crackColor: "rgba(0,0,0,0.3)"
  },
  { // World 4: Gravity Nexus (Levels 19-24)
    name: "GRAVITY NEXUS",
    bg1: "#050a05", bg2: "#0c150c",
    bgCrack: "rgba(0,255,0,0.07)",
    ground: "#1b331b", groundTop: "#264d26",
    platform: "#1b331b", platformTop: "#264d26", fake: "#0f1f0f",
    danger: "#ff3333", spike: "#ff3333", saw: "#00ff00",
    exit: "#00ff00", exitGlow: "rgba(0,255,0,0.5)",
    portal1: "#2edd0d", portal2: "#198c06",
    fog: "rgba(5,10,5,0.3)", crackColor: "rgba(0,255,0,0.07)"
  },
  { // World 5: Glitch Core (Levels 25-30)
    name: "GLITCH CORE",
    bg1: "#1d0e32", bg2: "#2d164d",
    bgCrack: "rgba(125,95,255,0.08)",
    ground: "#61318a", groundTop: "#753fa6",
    platform: "#61318a", platformTop: "#753fa6", fake: "#452263",
    danger: "#ff3f34", spike: "#ff3f34", saw: "#ef5777",
    exit: "#ffd32a", exitGlow: "rgba(255,211,42,0.5)",
    portal1: "#f53b57", portal2: "#3c40c6",
    fog: "rgba(29,14,50,0.22)", crackColor: "rgba(125,95,255,0.08)"
  }
];

function getTheme(idx) {
  const worldIndex = Math.floor(idx / 6);
  return WORLD_THEMES[Math.min(worldIndex, WORLD_THEMES.length - 1)];
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
    // Gravity flip properties
    this.gravityDir = 1; // 1 = down, -1 = up
    this.flipCooldown = 0;
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

    // Jump (adjust velocity direction based on gravity direction)
    if (this.jumpBuffer > 0 && this.coyoteTimer > 0) {
      this.vy = this.gravityDir * JUMP_VEL;
      this.coyoteTimer = 0;
      this.jumpBuffer  = 0;
      this.squishX = 0.62; this.squishY = 1.5;
      SFX.jump();
    }

    // Variable jump height decay (adjust for normal vs inverted gravity)
    if (this.gravityDir === 1) {
      if (this.vy < -200 && !pressed("ArrowUp","KeyW","Space")) {
        this.vy += 1600 * dt;
      }
    } else {
      if (this.vy > 200 && !pressed("ArrowUp","KeyW","Space")) {
        this.vy -= 1600 * dt;
      }
    }

    // Gravity pull direction
    if (this.gravityDir === 1) {
      this.vy = Math.min(this.vy + GRAVITY * dt, MAX_FALL);
    } else {
      this.vy = Math.max(this.vy - GRAVITY * dt, -MAX_FALL);
    }

    // Gravity flip triggers (Shift / F / mobile button)
    if (this.flipCooldown > 0) this.flipCooldown -= dt;
    if ((currentLevel >= 18 && currentLevel <= 23) && this.flipCooldown <= 0 && (pressed("ShiftLeft", "ShiftRight", "KeyF") || keys["ShiftLeft"] || keys["ShiftRight"])) {
      this.gravityDir *= -1;
      this.flipCooldown = 0.28;
      SFX.portal();
      spawnParticles(this.cx, this.cy, activeTheme.portal1, 8, 120);
      shake(3, 0.12);
    }

    // Move & collide
    const wasOnGround = this.onGround;
    this.onGround = false;

    this.x += this.vx * dt;
    level.resolveX(this);

    this.y += this.vy * dt;
    level.resolveY(this, dt);

    // Land squish
    if (!wasOnGround && this.onGround) {
      this.squishX = 1.4; this.squishY = 0.65;
      this.landTimer = 0.12;
      if (Math.abs(this.vy) > 200) SFX.land();
    }

    this.blinkTimer += dt;

    // Kill if fell off bottom OR flew off top in inverted gravity
    if (this.y > VH + 100 || this.y < -100) this.die("fell off");
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
      if (this.gravityDir === -1) {
        ctx.translate(this.cx, this.y); // pivot at head/ceiling
        if (!this.facingRight) ctx.scale(-1, 1);
        ctx.scale(this.squishX, -this.squishY); // flip Y!
      } else {
        ctx.translate(this.cx, this.y + this.h); // pivot at feet
        if (!this.facingRight) ctx.scale(-1, 1);
        ctx.scale(this.squishX, this.squishY);
      }
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
    // Glitch
    this.glitchInterval = opts.glitchInterval || 0;
    this.glitchTimer    = this.glitchInterval;
    this.active    = true; // for timed traps
  }

  get left()   { return this.x; }
  get right()  { return this.x + this.w; }
  get top()    { return this.y; }
  get bottom() { return this.y + this.h; }

  update(dt) {
    // Glitch cycle logic (runs even when inactive)
    if (this.glitchInterval > 0) {
      this.glitchTimer -= dt;
      if (this.glitchTimer <= 0) {
        this.glitchTimer = this.glitchInterval;
        this.active = !this.active;
        if (Math.random() < 0.5) {
          spawnParticles(this.x + this.w/2, this.y + this.h/2, activeTheme.portal1 || "#ff4757", 4, 70);
        }
      }
    }

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

    if (!this.active) {
      if (this.glitchInterval > 0) {
        ctx.save();
        ctx.strokeStyle = "rgba(255, 71, 87, 0.45)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 4]);
        ctx.strokeRect(this.x - 2, this.y, this.w, this.h);
        ctx.strokeStyle = "rgba(0, 210, 211, 0.45)";
        ctx.strokeRect(this.x + 2, this.y, this.w, this.h);
        ctx.restore();
      }
      return;
    }

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
  constructor(x, y, opts = {}) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.w = 40;
    this.h = 50;
    this.phase = 0;
    this.reached = false;
    // Fleeing Exit troll mechanics (inspired by Level Devil)
    this.fleeOnProximity = opts.fleeOnProximity || false;
    this.fleeDist = opts.fleeDist || 90;
    this.targetX = opts.targetX ?? x;
    this.targetY = opts.targetY ?? y;
    this.fleeSpeed = opts.fleeSpeed || 8;
    this.hasFled = false;
    this.fleeMessage = opts.fleeMessage || null;
  }

  get left()   { return this.x; }
  get right()  { return this.x+this.w; }
  get top()    { return this.y; }
  get bottom() { return this.y+this.h; }

  update(dt, player, runtime) {
    this.phase += dt * 2;
    if (this.fleeOnProximity && !this.hasFled && player && player.alive) {
      const dx = player.cx - (this.x + this.w / 2);
      const dy = player.cy - (this.y + this.h / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.fleeDist) {
        this.hasFled = true;
        SFX.portal();
        shake(5, 0.25);
        spawnParticles(this.x + this.w / 2, this.y + this.h / 2, activeTheme.portal1 || "#ff8800", 14, 160);
        if (runtime && this.fleeMessage) {
          runtime.flashMsg = this.fleeMessage;
          runtime.flashMsgTimer = 2.2;
        }
      }
    }
    if (this.hasFled) {
      this.x = lerp(this.x, this.targetX, dt * this.fleeSpeed);
      this.y = lerp(this.y, this.targetY, dt * this.fleeSpeed);
    }
  }

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

// ─── Interactive Hazard Classes ──────────────────────────────

class Crusher {
  constructor(x, y, w, h, groundY, opts = {}) {
    this.startX = x;
    this.startY = y;
    this.x = x;
    this.y = y;
    this.w = w || 54;
    this.h = h || 54;
    this.groundY = groundY || (VH - 70);
    this.triggerX1 = opts.triggerX1 ?? (x - 45);
    this.triggerX2 = opts.triggerX2 ?? (x + this.w + 45);
    this.slamSpeed = opts.slamSpeed || 780;
    this.retractSpeed = opts.retractSpeed || 110;
    this.state = "idle"; // idle, slamming, ground, retracting
    this.groundTimer = 0;
    this.groundWait = opts.groundWait || 0.65;
  }

  get left()   { return this.x; }
  get right()  { return this.x + this.w; }
  get top()    { return this.y; }
  get bottom() { return this.y + this.h; }

  update(dt, player) {
    if (this.state === "idle") {
      if (player && player.alive && player.cx >= this.triggerX1 && player.cx <= this.triggerX2 && player.y >= this.startY) {
        this.state = "slamming";
        SFX.trap();
      }
    } else if (this.state === "slamming") {
      this.y += this.slamSpeed * dt;
      if (this.y + this.h >= this.groundY) {
        this.y = this.groundY - this.h;
        this.state = "ground";
        this.groundTimer = this.groundWait;
        shake(7, 0.22);
        SFX.land();
        spawnParticles(this.x + this.w / 2, this.y + this.h, activeTheme.ground || "#888", 12, 150);
      }
    } else if (this.state === "ground") {
      this.groundTimer -= dt;
      if (this.groundTimer <= 0) {
        this.state = "retracting";
      }
    } else if (this.state === "retracting") {
      this.y -= this.retractSpeed * dt;
      if (this.y <= this.startY) {
        this.y = this.startY;
        this.state = "idle";
      }
    }
  }

  draw(ctx) {
    const th = activeTheme;
    ctx.save();

    // Chains from ceiling
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(this.x + 10, 0);
    ctx.lineTo(this.x + 10, this.y);
    ctx.moveTo(this.x + this.w - 10, 0);
    ctx.lineTo(this.x + this.w - 10, this.y);
    ctx.stroke();

    // Crusher Block Body
    ctx.fillStyle = th.platformTop || "#555";
    ctx.fillRect(this.x, this.y, this.w, this.h);

    ctx.fillStyle = th.platform || "#333";
    ctx.fillRect(this.x + 4, this.y + 4, this.w - 8, this.h - 8);

    // Spikes on the bottom edge
    ctx.fillStyle = th.spike || "#e74c3c";
    const teeth = Math.floor(this.w / 14);
    for (let i = 0; i < teeth; i++) {
      ctx.beginPath();
      ctx.moveTo(this.x + i * 14, this.y + this.h);
      ctx.lineTo(this.x + i * 14 + 7, this.y + this.h + 9);
      ctx.lineTo(this.x + i * 14 + 14, this.y + this.h);
      ctx.closePath();
      ctx.fill();
    }

    // Glowing menacing eyes
    const eyeY = this.y + this.h * 0.42;
    ctx.fillStyle = this.state === "slamming" ? "#ff0000" : (th.danger || "#ff5252");
    ctx.shadowBlur = 8;
    ctx.shadowColor = th.danger || "#ff0000";
    ctx.fillRect(this.x + 10, eyeY, 6, 6);
    ctx.fillRect(this.x + this.w - 16, eyeY, 6, 6);
    ctx.shadowBlur = 0;

    ctx.restore();
  }
}

class FallingPlatform extends Platform {
  constructor(x, y, w, h, opts = {}) {
    super(x, y, w, h, TILE.SOLID, opts);
    this.shakeTimer = 0;
    this.fallTimer = opts.fallDelay || 0.28;
    this.falling = false;
    this.vy = 0;
    this.steppedOn = false;
    this.respawnTimer = 0;
    this.respawnDelay = opts.respawnDelay || 3.2;
    this.shakeOffsetX = 0;
  }

  update(dt) {
    super.update(dt);
    if (this.steppedOn && !this.falling) {
      this.shakeTimer += dt;
      this.shakeOffsetX = Math.sin(this.shakeTimer * 50) * 3.5;
      this.fallTimer -= dt;
      if (this.fallTimer <= 0) {
        this.falling = true;
        this.shakeOffsetX = 0;
        SFX.trap();
        spawnParticles(this.x + this.w / 2, this.y + this.h, activeTheme.ground || "#ff8800", 8, 100);
      }
    }
    if (this.falling) {
      this.vy += 1300 * dt;
      this.y += this.vy * dt;
      if (this.y > VH + 200) {
        if (this.respawnDelay > 0) {
          this.respawnTimer += dt;
          if (this.respawnTimer >= this.respawnDelay) {
            this.y = this.startY;
            this.vy = 0;
            this.falling = false;
            this.steppedOn = false;
            this.shakeTimer = 0;
            this.fallTimer = 0.28;
            this.respawnTimer = 0;
          }
        }
      }
    }
  }

  draw(ctx, time) {
    if (this.y > VH + 100) return;
    ctx.save();
    ctx.translate(this.shakeOffsetX, 0);
    super.draw(ctx, time);
    ctx.restore();
  }
}

class PopSpike extends Spike {
  constructor(x, y, dir = "up", triggerX1, triggerX2, opts = {}) {
    super(x, y, dir, { ...opts, hidden: true });
    this.triggerX1 = triggerX1 ?? (x - 55);
    this.triggerX2 = triggerX2 ?? (x + 75);
    this.popped = false;
    this.extension = 0;
  }

  update(dt, playerX, playerY) {
    if (!this.popped && playerX >= this.triggerX1 && playerX <= this.triggerX2) {
      this.popped = true;
      this.revealed = true;
      SFX.trap();
      shake(3, 0.12);
    }
    if (this.popped && this.extension < 1) {
      this.extension = Math.min(1, this.extension + dt * 12);
    }
  }

  draw(ctx) {
    if (!this.revealed) return;
    ctx.save();
    ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
    const rotMap = { up: 0, down: Math.PI, left: -Math.PI / 2, right: Math.PI / 2 };
    ctx.rotate(rotMap[this.dir] || 0);

    ctx.fillStyle = activeTheme.spike || "#e74c3c";
    ctx.beginPath();
    ctx.moveTo(-this.w / 2, this.h / 2);
    ctx.lineTo(0, this.h / 2 - this.h * this.extension);
    ctx.lineTo(this.w / 2, this.h / 2);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 8;
    ctx.shadowColor = activeTheme.danger || "#ff0000";
    ctx.restore();
  }
}

class LaserHazard {
  constructor(x1, y1, x2, y2, opts = {}) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.cycle = opts.cycle || 2.4;
    this.onDuration = opts.onDuration || 1.1;
    this.offset = opts.offset || 0;
    this.time = this.offset;
    this.active = true;
    this.warning = false;
  }

  update(dt) {
    this.time = (this.time + dt) % this.cycle;
    const progress = this.time / this.cycle;
    this.warning = progress > (1 - (this.onDuration / this.cycle) - 0.16) && progress <= (1 - (this.onDuration / this.cycle));
    this.active = progress > (1 - (this.onDuration / this.cycle));
  }

  collides(player) {
    if (!this.active) return false;
    const px = player.cx, py = player.cy;
    const dx = this.x2 - this.x1, dy = this.y2 - this.y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return false;
    const t = Math.max(0, Math.min(1, ((px - this.x1) * dx + (py - this.y1) * dy) / lenSq));
    const nearX = this.x1 + t * dx, nearY = this.y1 + t * dy;
    const distSq = (px - nearX) * (px - nearX) + (py - nearY) * (py - nearY);
    return distSq < (player.w / 2 + 3) * (player.w / 2 + 3);
  }

  draw(ctx) {
    ctx.save();
    // Terminals
    ctx.fillStyle = "#333";
    ctx.beginPath(); ctx.arc(this.x1, this.y1, 6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(this.x2, this.y2, 6, 0, Math.PI * 2); ctx.fill();
// ─── Level Definitions (30 Handcrafted Levels across 5 Worlds) ──
function buildLevel(index) {
  const levels = [
    // 🏜️ World 1: Desert Ruins (Levels 0 - 5)
    lvl0_firstSteps,
    lvl1_crushingWelcome,
    lvl2_crumblingPath,
    lvl3_spikeAmbush,
    lvl4_bouncerTrick,
    lvl5_fleeingGateway,

    // ❄️ World 2: Frost Spire (Levels 6 - 11)
    lvl6_slipperySlope,
    lvl7_icicleSmash,
    lvl8_vanishingGlacier,
    lvl9_laserGridAlpha,
    lvl10_frozenSpring,
    lvl11_frostbiteChase,

    // 🏰 World 3: Shadow Crypt (Levels 12 - 17)
    lvl12_darkAmbush,
    lvl13_crushCrawl,
    lvl14_falseHope,
    lvl15_crossfireLasers,
    lvl16_collapsingStairs,
    lvl17_cryptMaster,

    // 🌀 World 4: Gravity Nexus (Levels 18 - 23)
    lvl18_ceilingWalker,
    lvl19_invertedSaws,
    lvl20_gravityFlipMaze,
    lvl21_invertedCrushers,
    lvl22_dualGravityLoops,
    lvl23_nexusCore,

    // ⚡ World 5: Glitch Core (Levels 24 - 29)
    lvl24_chromaticSteps,
    lvl25_hyperspeedBouncer,
    lvl26_glitchLaserRun,
    lvl27_teleportChaos,
    lvl28_matrixTrial,
    lvl29_grandFinale,
  ];

  const fn = levels[Math.max(0, Math.min(index, levels.length - 1))];
  return fn ? fn() : lvl0_firstSteps();
}

function getMaxLevels() {
  return 30;
}

// ═══════════════════════════════════════════════════════════════
// 🏜️ WORLD 1: DESERT RUINS (Levels 1 - 6)
// ═══════════════════════════════════════════════════════════════

function lvl0_firstSteps() {
  return {
    name: "First Steps :)",
    playerStart: [60, 420],
    platforms: [
      mkSolid(0, 470, 320, 70),
      mkSolid(400, 470, 560, 70),
      mkSolid(220, 370, 120, 20),
      mkSolid(460, 320, 120, 20),
    ],
    spikes: [
      new Spike(320, 520, "up"), new Spike(340, 520, "up"), new Spike(360, 520, "up"), new Spike(380, 520, "up"),
    ],
    saws: [], portals: [], crushers: [], lasers: [],
    exit: new Exit(850, 420, {
      fleeOnProximity: true,
      fleeDist: 100,
      targetX: 850,
      targetY: 260,
      fleeMessage: "Not so fast! 😇"
    }),
    triggers: [
      mkTrigger(
        r => r.exit.hasFled && !r.data._platformAdded,
        r => {
          r.platforms.push(mkSolid(780, 310, 160, 20));
          r.data._platformAdded = true;
        }
      )
    ],
  };
}

function lvl1_crushingWelcome() {
  return {
    name: "Crushing Welcome",
    playerStart: [60, 420],
    platforms: [
      mkSolid(0, 470, 240, 70),
      mkSolid(240, 470, 480, 70),
      mkSolid(720, 470, 240, 70),
    ],
    spikes: [], saws: [], portals: [], lasers: [],
    crushers: [
      mkCrusher(340, 60, 64, 64, 470, { triggerX1: 290, triggerX2: 440, slamSpeed: 820 }),
      mkCrusher(520, 60, 64, 64, 470, { triggerX1: 470, triggerX2: 620, slamSpeed: 820 }),
    ],
    exit: new Exit(860, 420),
  };
}

function lvl2_crumblingPath() {
  return {
    name: "Crumbling Path",
    playerStart: [50, 420],
    platforms: [
      mkSolid(0, 470, 140, 70),
      mkFalling(180, 450, 80, 20),
      mkFalling(300, 410, 80, 20),
      mkFalling(420, 370, 80, 20),
      mkFalling(540, 330, 80, 20),
      mkFalling(660, 370, 80, 20),
      mkSolid(780, 470, 180, 70),
    ],
    spikes: [
      new Spike(180, 520, "up"), new Spike(300, 520, "up"), new Spike(420, 520, "up"),
      new Spike(540, 520, "up"), new Spike(660, 520, "up"),
    ],
    saws: [], portals: [], crushers: [], lasers: [],
    exit: new Exit(860, 420),
  };
}

function lvl3_spikeAmbush() {
  return {
    name: "Spike Ambush",
    playerStart: [50, 420],
    platforms: [
      mkSolid(0, 470, 960, 70),
      mkSolid(300, 340, 160, 20),
      mkSolid(600, 260, 160, 20),
    ],
    spikes: [
      mkPopSpike(260, 454, "up", 200, 290),
      mkPopSpike(520, 454, "up", 460, 550),
      mkPopSpike(740, 454, "up", 680, 770),
    ],
    saws: [], portals: [], crushers: [], lasers: [],
    exit: new Exit(870, 420),
  };
}

function lvl4_bouncerTrick() {
  return {
    name: "Bouncer Trouble",
    playerStart: [50, 420],
    platforms: [
      mkSolid(0, 470, 150, 70),
      mkTrampo(220, 450, 70, 20, { bounceVel: -620 }),
      mkSolid(420, 270, 140, 20),
      mkTrampo(630, 450, 70, 20, { bounceVel: -620 }),
      mkSolid(780, 470, 180, 70),
    ],
    spikes: [
      new Spike(320, 520, "up"), new Spike(520, 520, "up"),
    ],
    saws: [
      new Saw(340, 180, { speed: 4, pathY: 1, pathRange: 50, pathSpeed: 100 }),
    ],
    portals: [], crushers: [], lasers: [],
    exit: new Exit(860, 420),
  };
}

function lvl5_fleeingGateway() {
  return {
    name: "The Fleeing Gate",
    playerStart: [50, 420],
    platforms: [
      mkSolid(0, 470, 180, 70),
      mkSolid(260, 400, 140, 20),
      mkSolid(480, 320, 140, 20),
      mkSolid(700, 400, 140, 20),
      mkSolid(850, 470, 110, 70),
    ],
    spikes: [
      new Spike(200, 520, "up"), new Spike(420, 520, "up"), new Spike(640, 520, "up"),
    ],
    saws: [], portals: [], crushers: [], lasers: [],
    exit: new Exit(320, 350, {
      fleeOnProximity: true,
      fleeDist: 85,
      targetX: 740,
      targetY: 350,
      fleeMessage: "Catch me if you can! 🏃"
    }),
  };
}

// ═══════════════════════════════════════════════════════════════
// ❄️ WORLD 2: FROST SPIRE (Levels 7 - 12)
// ═══════════════════════════════════════════════════════════════

function lvl6_slipperySlope() {
  return {
    name: "Slippery Slope",
    playerStart: [50, 420],
    platforms: [
      mkSolid(0, 470, 140, 70),
      mkIce(140, 470, 500, 70),
      mkSolid(780, 470, 180, 70),
    ],
    spikes: [
      new Spike(640, 454, "up"), new Spike(656, 454, "up"), new Spike(672, 454, "up"),
    ],
    saws: [], portals: [], crushers: [], lasers: [],
    exit: new Exit(860, 420),
  };
}

function lvl7_icicleSmash() {
  return {
    name: "Icicle Smash",
    playerStart: [50, 420],
    platforms: [
      mkSolid(0, 470, 200, 70),
      mkIce(200, 470, 500, 70),
      mkSolid(700, 470, 260, 70),
    ],
    spikes: [], saws: [], portals: [], lasers: [],
    crushers: [
      mkCrusher(280, 50, 60, 60, 470, { triggerX1: 220, triggerX2: 360, slamSpeed: 850 }),
      mkCrusher(450, 50, 60, 60, 470, { triggerX1: 390, triggerX2: 530, slamSpeed: 850 }),
      mkCrusher(600, 50, 60, 60, 470, { triggerX1: 540, triggerX2: 680, slamSpeed: 850 }),
    ],
    exit: new Exit(860, 420),
  };
}

function lvl8_vanishingGlacier() {
  return {
    name: "Vanishing Glacier",
    playerStart: [40, 420],
    platforms: [
      mkSolid(0, 470, 120, 70),
      mkVanish(160, 410, 90, 18, { vanishDelay: 0.5 }),
      mkVanish(290, 350, 90, 18, { vanishDelay: 0.4 }),
      mkVanish(420, 290, 90, 18, { vanishDelay: 0.4 }),
      mkVanish(550, 350, 90, 18, { vanishDelay: 0.5 }),
      mkVanish(680, 410, 90, 18, { vanishDelay: 0.6 }),
      mkSolid(810, 470, 150, 70),
    ],
    spikes: [
      new Spike(200, 520, "up"), new Spike(400, 520, "up"), new Spike(600, 520, "up"),
    ],
    saws: [], portals: [], crushers: [], lasers: [],
    exit: new Exit(870, 420),
  };
}

function lvl9_laserGridAlpha() {
  return {
    name: "Laser Grid Alpha",
    playerStart: [50, 420],
    platforms: [
      mkSolid(0, 470, 200, 70),
      mkSolid(280, 470, 200, 70),
      mkSolid(560, 470, 200, 70),
      mkSolid(820, 470, 140, 70),
    ],
    spikes: [
      new Spike(200, 520, "up"), new Spike(480, 520, "up"), new Spike(760, 520, "up"),
    ],
    saws: [], portals: [], crushers: [],
    lasers: [
      mkLaser(240, 200, 240, 520, { cycle: 2.2, onDuration: 1.0, offset: 0 }),
      mkLaser(520, 200, 520, 520, { cycle: 2.2, onDuration: 1.0, offset: 1.1 }),
    ],
    exit: new Exit(870, 420),
  };
}

function lvl10_frozenSpring() {
  return {
    name: "Frozen Spring",
    playerStart: [50, 420],
    platforms: [
      mkSolid(0, 470, 120, 70),
      mkIce(120, 470, 200, 70),
      mkTrampo(320, 450, 70, 20, { bounceVel: -680 }),
      mkSolid(460, 240, 160, 20),
      mkSolid(760, 320, 200, 220),
    ],
    spikes: [
      new Spike(400, 520, "up"), new Spike(600, 520, "up"),
    ],
    saws: [],
    portals: [
      new Portal(560, 190, 800, 270, { color: "#00d2d3" }),
    ],
    crushers: [], lasers: [],
    exit: new Exit(880, 270),
  };
}

function lvl11_frostbiteChase() {
  return {
    name: "Frostbite Chase",
    playerStart: [50, 420],
    platforms: [
      mkSolid(0, 470, 140, 70),
      mkIce(140, 470, 480, 70),
      mkFalling(640, 390, 90, 20),
      mkSolid(780, 470, 180, 70),
    ],
    spikes: [
      mkPopSpike(360, 454, "up", 280, 400),
      mkPopSpike(520, 454, "up", 440, 560),
    ],
    saws: [
      new Saw(300, 440, { speed: 5, pathX: 1, pathRange: 120, pathSpeed: 160 }),
    ],
    portals: [], crushers: [], lasers: [],
    exit: new Exit(860, 420),
  };
}

// ═══════════════════════════════════════════════════════════════
// 🏰 WORLD 3: SHADOW CRYPT (Levels 13 - 18)
// ═══════════════════════════════════════════════════════════════

function lvl12_darkAmbush() {
  return {
    name: "Dark Ambush",
    playerStart: [50, 420],
    platforms: [
      mkSolid(0, 470, 300, 70),
      mkSolid(380, 470, 200, 70),
      mkSolid(660, 470, 300, 70),
      mkSolid(420, 320, 120, 20),
    ],
    spikes: [
      new Spike(300, 520, "up"), new Spike(580, 520, "up"),
    ],
    saws: [
      new Saw(500, 160, { speed: 4, pathY: 1, pathRange: 80, pathSpeed: 140 }),
    ],
    portals: [], crushers: [], lasers: [],
    exit: new Exit(860, 420),
  };
}

function lvl13_crushCrawl() {
  return {
    name: "Crush Crawl",
    playerStart: [50, 420],
    platforms: [
      mkSolid(0, 470, 200, 70),
      mkSolid(200, 470, 560, 70),
      mkSolid(760, 470, 200, 70),
    ],
    spikes: [], saws: [], portals: [], lasers: [],
    crushers: [
      mkCrusher(300, 40, 120, 64, 470, { triggerX1: 240, triggerX2: 440, slamSpeed: 880 }),
      mkCrusher(520, 40, 120, 64, 470, { triggerX1: 460, triggerX2: 660, slamSpeed: 880 }),
    ],
    exit: new Exit(870, 420),
  };
}

function lvl14_falseHope() {
  return {
    name: "False Hope",
    playerStart: [50, 420],
    platforms: [
      mkSolid(0, 470, 220, 70),
      mkSolid(300, 470, 360, 70),
      mkSolid(740, 470, 220, 70),
      mkSolid(400, 260, 160, 20),
    ],
    spikes: [
      mkPopSpike(800, 454, "up", 740, 860),
    ],
    saws: [], portals: [], crushers: [], lasers: [],
    exit: new Exit(480, 210), // Real exit elevated!
  };
}

function lvl15_crossfireLasers() {
  return {
    name: "Crossfire Lasers",
    playerStart: [50, 420],
    platforms: [
      mkSolid(0, 470, 160, 70),
      mkSolid(240, 400, 120, 20),
      mkSolid(440, 300, 120, 20),
      mkSolid(640, 400, 120, 20),
      mkSolid(800, 470, 160, 70),
    ],
    spikes: [
      new Spike(160, 520, "up"), new Spike(360, 520, "up"), new Spike(560, 520, "up"),
    ],
    saws: [], portals: [], crushers: [],
    lasers: [
      mkLaser(300, 100, 300, 500, { cycle: 2.2, onDuration: 1.1, offset: 0 }),
      mkLaser(500, 100, 500, 500, { cycle: 2.2, onDuration: 1.1, offset: 1.1 }),
      mkLaser(150, 350, 750, 350, { cycle: 2.8, onDuration: 1.0, offset: 0.5 }),
    ],
    exit: new Exit(860, 420),
  };
}

function lvl16_collapsingStairs() {
  return {
    name: "Collapsing Stairs",
    playerStart: [40, 420],
    platforms: [
      mkSolid(0, 470, 120, 70),
      mkFalling(160, 440, 90, 20),
      mkFalling(280, 380, 90, 20),
      mkFalling(400, 320, 90, 20),
      mkFalling(520, 260, 90, 20),
      mkFalling(640, 200, 90, 20),
      mkSolid(780, 240, 180, 300),
    ],
    spikes: [
      new Spike(150, 520, "up"), new Spike(300, 520, "up"), new Spike(450, 520, "up"), new Spike(600, 520, "up"),
    ],
    saws: [], portals: [], crushers: [], lasers: [],
    exit: new Exit(860, 190),
  };
}

function lvl17_cryptMaster() {
  return {
    name: "Crypt Master",
    playerStart: [50, 420],
    platforms: [
      mkSolid(0, 470, 160, 70),
      mkFalling(220, 420, 100, 20),
      mkSolid(380, 340, 120, 20),
      mkFalling(560, 340, 100, 20),
      mkSolid(740, 470, 220, 70),
    ],
    spikes: [
      new Spike(160, 520, "up"), new Spike(480, 520, "up"),
    ],
    saws: [
      new Saw(300, 240, { speed: 4, pathY: 1, pathRange: 60, pathSpeed: 120 }),
    ],
    crushers: [
      mkCrusher(440, 50, 64, 64, 340, { triggerX1: 380, triggerX2: 500, slamSpeed: 850 }),
    ],
    lasers: [
      mkLaser(680, 150, 680, 500, { cycle: 2.4, onDuration: 1.1, offset: 0 }),
    ],
    portals: [],
    exit: new Exit(860, 420, {
      fleeOnProximity: true,
      fleeDist: 85,
      targetX: 860,
      targetY: 280,
      fleeMessage: "Crypt Master says: NOPE! 😈"
    }),
    triggers: [
      mkTrigger(
        r => r.exit.hasFled && !r.data._platformAdded,
        r => {
          r.platforms.push(mkSolid(800, 330, 140, 20));
          r.data._platformAdded = true;
        }
      )
    ],
  };
}

// ═══════════════════════════════════════════════════════════════
// 🌀 WORLD 4: GRAVITY NEXUS (Levels 19 - 24)
// ═══════════════════════════════════════════════════════════════

function lvl18_ceilingWalker() {
  return {
    name: "Ceiling Walker",
    playerStart: [60, 420],
    platforms: [
      mkSolid(0, 470, 240, 70),
      mkSolid(320, 470, 640, 70),
      mkSolid(400, 120, 200, 20),
      mkSolid(800, 250, 160, 20),
    ],
    spikes: [
      new Spike(240, 470, "up"), new Spike(256, 470, "up"), new Spike(272, 470, "up"), new Spike(288, 470, "up"), new Spike(304, 470, "up"),
    ],
    saws: [], portals: [], crushers: [], lasers: [],
    exit: new Exit(860, 200),
    trapMessage: "PC: Shift | Mobile: Tap FLIP to walk on ceilings!",
  };
}

function lvl19_invertedSaws() {
  return {
    name: "Inverted Saws",
    playerStart: [50, 410],
    platforms: [
      mkSolid(0, 450, 200, 90),
      mkSolid(250, 450, 400, 90),
      mkSolid(700, 450, 260, 90),
      mkSolid(350, 100, 250, 20),
    ],
    spikes: [
      new Spike(210, 450, "up"), new Spike(226, 450, "up"),
      new Spike(660, 450, "up"), new Spike(676, 450, "up"),
    ],
    saws: [
      new Saw(350, 435, { speed: 4, pathX: 1, pathRange: 120, pathSpeed: 200 }),
      new Saw(550, 435, { speed: 5, pathX: 1, pathRange: 100, pathSpeed: 180 }),
    ],
    portals: [], crushers: [], lasers: [],
    exit: new Exit(850, 400),
    trapMessage: "Floor is a buzzsaw ballet. Use the ceiling!",
  };
}

function lvl20_gravityFlipMaze() {
  return {
    name: "Gravity Flip Maze",
    playerStart: [50, 420],
    platforms: [
      mkSolid(0, 460, 120, 80),
      mkSolid(220, 160, 100, 20),
      mkSolid(420, 120, 100, 20),
      mkSolid(620, 160, 100, 20),
      mkSolid(800, 420, 160, 120),
    ],
    spikes: [
      new Spike(140, 520, "up"), new Spike(240, 520, "up"), new Spike(340, 520, "up"),
      new Spike(440, 520, "up"), new Spike(540, 520, "up"), new Spike(640, 520, "up"),
      new Spike(740, 520, "up"),
    ],
    saws: [], portals: [], crushers: [], lasers: [],
    exit: new Exit(860, 370),
    trapMessage: "Stand on the ceiling and jump DOWNWARD!",
  };
}

function lvl21_invertedCrushers() {
  return {
    name: "Inverted Crushers",
    playerStart: [50, 410],
    platforms: [
      mkSolid(0, 450, 150, 90),
      mkSolid(150, 100, 660, 20), // Ceiling walking track
      mkSolid(810, 450, 150, 90),
    ],
    spikes: [
      new Spike(150, 520, "up"), new Spike(300, 520, "up"), new Spike(500, 520, "up"), new Spike(700, 520, "up"),
    ],
    crushers: [
      mkCrusher(300, 400, 60, 60, 120, { triggerX1: 240, triggerX2: 360, slamSpeed: 800 }),
      mkCrusher(550, 400, 60, 60, 120, { triggerX1: 490, triggerX2: 610, slamSpeed: 800 }),
    ],
    saws: [], portals: [], lasers: [],
    exit: new Exit(870, 400),
    trapMessage: "Flip gravity to ceiling, but watch the floor slammers!",
  };
}

function lvl22_dualGravityLoops() {
  return {
    name: "Dual Gravity Loops",
    playerStart: [50, 410],
    platforms: [
      mkSolid(0, 450, 150, 90),
      mkSolid(250, 200, 120, 20),
      mkSolid(450, 320, 120, 20),
      mkSolid(620, 150, 120, 20),
      mkSolid(800, 450, 160, 90),
    ],
    spikes: [
      new Spike(160, 520, "up"), new Spike(300, 520, "up"), new Spike(500, 520, "up"),
    ],
    portals: [
      new Portal(300, 190, 680, 140, { color: "#2edd0d" }),
    ],
    saws: [], crushers: [], lasers: [],
    exit: new Exit(860, 400),
    trapMessage: "Teleport and flip gravity instantly mid-air!",
  };
}

function lvl23_nexusCore() {
  return {
    name: "Nexus Core",
    playerStart: [50, 410],
    platforms: [
      mkSolid(0, 450, 180, 90),
      mkSolid(220, 340, 140, 20),
      mkSolid(420, 200, 140, 20),
      mkSolid(620, 340, 140, 20),
      mkSolid(800, 450, 160, 90),
      mkSolid(150, 120, 80, 20),
      mkSolid(550, 120, 80, 20),
    ],
    saws: [
      new Saw(500, 185, { speed: 4, pathY: 1, pathRange: 60, pathSpeed: 120 }),
    ],
    spikes: [
      new Spike(250, 340, "up"),
      new Spike(450, 200, "down"),
      new Spike(650, 340, "up"),
      new Spike(170, 140, "down"),
      new Spike(570, 140, "down"),
    ],
    portals: [], crushers: [], lasers: [],
    exit: new Exit(860, 400),
    trapMessage: "Flipping at the exact right millisecond is key.",
  };
}

// ═══════════════════════════════════════════════════════════════
// ⚡ WORLD 5: GLITCH CORE (Levels 25 - 30)
// ═══════════════════════════════════════════════════════════════

function lvl24_chromaticSteps() {
  return {
    name: "Chromatic Steps",
    playerStart: [50, 430],
    platforms: [
      mkSolid(0, 470, 120, 70),
      mkSolid(220, 380, 100, 18, { glitchInterval: 1.4 }),
      mkSolid(420, 300, 100, 18, { glitchInterval: 1.4 }),
      mkSolid(620, 380, 100, 18, { glitchInterval: 1.4 }),
      mkSolid(820, 470, 140, 70),
    ],
    spikes: [
      new Spike(150, 520, "up"), new Spike(350, 520, "up"), new Spike(550, 520, "up"),
    ],
    saws: [], portals: [], crushers: [], lasers: [],
    exit: new Exit(870, 420),
    trapMessage: "Dashed chromatic outlines indicate GLITCH platforms!",
  };
}

function lvl25_hyperspeedBouncer() {
  return {
    name: "Hyperspeed Bouncer",
    playerStart: [60, 430],
    platforms: [
      mkSolid(0, 470, 200, 70),
      mkTrampo(280, 440, 80, 20, { bounceVel: -650 }),
      mkSolid(480, 280, 160, 20),
      mkSolid(760, 280, 200, 260),
    ],
    spikes: [
      new Spike(220, 520, "up"), new Spike(240, 520, "up"),
      new Spike(400, 520, "up"), new Spike(420, 520, "up"),
    ],
    saws: [], portals: [], crushers: [], lasers: [],
  };
}

function lvl26_glitchLaserRun() {
  return {
    name: "Glitch Laser Run",
    playerStart: [50, 430],
    platforms: [
      mkSolid(0, 470, 140, 70),
      mkSolid(220, 380, 100, 18, { glitchInterval: 1.3 }),
      mkSolid(420, 280, 100, 18),
      mkSolid(620, 380, 100, 18, { glitchInterval: 1.3 }),
      mkSolid(800, 470, 160, 70),
    ],
    spikes: [
      new Spike(160, 520, "up"), new Spike(360, 520, "up"), new Spike(560, 520, "up"),
    ],
    saws: [], portals: [], crushers: [],
    lasers: [
      mkLaser(320, 150, 320, 500, { cycle: 2.2, onDuration: 1.0, offset: 0 }),
      mkLaser(520, 150, 520, 500, { cycle: 2.2, onDuration: 1.0, offset: 1.1 }),
    ],
    exit: new Exit(860, 420),
  };
}

function lvl27_teleportChaos() {
  return {
    name: "Teleport Chaos",
    playerStart: [50, 430],
    platforms: [
      mkSolid(0, 470, 140, 70),
      mkSolid(240, 470, 100, 70),
      mkSolid(440, 470, 100, 70),
      mkSolid(640, 470, 100, 70),
      mkSolid(820, 470, 140, 70),
      mkSolid(400, 240, 160, 20),
    ],
    spikes: [
      new Spike(150, 520, "up"), new Spike(350, 520, "up"), new Spike(550, 520, "up"), new Spike(750, 520, "up"),
    ],
    saws: [],
    portals: [
      new Portal(270, 420, 480, 190, { color: "#ff007f" }),
      new Portal(470, 420, 880, 420, { color: "#00d2d3" }),
      new Portal(670, 420, 350, 500, { color: "#ffd32a" }),
    ],
    crushers: [], lasers: [],
    exit: new Exit(880, 420),
  };
}

function lvl28_matrixTrial() {
  return {
    name: "The Matrix Trial",
    playerStart: [50, 420],
    platforms: [
      mkSolid(0, 470, 140, 70),
      mkFalling(180, 420, 80, 20),
      mkSolid(300, 340, 90, 18, { glitchInterval: 1.2 }),
      mkTrampo(440, 450, 70, 20, { bounceVel: -670 }),
      mkSolid(580, 250, 100, 18, { glitchInterval: 1.2 }),
      mkSolid(760, 470, 200, 70),
    ],
    spikes: [
      new Spike(270, 520, "up"), new Spike(520, 520, "up"),
      mkPopSpike(840, 454, "up", 780, 880),
    ],
    saws: [
      new Saw(350, 200, { speed: 4, pathY: 1, pathRange: 80, pathSpeed: 180 }),
    ],
    crushers: [
      mkCrusher(640, 50, 60, 60, 250, { triggerX1: 580, triggerX2: 680, slamSpeed: 900 }),
    ],
    lasers: [],
    portals: [],
    exit: new Exit(880, 420),
  };
}

function lvl29_grandFinale() {
  return {
    name: "The Grand Finale: OOPS!",
    playerStart: [50, 420],
    platforms: [
      mkSolid(0, 470, 160, 70),
      mkFalling(200, 400, 90, 20),
      mkSolid(340, 320, 100, 18, { glitchInterval: 1.3 }),
      mkTrampo(480, 450, 70, 20, { bounceVel: -700 }),
      mkSolid(620, 240, 110, 18, { glitchInterval: 1.3 }),
      mkSolid(790, 470, 170, 70),
    ],
    spikes: [
      new Spike(170, 520, "up"), new Spike(400, 520, "up"), new Spike(560, 520, "up"),
    ],
    saws: [
      new Saw(500, 160, { speed: 5, pathX: 1, pathRange: 80, pathSpeed: 180 }),
    ],
    crushers: [
      mkCrusher(240, 40, 60, 60, 400, { triggerX1: 180, triggerX2: 300, slamSpeed: 920 }),
    ],
    lasers: [
      mkLaser(720, 150, 720, 500, { cycle: 2.0, onDuration: 0.9, offset: 0 }),
    ],
    portals: [],
    exit: new Exit(860, 420, {
      fleeOnProximity: true,
      fleeDist: 90,
      targetX: 860,
      targetY: 260,
      fleeMessage: "One final leap to glory! 🏆"
    }),
    triggers: [
      mkTrigger(
        r => r.exit.hasFled && !r.data._platformAdded,
        r => {
          r.platforms.push(mkSolid(800, 310, 150, 20));
          r.data._platformAdded = true;
        }
      )
    ],
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
// ─── Background Renderer ─────────────────────────────────────
class Background {
  constructor(col1, col2) {
    this.col1 = col1;
    this.col2 = col2;
    // Parallax mountain silhouettes
    this.mountainOffset = 0;
    // Ambient atmospheric particles (50 particles)
    this.ambientParticles = Array.from({ length: 50 }, () => ({
      x: rand(0, VW),
      y: rand(0, VH),
      r: rand(1, 3.5),
      speedX: rand(-15, 25),
      speedY: rand(10, 35),
      alpha: rand(0.2, 0.8),
      pulse: rand(0, Math.PI * 2),
      char: String.fromCharCode(randInt(65, 90)), // For matrix effect
    }));
  }

  update(dt) {
    const thName = activeTheme.name || "DESERT";
    this.mountainOffset = (this.mountainOffset + dt * 4) % VW;

    this.ambientParticles.forEach(p => {
      p.pulse += dt * 3;
      if (thName === "FROST") {
        // Snowflakes gently drifting down and swaying
        p.y += p.speedY * dt * 1.5;
        p.x += Math.sin(p.pulse) * 20 * dt;
      } else if (thName === "LAVA" || thName === "SHADOW") {
        // Rising glowing embers
        p.y -= p.speedY * dt * 1.8;
        p.x += Math.cos(p.pulse) * 15 * dt;
      } else if (thName === "MATRIX") {
        // Matrix digital rain streams
        p.y += p.speedY * dt * 3.5;
      } else {
        // Desert / Void dust motes floating gently
        p.x += p.speedX * dt * 1.2;
        p.y += Math.sin(p.pulse) * 12 * dt;
      }

      // Wrap around
      if (p.x < -20) p.x = VW + 20;
      if (p.x > VW + 20) p.x = -20;
      if (p.y < -20) p.y = VH + 20;
      if (p.y > VH + 20) p.y = -20;
    });
  }

  draw(ctx, time) {
    const th = activeTheme;
    // 1. Sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, VH);
    grad.addColorStop(0, th.bg1);
    grad.addColorStop(1, th.bg2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, VW, VH);

    // 2. Distant Parallax Cavern / Mountain Silhouettes
    ctx.save();
    ctx.fillStyle = th.bgCrack || "rgba(0, 0, 0, 0.18)";
    // Far layer peaks
    ctx.beginPath();
    ctx.moveTo(0, VH);
    for (let x = 0; x <= VW; x += 120) {
      const py = VH * 0.55 + Math.sin((x + 80) * 0.008) * 45 + Math.cos(x * 0.02) * 20;
      ctx.lineTo(x, py);
    }
    ctx.lineTo(VW, VH);
    ctx.closePath();
    ctx.fill();

    // Mid layer ridges
    ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
    ctx.beginPath();
    ctx.moveTo(0, VH);
    for (let x = 0; x <= VW; x += 90) {
      const py = VH * 0.68 + Math.sin(x * 0.015) * 35 + Math.sin((x + 200) * 0.03) * 15;
      ctx.lineTo(x, py);
    }
    ctx.lineTo(VW, VH);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 3. Ambient atmospheric particles
    ctx.save();
    const thName = th.name || "DESERT";
    this.ambientParticles.forEach(p => {
      ctx.globalAlpha = p.alpha * (0.6 + Math.sin(p.pulse) * 0.4);
      if (thName === "FROST") {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      } else if (thName === "LAVA") {
        ctx.fillStyle = "#ff6b35";
        ctx.shadowBlur = 6; ctx.shadowColor = "#ff4757";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 1.2, 0, Math.PI * 2); ctx.fill();
      } else if (thName === "MATRIX") {
        ctx.fillStyle = "#00ff66";
        ctx.font = "9px monospace";
        ctx.fillText(p.char, p.x, p.y);
      } else {
        ctx.fillStyle = th.exit || "#ffd32a";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 0.8, 0, Math.PI * 2); ctx.fill();
      }
    });
    ctx.restore();

    // 4. Background structural cracks (Level Devil style)
    ctx.save();
    ctx.strokeStyle = th.crackColor || "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 7; i++) {
      const x = (VW * (i + 1)) / 8;
      const len = 25 + (i * 37) % 50;
      ctx.beginPath();
      ctx.moveTo(x, 50 + (i * 47) % 100);
      ctx.lineTo(x + 8 * (i % 2 ? 1 : -1), 50 + (i * 47) % 100 + len);
      ctx.stroke();
    }
    ctx.restore();

    // 5. Bottom atmospheric fog
    const fog = ctx.createLinearGradient(0, VH - 90, 0, VH);
    fog.addColorStop(0, "rgba(0,0,0,0)");
    fog.addColorStop(1, th.fog || "rgba(0,0,0,0.3)");
    ctx.fillStyle = fog;
    ctx.fillRect(0, VH - 90, VW, 90);
  }
}

// ─── Level Runtime ───────────────────────────────────────────
class LevelRuntime {
  constructor(levelData) {
    this.data = levelData;
    this.bg = new Background(...(levelData.bg || ["#1a0533", "#2d1b69"]));
    this.player = new Player(...levelData.playerStart);
    this.platforms = [...(levelData.platforms || [])];
    this.spikes = [...(levelData.spikes || [])];
    this.saws = [...(levelData.saws || [])];
    this.portals = [...(levelData.portals || [])];
    this.crushers = [...(levelData.crushers || [])];
    this.lasers = [...(levelData.lasers || [])];
    this.triggers = [...(levelData.triggers || [])];
    this.exit = levelData.exit;
    this.time = 0;
    this.portalCooldown = 0;
    this.complete = false;
    this.dead = false;
    this.deathTimer = 0;
    this.exitPhase = false;
    this.exitTimer = 0;
    this.flashColor = null;
    this.flashTimer = 0;
    this.flashMsg = null;
    this.flashMsgTimer = 0;
  }

  flash(color, dur = 0.4) { this.flashColor = color; this.flashTimer = dur; }

  resolveX(player) {
    for (const p of this.platforms) {
      if (p.type === TILE.FAKE || p.vanished || !p.active) continue;
      if (player.right > p.left && player.left < p.right &&
          player.bottom > p.top && player.top < p.bottom) {
        if (player.vx > 0) player.x = p.left - player.w;
        else               player.x = p.right;
        player.vx = 0;
      }
    }
    player.x = clamp(player.x, 0, VW - player.w);
  }

  resolveY(player, dt) {
    const isNormal = (player.gravityDir === 1);
    
    for (const p of this.platforms) {
      if (p.type === TILE.FAKE || p.vanished || !p.active) continue;

      // One-way platform bypass checks
      if (p.type === TILE.PLATFORM) {
        if (isNormal && player.vy < 0) continue;
        if (!isNormal && player.vy > 0) continue;
      }

      if (player.right > p.left + 2 && player.left < p.right - 2 &&
          player.bottom > p.top && player.top < p.bottom) {

        const isLanding = isNormal ? (player.vy >= 0) : (player.vy <= 0);

        if (isLanding) {
          if (isNormal) {
            player.y = p.top - player.h;
            player.onGround = true;
          } else {
            player.y = p.bottom;
            player.onGround = true;
          }
          player.vy = 0;

          // Falling platform step trigger
          if (p instanceof FallingPlatform) {
            p.steppedOn = true;
          }

          // Trampoline
          if (p.type === TILE.TRAMPOLINE) {
            player.vy = isNormal ? p.bounceVel : -p.bounceVel;
            player.onGround = false;
            spawnParticles(player.cx, isNormal ? player.bottom : player.top, "#ff6b35", 8, 150);
            shake(4, 0.15);
          }

          // Vanish trigger
          if (p.type === TILE.VANISH && p.vanishTimer <= 0 && !p.vanished) {
            p.vanishTimer = p.vanishDelay;
          }

          // Ice friction
          if (p.type === TILE.ICE) {
            player.vx *= 0.98;
          }

          // Lava kill
          if (p.type === TILE.LAVA) {
            player.die("lava");
          }

          // Moving platform carry
          if (p.moveRange > 0 && p.moveX !== 0) {
            player.x += p.moveDir * p.moveSpeed * dt;
          }
        } else {
          // Head bump
          if (isNormal) {
            player.y = p.bottom;
          } else {
            player.y = p.top - player.h;
          }
          player.vy = 0;
        }
      }
    }
  }

  update(dt) {
    if (this.complete || this.dead) return;

    if (this.exitPhase) {
      this.exitTimer -= dt;
      
      const ex = this.exit;
      const targetX = ex.x + ex.w / 2 - this.player.w / 2;
      const targetY = ex.y + ex.h - this.player.h;
      this.player.x = lerp(this.player.x, targetX, dt * 6);
      this.player.y = lerp(this.player.y, targetY, dt * 6);
      
      this.player.exitRotation += dt * 8;
      this.player.squishX = lerp(this.player.squishX, 0, dt * 6);
      this.player.squishY = lerp(this.player.squishY, 0, dt * 6);
      
      if (Math.random() < 0.3) {
        spawnParticles(this.player.cx, this.player.cy, activeTheme.exit || "#ffd32a", 2, 70);
      }
      
      if (this.exitTimer <= 0) {
        this.complete = true;
      }
      
      for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update(dt);
        if (particles[i].life <= 0) particles.splice(i, 1);
      }
      return;
    }

    this.time += dt;
    levelTimer += dt;
    if (this.portalCooldown > 0) this.portalCooldown -= dt;
    if (this.flashMsgTimer > 0) this.flashMsgTimer -= dt;

    this.bg.update(dt);

    this.platforms.forEach(p => p.update(dt));
    this.spikes.forEach(s => s.update(dt, this.player.cx, this.player.cy));
    this.saws.forEach(s => s.update(dt));
    this.portals.forEach(p => p.update(dt));
    this.crushers.forEach(c => c.update(dt, this.player));
    this.lasers.forEach(l => l.update(dt));
    this.triggers.forEach(t => t.update(this));
    this.exit.update(dt, this.player, this);

    // Custom level scripted actions
    if (this.data.onUpdate) {
      this.data.onUpdate(this, dt);
    }

    // Flash
    if (this.flashTimer > 0) this.flashTimer -= dt;

    // Shake decay
    if (shakeDur > 0) {
      shakeDur -= dt;
      if (shakeDur <= 0) { shakeAmt = 0; }
    }

    this.player.update(dt, this);

    if (!this.player.alive) {
      this.dead = true;
      return;
    }

    // Spike collisions
    for (const s of this.spikes) {
      if (!s.revealed || !s.active) continue;
      if (this.player.right > s.left + 2 && this.player.left < s.right - 2 &&
          this.player.bottom > s.top + 2 && this.player.top < s.bottom - 2) {
        this.player.die("spike");
        this.dead = true;
        return;
      }
    }

    // Saw collisions
    for (const s of this.saws) {
      const dx = this.player.cx - s.x, dy = this.player.cy - s.y;
      if (Math.sqrt(dx * dx + dy * dy) < s.r + 8) {
        this.player.die("saw");
        this.dead = true;
        return;
      }
    }

    // Crusher collisions
    for (const c of this.crushers) {
      if (this.player.right > c.left + 4 && this.player.left < c.right - 4 &&
          this.player.bottom > c.top + 4 && this.player.top < c.bottom - 4) {
        this.player.die("crush");
        this.dead = true;
        return;
      }
    }

    // Laser collisions
    for (const l of this.lasers) {
      if (l.collides(this.player)) {
        this.player.die("laser");
        this.dead = true;
        return;
      }
    }

    // Portal collisions
    if (this.portalCooldown <= 0) {
      for (const p of this.portals) {
        if (this.player.right > p.left && this.player.left < p.right &&
            this.player.bottom > p.top && this.player.top < p.bottom) {
          this.player.x = p.tx - this.player.w / 2;
          this.player.y = p.ty - this.player.h;
          this.player.vy = -100;
          this.portalCooldown = 0.8;
          spawnParticles(p.x + p.w / 2, p.y + p.h / 2, p.color, 16, 200);
          spawnParticles(p.tx, p.ty, p.color, 16, 200);
          SFX.portal();
          shake(5, 0.2);
          break;
        }
      }
    }

    // Fake platform — reveal on overlap
    for (const p of this.platforms) {
      if (p.type !== TILE.FAKE) continue;
      if (this.player.right > p.left && this.player.left < p.right &&
          this.player.bottom > p.top && this.player.top < p.bottom) {
        p.revealed = true;
      }
    }

    // Exit collision
    const ex = this.exit;
    if (!this.exitPhase && this.player.right > ex.left && this.player.left < ex.right &&
        this.player.bottom > ex.top && this.player.top < ex.bottom) {
      this.exitPhase = true;
      this.exitTimer = 0.85;
      this.player.exitingPortal = true;
      this.player.exitRotation = 0;
      spawnConfetti(ex.x + ex.w / 2, ex.y + ex.h / 2, 45);
      shake(6, 0.3);
      SFX.win();
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update(dt);
      if (particles[i].life <= 0) particles.splice(i, 1);
    }
  }

  draw(ctx, time) {
    let sx = 0, sy = 0;
    if (shakeDur > 0) {
      sx = rand(-shakeAmt, shakeAmt);
      sy = rand(-shakeAmt, shakeAmt);
    }

    ctx.save();
    ctx.translate(sx, sy);

    // Background
    this.bg.draw(ctx, time);

    // Platforms
    this.platforms.forEach(p => p.draw(ctx, time));

    // Lasers
    this.lasers.forEach(l => l.draw(ctx));

    // Spikes
    this.spikes.forEach(s => s.draw(ctx));

    // Saws
    this.saws.forEach(s => s.draw(ctx));

    // Crushers
    this.crushers.forEach(c => c.draw(ctx));

    // Portals
    this.portals.forEach(p => p.draw(ctx));

    // Exit
    this.exit.draw(ctx);

    // Player
    this.player.draw(ctx);

    // Particles
    particles.forEach(p => p.draw(ctx));

    // Screen flash
    if (this.flashTimer > 0) {
      ctx.globalAlpha = (this.flashTimer / 0.4) * 0.4;
      ctx.fillStyle = this.flashColor || "#ff0000";
      ctx.fillRect(0, 0, VW, VH);
      ctx.globalAlpha = 1;
    }

    // Flash message pill (troll notifications)
    if (this.flashMsgTimer > 0 && this.flashMsg) {
      ctx.save();
      ctx.fillStyle = "rgba(12, 10, 20, 0.88)";
      ctx.strokeStyle = activeTheme.danger || "#ff4757";
      ctx.lineWidth = 2;
      ctx.font = "11px 'Press Start 2P', monospace";
      const tw = ctx.measureText(this.flashMsg).width;
      const bw = tw + 36, bh = 32;
      const bx = (VW - bw) / 2, by = 48;
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeRect(bx, by, bw, bh);
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.flashMsg, VW / 2, by + bh / 2);
      ctx.restore();
    }

    // Level name watermark
    ctx.save();
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = "#fff";
    ctx.font = "bold 44px monospace";
    ctx.textAlign = "center";
    ctx.fillText(this.data.name, VW / 2, VH / 2 + 20);
    ctx.restore();

    ctx.restore();
  }
}

// ─── Save Manager (localStorage) ────────────────────────────
const SAVE_KEY = "oops_game_save_v3";

const SaveManager = {
  save(levelIndex, totalDeaths) {
    const prev = this.load() || { level: 0, deaths: 0, maxUnlocked: 0 };
    const maxUnlocked = Math.max(prev.maxUnlocked || 0, levelIndex);
    const data = {
      level: levelIndex,
      maxUnlocked: maxUnlocked,
      deaths: totalDeaths,
      savedAt: Date.now(),
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch(e) {}
  },

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch(e) { return null; }
  },

  clear() {
    try { localStorage.removeItem(SAVE_KEY); } catch(e) {}
  },

  hasSave() {
    const d = this.load();
    return d !== null && d.level >= 0;
  },

  getMaxUnlocked() {
    const d = this.load();
    return d ? (d.maxUnlocked || d.level || 0) : 0;
  }
};

// ─── UI Controller ───────────────────────────────────────────
const screens = {
  start:         document.getElementById("start-screen"),
  multiverse:    document.getElementById("multiverse-screen"),
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
  
  // Maintain background gradient blend across all screen transitions
  if (name === "start" || name === "multiverse" || name === "death" || name === "levelComplete") {
    const bgGrad = `linear-gradient(to bottom, ${activeTheme.bg1}, ${activeTheme.bg2})`;
    document.body.style.background = bgGrad;
    const wrapper = document.getElementById("game-wrapper");
    if (wrapper) wrapper.style.background = bgGrad;
  }
}

// Update start screen — show Continue button if save exists
function refreshStartScreen() {
  const saveSection  = document.getElementById("continue-section");
  const savedLvlTxt  = document.getElementById("saved-level-text");
  const savedDthTxt  = document.getElementById("saved-deaths-text");

  if (SaveManager.hasSave()) {
    const d = SaveManager.load();
    const lvl = Math.min(d.level, getMaxLevels() - 1);
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
  if (fill) fill.style.width = ((lvl + 1) / getMaxLevels() * 100) + "%";
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
  currentLevel = idx;

  // Update world theme
  const prevTheme = activeTheme;
  activeTheme = getTheme(idx);

  // Set body and wrapper background gradient to match theme
  const bgGrad = `linear-gradient(to bottom, ${activeTheme.bg1}, ${activeTheme.bg2})`;
  document.body.style.background = bgGrad;
  const wrapper = document.getElementById("game-wrapper");
  if (wrapper) wrapper.style.background = bgGrad;

  // Show world title when entering a new world (every 6 levels)
  if (idx % 6 === 0) {
    showWorldTitle(activeTheme.name);
  }

  const data = buildLevel(idx);
  runtime = new LevelRuntime(data);

  // Reset player gravity settings
  runtime.player.gravityDir = 1;
  runtime.player.exitRotation = 0;
  runtime.player.exitingPortal = false;

  // Toggle on-screen touch FLIP button for Gravity Nexus (levels 18 to 23)
  const flipBtn = document.getElementById("btn-flip");
  if (flipBtn) {
    if (idx >= 18 && idx <= 23) flipBtn.classList.remove("hidden");
    else                         flipBtn.classList.add("hidden");
  }

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
      SaveManager.save(currentLevel, deaths);
      const msg = DEATH_COMMENTARIES[deaths] || DEATH_MSGS[Math.floor(Math.random() * DEATH_MSGS.length)];
      document.getElementById("death-title").textContent = "Oops!";
      document.getElementById("death-msg").textContent   = msg;
      document.getElementById("death-big").textContent   = deaths;
      document.getElementById("death-count").textContent = deaths;
      setTimeout(() => showScreen("death"), 450);
    }

    if (runtime.complete) {
      stopMusic();
      gameState = "levelcomplete";
      const t = levelTimer.toFixed(1);
      document.getElementById("win-time").textContent = t + "s";
      const stars = t < 5 ? "⭐⭐⭐" : t < 12 ? "⭐⭐" : "⭐";
      document.getElementById("win-rating").textContent = stars;

      // Save next unlocked level
      const nextLevel = currentLevel + 1;
      if (nextLevel < getMaxLevels()) {
        SaveManager.save(nextLevel, deaths);
      }

      setTimeout(() => showScreen("levelComplete"), 750);
    }
  } else {
    // Draw background during menus
    if (runtime) runtime.draw(ctx, ts / 1000);
    else {
      const grad = ctx.createLinearGradient(0, 0, 0, VH);
      grad.addColorStop(0, activeTheme ? activeTheme.bg1 : "#1a0800");
      grad.addColorStop(1, activeTheme ? activeTheme.bg2 : "#2d0f00");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, VW, VH);
    }
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

// PLAY GAME — start from level 0 (or first unlocked)
document.getElementById("start-btn").addEventListener("click", () => {
  initAudio();
  startLevel(0);
});

// SELECT WORLD & LEVEL — open Multiverse & Level Select Map Screen
document.getElementById("select-world-btn")?.addEventListener("click", () => {
  initAudio();
  refreshMultiverseSelector();
  showScreen("multiverse");
});

// CONTINUE — load saved level
document.getElementById("continue-btn")?.addEventListener("click", () => {
  initAudio();
  const saved = SaveManager.load();
  if (saved) {
    deaths       = saved.deaths || 0;
    currentLevel = Math.min(saved.level, getMaxLevels() - 1);
  }
  startLevel(currentLevel);
});

// START OVER link inside continue section
document.getElementById("new-game-link")?.addEventListener("click", () => {
  if (confirm("Start over? Your saved progress will be deleted.")) {
    SaveManager.clear();
    deaths = 0;
    currentLevel = 0;
    refreshStartScreen();
    refreshMultiverseSelector();
  }
});

// Click anywhere on death screen to instant retry
document.getElementById("death-screen").addEventListener("click", () => {
  initAudio();
  startLevel(currentLevel);
});

// NEXT LEVEL after completing a level
document.getElementById("next-btn").addEventListener("click", () => {
  initAudio();
  currentLevel++;
  if (currentLevel >= getMaxLevels()) {
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
  deaths = 0;
  currentLevel = 0;
  startLevel(0);
});

// ─── Instant Game Startup ────────────────────────────────────
gameState = "start";
refreshStartScreen();
showScreen("start");
lastTime = performance.now();
requestAnimationFrame(loop);

// ─── Multiverse & Level Select Map Screen Logic ───────────────
function refreshMultiverseSelector() {
  const maxUnlocked = SaveManager.getMaxUnlocked();

  // Populate interactive level nodes grid (1 to 30)
  const container = document.getElementById("level-nodes-container");
  if (container) {
    container.innerHTML = "";
    for (let i = 0; i < 30; i++) {
      const btn = document.createElement("button");
      btn.className = "level-node-btn";
      btn.textContent = (i + 1);
      if (i < maxUnlocked) {
        btn.classList.add("cleared");
        btn.title = `Level ${i + 1} (Cleared)`;
      } else if (i === maxUnlocked) {
        btn.classList.add("current");
        btn.title = `Level ${i + 1} (Current)`;
      } else {
        btn.classList.add("locked");
        btn.title = `Level ${i + 1} (Locked)`;
      }
      btn.addEventListener("click", () => {
        if (i <= maxUnlocked) {
          initAudio();
          startLevel(i);
        }
      });
      container.appendChild(btn);
    }
  }
}

// Bind World buttons to jump directly to world starting levels
document.querySelectorAll("[data-world]").forEach(btn => {
  btn.addEventListener("click", (e) => {
    initAudio();
    const wIdx = parseInt(e.currentTarget.getAttribute("data-world") || "0", 10);
    const startLvl = wIdx * 6;
    startLevel(startLvl);
  });
});

// Back to main menu
document.getElementById("mv-back-btn").addEventListener("click", () => {
  initAudio();
  refreshStartScreen();
  showScreen("start");
});

// HUD Home button (exit to world & level select)
document.getElementById("btn-home").addEventListener("click", () => {
  initAudio();
  if (musicInterval) {
    clearInterval(musicInterval);
    musicInterval = null;
  }
  gameState = "start";
  refreshMultiverseSelector();
  showScreen("multiverse");
});

