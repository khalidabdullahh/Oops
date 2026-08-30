// =============================================================================
//  Oops! – World 2: The Shift (v2.0)
//  "A beautiful world that slowly becomes wrong."
//  50 Handcrafted Levels of Mirror World, Time Zones, Echo Ghost & Magnetism
// =============================================================================
"use strict";

var WORLD_2_THEME = {
  id: 1,
  name: "THE SHIFT",
  badge: "WORLD 2",
  subtitle: "50 Handcrafted Levels of Mirror Illusions, Time Distortion, Echo Ghosts & Magnetic Collapse",
  gimmickName: "MIRROR & CHRONO SHIFT",
  bg: 0x0a192f,
  bgTop: 0x050c18,
  platform: 0x1b4965,
  platformTop: 0x62b6cb,
  platformGrass: 0x2ed573,
  spike: 0xeb4d4b,
  door: 0xffffff,
  doorTrim: 0x00d2d3,
  island: 0x162b42,
  islandBorder: 0x00d2d3,
  accent: 0x00d2d3
};

var World2Assets = {
  created: false,

  create: function(scene) {
    if (this.created) return;
    this.created = true;

    // ── 🌿 2.5D SKY RUIN PLATFORM WITH MOSS/GRASS FRINGE ──
    var platGfx = scene.make.graphics({ x: 0, y: 0, add: false });
    platGfx.fillStyle(0x1b4965, 1);
    platGfx.fillRect(0, 0, 32, 32);
    platGfx.fillStyle(0x0e2f44, 0.65);
    platGfx.fillRect(0, 8, 32, 3);
    platGfx.fillRect(0, 18, 32, 2);
    platGfx.fillStyle(0x2ed573, 1);
    platGfx.fillRect(0, 0, 32, 4);
    platGfx.fillStyle(0x7bed9f, 0.85);
    platGfx.fillRect(4, 3, 4, 3);
    platGfx.fillRect(14, 3, 5, 2);
    platGfx.fillRect(24, 3, 4, 3);
    platGfx.fillStyle(0x0a1c28, 0.85);
    platGfx.fillRect(0, 26, 32, 6);
    platGfx.generateTexture("plat_w2_tex", 32, 32);
    platGfx.destroy();

    // ── 🪞 MIRROR CRYSTAL PLATFORM (Shimmering Glass) ──
    var mirrPlatGfx = scene.make.graphics({ x: 0, y: 0, add: false });
    mirrPlatGfx.fillStyle(0x00d2d3, 0.38);
    mirrPlatGfx.fillRect(0, 0, 32, 32);
    mirrPlatGfx.lineStyle(1.5, 0xffffff, 0.85);
    mirrPlatGfx.strokeRect(1, 1, 30, 30);
    mirrPlatGfx.lineStyle(1, 0xffffff, 0.6);
    mirrPlatGfx.lineBetween(4, 28, 28, 4);
    mirrPlatGfx.lineBetween(10, 28, 28, 10);
    mirrPlatGfx.generateTexture("mirror_plat_tex", 32, 32);
    mirrPlatGfx.destroy();

    // ── 👻 PHANTOM PLATFORM ──
    var phantGfx = scene.make.graphics({ x: 0, y: 0, add: false });
    phantGfx.fillStyle(0x9b59b6, 0.25);
    phantGfx.fillRect(0, 0, 32, 32);
    phantGfx.lineStyle(1.5, 0xe056fd, 0.7);
    phantGfx.strokeRoundedRect(2, 2, 28, 28, 4);
    phantGfx.generateTexture("phantom_plat_tex", 32, 32);
    phantGfx.destroy();

    // ── ⏳ TIME ZONE: SLOW FIELD (Indigo/Cyan Pulsing Vortex) ──
    var slowGfx = scene.make.graphics({ x: 0, y: 0, add: false });
    slowGfx.fillStyle(0x3867d6, 0.25);
    slowGfx.fillCircle(32, 32, 30);
    slowGfx.lineStyle(2, 0x45aaf2, 0.85);
    slowGfx.strokeCircle(32, 32, 28);
    slowGfx.lineStyle(1, 0xffffff, 0.6);
    slowGfx.strokeCircle(32, 32, 16);
    slowGfx.fillStyle(0xffffff, 0.9);
    slowGfx.fillTriangle(26, 22, 38, 22, 32, 30);
    slowGfx.fillTriangle(26, 42, 38, 42, 32, 34);
    slowGfx.generateTexture("time_zone_slow", 64, 64);
    slowGfx.destroy();

    // ── ⚡ TIME ZONE: FAST FIELD (Amber/Gold Hyper Vortex) ──
    var fastGfx = scene.make.graphics({ x: 0, y: 0, add: false });
    fastGfx.fillStyle(0xffa502, 0.26);
    fastGfx.fillCircle(32, 32, 30);
    fastGfx.lineStyle(2, 0xffd32a, 0.85);
    fastGfx.strokeCircle(32, 32, 28);
    fastGfx.fillStyle(0xffffff, 0.9);
    fastGfx.fillTriangle(24, 24, 31, 32, 24, 40);
    fastGfx.fillTriangle(33, 24, 40, 32, 33, 40);
    fastGfx.generateTexture("time_zone_fast", 64, 64);
    fastGfx.destroy();

    // ── 👤 ECHO SHADOW PLAYER SPRITE ──
    var echoGfx = scene.make.graphics({ x: 0, y: 0, add: false });
    echoGfx.fillStyle(0x00d2d3, 0.6);
    echoGfx.fillRoundedRect(6, 6, 20, 24, 6);
    echoGfx.fillStyle(0xffffff, 0.85);
    echoGfx.fillCircle(12, 14, 2.5);
    echoGfx.fillCircle(20, 14, 2.5);
    echoGfx.lineStyle(1.5, 0x55efc4, 0.9);
    echoGfx.strokeRoundedRect(5, 5, 22, 26, 6);
    echoGfx.generateTexture("echo_hero_ghost", 32, 36);
    echoGfx.destroy();

    // ── 🧲 MAGNETIC POLAR NODE (Attract / Repel) ──
    var magGfx = scene.make.graphics({ x: 0, y: 0, add: false });
    magGfx.fillStyle(0x2d3436, 1);
    magGfx.fillCircle(16, 16, 14);
    magGfx.fillStyle(0x0984e3, 1);
    magGfx.fillRect(4, 10, 10, 12);
    magGfx.fillStyle(0xd63031, 1);
    magGfx.fillRect(18, 10, 10, 12);
    magGfx.lineStyle(2, 0xffffff, 0.9);
    magGfx.strokeCircle(16, 16, 14);
    magGfx.generateTexture("magnet_node", 32, 32);
    magGfx.destroy();

    // ── 📦 MOVABLE METAL CRATE ──
    var crateGfx = scene.make.graphics({ x: 0, y: 0, add: false });
    crateGfx.fillStyle(0x4b6584, 1);
    crateGfx.fillRoundedRect(0, 0, 28, 28, 4);
    crateGfx.lineStyle(2, 0x778ca3, 1);
    crateGfx.strokeRoundedRect(1, 1, 26, 26, 4);
    crateGfx.lineBetween(4, 4, 24, 24);
    crateGfx.lineBetween(24, 4, 4, 24);
    crateGfx.generateTexture("metal_crate_tex", 28, 28);
    crateGfx.destroy();

    // ── 🔘 PUZZLE FLOOR PEDESTAL SWITCH ──
    var swOffGfx = scene.make.graphics({ x: 0, y: 0, add: false });
    swOffGfx.fillStyle(0x2f3542, 1);
    swOffGfx.fillRoundedRect(0, 6, 28, 10, 3);
    swOffGfx.fillStyle(0xff4757, 1);
    swOffGfx.fillRect(6, 2, 16, 6);
    swOffGfx.generateTexture("switch_off_tex", 28, 16);
    swOffGfx.destroy();

    var swOnGfx = scene.make.graphics({ x: 0, y: 0, add: false });
    swOnGfx.fillStyle(0x2f3542, 1);
    swOnGfx.fillRoundedRect(0, 6, 28, 10, 3);
    swOnGfx.fillStyle(0x2ed573, 1);
    swOnGfx.fillRect(6, 4, 16, 4);
    swOnGfx.generateTexture("switch_on_tex", 28, 16);
    swOnGfx.destroy();

    // ── ⚡ ENERGY BARRIER GATE ──
    var gateGfx = scene.make.graphics({ x: 0, y: 0, add: false });
    gateGfx.fillStyle(0x00d2d3, 0.7);
    gateGfx.fillRect(4, 0, 8, 64);
    gateGfx.fillStyle(0xffffff, 0.9);
    gateGfx.fillRect(6, 0, 4, 64);
    gateGfx.lineStyle(1.5, 0x55efc4, 1);
    gateGfx.strokeRect(2, 0, 12, 64);
    gateGfx.generateTexture("energy_barrier_tex", 16, 64);
    gateGfx.destroy();

    // ── 🌌 WORLD 3 MONOLITH ARTIFACT ──
    var monoGfx = scene.make.graphics({ x: 0, y: 0, add: false });
    monoGfx.fillStyle(0x000000, 1);
    monoGfx.fillRoundedRect(0, 0, 40, 90, 8);
    monoGfx.lineStyle(2, 0xa55eea, 1);
    monoGfx.strokeRoundedRect(0, 0, 40, 90, 8);
    monoGfx.fillStyle(0x8854d0, 0.5);
    monoGfx.fillCircle(20, 35, 12);
    monoGfx.fillStyle(0xffffff, 0.9);
    monoGfx.fillCircle(20, 35, 4);
    monoGfx.generateTexture("monolith_tex", 40, 90);
    monoGfx.destroy();

    // ── 🍃 FOREGROUND FLOATING LEAF ──
    var leafGfx = scene.make.graphics({ x: 0, y: 0, add: false });
    leafGfx.fillStyle(0x2ed573, 0.85);
    leafGfx.fillEllipse(8, 6, 8, 4);
    leafGfx.fillStyle(0x7bed9f, 0.9);
    leafGfx.fillCircle(8, 6, 2);
    leafGfx.generateTexture("foliage_leaf", 16, 12);
    leafGfx.destroy();
  }
};


// ─── World 2 Core Engine Subsystem ───────────────────────────
var World2Engine = {
  active: false,
  scene: null,
  levelIdx: 0,
  
  // Parallax elements
  skyGfx: null,
  clouds: [],
  distantIslandsGfx: null,
  midRuinsGfx: null,
  foliageEmitters: null,

  // Mechanics tracking
  mirrorActive: false,
  mirrorY: 460,
  mirrorReflectionSprite: null,
  phantomPlatforms: [],
  
  timeZones: [],
  timeZoneSprites: [],

  echoActive: false,
  echoGhost: null,
  echoBuffer: [],
  echoDelaySec: 2.0,

  magneticNodes: [],
  metalCrates: [],

  switches: [],
  gates: [],
  customUpdateHandlers: [],

  init: function(scene, levelIdx) {
    this.active = true;
    this.scene = scene;
    this.levelIdx = levelIdx;
    
    this.mirrorActive = false;
    this.mirrorReflectionSprite = null;
    this.phantomPlatforms = [];

    this.timeZones = [];
    this.timeZoneSprites = [];

    this.echoActive = false;
    this.echoGhost = null;
    this.echoBuffer = [];

    this.magneticNodes = [];
    this.metalCrates = [];

    this.switches = [];
    this.gates = [];
    this.customUpdateHandlers = [];

    World2Assets.create(scene);
    this.draw2DParallax(scene);
  },

  draw2DParallax: function(scene) {
    var width = scene.scale.width;
    var height = scene.scale.height;

    // Layer 0: Sky Gradient (Deep Twilight to Cyan)
    // Progressively darken sky for later levels (41-50)
    var skyTop = 0x050c18;
    var skyBot = 0x0a192f;
    if (this.levelIdx >= 40) {
      skyTop = 0x040308; // Deep ominous purple/black
      skyBot = 0x120824;
    }

    this.skyGfx = scene.add.graphics().setDepth(-40);
    this.skyGfx.fillGradientStyle(skyTop, skyTop, skyBot, skyBot, 1);
    this.skyGfx.fillRect(0, 0, width, height);

    // Celestial Sun / Void Halo
    var haloColor = (this.levelIdx >= 40) ? 0xa55eea : 0x00d2d3;
    var sun = scene.add.graphics().setDepth(-38);
    sun.fillStyle(haloColor, 0.16);
    sun.fillCircle(width * 0.78, height * 0.22, 100);
    sun.fillStyle(haloColor, 0.32);
    sun.fillCircle(width * 0.78, height * 0.22, 48);

    // Layer 1: Distant Floating Islands & Waterfalls
    this.distantIslandsGfx = scene.add.graphics().setDepth(-30);
    this.drawDistantIslands(this.distantIslandsGfx, width, height, 0);

    // Layer 2: Midground Celestial Ruin Pillars
    this.midRuinsGfx = scene.add.graphics().setDepth(-20);
    this.drawMidRuins(this.midRuinsGfx, width, height, 0);

    // Layer 3: Foreground Floating Foliage Particles
    try {
      this.foliageEmitters = scene.add.particles(0, 0, "foliage_leaf", {
        x: { min: 0, max: width },
        y: -20,
        lifespan: 6000,
        speedY: { min: 30, max: 70 },
        speedX: { min: -25, max: 25 },
        rotate: { min: 0, max: 360 },
        scale: { start: 0.8, end: 0.2 },
        alpha: { start: 0.7, end: 0 },
        frequency: 450
      }).setDepth(150);
    } catch(e) {}
  },

  drawDistantIslands: function(gfx, width, height, offsetX) {
    gfx.clear();
    var islandColor = (this.levelIdx >= 40) ? 0x180b2c : 0x0e2f44;
    gfx.fillStyle(islandColor, 0.8);
    
    // Island 1 (Left)
    gfx.fillRoundedRect(width * 0.12 + offsetX, 130, 180, 42, 16);
    gfx.fillTriangle(width * 0.12 + offsetX + 20, 172, width * 0.12 + offsetX + 160, 172, width * 0.12 + offsetX + 90, 225);
    
    // Island 2 (Center High)
    gfx.fillRoundedRect(width * 0.44 + offsetX * 1.2, 85, 220, 48, 18);
    gfx.fillTriangle(width * 0.44 + offsetX * 1.2 + 30, 133, width * 0.44 + offsetX * 1.2 + 190, 133, width * 0.44 + offsetX * 1.2 + 110, 195);
    
    // Island 3 (Right)
    gfx.fillRoundedRect(width * 0.76 + offsetX * 0.8, 155, 160, 38, 14);
    gfx.fillTriangle(width * 0.76 + offsetX * 0.8 + 20, 193, width * 0.76 + offsetX * 0.8 + 140, 193, width * 0.76 + offsetX * 0.8 + 80, 235);
  },

  drawMidRuins: function(gfx, width, height, offsetX) {
    gfx.clear();
    var ruinColor = (this.levelIdx >= 40) ? 0x22133c : 0x143952;
    var accentGlow = (this.levelIdx >= 40) ? 0x8854d0 : 0x00d2d3;
    gfx.fillStyle(ruinColor, 0.95);

    // Ancient Ruin Column 1
    gfx.fillRect(width * 0.06 + offsetX, 230, 32, 180);
    gfx.fillRect(width * 0.04 + offsetX, 220, 48, 12);
    gfx.lineStyle(1.5, accentGlow, 0.6);
    gfx.lineBetween(width * 0.06 + offsetX + 16, 240, width * 0.06 + offsetX + 16, 380);

    // Floating Bridge Arch
    gfx.fillRect(width * 0.35 + offsetX * 1.1, 280, 140, 24);
    gfx.fillRect(width * 0.38 + offsetX * 1.1, 304, 20, 80);
    gfx.fillRect(width * 0.45 + offsetX * 1.1, 304, 20, 80);

    // Ancient Ruin Column 2
    gfx.fillRect(width * 0.88 + offsetX * 0.9, 210, 36, 200);
    gfx.fillRect(width * 0.86 + offsetX * 0.9, 200, 52, 14);
  },

  // ── Mirror System ──────────────────────────────────────────
  setupMirrorPlane: function(scene, mirrorY) {
    this.mirrorActive = true;
    this.mirrorY = mirrorY;

    // Glowing mirror horizon line
    var line = scene.add.graphics().setDepth(5);
    line.lineStyle(2, 0x00d2d3, 0.7);
    line.lineBetween(0, mirrorY, scene.scale.width, mirrorY);
    line.lineStyle(1, 0xffffff, 0.9);
    line.lineBetween(0, mirrorY, scene.scale.width, mirrorY);

    // Reflection avatar sprite
    this.mirrorReflectionSprite = scene.add.sprite(scene.spawnX, mirrorY + 30, "hero_idle_1");
    this.mirrorReflectionSprite.setDepth(6);
    this.mirrorReflectionSprite.setAlpha(0.45);
    this.mirrorReflectionSprite.setTint(0x00d2d3);
    this.mirrorReflectionSprite.setFlipY(true);
  },

  // ── Time Zone System ───────────────────────────────────────
  addTimeZone: function(scene, x, y, type, radius) {
    if (!radius) radius = 80;
    var texKey = (type === "slow") ? "time_zone_slow" : "time_zone_fast";
    var sprite = scene.add.sprite(x, y, texKey).setDepth(8);
    sprite.setDisplaySize(radius * 2, radius * 2);
    sprite.setAlpha(0.85);

    scene.tweens.add({
      targets: sprite,
      angle: 360,
      duration: (type === "slow") ? 12000 : 3000,
      repeat: -1
    });

    scene.tweens.add({
      targets: sprite,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    var tzObj = { x: x, y: y, radius: radius, type: type, sprite: sprite };
    this.timeZones.push(tzObj);
    return tzObj;
  },

  // ── Echo Player System ─────────────────────────────────────
  setupEchoSystem: function(scene) {
    this.echoActive = true;
    this.echoBuffer = [];
    this.echoGhost = scene.physics.add.sprite(scene.spawnX, scene.spawnY, "echo_hero_ghost");
    this.echoGhost.setDepth(90);
    this.echoGhost.setAlpha(0);
    this.echoGhost.body.setAllowGravity(false);
    this.echoGhost.body.setSize(22, 34);
  },

  // ── Magnetic Node System ───────────────────────────────────
  addMagnetNode: function(scene, x, y, type, strength) {
    if (!strength) strength = 260;
    var node = scene.add.sprite(x, y, "magnet_node").setDepth(12);
    node.magnetType = type; // 'attract' or 'repel'
    node.magnetStrength = strength;

    var ringGfx = scene.add.graphics().setDepth(11);
    var ringColor = (type === "attract") ? 0x0984e3 : 0xd63031;
    ringGfx.lineStyle(1.5, ringColor, 0.6);
    ringGfx.strokeCircle(x, y, 70);

    scene.tweens.add({
      targets: ringGfx,
      scaleX: 1.15,
      scaleY: 1.15,
      alpha: 0.2,
      duration: 900,
      yoyo: true,
      repeat: -1
    });

    var magObj = { x: x, y: y, type: type, strength: strength, node: node };
    this.magneticNodes.push(magObj);
    return magObj;
  },

  // ── Moveable Metal Crate ───────────────────────────────────
  addMetalCrate: function(scene, x, y) {
    var crate = scene.physics.add.sprite(x, y, "metal_crate_tex");
    crate.setDepth(15);
    crate.body.setGravityY(1200);
    crate.body.setBounce(0.1);
    crate.body.setFriction(0.8);
    crate.body.setCollideWorldBounds(true);
    scene.physics.add.collider(crate, scene.platforms);
    scene.physics.add.collider(scene.player, crate);
    this.metalCrates.push(crate);
    return crate;
  },

  // ── Puzzle Switch & Energy Gate ────────────────────────────
  addPuzzleSwitch: function(scene, x, y, id) {
    var sw = scene.physics.add.sprite(x, y, "switch_off_tex");
    sw.setDepth(14);
    sw.switchId = id;
    sw.isPressed = false;
    sw.body.setAllowGravity(false);
    sw.body.setImmovable(true);
    sw.body.setSize(28, 12);
    this.switches.push(sw);
    return sw;
  },

  addEnergyGate: function(scene, x, y, id) {
    var gate = scene.physics.add.sprite(x, y, "energy_barrier_tex");
    gate.setDepth(16);
    gate.gateId = id;
    gate.isOpen = false;
    gate.body.setAllowGravity(false);
    gate.body.setImmovable(true);
    scene.physics.add.collider(scene.player, gate, null, function(pl, g) {
      return !g.isOpen;
    }, scene);
    this.gates.push(gate);
    return gate;
  },

  activateSwitch: function(scene, sw) {
    if (sw.isPressed) return;
    sw.isPressed = true;
    sw.setTexture("switch_on_tex");
    AudioEngine.sfxBounce();
    scene.showTrollToast("⚡ SWITCH ACTIVATED!");

    // Open linked gates
    this.gates.forEach(function(g) {
      if (g.gateId === sw.switchId) {
        g.isOpen = true;
        scene.tweens.add({
          targets: g,
          alpha: 0,
          scaleY: 0.1,
          duration: 350,
          onComplete: function() {
            if (g.body) g.body.enable = false;
          }
        });
      }
    });
  },

  // ── Main World 2 Per-Frame Update Loop ─────────────────────
  update: function(scene, dt) {
    if (!this.active || scene.isDead || scene.isComplete) return;

    var width = scene.scale.width;
    var height = scene.scale.height;
    var player = scene.player;

    // 1. Parallax update
    if (this.distantIslandsGfx && this.midRuinsGfx) {
      var pRatio = (player.x - width / 2) / width;
      this.drawDistantIslands(this.distantIslandsGfx, width, height, -pRatio * 22);
      this.drawMidRuins(this.midRuinsGfx, width, height, -pRatio * 52);
    }

    // 2. Mirror reflection update
    if (this.mirrorActive && this.mirrorReflectionSprite) {
      this.mirrorReflectionSprite.x = player.x;
      var distY = player.y - this.mirrorY;
      this.mirrorReflectionSprite.y = this.mirrorY - distY;
      this.mirrorReflectionSprite.setFlipX(player.flipX);
    }

    // 3. Time Zone physics modulation
    var inSlow = false;
    var inFast = false;
    for (var i = 0; i < this.timeZones.length; i++) {
      var tz = this.timeZones[i];
      var d = Phaser.Math.Distance.Between(player.x, player.y, tz.x, tz.y);
      if (d < tz.radius) {
        if (tz.type === "slow") inSlow = true;
        if (tz.type === "fast") inFast = true;
      }
    }

    if (inSlow) {
      player.body.gravity.y = 500;
      if (Math.abs(player.body.velocity.x) > 110) {
        player.body.velocity.x *= 0.6;
      }
      if (player.body.velocity.y < -300) {
        player.body.velocity.y = -300;
      }
    } else if (inFast) {
      player.body.gravity.y = 2100;
      if (Math.abs(player.body.velocity.x) > 10) {
        player.body.velocity.x *= 1.45;
      }
    } else {
      player.body.gravity.y = 1400;
    }

    // 4. Echo Player trajectory record & replay
    if (this.echoActive && this.echoGhost) {
      this.echoBuffer.push({
        x: player.x,
        y: player.y,
        time: scene.levelTime,
        flipX: player.flipX
      });

      // Target playback frame: 2.0 seconds ago
      var targetTime = scene.levelTime - this.echoDelaySec;
      if (targetTime > 0) {
        this.echoGhost.setAlpha(0.65);
        // Find closest recorded frame
        for (var b = 0; b < this.echoBuffer.length; b++) {
          if (this.echoBuffer[b].time >= targetTime) {
            var f = this.echoBuffer[b];
            this.echoGhost.x = f.x;
            this.echoGhost.y = f.y;
            this.echoGhost.setFlipX(f.flipX);
            break;
          }
        }

        // Echo switch triggers
        var self = this;
        this.switches.forEach(function(sw) {
          if (!sw.isPressed) {
            var ed = Phaser.Math.Distance.Between(self.echoGhost.x, self.echoGhost.y, sw.x, sw.y);
            if (ed < 24) {
              self.activateSwitch(scene, sw);
            }
          }
        });
      }

      // Memory trim: discard frames older than 4.0s
      while (this.echoBuffer.length > 0 && this.echoBuffer[0].time < scene.levelTime - 4.0) {
        this.echoBuffer.shift();
      }
    }

    // Live player switch trigger
    var self = this;
    this.switches.forEach(function(sw) {
      if (!sw.isPressed) {
        var pd = Phaser.Math.Distance.Between(player.x, player.y, sw.x, sw.y);
        if (pd < 22) {
          self.activateSwitch(scene, sw);
        }
      }
    });

    // 5. Magnetic Nodes Attraction / Repulsion
    for (var m = 0; m < this.magneticNodes.length; m++) {
      var node = this.magneticNodes[m];
      var mDist = Phaser.Math.Distance.Between(player.x, player.y, node.x, node.y);
      if (mDist < 160 && mDist > 8) {
        var force = (node.strength / mDist) * 14;
        var angle = Phaser.Math.Angle.Between(player.x, player.y, node.x, node.y);
        if (node.type === "repel") angle += Math.PI; // Push away

        player.body.velocity.x += Math.cos(angle) * force;
        player.body.velocity.y += Math.sin(angle) * force * 0.7;
      }

      // Apply to metal crates
      for (var c = 0; c < this.metalCrates.length; c++) {
        var crate = this.metalCrates[c];
        var cDist = Phaser.Math.Distance.Between(crate.x, crate.y, node.x, node.y);
        if (cDist < 180 && cDist > 10) {
          var cForce = (node.strength / cDist) * 16;
          var cAngle = Phaser.Math.Angle.Between(crate.x, crate.y, node.x, node.y);
          if (node.type === "repel") cAngle += Math.PI;
          crate.body.velocity.x += Math.cos(cAngle) * cForce;
          crate.body.velocity.y += Math.sin(cAngle) * cForce * 0.7;
        }
      }
    }

    // 6. Atmospheric Glitches for Levels 41-44
    if (this.levelIdx >= 40 && this.levelIdx <= 43) {
      if (Math.random() < 0.04) {
        scene.cameras.main.scrollX = (Math.random() - 0.5) * 4;
        scene.cameras.main.scrollY = (Math.random() - 0.5) * 4;
      } else {
        scene.cameras.main.scrollX = 0;
        scene.cameras.main.scrollY = 0;
      }
    }

    // 7. Custom level update handlers
    this.customUpdateHandlers.forEach(function(fn) { fn(scene, dt); });
  },

  // ── Level 45 Reveal Sequence & World 3 Cinematic Teaser ─────
  triggerLevel45Sequence: function(scene) {
    var self = this;
    scene.isComplete = true;
    scene.player.setVelocity(0, 0);
    if (scene.player.body) scene.player.body.setEnable(false);

    AudioEngine.stopMusic();
    AudioEngine.playTone(90, "sawtooth", 0.4, 0.3);

    // 1. Reality Freeze & Sound Blackout
    var flash = scene.add.rectangle(scene.scale.width/2, scene.scale.height/2, scene.scale.width, scene.scale.height, 0xffffff, 1).setDepth(999);
    scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 700,
      onComplete: function() { flash.destroy(); }
    });

    scene.showTrollToast("⚠ ERROR: DIMENSIONAL MEMBRANE CORRUPTED");

    // 2. Camera zoom out & Reality Shatter
    scene.cameras.main.zoomTo(0.65, 1600, "Cubic.easeInOut");
    scene.cameras.main.shake(1200, 0.035);

    // Drop and shatter visible platforms
    scene.platforms.getChildren().forEach(function(p) {
      scene.tweens.add({
        targets: p,
        y: p.y + 350 + Math.random() * 200,
        angle: (Math.random() - 0.5) * 45,
        alpha: 0,
        duration: 1400,
        delay: Math.random() * 400
      });
    });

    // 3. Emerge Monolith Portal
    scene.time.delayedCall(1600, function() {
      var mono = scene.add.sprite(scene.scale.width/2, scene.scale.height/2, "monolith_tex").setDepth(200).setScale(0.1);
      AudioEngine.playTone(180, "sine", 1.2, 0.4);
      AudioEngine.playTone(220, "triangle", 1.4, 0.3, 0.2);

      scene.tweens.add({
        targets: mono,
        scaleX: 2.2,
        scaleY: 2.2,
        duration: 1200,
        ease: "Back.easeOut"
      });

      // Swirling particles
      scene.add.particles(scene.scale.width/2, scene.scale.height/2, "part_dot", {
        speed: { min: 40, max: 180 },
        scale: { start: 1.5, end: 0 },
        lifespan: 1200,
        tint: [0xa55eea, 0x45aaf2, 0xffffff],
        frequency: 60
      }).setDepth(201);

      // 4. Whiteout to World 3 Cinematic Teaser (15-20s)
      scene.time.delayedCall(2200, function() {
        self.launchWorld3Teaser(scene);
      });
    });
  },

  launchWorld3Teaser: function(scene) {
    var width = scene.scale.width;
    var height = scene.scale.height;

    var overlay = scene.add.container(0, 0).setDepth(9999);
    var bg = scene.add.rectangle(width/2, height/2, width, height, 0x030307, 1);
    overlay.add(bg);

    // Audio hum
    AudioEngine.playTone(65, "sawtooth", 3.0, 0.4);
    AudioEngine.playTone(130, "sine", 4.0, 0.3, 0.5);

    // Quantum Monolith Centerpiece
    var monoCenter = scene.add.sprite(width/2, height/2 - 20, "monolith_tex").setScale(2.4);
    overlay.add(monoCenter);

    scene.tweens.add({
      targets: monoCenter,
      y: height/2 - 40,
      scaleX: 2.7,
      scaleY: 2.7,
      duration: 3500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    // Teaser Text Sequence
    var t1 = scene.add.text(width/2, height/2 + 90, "OOPS! — WORLD 3", {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "18px",
      color: "#a55eea",
      stroke: "#000000",
      strokeThickness: 6
    }).setOrigin(0.5).setAlpha(0);

    var t2 = scene.add.text(width/2, height/2 + 130, "YOU'RE NOT READY.", {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "12px",
      color: "#ffffff"
    }).setOrigin(0.5).setAlpha(0);

    var t3 = scene.add.text(width/2, height/2 + 165, "🔒 COMING SOON", {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "10px",
      color: "#ffd32a"
    }).setOrigin(0.5).setAlpha(0);

    overlay.add([t1, t2, t3]);

    scene.tweens.add({ targets: t1, alpha: 1, duration: 1000, delay: 800 });
    scene.tweens.add({ targets: t2, alpha: 1, duration: 1000, delay: 2200 });
    scene.tweens.add({ targets: t3, alpha: 1, duration: 1000, delay: 3600 });

    // Progress counter text: 45 / 50
    var tProgress = scene.add.text(width/2, height/2 + 205, "CHAPTER PROGRESS: 45 / 50 LEVELS", {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "8.5px",
      color: "#2ed573"
    }).setOrigin(0.5).setAlpha(0);
    overlay.add(tProgress);
    scene.tweens.add({ targets: tProgress, alpha: 1, duration: 800, delay: 5000 });

    // Continue Button to Descent Levels 46-50
    var contBtn = scene.add.container(width/2, height - 38);
    var cGfx = scene.add.graphics();
    cGfx.fillStyle(0x2ed573, 1);
    cGfx.fillRoundedRect(-140, -16, 280, 32, 8);
    var cTxt = scene.add.text(0, 0, "ENTER THE DESCENT (46-50) ▶", {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "8px",
      color: "#000000"
    }).setOrigin(0.5);
    var cZone = scene.add.zone(0, 0, 280, 32).setInteractive({ cursor: "pointer" });
    contBtn.add([cGfx, cTxt, cZone]);
    contBtn.setAlpha(0);
    overlay.add(contBtn);

    scene.tweens.add({ targets: contBtn, alpha: 1, duration: 800, delay: 6000 });

    cZone.on("pointerdown", function() {
      SaveManager.saveLevelClear(1, 44, scene.deaths);
      scene.scene.restart({
        world: 1,
        level: 45, // Level 46 (0-indexed 45)
        deaths: scene.deaths,
        levelDeaths: 0
      });
    });
  },

  // ─── 50 Handcrafted Level Definitions for World 2 ───────────
  buildLevel: function(scene, lvl) {
    var self = this;
    var width = scene.scale.width;
    var height = scene.scale.height;

    // Helper builder functions
    var addPlat = function(x, y, w, h) {
      if (y < 420) {
        scene.add.rectangle(x + w/2, y + h + 3, w - 2, 6, 0x000000, 0.28).setDepth(2);
      }
      var p = scene.add.tileSprite(x + w/2, y + h/2, w, h, "plat_w2_tex");
      p.setDepth(10);
      scene.platforms.add(p);
      return p;
    };

    var addMirrorPlat = function(x, y, w, h) {
      var p = scene.add.tileSprite(x + w/2, y + h/2, w, h, "mirror_plat_tex");
      p.setDepth(10);
      scene.platforms.add(p);
      return p;
    };

    var addPhantomPlat = function(x, y, w, h) {
      var p = scene.add.tileSprite(x + w/2, y + h/2, w, h, "phantom_plat_tex");
      p.setDepth(10);
      scene.platforms.add(p);
      return p;
    };

    var addFallingPlat = function(x, y, w, h) {
      var p = scene.add.tileSprite(x + w/2, y + h/2, w, h, "plat_w2_tex");
      p.setDepth(10);
      p.isFallingPlat = true;
      p.stepped = false;
      p.hasFallen = false;
      p.shakeTimer = 0.38;
      scene.platforms.add(p);
      scene.fallingPlatforms.push(p);
      return p;
    };

    var addSpike = function(x, y) {
      var s = scene.spikes.create(x, y, "spike_up");
      s.setTint(WORLD_2_THEME.spike);
      s.setDepth(15);
      s.body.setSize(18, 14).setOffset(1, 6);
      return s;
    };

    var addCrusher = function(x, startY) {
      var c = scene.crushers.create(x, startY, "crusher_tex");
      c.startY = startY;
      c.isDropping = false;
      c.isRetracting = false;
      c.body.setImmovable(true);
      c.body.setSize(52, 60);
      c.setDepth(20);
      return c;
    };

    var addTrampoline = function(x, y) {
      var tr = scene.trampolines.create(x, y, "tramp_tex");
      tr.setDepth(12);
      tr.body.setSize(32, 12).setOffset(0, 4);
      return tr;
    };

    scene.spawnX = 60;
    scene.spawnY = 410;

    // ── CHAPTER 1: THE SHIFT (Levels 1 - 10) ───────────────────
    if (lvl === 0) { // Level 1: Reflections (Tutorial)
      addPlat(-80, 460, width + 160, 80);
      this.setupMirrorPlane(scene, 460);
      scene.exitGate = scene.createExitDoor(880, 435);
      scene.showTrollToast("WORLD 2: THE SHIFT\nNotice your reflection... 🪞");
    }
    else if (lvl === 1) { // Level 2: The Twin Spikes
      addPlat(-80, 460, 360, 80);
      addPlat(420, 460, 180, 80);
      addPlat(660, 460, 380, 80);
      this.setupMirrorPlane(scene, 460);
      addSpike(380, 450);
      addSpike(630, 450);
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 2) { // Level 3: Phantom Leap
      addPlat(-80, 460, 260, 80);
      addMirrorPlat(280, 460, 120, 30);
      addPhantomPlat(440, 430, 110, 30);
      addPlat(600, 460, 440, 80);
      this.setupMirrorPlane(scene, 460);
      for (var sx = 260; sx <= 580; sx += 40) addSpike(sx, 520);
      scene.exitGate = scene.createExitDoor(890, 435);
    }
    else if (lvl === 3) { // Level 4: Mirror Flip (Fleeing Door)
      addPlat(-80, 460, width + 160, 80);
      this.setupMirrorPlane(scene, 460);
      scene.exitGate = scene.createExitDoor(720, 435);
      scene.exitGate.fleeOnProximity = true;
      scene.exitGate.targetX = 860;
      scene.exitGate.targetY = 365;
      scene.exitGate.fleeMessage = "Oops! Reflected higher! 🪞";
      addMirrorPlat(800, 395, 180, 30);
    }
    else if (lvl === 4) { // Level 5: Glass Chasm
      addPlat(-80, 460, 220, 80);
      addMirrorPlat(220, 440, 90, 25);
      addMirrorPlat(360, 410, 90, 25);
      addMirrorPlat(500, 380, 90, 25);
      addPlat(660, 460, 380, 80);
      this.setupMirrorPlane(scene, 460);
      addSpike(690, 450);
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 5) { // Level 6: Reverse Horizon
      addPlat(-80, 460, width + 160, 80);
      this.setupMirrorPlane(scene, 460);
      addCrusher(420, 60);
      addCrusher(680, 60);
      scene.exitGate = scene.createExitDoor(910, 435);
    }
    else if (lvl === 6) { // Level 7: Shattered Steps
      addPlat(-80, 460, 240, 80);
      addFallingPlat(240, 460, 90, 25);
      addFallingPlat(380, 430, 90, 25);
      addFallingPlat(520, 460, 90, 25);
      addPlat(680, 460, 360, 80);
      for (var sx = 200; sx <= 660; sx += 40) addSpike(sx, 520);
      scene.exitGate = scene.createExitDoor(890, 435);
    }
    else if (lvl === 7) { // Level 8: Mirrored Springs
      addPlat(-80, 460, 260, 80);
      addTrampoline(300, 452);
      addPlat(420, 280, 180, 30);
      addTrampoline(550, 272);
      addPlat(660, 460, 380, 80);
      for (var sx = 240; sx <= 640; sx += 40) addSpike(sx, 520);
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 8) { // Level 9: The Twin Trap
      addPlat(-80, 460, 320, 80);
      addPlat(400, 460, 220, 80);
      addPlat(700, 460, 340, 80);
      this.setupMirrorPlane(scene, 460);
      addCrusher(510, 60);
      addSpike(360, 450);
      addSpike(660, 450);
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 9) { // Level 10: 💀 BRUTAL CHALLENGE #1 — The Grand Prism
      addPlat(-80, 460, 200, 80);
      this.setupMirrorPlane(scene, 460);
      addMirrorPlat(200, 430, 80, 25);
      addCrusher(340, 60);
      addMirrorPlat(390, 390, 80, 25);
      addFallingPlat(520, 360, 80, 25);
      addCrusher(620, 40);
      addMirrorPlat(680, 330, 80, 25);
      addPlat(800, 460, 240, 80);
      for (var sx = 180; sx <= 780; sx += 35) addSpike(sx, 520);
      scene.exitGate = scene.createExitDoor(880, 435);
      scene.showTrollToast("💀 BRUTAL CHALLENGE: THE GRAND PRISM");
    }

    // ── CHAPTER 2: DISTORTION (Levels 11 - 20) ──────────────────
    else if (lvl === 10) { // Level 11: Slow Motion
      addPlat(-80, 460, width + 160, 80);
      this.addTimeZone(scene, 480, 380, "slow", 110);
      addCrusher(420, 60);
      addCrusher(540, 60);
      scene.exitGate = scene.createExitDoor(900, 435);
      scene.showTrollToast("CHRONO DISTORTION: SLOW ZONE ⏳");
    }
    else if (lvl === 11) { // Level 12: Hyper Velocity
      addPlat(-80, 460, 280, 80);
      this.addTimeZone(scene, 450, 420, "fast", 100);
      addPlat(640, 460, 400, 80);
      for (var sx = 260; sx <= 620; sx += 40) addSpike(sx, 520);
      scene.exitGate = scene.createExitDoor(900, 435);
      scene.showTrollToast("HYPER VELOCITY: FAST ZONE ⚡");
    }
    else if (lvl === 12) { // Level 13: Chrono Shift
      addPlat(-80, 460, 240, 80);
      this.addTimeZone(scene, 320, 400, "slow", 80);
      addMirrorPlat(280, 420, 100, 25);
      this.addTimeZone(scene, 520, 360, "fast", 80);
      addMirrorPlat(480, 370, 100, 25);
      addPlat(680, 460, 360, 80);
      for (var sx = 220; sx <= 660; sx += 40) addSpike(sx, 520);
      scene.exitGate = scene.createExitDoor(890, 435);
    }
    else if (lvl === 13) { // Level 14: The Clockwork Pillar
      addPlat(-80, 460, 220, 80);
      var lift = addPlat(340, 420, 120, 30);
      scene.tweens.add({ targets: lift, y: 220, duration: 1800, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      this.addTimeZone(scene, 400, 320, "slow", 90);
      addPlat(620, 300, 420, 80);
      for (var sx = 200; sx <= 600; sx += 40) addSpike(sx, 520);
      scene.exitGate = scene.createExitDoor(900, 275);
    }
    else if (lvl === 14) { // Level 15: Rotating Spire
      addPlat(-80, 460, 260, 80);
      var oscPlat = addPlat(400, 380, 140, 25);
      scene.tweens.add({ targets: oscPlat, x: 560, duration: 1400, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      addPlat(720, 460, 320, 80);
      for (var sx = 240; sx <= 700; sx += 40) addSpike(sx, 520);
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 15) { // Level 16: Mirror of Time
      addPlat(-80, 460, width + 160, 80);
      this.setupMirrorPlane(scene, 460);
      this.addTimeZone(scene, 480, 390, "slow", 90);
      addCrusher(480, 60);
      scene.exitGate = scene.createExitDoor(890, 435);
    }
    else if (lvl === 16) { // Level 17: Desynchronized
      addPlat(-80, 460, 240, 80);
      var p1 = addPlat(280, 430, 90, 25);
      var p2 = addPlat(480, 400, 90, 25);
      this.addTimeZone(scene, 320, 430, "fast", 80);
      this.addTimeZone(scene, 520, 400, "slow", 80);
      addPlat(680, 460, 360, 80);
      for (var sx = 220; sx <= 660; sx += 40) addSpike(sx, 520);
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 17) { // Level 18: Temporal Crushers
      addPlat(-80, 460, width + 160, 80);
      this.addTimeZone(scene, 360, 380, "slow", 80);
      this.addTimeZone(scene, 620, 380, "fast", 80);
      addCrusher(360, 60);
      addCrusher(620, 60);
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 18) { // Level 19: The Moving Sky
      addPlat(-80, 460, 220, 80);
      var m1 = addPlat(260, 440, 100, 25);
      var m2 = addPlat(440, 400, 100, 25);
      var m3 = addPlat(620, 360, 100, 25);
      scene.tweens.add({ targets: [m1, m2, m3], y: "-=50", duration: 1600, yoyo: true, repeat: -1 });
      addPlat(780, 460, 260, 80);
      for (var sx = 200; sx <= 760; sx += 40) addSpike(sx, 520);
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 19) { // Level 20: 💀 BRUTAL CHALLENGE #2 — Chrono-Collapse
      addPlat(-80, 460, 180, 80);
      this.setupMirrorPlane(scene, 460);
      this.addTimeZone(scene, 260, 400, "fast", 75);
      addMirrorPlat(230, 420, 80, 25);
      addCrusher(360, 50);
      this.addTimeZone(scene, 480, 360, "slow", 75);
      addFallingPlat(450, 380, 80, 25);
      addCrusher(580, 50);
      addMirrorPlat(660, 340, 80, 25);
      addPlat(780, 460, 260, 80);
      for (var sx = 160; sx <= 760; sx += 35) addSpike(sx, 520);
      scene.exitGate = scene.createExitDoor(880, 435);
      scene.showTrollToast("💀 BRUTAL CHALLENGE: CHRONO-COLLAPSE");
    }

    // ── CHAPTER 3: ECHO (Levels 21 - 30) ───────────────────────
    else if (lvl === 20) { // Level 21: Past Self (Echo Tutorial)
      addPlat(-80, 460, width + 160, 80);
      this.setupEchoSystem(scene);
      this.addPuzzleSwitch(scene, 320, 452, "gate_21");
      this.addEnergyGate(scene, 600, 410, "gate_21");
      scene.exitGate = scene.createExitDoor(880, 435);
      scene.showTrollToast("THE ECHO: Step on switch, then move forward...\nYour past ghost follows in 2s! 👤");
    }
    else if (lvl === 21) { // Level 22: Double Duty
      addPlat(-80, 460, 300, 80);
      this.setupEchoSystem(scene);
      this.addPuzzleSwitch(scene, 180, 452, "gate_22");
      this.addEnergyGate(scene, 440, 410, "gate_22");
      addPlat(480, 460, 560, 80);
      addSpike(340, 450);
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 22) { // Level 23: The Relay
      addPlat(-80, 460, 260, 80);
      this.setupEchoSystem(scene);
      this.addPuzzleSwitch(scene, 140, 452, "gate_23a");
      this.addEnergyGate(scene, 380, 410, "gate_23a");
      addPlat(420, 460, 200, 80);
      this.addPuzzleSwitch(scene, 520, 452, "gate_23b");
      this.addEnergyGate(scene, 680, 410, "gate_23b");
      addPlat(720, 460, 320, 80);
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 23) { // Level 24: Echo Bait
      addPlat(-80, 460, width + 160, 80);
      this.setupEchoSystem(scene);
      addCrusher(450, 60);
      this.addPuzzleSwitch(scene, 260, 452, "gate_24");
      this.addEnergyGate(scene, 680, 410, "gate_24");
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 24) { // Level 25: Ghost Leap
      addPlat(-80, 460, 280, 80);
      this.setupEchoSystem(scene);
      addTrampoline(220, 452);
      this.addPuzzleSwitch(scene, 220, 280, "gate_25");
      this.addEnergyGate(scene, 520, 410, "gate_25");
      addPlat(560, 460, 480, 80);
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 25) { // Level 26: Mirror & Ghost
      addPlat(-80, 460, width + 160, 80);
      this.setupMirrorPlane(scene, 460);
      this.setupEchoSystem(scene);
      this.addPuzzleSwitch(scene, 360, 452, "gate_26");
      this.addEnergyGate(scene, 660, 410, "gate_26");
      addSpike(480, 450);
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 26) { // Level 27: Echo in Time
      addPlat(-80, 460, width + 160, 80);
      this.setupEchoSystem(scene);
      this.addTimeZone(scene, 280, 430, "slow", 80);
      this.addPuzzleSwitch(scene, 280, 452, "gate_27");
      this.addEnergyGate(scene, 640, 410, "gate_27");
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 27) { // Level 28: The Triad Path
      addPlat(-80, 460, 240, 80);
      this.setupEchoSystem(scene);
      this.addPuzzleSwitch(scene, 120, 452, "gate_28a");
      this.addEnergyGate(scene, 320, 410, "gate_28a");
      addPlat(360, 460, 160, 80);
      this.addPuzzleSwitch(scene, 420, 452, "gate_28b");
      this.addEnergyGate(scene, 580, 410, "gate_28b");
      addPlat(620, 460, 420, 80);
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 28) { // Level 29: Phantom Corridor
      addPlat(-80, 460, 260, 80);
      this.setupEchoSystem(scene);
      addPhantomPlat(280, 430, 90, 25);
      addPhantomPlat(420, 400, 90, 25);
      this.addPuzzleSwitch(scene, 460, 392, "gate_29");
      this.addEnergyGate(scene, 600, 410, "gate_29");
      addPlat(640, 460, 400, 80);
      for (var sx = 240; sx <= 600; sx += 40) addSpike(sx, 520);
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 29) { // Level 30: 💀 BRUTAL CHALLENGE #3 — Paradox Engine
      addPlat(-80, 460, 220, 80);
      this.setupMirrorPlane(scene, 460);
      this.setupEchoSystem(scene);
      this.addPuzzleSwitch(scene, 140, 452, "gate_30a");
      this.addTimeZone(scene, 300, 400, "fast", 75);
      addCrusher(340, 50);
      this.addEnergyGate(scene, 440, 410, "gate_30a");
      addMirrorPlat(470, 390, 90, 25);
      this.addPuzzleSwitch(scene, 510, 382, "gate_30b");
      this.addEnergyGate(scene, 660, 410, "gate_30b");
      addPlat(700, 460, 340, 80);
      for (var sx = 180; sx <= 680; sx += 35) addSpike(sx, 520);
      scene.exitGate = scene.createExitDoor(890, 435);
      scene.showTrollToast("💀 BRUTAL CHALLENGE: PARADOX ENGINE");
    }

    // ── CHAPTER 4: COLLAPSE (Levels 31 - 40) ───────────────────
    else if (lvl === 30) { // Level 31: Polarity (Magnet Tutorial)
      addPlat(-80, 460, 320, 80);
      this.addMagnetNode(scene, 260, 390, "repel", 300);
      addPlat(480, 340, 200, 40);
      addPlat(720, 460, 320, 80);
      for (var sx = 300; sx <= 700; sx += 40) addSpike(sx, 520);
      scene.exitGate = scene.createExitDoor(900, 435);
      scene.showTrollToast("MAGNETIC COLLAPSE: Polar Repulsion Field 🧲");
    }
    else if (lvl === 31) { // Level 32: Magnetic Rail
      addPlat(-80, 460, 260, 80);
      this.addMagnetNode(scene, 420, 320, "attract", 280);
      addPlat(560, 460, 480, 80);
      for (var sx = 240; sx <= 540; sx += 40) addSpike(sx, 520);
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 32) { // Level 33: Inverse Pull
      addPlat(-80, 460, 240, 80);
      this.addMagnetNode(scene, 380, 240, "attract", 320);
      addPlat(520, 460, 160, 80);
      this.addMagnetNode(scene, 680, 420, "repel", 280);
      addPlat(780, 360, 260, 40);
      for (var sx = 220; sx <= 760; sx += 40) addSpike(sx, 520);
      scene.exitGate = scene.createExitDoor(900, 335);
    }
    else if (lvl === 33) { // Level 34: Circuitry (Multi-Switch)
      addPlat(-80, 460, width + 160, 80);
      this.addPuzzleSwitch(scene, 280, 452, "gate_34a");
      this.addEnergyGate(scene, 440, 410, "gate_34a");
      this.addPuzzleSwitch(scene, 520, 452, "gate_34b");
      this.addEnergyGate(scene, 680, 410, "gate_34b");
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 34) { // Level 35: The Gravity Well
      addPlat(-80, 460, 220, 80);
      this.addMagnetNode(scene, 380, 220, "attract", 280);
      this.addMagnetNode(scene, 540, 480, "repel", 280);
      addPlat(680, 460, 360, 80);
      for (var sx = 200; sx <= 660; sx += 40) addSpike(sx, 520);
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 35) { // Level 36: Collapsing Spires
      addPlat(-80, 460, 200, 80);
      var sp1 = addPlat(260, 430, 90, 25);
      var sp2 = addPlat(420, 390, 90, 25);
      var sp3 = addPlat(580, 350, 90, 25);
      this.addMagnetNode(scene, 420, 260, "attract", 250);
      addPlat(720, 460, 320, 80);
      for (var sx = 180; sx <= 700; sx += 40) addSpike(sx, 520);
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 36) { // Level 37: Magnetic Echo
      addPlat(-80, 460, width + 160, 80);
      this.setupEchoSystem(scene);
      this.addMagnetNode(scene, 440, 380, "repel", 260);
      this.addPuzzleSwitch(scene, 260, 452, "gate_37");
      this.addEnergyGate(scene, 650, 410, "gate_37");
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 37) { // Level 38: Polarity Reversal
      addPlat(-80, 460, 240, 80);
      var mag38 = this.addMagnetNode(scene, 420, 360, "repel", 300);
      this.addPuzzleSwitch(scene, 180, 452, "gate_38");
      addPlat(620, 460, 420, 80);
      for (var sx = 220; sx <= 600; sx += 40) addSpike(sx, 520);
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 38) { // Level 39: Tectonic Shift
      addPlat(-80, 460, 220, 80);
      var step1 = addPlat(280, 440, 100, 25);
      var step2 = addPlat(440, 400, 100, 25);
      var step3 = addPlat(600, 360, 100, 25);
      this.addPuzzleSwitch(scene, 160, 452, "gate_39");
      addPlat(760, 460, 280, 80);
      for (var sx = 200; sx <= 740; sx += 40) addSpike(sx, 520);
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 39) { // Level 40: 💀 BRUTAL CHALLENGE #4 — Magnetic Labyrinth
      addPlat(-80, 460, 180, 80);
      this.setupEchoSystem(scene);
      this.addMagnetNode(scene, 260, 350, "repel", 280);
      addMirrorPlat(220, 410, 80, 25);
      this.addPuzzleSwitch(scene, 140, 452, "gate_40a");
      this.addEnergyGate(scene, 380, 370, "gate_40a");
      this.addMagnetNode(scene, 500, 260, "attract", 300);
      addMirrorPlat(480, 360, 80, 25);
      this.addPuzzleSwitch(scene, 520, 352, "gate_40b");
      this.addEnergyGate(scene, 660, 370, "gate_40b");
      addPlat(740, 460, 300, 80);
      for (var sx = 160; sx <= 720; sx += 35) addSpike(sx, 520);
      scene.exitGate = scene.createExitDoor(890, 435);
      scene.showTrollToast("💀 BRUTAL CHALLENGE: MAGNETIC LABYRINTH");
    }

    // ── CHAPTER 5: SOMETHING IS WRONG... (Levels 41 - 44) ───────
    else if (lvl === 40) { // Level 41: The Quiet Ruin (Atmosphere)
      addPlat(-80, 460, width + 160, 80);
      scene.exitGate = scene.createExitDoor(880, 435);
      scene.showTrollToast("...The wind has stopped blowing.");
    }
    else if (lvl === 41) { // Level 42: The Shadow That Follows
      addPlat(-80, 460, 320, 80);
      addPlat(400, 460, 240, 80);
      addPlat(700, 460, 340, 80);
      addSpike(360, 450);
      addSpike(660, 450);
      scene.exitGate = scene.createExitDoor(900, 435);
      scene.showTrollToast("Did something in the distance just move?");
    }
    else if (lvl === 42) { // Level 43: Signal Glitch
      addPlat(-80, 460, 280, 80);
      addMirrorPlat(320, 430, 100, 25);
      addMirrorPlat(500, 400, 100, 25);
      addPlat(660, 460, 380, 80);
      for (var sx = 260; sx <= 640; sx += 40) addSpike(sx, 520);
      scene.exitGate = scene.createExitDoor(900, 435);
      scene.showTrollToast("⚠ SIGNAL GLITCH DETECTED");
    }
    else if (lvl === 43) { // Level 44: Reality Tremor
      addPlat(-80, 460, width + 160, 80);
      addCrusher(460, 60);
      scene.exitGate = scene.createExitDoor(900, 435);
      scene.showTrollToast("Reality is destabilizing...");
    }

    // ── CHAPTER 6: LEVEL 45 — THE REVEAL & WORLD 3 TEASER ───────
    else if (lvl === 44) { // Level 45: THE REVEAL (Cinematic Event)
      addPlat(-80, 460, width + 160, 80);
      scene.exitGate = scene.createExitDoor(880, 435);
      scene.exitGate.isRevealEvent = true;
      scene.showTrollToast("THE APEX OF WORLD 2");
    }

    // ── CHAPTER 7: THE DESCENT (Levels 46 - 50) ─────────────────
    else if (lvl === 45) { // Level 46: Aftermath (Post-Reveal Breakdown)
      addPlat(-80, 460, 260, 80);
      addMirrorPlat(280, 430, 90, 25);
      addMirrorPlat(420, 390, 90, 25);
      addPlat(560, 460, 480, 80);
      this.setupMirrorPlane(scene, 460);
      for (var sx = 240; sx <= 540; sx += 40) addSpike(sx, 520);
      scene.exitGate = scene.createExitDoor(900, 435);
      scene.showTrollToast("THE DESCENT: 46 / 50 LEVELS");
    }
    else if (lvl === 46) { // Level 47: The Monolith's Shadow
      addPlat(-80, 460, width + 160, 80);
      var monolithShadow = scene.add.sprite(500, 240, "monolith_tex").setDepth(5).setAlpha(0.4).setScale(1.6);
      scene.tweens.add({ targets: monolithShadow, y: 220, duration: 2500, yoyo: true, repeat: -1 });
      this.addMagnetNode(scene, 500, 360, "attract", 280);
      addSpike(420, 450);
      addSpike(580, 450);
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 47) { // Level 48: Dimension Rift
      addPlat(-80, 460, 240, 80);
      this.addTimeZone(scene, 360, 380, "slow", 90);
      this.addTimeZone(scene, 560, 380, "fast", 90);
      addMirrorPlat(320, 410, 90, 25);
      addMirrorPlat(520, 410, 90, 25);
      addPlat(680, 460, 360, 80);
      for (var sx = 220; sx <= 660; sx += 40) addSpike(sx, 520);
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 48) { // Level 49: 💀 BRUTAL CHALLENGE #5 — Fractured Continuum
      addPlat(-80, 460, 180, 80);
      this.setupMirrorPlane(scene, 460);
      this.setupEchoSystem(scene);
      this.addTimeZone(scene, 280, 390, "fast", 70);
      addMirrorPlat(230, 420, 80, 25);
      addCrusher(360, 50);
      this.addPuzzleSwitch(scene, 140, 452, "gate_49");
      this.addEnergyGate(scene, 440, 380, "gate_49");
      this.addMagnetNode(scene, 520, 260, "attract", 290);
      addFallingPlat(480, 370, 80, 25);
      addCrusher(600, 50);
      addMirrorPlat(660, 340, 80, 25);
      addPlat(760, 460, 280, 80);
      for (var sx = 160; sx <= 740; sx += 35) addSpike(sx, 520);
      scene.exitGate = scene.createExitDoor(890, 435);
      scene.showTrollToast("💀 BRUTAL CHALLENGE: FRACTURED CONTINUUM");
    }
    else if (lvl === 49) { // Level 50: 👑 GRAND MASTER FINALE — The Shift Complete
      addPlat(-80, 460, 180, 80);
      this.setupMirrorPlane(scene, 460);
      this.setupEchoSystem(scene);
      
      // Multi-Chamber Master Climax
      // Chamber 1: Echo Relay & Time Shift
      this.addPuzzleSwitch(scene, 120, 452, "gate_50a");
      this.addTimeZone(scene, 280, 410, "slow", 70);
      addMirrorPlat(240, 420, 80, 25);
      this.addEnergyGate(scene, 360, 390, "gate_50a");

      // Chamber 2: Magnetic Leap over Abyss
      this.addMagnetNode(scene, 460, 260, "repel", 320);
      addFallingPlat(430, 380, 80, 25);
      this.addPuzzleSwitch(scene, 460, 372, "gate_50b");
      this.addEnergyGate(scene, 580, 360, "gate_50b");

      // Chamber 3: High-Speed Crusher Dash
      this.addTimeZone(scene, 660, 350, "fast", 75);
      addCrusher(650, 40);
      addMirrorPlat(640, 350, 90, 25);

      // Sanctuary: The Grand Celestial Exit
      addPlat(760, 460, 280, 80);
      for (var sx = 160; sx <= 740; sx += 32) addSpike(sx, 520);

      scene.exitGate = scene.createExitDoor(890, 435);
      scene.showTrollToast("👑 GRAND FINALE: CONQUER THE SHIFT!");
    }
  }
};

window.WORLD_2_THEME = WORLD_2_THEME;
window.World2Assets = World2Assets;
window.World2Engine = World2Engine;

