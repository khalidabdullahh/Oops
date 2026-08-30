// =============================================================================
//  Oops! – World 2: The Shift (v2.1 Complete Production Rebuild)
//  "A beautiful world that slowly becomes wrong."
//  50 Handcrafted Levels, 6 Dynamic Biomes, Animated 2.5D Parallax,
//  Interactive Mirror World, Localized Time Zones, Echo Ghost, Magnetic Mechanics
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

var WORLD_2_BIOMES = {
  GARDEN: {
    id: "GARDEN",
    name: "FLOATING GARDEN / SKY RUINS",
    skyTop: 0x061426, skyBot: 0x0f2b48,
    sunColor: 0x00d2d3, islandColor: 0x133852, ruinColor: 0x1a4664,
    leafTint: 0x2ed573, cloudAlpha: 0.45
  },
  DISTORTION: {
    id: "DISTORTION",
    name: "DISTORTED VALLEY",
    skyTop: 0x180a2b, skyBot: 0x2d124d,
    sunColor: 0xff9f43, islandColor: 0x2c1945, ruinColor: 0x3d2260,
    leafTint: 0xff9f43, cloudAlpha: 0.35
  },
  ECHO: {
    id: "ECHO",
    name: "ECHO FOREST",
    skyTop: 0x060c18, skyBot: 0x0f1c33,
    sunColor: 0x55efc4, islandColor: 0x10223d, ruinColor: 0x173154,
    leafTint: 0x00cec9, cloudAlpha: 0.55
  },
  COLLAPSE: {
    id: "COLLAPSE",
    name: "BROKEN RUINS",
    skyTop: 0x0a0c10, skyBot: 0x1c212a,
    sunColor: 0x0984e3, islandColor: 0x202633, ruinColor: 0x2d3648,
    leafTint: 0x74b9ff, cloudAlpha: 0.3
  },
  UNSTABLE: {
    id: "UNSTABLE",
    name: "UNSTABLE WORLD",
    skyTop: 0x05020c, skyBot: 0x1a062e,
    sunColor: 0xa55eea, islandColor: 0x240938, ruinColor: 0x380f54,
    leafTint: 0xd980fa, cloudAlpha: 0.4
  },
  DESCENT: {
    id: "DESCENT",
    name: "THE DESCENT",
    skyTop: 0x020106, skyBot: 0x0b0314,
    sunColor: 0x8854d0, islandColor: 0x14041f, ruinColor: 0x210833,
    leafTint: 0x6c5ce7, cloudAlpha: 0.25
  }
};

function getBiomeForLevel(lvl) {
  if (lvl < 10) return WORLD_2_BIOMES.GARDEN;
  if (lvl < 20) return WORLD_2_BIOMES.DISTORTION;
  if (lvl < 30) return WORLD_2_BIOMES.ECHO;
  if (lvl < 40) return WORLD_2_BIOMES.COLLAPSE;
  if (lvl < 45) return WORLD_2_BIOMES.UNSTABLE;
  return WORLD_2_BIOMES.DESCENT;
}

// ─── Procedural Asset Generation Pipeline ──────────────────────
var World2Assets = {
  created: false,

  create: function(scene) {
    if (this.created) return;
    this.created = true;

    // 🌿 2.5D Sky Ruin Platform with 3D Bevel & Moss
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

    // 🪞 Shimmering Mirror Glass Platform
    var mirrPlatGfx = scene.make.graphics({ x: 0, y: 0, add: false });
    mirrPlatGfx.fillStyle(0x00d2d3, 0.4);
    mirrPlatGfx.fillRect(0, 0, 32, 32);
    mirrPlatGfx.lineStyle(2, 0xffffff, 0.9);
    mirrPlatGfx.strokeRect(1, 1, 30, 30);
    mirrPlatGfx.lineStyle(1, 0xffffff, 0.7);
    mirrPlatGfx.lineBetween(4, 28, 28, 4);
    mirrPlatGfx.lineBetween(10, 28, 28, 10);
    mirrPlatGfx.generateTexture("mirror_plat_tex", 32, 32);
    mirrPlatGfx.destroy();

    // 👻 Holographic Phantom Platform
    var phantGfx = scene.make.graphics({ x: 0, y: 0, add: false });
    phantGfx.fillStyle(0x9b59b6, 0.15);
    phantGfx.fillRect(0, 0, 32, 32);
    phantGfx.lineStyle(1.5, 0xe056fd, 0.85);
    phantGfx.strokeRoundedRect(2, 2, 28, 28, 4);
    phantGfx.lineBetween(6, 6, 26, 26);
    phantGfx.generateTexture("phantom_plat_tex", 32, 32);
    phantGfx.destroy();

    // ☁️ Volumetric Cloud Puff
    var cloudGfx = scene.make.graphics({ x: 0, y: 0, add: false });
    cloudGfx.fillStyle(0xffffff, 0.25);
    cloudGfx.fillCircle(40, 24, 20);
    cloudGfx.fillCircle(65, 20, 24);
    cloudGfx.fillCircle(90, 24, 18);
    cloudGfx.fillRoundedRect(20, 20, 90, 20, 10);
    cloudGfx.generateTexture("w2_cloud_puff", 120, 48);
    cloudGfx.destroy();

    // ⏳ Time Zone: Slow Field
    var slowGfx = scene.make.graphics({ x: 0, y: 0, add: false });
    slowGfx.fillStyle(0x3867d6, 0.22);
    slowGfx.fillCircle(32, 32, 30);
    slowGfx.lineStyle(2, 0x45aaf2, 0.85);
    slowGfx.strokeCircle(32, 32, 28);
    slowGfx.lineStyle(1, 0xffffff, 0.6);
    slowGfx.strokeCircle(32, 32, 16);
    slowGfx.fillStyle(0xffffff, 0.95);
    slowGfx.fillTriangle(26, 22, 38, 22, 32, 30);
    slowGfx.fillTriangle(26, 42, 38, 42, 32, 34);
    slowGfx.generateTexture("time_zone_slow", 64, 64);
    slowGfx.destroy();

    // ⚡ Time Zone: Fast Field
    var fastGfx = scene.make.graphics({ x: 0, y: 0, add: false });
    fastGfx.fillStyle(0xffa502, 0.25);
    fastGfx.fillCircle(32, 32, 30);
    fastGfx.lineStyle(2, 0xffd32a, 0.85);
    fastGfx.strokeCircle(32, 32, 28);
    fastGfx.fillStyle(0xffffff, 0.95);
    fastGfx.fillTriangle(24, 24, 31, 32, 24, 40);
    fastGfx.fillTriangle(33, 24, 40, 32, 33, 40);
    fastGfx.generateTexture("time_zone_fast", 64, 64);
    fastGfx.destroy();

    // 👤 Echo Shadow Player Sprite
    var echoGfx = scene.make.graphics({ x: 0, y: 0, add: false });
    echoGfx.fillStyle(0x00d2d3, 0.65);
    echoGfx.fillRoundedRect(6, 6, 20, 24, 6);
    echoGfx.fillStyle(0xffffff, 0.9);
    echoGfx.fillCircle(12, 14, 2.5);
    echoGfx.fillCircle(20, 14, 2.5);
    echoGfx.lineStyle(1.5, 0x55efc4, 0.95);
    echoGfx.strokeRoundedRect(5, 5, 22, 26, 6);
    echoGfx.generateTexture("echo_hero_ghost", 32, 36);
    echoGfx.destroy();

    // 🧲 Magnetic Polar Node (Attract / Repel)
    var magGfx = scene.make.graphics({ x: 0, y: 0, add: false });
    magGfx.fillStyle(0x2d3436, 1);
    magGfx.fillCircle(16, 16, 14);
    magGfx.fillStyle(0x0984e3, 1);
    magGfx.fillRect(4, 10, 10, 12);
    magGfx.fillStyle(0xd63031, 1);
    magGfx.fillRect(18, 10, 10, 12);
    magGfx.lineStyle(2, 0xffffff, 0.95);
    magGfx.strokeCircle(16, 16, 14);
    magGfx.generateTexture("magnet_node", 32, 32);
    magGfx.destroy();

    // 📦 Movable Metal Crate
    var crateGfx = scene.make.graphics({ x: 0, y: 0, add: false });
    crateGfx.fillStyle(0x4b6584, 1);
    crateGfx.fillRoundedRect(0, 0, 28, 28, 4);
    crateGfx.lineStyle(2, 0x778ca3, 1);
    crateGfx.strokeRoundedRect(1, 1, 26, 26, 4);
    crateGfx.lineBetween(4, 4, 24, 24);
    crateGfx.lineBetween(24, 4, 4, 24);
    crateGfx.generateTexture("metal_crate_tex", 28, 28);
    crateGfx.destroy();

    // 🔘 Floor Pedestal Switch (Off / On)
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

    // ⚡ Energy Barrier Gate
    var gateGfx = scene.make.graphics({ x: 0, y: 0, add: false });
    gateGfx.fillStyle(0x00d2d3, 0.7);
    gateGfx.fillRect(4, 0, 8, 64);
    gateGfx.fillStyle(0xffffff, 0.95);
    gateGfx.fillRect(6, 0, 4, 64);
    gateGfx.lineStyle(1.5, 0x55efc4, 1);
    gateGfx.strokeRect(2, 0, 12, 64);
    gateGfx.generateTexture("energy_barrier_tex", 16, 64);
    gateGfx.destroy();

    // 🌌 World 3 Monolith Artifact
    var monoGfx = scene.make.graphics({ x: 0, y: 0, add: false });
    monoGfx.fillStyle(0x030308, 1);
    monoGfx.fillRoundedRect(0, 0, 42, 94, 8);
    monoGfx.lineStyle(2, 0xa55eea, 1);
    monoGfx.strokeRoundedRect(0, 0, 42, 94, 8);
    monoGfx.fillStyle(0x8854d0, 0.55);
    monoGfx.fillCircle(21, 36, 13);
    monoGfx.fillStyle(0xffffff, 0.95);
    monoGfx.fillCircle(21, 36, 4);
    monoGfx.generateTexture("monolith_tex", 42, 94);
    monoGfx.destroy();

    // 🍃 Drifting Foliage Leaf
    var leafGfx = scene.make.graphics({ x: 0, y: 0, add: false });
    leafGfx.fillStyle(0x2ed573, 0.9);
    leafGfx.fillEllipse(8, 6, 8, 4);
    leafGfx.fillStyle(0x7bed9f, 0.95);
    leafGfx.fillCircle(8, 6, 2);
    leafGfx.generateTexture("foliage_leaf", 16, 12);
    leafGfx.destroy();

    // 💧 Waterfall Stream Droplet
    var dropGfx = scene.make.graphics({ x: 0, y: 0, add: false });
    dropGfx.fillStyle(0x48dbfb, 0.75);
    dropGfx.fillRoundedRect(0, 0, 4, 14, 2);
    dropGfx.generateTexture("waterfall_drop", 4, 14);
    dropGfx.destroy();
  }
};

// ─── Dedicated Cinematic World 2 Intro Scene (5-8 Seconds) ─────
class World2IntroScene extends Phaser.Scene {
  constructor() {
    super("World2IntroScene");
  }

  create() {
    var self = this;
    var width = this.scale.width;
    var height = this.scale.height;

    AudioEngine.init();
    AudioEngine.stopMusic();
    MobileGamepad.hide();
    removeLoaderSplash();

    World2Assets.create(this);

    // Initial Darkness
    var bg = this.add.graphics();
    bg.fillGradientStyle(0x050c18, 0x050c18, 0x0a192f, 0x0a192f, 1);
    bg.fillRect(0, 0, width, height);

    // Atmospheric Synth Hum
    AudioEngine.playTone(55, "sine", 4.0, 0.4);
    AudioEngine.playTone(110, "triangle", 3.0, 0.25, 0.3);

    // Drifting Clouds
    this.clouds = [];
    for (var c = 0; c < 4; c++) {
      var cloud = this.add.sprite(c * 260 + 50, 70 + (c % 2) * 40, "w2_cloud_puff").setDepth(5).setAlpha(0.45).setScale(1.2);
      this.clouds.push(cloud);
    }

    // Distant Sky Ruins & Islands
    var islGfx = this.add.graphics().setDepth(10);
    islGfx.fillStyle(0x133852, 0.85);
    islGfx.fillRoundedRect(width * 0.15, 140, 160, 36, 12);
    islGfx.fillTriangle(width * 0.15 + 20, 176, width * 0.15 + 140, 176, width * 0.15 + 80, 220);
    islGfx.fillRoundedRect(width * 0.65, 110, 200, 42, 14);
    islGfx.fillTriangle(width * 0.65 + 30, 152, width * 0.65 + 170, 152, width * 0.65 + 100, 205);

    // Cascading Waterfall Particles
    this.add.particles(width * 0.22, 175, "waterfall_drop", {
      speedY: { min: 40, max: 90 },
      speedX: { min: -4, max: 4 },
      scale: { start: 0.8, end: 0.2 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 1200,
      frequency: 180
    }).setDepth(11);

    // Player Hero on Floating Platform Island
    var heroPlatform = this.add.tileSprite(width / 2, height * 0.65, 180, 32, "plat_w2_tex").setDepth(20);
    var hero = this.add.sprite(width / 2, height * 0.65 - 28, "hero_idle_1").setDepth(25);
    hero.anims.play("hero_anim_idle");

    // Camera Starts Pulled Back and Zooms In
    this.cameras.main.setZoom(0.75);
    this.cameras.main.pan(width / 2, height * 0.55, 3200, "Cubic.easeOut");
    this.cameras.main.zoomTo(1.0, 3200, "Cubic.easeOut");

    // Skip Button
    var skipBtn = this.add.container(width - 65, 30).setDepth(200);
    var sGfx = this.add.graphics();
    sGfx.fillStyle(0x161822, 0.85);
    sGfx.fillRoundedRect(-45, -12, 90, 24, 6);
    sGfx.lineStyle(1.5, 0x00d2d3, 0.9);
    sGfx.strokeRoundedRect(-45, -12, 90, 24, 6);
    var sTxt = this.add.text(0, 0, "SKIP ▶", {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "7.5px",
      color: "#00d2d3"
    }).setOrigin(0.5);
    var sZone = this.add.zone(0, 0, 90, 24).setInteractive({ cursor: "pointer" });
    sZone.on("pointerdown", function() {
      self.finishIntro();
    });
    skipBtn.add([sGfx, sTxt, sZone]);

    // Phase 2: The Mirror Anomaly (At 3.2s)
    this.time.delayedCall(3200, function() {
      AudioEngine.playTone(280, "sawtooth", 0.15, 0.25);
      AudioEngine.playTone(140, "sawtooth", 0.25, 0.3, 0.08);

      var ripple = self.add.graphics().setDepth(50);
      ripple.lineStyle(3, 0x00d2d3, 0.9);
      ripple.lineBetween(0, height * 0.65, width, height * 0.65);
      
      var reflectionGhost = self.add.sprite(width / 2, height * 0.65 + 32, "hero_idle_1").setDepth(24).setTint(0x00d2d3).setAlpha(0.6).setFlipY(true);

      self.cameras.main.shake(350, 0.015);

      self.tweens.add({
        targets: [ripple, reflectionGhost],
        alpha: 0,
        duration: 900,
        onComplete: function() {
          ripple.destroy();
          reflectionGhost.destroy();
        }
      });

      // Phase 3: Title Slam (At 4.2s)
      self.time.delayedCall(900, function() {
        var titleGroup = self.add.container(width / 2, height * 0.32).setDepth(150).setScale(0.6).setAlpha(0);

        var tBadge = self.add.text(0, -28, "CHAPTER II", {
          fontFamily: "'Press Start 2P', monospace",
          fontSize: "10px",
          color: "#00d2d3"
        }).setOrigin(0.5);

        var tTitle = self.add.text(0, 0, "THE SHIFT", {
          fontFamily: "'Press Start 2P', monospace",
          fontSize: "26px",
          color: "#ffffff",
          stroke: "#000000",
          strokeThickness: 8
        }).setOrigin(0.5);

        var tSub = self.add.text(0, 26, "A beautiful world that slowly becomes wrong.", {
          fontFamily: "'Press Start 2P', monospace",
          fontSize: "7.5px",
          color: "#7bed9f"
        }).setOrigin(0.5);

        titleGroup.add([tBadge, tTitle, tSub]);

        AudioEngine.sfxBoom();

        self.tweens.add({
          targets: titleGroup,
          alpha: 1,
          scaleX: 1.0,
          scaleY: 1.0,
          duration: 450,
          ease: "Back.easeOut"
        });

        // Phase 4: Smooth Fade to Level 1 (At 7.0s)
        self.time.delayedCall(2200, function() {
          self.finishIntro();
        });
      });
    });
  }

  update(time, delta) {
    if (this.clouds) {
      for (var i = 0; i < this.clouds.length; i++) {
        this.clouds[i].x += (0.2 + i * 0.08);
        if (this.clouds[i].x > this.scale.width + 80) {
          this.clouds[i].x = -80;
        }
      }
    }
  }

  finishIntro() {
    var self = this;
    if (this.finished) return;
    this.finished = true;

    try {
      var data = SaveManager.load();
      data.introSeenWorld2 = true;
      SafeStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch(e) {}

    this.cameras.main.fade(450, 0, 0, 0);
    this.time.delayedCall(450, function() {
      self.scene.start("GameScene", { world: 1, level: 0 });
    });
  }
}

// ─── 2.5D Animated Parallax Biome Manager ─────────────────────
var World2ThemeManager = {
  scene: null,
  levelIdx: 0,
  biome: null,

  skyGfx: null,
  sunGfx: null,
  clouds: [],
  distantIslandsGfx: null,
  midRuinsGfx: null,
  foliageEmitters: null,
  waterfallEmitters: null,

  init: function(scene, levelIdx) {
    this.scene = scene;
    this.levelIdx = levelIdx;
    this.biome = getBiomeForLevel(levelIdx);
    this.clouds = [];

    this.buildParallaxLayers();
  },

  buildParallaxLayers: function() {
    var scene = this.scene;
    var width = scene.scale.width;
    var height = scene.scale.height;
    var biome = this.biome;

    // Layer 0: Biome Sky Gradient
    this.skyGfx = scene.add.graphics().setDepth(-40);
    this.skyGfx.fillGradientStyle(biome.skyTop, biome.skyTop, biome.skyBot, biome.skyBot, 1);
    this.skyGfx.fillRect(0, 0, width, height);

    // Layer 1: Celestial Sun / Anomaly Halo
    this.sunGfx = scene.add.graphics().setDepth(-38);
    this.sunGfx.fillStyle(biome.sunColor, 0.14);
    this.sunGfx.fillCircle(width * 0.78, height * 0.22, 105);
    this.sunGfx.fillStyle(biome.sunColor, 0.32);
    this.sunGfx.fillCircle(width * 0.78, height * 0.22, 46);

    // Layer 2: Drifting Volumetric Cloud Sprites
    for (var c = 0; c < 5; c++) {
      var cloud = scene.add.sprite(c * 220 + 40, 65 + (c % 3) * 35, "w2_cloud_puff").setDepth(-35);
      cloud.setAlpha(biome.cloudAlpha);
      cloud.setScale(1.1 + (c % 2) * 0.3);
      cloud.driftSpeed = 0.25 + (c * 0.12);
      this.clouds.push(cloud);
    }

    // Layer 3: Distant Floating Islands & Animated Waterfalls
    this.distantIslandsGfx = scene.add.graphics().setDepth(-30);
    this.drawDistantIslands(this.distantIslandsGfx, width, height, 0);

    if (this.levelIdx < 30) {
      try {
        this.waterfallEmitters = scene.add.particles(width * 0.18, 175, "waterfall_drop", {
          speedY: { min: 45, max: 90 },
          scale: { start: 0.7, end: 0.1 },
          alpha: { start: 0.75, end: 0 },
          lifespan: 1100,
          frequency: 220
        }).setDepth(-29);
      } catch(e) {}
    }

    // Layer 4: Midground Ruin Pillars & Floating Arches
    this.midRuinsGfx = scene.add.graphics().setDepth(-20);
    this.drawMidRuins(this.midRuinsGfx, width, height, 0);

    // Layer 5: Foreground Floating Foliage Particles
    try {
      this.foliageEmitters = scene.add.particles(0, 0, "foliage_leaf", {
        x: { min: 0, max: width },
        y: -20,
        lifespan: 6000,
        speedY: { min: 30, max: 65 },
        speedX: { min: -20, max: 20 },
        rotate: { min: 0, max: 360 },
        scale: { start: 0.75, end: 0.2 },
        alpha: { start: 0.7, end: 0 },
        tint: biome.leafTint,
        frequency: 450
      }).setDepth(150);
    } catch(e) {}
  },

  drawDistantIslands: function(gfx, width, height, offsetX) {
    gfx.clear();
    var biome = this.biome;
    gfx.fillStyle(biome.islandColor, 0.88);

    gfx.fillRoundedRect(width * 0.10 + offsetX, 135, 170, 40, 14);
    gfx.fillTriangle(width * 0.10 + offsetX + 20, 175, width * 0.10 + offsetX + 150, 175, width * 0.10 + offsetX + 85, 222);

    gfx.fillRoundedRect(width * 0.42 + offsetX * 1.2, 90, 210, 46, 16);
    gfx.fillTriangle(width * 0.42 + offsetX * 1.2 + 25, 136, width * 0.42 + offsetX * 1.2 + 185, 136, width * 0.42 + offsetX * 1.2 + 105, 195);

    gfx.fillRoundedRect(width * 0.75 + offsetX * 0.8, 150, 160, 36, 12);
    gfx.fillTriangle(width * 0.75 + offsetX * 0.8 + 20, 186, width * 0.75 + offsetX * 0.8 + 140, 186, width * 0.75 + offsetX * 0.8 + 80, 230);
  },

  drawMidRuins: function(gfx, width, height, offsetX) {
    gfx.clear();
    var biome = this.biome;
    gfx.fillStyle(biome.ruinColor, 0.95);

    gfx.fillRect(width * 0.05 + offsetX, 235, 32, 175);
    gfx.fillRect(width * 0.03 + offsetX, 225, 48, 12);
    gfx.lineStyle(1.5, biome.sunColor, 0.6);
    gfx.lineBetween(width * 0.05 + offsetX + 16, 245, width * 0.05 + offsetX + 16, 385);

    gfx.fillRect(width * 0.36 + offsetX * 1.1, 285, 130, 22);
    gfx.fillRect(width * 0.39 + offsetX * 1.1, 307, 18, 75);
    gfx.fillRect(width * 0.45 + offsetX * 1.1, 307, 18, 75);

    gfx.fillRect(width * 0.89 + offsetX * 0.9, 215, 34, 195);
    gfx.fillRect(width * 0.87 + offsetX * 0.9, 205, 50, 14);
  },

  update: function(player, dt) {
    if (!player) return;
    var width = this.scene.scale.width;
    var height = this.scene.scale.height;

    for (var i = 0; i < this.clouds.length; i++) {
      this.clouds[i].x += this.clouds[i].driftSpeed;
      if (this.clouds[i].x > width + 80) {
        this.clouds[i].x = -80;
      }
    }

    var pRatio = (player.x - width / 2) / width;
    if (this.distantIslandsGfx) this.drawDistantIslands(this.distantIslandsGfx, width, height, -pRatio * 22);
    if (this.midRuinsGfx) this.drawMidRuins(this.midRuinsGfx, width, height, -pRatio * 52);
  }
};

// ─── Authentic Mechanics Engines ──────────────────────────────
var MirrorEngine = {
  active: false,
  scene: null,
  mirrorY: 460,
  reflectionSprite: null,
  mirrorLineGfx: null,
  phantomPlats: [],

  init: function(scene, mirrorY) {
    this.active = true;
    this.scene = scene;
    this.mirrorY = mirrorY || 460;
    this.phantomPlats = [];

    this.mirrorLineGfx = scene.add.graphics().setDepth(6);
    this.mirrorLineGfx.lineStyle(2.5, 0x00d2d3, 0.85);
    this.mirrorLineGfx.lineBetween(0, this.mirrorY, scene.scale.width, this.mirrorY);
    this.mirrorLineGfx.lineStyle(1, 0xffffff, 0.95);
    this.mirrorLineGfx.lineBetween(0, this.mirrorY, scene.scale.width, this.mirrorY);

    this.reflectionSprite = scene.add.sprite(scene.spawnX, this.mirrorY + 30, "hero_idle_1");
    this.reflectionSprite.setDepth(7);
    this.reflectionSprite.setAlpha(0.55);
    this.reflectionSprite.setTint(0x00d2d3);
    this.reflectionSprite.setFlipY(true);
  },

  addPhantomPlatform: function(scene, x, y, w, h, isReal) {
    var p = scene.add.tileSprite(x + w/2, y + h/2, w, h, isReal ? "mirror_plat_tex" : "phantom_plat_tex");
    p.setDepth(10);
    p.isPhantom = true;
    p.isReal = isReal;

    if (isReal) {
      scene.platforms.add(p);
    } else {
      p.stepped = false;
      this.phantomPlats.push(p);
    }

    var refY = this.mirrorY + (this.mirrorY - y);
    var refIndicator = scene.add.tileSprite(x + w/2, refY - h/2, w, h, "mirror_plat_tex");
    if (refIndicator) {
      if (refIndicator.setDepth) refIndicator.setDepth(7);
      if (refIndicator.setAlpha) refIndicator.setAlpha(0.45);
      if (refIndicator.setFlipY) refIndicator.setFlipY(true);
      if (refIndicator.setTint) refIndicator.setTint(isReal ? 0x2ed573 : 0xff4757);
    }

    return p;
  },

  update: function(player, dt) {
    if (!this.active || !this.reflectionSprite || !player) return;

    this.reflectionSprite.x = player.x;
    var distY = player.y - this.mirrorY;
    this.reflectionSprite.y = this.mirrorY - distY;
    this.reflectionSprite.setFlipX(player.flipX);

    if (player.anims && player.anims.currentAnim) {
      this.reflectionSprite.anims.play(player.anims.currentAnim.key, true);
    }

    for (var i = 0; i < this.phantomPlats.length; i++) {
      var ph = this.phantomPlats[i];
      if (!ph.stepped && Math.abs(player.x - ph.x) < ph.width / 2 && Math.abs(player.y - ph.y) < 26) {
        ph.stepped = true;
        AudioEngine.sfxGlassShatter();
        this.scene.showTrollToast("DECEPTIVE MIRROR: That was a phantom illusion!");
        this.scene.tweens.add({
          targets: ph,
          alpha: 0,
          scaleY: 0.1,
          duration: 250,
          onComplete: function() { ph.destroy(); }
        });
      }
    }
  }
};

var ChronoEngine = {
  timeZones: [],

  init: function(scene) {
    this.timeZones = [];
  },

  addZone: function(scene, x, y, type, radius) {
    if (!radius) radius = 85;
    var texKey = (type === "slow") ? "time_zone_slow" : "time_zone_fast";
    var sprite = scene.add.sprite(x, y, texKey).setDepth(8);
    sprite.setDisplaySize(radius * 2, radius * 2);
    sprite.setAlpha(0.85);

    scene.tweens.add({
      targets: sprite,
      angle: 360,
      duration: (type === "slow") ? 14000 : 3200,
      repeat: -1
    });

    scene.tweens.add({
      targets: sprite,
      scaleX: 1.07,
      scaleY: 1.07,
      duration: 750,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    var tz = { x: x, y: y, radius: radius, type: type, sprite: sprite };
    this.timeZones.push(tz);
    return tz;
  },

  update: function(scene, player, dt) {
    if (!player || scene.isDead || scene.isComplete) return;

    var inSlow = false;
    var inFast = false;

    for (var i = 0; i < this.timeZones.length; i++) {
      var tz = this.timeZones[i];
      var d = Phaser.Math.Distance.Between(player.x, player.y, tz.x, tz.y);
      if (d < tz.radius) {
        if (tz.type === "slow") inSlow = true;
        if (tz.type === "fast") inFast = true;
      }

      if (scene.platforms) {
        scene.platforms.getChildren().forEach(function(p) {
          if (p.isMovingPlatform) {
            var pd = Phaser.Math.Distance.Between(p.x, p.y, tz.x, tz.y);
            if (pd < tz.radius) {
              if (p.moveTween) p.moveTween.timeScale = (tz.type === "slow") ? 0.35 : 1.8;
            }
          }
        });
      }

      if (scene.crushers) {
        scene.crushers.getChildren().forEach(function(c) {
          var cd = Phaser.Math.Distance.Between(c.x, c.y, tz.x, tz.y);
          if (cd < tz.radius) {
            c.chronoScale = (tz.type === "slow") ? 0.35 : 1.8;
          } else {
            c.chronoScale = 1.0;
          }
        });
      }
    }

    if (inSlow) {
      player.body.gravity.y = 520;
      if (Math.abs(player.body.velocity.x) > 115) {
        player.body.velocity.x *= 0.62;
      }
      if (player.body.velocity.y < -310) {
        player.body.velocity.y = -310;
      }
    } else if (inFast) {
      player.body.gravity.y = 2100;
      if (Math.abs(player.body.velocity.x) > 10) {
        player.body.velocity.x *= 1.42;
      }
    } else {
      player.body.gravity.y = 1400;
    }
  }
};

var EchoEngine = {
  active: false,
  scene: null,
  echoGhost: null,
  recordBuffer: [],
  echoDelaySec: 2.0,

  init: function(scene) {
    this.active = true;
    this.scene = scene;
    this.recordBuffer = [];
    this.echoGhost = scene.physics.add.sprite(scene.spawnX, scene.spawnY, "echo_hero_ghost");
    this.echoGhost.setDepth(90);
    this.echoGhost.setAlpha(0);
    this.echoGhost.body.setAllowGravity(false);
    this.echoGhost.body.setSize(22, 34);
  },

  update: function(scene, player, dt) {
    if (!this.active || !this.echoGhost || !player || scene.isDead) return;

    this.recordBuffer.push({
      x: player.x,
      y: player.y,
      time: scene.levelTime,
      flipX: player.flipX,
      animKey: (player.anims && player.anims.currentAnim) ? player.anims.currentAnim.key : "hero_anim_idle"
    });

    var targetTime = scene.levelTime - this.echoDelaySec;
    if (targetTime > 0) {
      this.echoGhost.setAlpha(0.7);

      for (var i = 0; i < this.recordBuffer.length; i++) {
        if (this.recordBuffer[i].time >= targetTime) {
          var f = this.recordBuffer[i];
          this.echoGhost.x = f.x;
          this.echoGhost.y = f.y;
          if (this.echoGhost.setFlipX) this.echoGhost.setFlipX(f.flipX);
          break;
        }
      }

      var self = this;
      if (scene.switches) {
        scene.switches.forEach(function(sw) {
          var ed = Phaser.Math.Distance.Between(self.echoGhost.x, self.echoGhost.y, sw.x, sw.y);
          if (ed < 24) {
            scene.activateSwitch(sw, true);
          }
        });
      }

      if (scene.pressurePlates) {
        scene.pressurePlates.forEach(function(pp) {
          var pd = Phaser.Math.Distance.Between(self.echoGhost.x, self.echoGhost.y, pp.x, pp.y);
          pp.isPressedByEcho = (pd < 24);
        });
      }
    }

    while (this.recordBuffer.length > 0 && this.recordBuffer[0].time < scene.levelTime - 4.5) {
      this.recordBuffer.shift();
    }
  }
};

var MagnetEngine = {
  nodes: [],
  crates: [],

  init: function(scene) {
    this.nodes = [];
    this.crates = [];
  },

  addNode: function(scene, x, y, type, strength) {
    if (!strength) strength = 280;
    var node = scene.add.sprite(x, y, "magnet_node").setDepth(12);
    node.magnetType = type;
    node.strength = strength;

    var ringGfx = scene.add.graphics().setDepth(11);
    var ringColor = (type === "attract") ? 0x0984e3 : 0xd63031;
    ringGfx.lineStyle(2, ringColor, 0.7);
    ringGfx.strokeCircle(x, y, 75);

    scene.tweens.add({
      targets: ringGfx,
      scaleX: 1.14,
      scaleY: 1.14,
      alpha: 0.25,
      duration: 850,
      yoyo: true,
      repeat: -1
    });

    node.ringGfx = ringGfx;
    this.nodes.push(node);
    return node;
  },

  addCrate: function(scene, x, y) {
    var crate = scene.physics.add.sprite(x, y, "metal_crate_tex");
    crate.setDepth(15);
    crate.body.setGravityY(1200);
    crate.body.setBounce(0.12);
    crate.body.setFriction(0.85);
    crate.body.setCollideWorldBounds(true);
    scene.physics.add.collider(crate, scene.platforms);
    scene.physics.add.collider(scene.player, crate);
    this.crates.push(crate);
    return crate;
  },

  togglePolarity: function() {
    this.nodes.forEach(function(node) {
      node.magnetType = (node.magnetType === "attract") ? "repel" : "attract";
      if (node.ringGfx) {
        node.ringGfx.clear();
        var ringColor = (node.magnetType === "attract") ? 0x0984e3 : 0xd63031;
        node.ringGfx.lineStyle(2, ringColor, 0.7);
        node.ringGfx.strokeCircle(node.x, node.y, 75);
      }
    });
  },

  update: function(scene, player, dt) {
    if (!player || scene.isDead) return;

    for (var m = 0; m < this.nodes.length; m++) {
      var node = this.nodes[m];
      var dist = Phaser.Math.Distance.Between(player.x, player.y, node.x, node.y);
      if (dist < 170 && dist > 10) {
        var force = (node.strength / dist) * 14.5;
        var angle = Phaser.Math.Angle.Between(player.x, player.y, node.x, node.y);
        if (node.magnetType === "repel") angle += Math.PI;

        player.body.velocity.x += Math.cos(angle) * force;
        player.body.velocity.y += Math.sin(angle) * force * 0.72;
      }

      for (var c = 0; c < this.crates.length; c++) {
        var crate = this.crates[c];
        var cDist = Phaser.Math.Distance.Between(crate.x, crate.y, node.x, node.y);
        if (cDist < 190 && cDist > 12) {
          var cForce = (node.strength / cDist) * 16.5;
          var cAngle = Phaser.Math.Angle.Between(crate.x, crate.y, node.x, node.y);
          if (node.magnetType === "repel") cAngle += Math.PI;
          crate.body.velocity.x += Math.cos(cAngle) * cForce;
          crate.body.velocity.y += Math.sin(cAngle) * cForce * 0.72;
        }
      }
    }
  }
};

var ShiftEngine = {
  rotateAssembly: function(scene, platforms, targetAngle, duration) {
    if (!duration) duration = 1200;
    scene.cameras.main.shake(duration * 0.8, 0.015);
    AudioEngine.playTone(90, "sawtooth", duration / 1000, 0.35);

    platforms.forEach(function(p) {
      scene.tweens.add({
        targets: p,
        angle: targetAngle,
        duration: duration,
        ease: "Cubic.easeInOut"
      });
    });
  }
};

// ─── Level 45 Reveal & World 3 Teaser ─────────────────────────
var World2Cinematics = {
  triggerLevel45Sequence: function(scene) {
    var self = this;
    scene.isComplete = true;
    scene.player.setVelocity(0, 0);
    if (scene.player.body) scene.player.body.setEnable(false);

    AudioEngine.stopMusic();
    AudioEngine.playTone(90, "sawtooth", 0.4, 0.35);

    var flash = scene.add.rectangle(scene.scale.width/2, scene.scale.height/2, scene.scale.width, scene.scale.height, 0xffffff, 1).setDepth(999);
    scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 650,
      onComplete: function() { flash.destroy(); }
    });

    scene.showTrollToast("⚠ CRITICAL ERROR: REALITY MEMBRANE FRACTURING");

    scene.cameras.main.zoomTo(0.6, 1800, "Cubic.easeInOut");
    scene.cameras.main.shake(1400, 0.03);

    scene.platforms.getChildren().forEach(function(p) {
      scene.tweens.add({
        targets: p,
        y: p.y + 360 + Math.random() * 220,
        angle: (Math.random() - 0.5) * 50,
        alpha: 0,
        duration: 1400,
        delay: Math.random() * 450
      });
    });

    scene.time.delayedCall(1800, function() {
      var mono = scene.add.sprite(scene.scale.width/2, scene.scale.height/2, "monolith_tex").setDepth(200).setScale(0.1);
      AudioEngine.playTone(180, "sine", 1.2, 0.4);
      AudioEngine.playTone(240, "triangle", 1.5, 0.3, 0.2);

      scene.tweens.add({
        targets: mono,
        scaleX: 2.2,
        scaleY: 2.2,
        duration: 1300,
        ease: "Back.easeOut"
      });

      scene.add.particles(scene.scale.width/2, scene.scale.height/2, "part_dot", {
        speed: { min: 50, max: 200 },
        scale: { start: 1.6, end: 0 },
        lifespan: 1300,
        tint: [0xa55eea, 0x45aaf2, 0xffffff, 0xd980fa],
        frequency: 50
      }).setDepth(201);

      scene.time.delayedCall(2200, function() {
        self.launchWorld3Teaser(scene);
      });
    });
  },

  launchWorld3Teaser: function(scene) {
    var width = scene.scale.width;
    var height = scene.scale.height;

    var overlay = scene.add.container(0, 0).setDepth(9999);
    var bg = scene.add.rectangle(width/2, height/2, width, height, 0x020106, 1);
    overlay.add(bg);

    AudioEngine.playTone(60, "sawtooth", 3.5, 0.4);
    AudioEngine.playTone(120, "sine", 4.5, 0.3, 0.4);

    var monoCenter = scene.add.sprite(width/2, height/2 - 25, "monolith_tex").setScale(2.5);
    overlay.add(monoCenter);

    scene.tweens.add({
      targets: monoCenter,
      y: height/2 - 45,
      scaleX: 2.8,
      scaleY: 2.8,
      duration: 3200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    var t1 = scene.add.text(width/2, height/2 + 85, "OOPS! — WORLD 3", {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "19px",
      color: "#a55eea",
      stroke: "#000000",
      strokeThickness: 6
    }).setOrigin(0.5).setAlpha(0);

    var t2 = scene.add.text(width/2, height/2 + 125, "YOU'RE NOT READY.", {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "12px",
      color: "#ffffff"
    }).setOrigin(0.5).setAlpha(0);

    var t3 = scene.add.text(width/2, height/2 + 160, "🔒 COMING SOON", {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "10px",
      color: "#ffd32a"
    }).setOrigin(0.5).setAlpha(0);

    var tProgress = scene.add.text(width/2, height/2 + 200, "CHAPTER PROGRESS: 45 / 50 LEVELS", {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "8.5px",
      color: "#2ed573"
    }).setOrigin(0.5).setAlpha(0);

    overlay.add([t1, t2, t3, tProgress]);

    scene.tweens.add({ targets: t1, alpha: 1, duration: 900, delay: 800 });
    scene.tweens.add({ targets: t2, alpha: 1, duration: 900, delay: 2000 });
    scene.tweens.add({ targets: t3, alpha: 1, duration: 900, delay: 3200 });
    scene.tweens.add({ targets: tProgress, alpha: 1, duration: 800, delay: 4400 });

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

    scene.tweens.add({ targets: contBtn, alpha: 1, duration: 800, delay: 5200 });

    cZone.on("pointerdown", function() {
      SaveManager.saveLevelClear(1, 44, scene.deaths);
      scene.scene.restart({
        world: 1,
        level: 45,
        deaths: scene.deaths,
        levelDeaths: 0
      });
    });
  }
};

// ─── Main World 2 Engine ──────────────────────────────────────
var World2Engine = {
  active: false,
  scene: null,
  levelIdx: 0,
  biome: null,

  init: function(scene, levelIdx) {
    this.active = true;
    this.scene = scene;
    this.levelIdx = levelIdx;
    this.biome = getBiomeForLevel(levelIdx);

    World2Assets.create(scene);
    World2ThemeManager.init(scene, levelIdx);

    MirrorEngine.active = false;
    ChronoEngine.init(scene);
    EchoEngine.active = false;
    MagnetEngine.init(scene);

    scene.switches = [];
    scene.pressurePlates = [];
    scene.energyGates = [];
    scene.customUpdateHandlers = [];
  },

  update: function(scene, dt) {
    if (!this.active || scene.isDead || scene.isComplete) return;

    var player = scene.player;
    if (!player) return;

    World2ThemeManager.update(player, dt);

    if (MirrorEngine.active) {
      MirrorEngine.update(player, dt);
    }

    ChronoEngine.update(scene, player, dt);

    if (EchoEngine.active) {
      EchoEngine.update(scene, player, dt);
    }

    MagnetEngine.update(scene, player, dt);

    if (scene.pressurePlates) {
      scene.pressurePlates.forEach(function(pp) {
        var pDist = Phaser.Math.Distance.Between(player.x, player.y, pp.x, pp.y);
        var isPlayerOn = (pDist < 24);
        var isPressed = isPlayerOn || pp.isPressedByEcho;

        if (isPressed !== pp.wasPressed) {
          pp.wasPressed = isPressed;
          pp.setTexture(isPressed ? "switch_on_tex" : "switch_off_tex");
          if (isPressed) AudioEngine.sfxBounce();

          if (scene.energyGates) {
            scene.energyGates.forEach(function(g) {
              if (g.gateId === pp.targetGateId) {
                g.isOpen = isPressed;
                g.setAlpha(isPressed ? 0.15 : 0.85);
                if (g.body) g.body.enable = !isPressed;
              }
            });
          }
        }
      });
    }

    if (scene.switches) {
      scene.switches.forEach(function(sw) {
        if (!sw.isPressed) {
          var dist = Phaser.Math.Distance.Between(player.x, player.y, sw.x, sw.y);
          if (dist < 24) {
            scene.activateSwitch(sw, false);
          }
        }
      });
    }

    if (this.levelIdx >= 40 && this.levelIdx <= 43) {
      if (Math.random() < 0.05) {
        scene.cameras.main.scrollX = (Math.random() - 0.5) * 5;
        scene.cameras.main.scrollY = (Math.random() - 0.5) * 5;
      } else {
        scene.cameras.main.scrollX = 0;
        scene.cameras.main.scrollY = 0;
      }
    }

    scene.customUpdateHandlers.forEach(function(fn) { fn(scene, dt); });
  },

  triggerLevel45Sequence: function(scene) {
    World2Cinematics.triggerLevel45Sequence(scene);
  },

  // ─── 50 HANDCRAFTED INDIVIDUAL LEVEL DEFINITIONS ─────────────
  buildLevel: function(scene, lvl) {
    var self = this;
    var width = scene.scale.width;
    var height = scene.scale.height;

    var addPlat = function(x, y, w, h) {
      if (y < 420) {
        scene.add.rectangle(x + w/2, y + h + 3, w - 2, 6, 0x000000, 0.28).setDepth(2);
      }
      var p = scene.add.tileSprite(x + w/2, y + h/2, w, h, "plat_w2_tex");
      p.setDepth(10);
      scene.platforms.add(p);
      return p;
    };

    var addMovingPlat = function(x, y, w, h, targetX, targetY, duration) {
      var p = addPlat(x, y, w, h);
      p.isMovingPlatform = true;
      p.moveTween = scene.tweens.add({
        targets: p,
        x: targetX + w/2,
        y: targetY + h/2,
        duration: duration || 1800,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });
      return p;
    };

    var addCrusher = function(x, startY) {
      var c = scene.crushers.create(x, startY, "crusher_tex");
      c.startY = startY;
      c.isDropping = false;
      c.isRetracting = false;
      c.chronoScale = 1.0;
      c.body.setImmovable(true);
      c.body.setSize(52, 60);
      c.setDepth(20);
      return c;
    };

    var addSwitch = function(x, y, gateId) {
      var sw = scene.physics.add.sprite(x, y, "switch_off_tex");
      sw.setDepth(14);
      sw.switchId = gateId;
      sw.isPressed = false;
      sw.body.setAllowGravity(false);
      sw.body.setImmovable(true);
      sw.body.setSize(28, 12);
      scene.switches.push(sw);
      return sw;
    };

    var addPressurePlate = function(x, y, targetGateId) {
      var pp = scene.physics.add.sprite(x, y, "switch_off_tex");
      pp.setDepth(14);
      pp.targetGateId = targetGateId;
      pp.wasPressed = false;
      pp.isPressedByEcho = false;
      pp.body.setAllowGravity(false);
      pp.body.setImmovable(true);
      pp.body.setSize(28, 12);
      scene.pressurePlates.push(pp);
      return pp;
    };

    var addEnergyGate = function(x, y, gateId) {
      var gate = scene.physics.add.sprite(x, y, "energy_barrier_tex");
      gate.setDepth(16);
      gate.gateId = gateId;
      gate.isOpen = false;
      gate.body.setAllowGravity(false);
      gate.body.setImmovable(true);
      scene.physics.add.collider(scene.player, gate, null, function(pl, g) {
        return !g.isOpen;
      }, scene);
      scene.energyGates.push(gate);
      return gate;
    };

    scene.activateSwitch = function(sw, byEcho) {
      if (sw.isPressed) return;
      sw.isPressed = true;
      sw.setTexture("switch_on_tex");
      AudioEngine.sfxBounce();
      scene.showTrollToast(byEcho ? "👤 ECHO ACTIVATED SWITCH!" : "⚡ SWITCH ACTIVATED!");

      scene.energyGates.forEach(function(g) {
        if (g.gateId === sw.switchId) {
          g.isOpen = true;
          scene.tweens.add({
            targets: g,
            alpha: 0,
            scaleY: 0.08,
            duration: 350,
            onComplete: function() {
              if (g.body) g.body.enable = false;
            }
          });
        }
      });
    };

    scene.spawnX = 60;
    scene.spawnY = 410;

    // =========================================================================
    //  CHAPTER 1: THE SHIFT (Levels 1 - 10: Mirror World)
    //  Biome: Floating Garden / Sky Ruins
    // =========================================================================
    if (lvl === 0) { // Level 1: Reflections (Pure Mirror Intro)
      addPlat(-80, 460, width + 160, 80);
      MirrorEngine.init(scene, 460);
      scene.exitGate = scene.createExitDoor(880, 435);
      scene.showTrollToast("WORLD 2: THE SHIFT\nLook closely at your reflection... 🪞");
    }
    else if (lvl === 1) { // Level 2: The Looking Glass (Reflection Clues)
      addPlat(-80, 460, 260, 80);
      MirrorEngine.init(scene, 460);
      MirrorEngine.addPhantomPlatform(scene, 280, 430, 90, 26, true);
      MirrorEngine.addPhantomPlatform(scene, 420, 400, 90, 26, true);
      MirrorEngine.addPhantomPlatform(scene, 560, 430, 90, 26, true);
      addPlat(680, 460, 360, 80);
      scene.exitGate = scene.createExitDoor(900, 435);
      scene.showTrollToast("Check the mirror: Green reflections are solid! 🌿");
    }
    else if (lvl === 2) { // Level 3: Phantom Leap (First Deceptive Fake Mirror)
      addPlat(-80, 460, 240, 80);
      MirrorEngine.init(scene, 460);
      MirrorEngine.addPhantomPlatform(scene, 270, 440, 90, 26, true);
      MirrorEngine.addPhantomPlatform(scene, 400, 410, 90, 26, false);
      MirrorEngine.addPhantomPlatform(scene, 400, 470, 90, 26, true);
      MirrorEngine.addPhantomPlatform(scene, 540, 430, 90, 26, true);
      addPlat(660, 460, 380, 80);
      scene.exitGate = scene.createExitDoor(900, 435);
      scene.showTrollToast("Red reflections in the mirror are illusions! 🪞");
    }
    else if (lvl === 3) { // Level 4: Deceptive Horizon (Fleeing Mirror Door)
      addPlat(-80, 460, 320, 80);
      MirrorEngine.init(scene, 460);
      addPlat(420, 430, 140, 26);
      addPlat(640, 460, 400, 80);
      scene.exitGate = scene.createExitDoor(720, 435);
      scene.exitGate.fleeOnProximity = true;
      scene.exitGate.targetX = 880;
      scene.exitGate.targetY = 365;
      scene.exitGate.fleeMessage = "Oops! Reflected upward! 🪞";
      MirrorEngine.addPhantomPlatform(scene, 820, 395, 120, 26, true);
    }
    else if (lvl === 4) { // Level 5: Moving Mirror Steps
      addPlat(-80, 460, 220, 80);
      MirrorEngine.init(scene, 460);
      var mp1 = addMovingPlat(260, 440, 100, 26, 380, 440, 1600);
      var mp2 = addMovingPlat(480, 390, 100, 26, 600, 390, 1600);
      addPlat(720, 460, 320, 80);
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 5) { // Level 6: The Reverse Horizon (Inverted Mirror Perspective)
      addPlat(-80, 460, 280, 80);
      MirrorEngine.init(scene, 460);
      MirrorEngine.addPhantomPlatform(scene, 320, 420, 100, 26, true);
      MirrorEngine.addPhantomPlatform(scene, 460, 380, 100, 26, true);
      MirrorEngine.addPhantomPlatform(scene, 600, 420, 100, 26, true);
      addPlat(740, 460, 300, 80);
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 6) { // Level 7: Shattered Crystal Steps
      addPlat(-80, 460, 240, 80);
      MirrorEngine.init(scene, 460);
      MirrorEngine.addPhantomPlatform(scene, 280, 450, 80, 26, true);
      MirrorEngine.addPhantomPlatform(scene, 400, 420, 80, 26, false);
      MirrorEngine.addPhantomPlatform(scene, 400, 470, 80, 26, true);
      MirrorEngine.addPhantomPlatform(scene, 520, 430, 80, 26, true);
      addPlat(660, 460, 380, 80);
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 7) { // Level 8: Mirrored Route Selection
      addPlat(-80, 460, 260, 80);
      MirrorEngine.init(scene, 460);
      MirrorEngine.addPhantomPlatform(scene, 300, 350, 90, 26, true);
      MirrorEngine.addPhantomPlatform(scene, 440, 330, 90, 26, true);
      MirrorEngine.addPhantomPlatform(scene, 300, 450, 90, 26, false);
      MirrorEngine.addPhantomPlatform(scene, 440, 450, 90, 26, true);
      addPlat(600, 460, 440, 80);
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 8) { // Level 9: The Twin Mirage
      addPlat(-80, 460, 280, 80);
      MirrorEngine.init(scene, 460);
      addMovingPlat(320, 420, 90, 26, 460, 420, 1500);
      MirrorEngine.addPhantomPlatform(scene, 540, 390, 90, 26, true);
      addPlat(680, 460, 360, 80);
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 9) { // Level 10: 💀 BRUTAL CHALLENGE #1 — The Grand Prism
      addPlat(-80, 460, 180, 80);
      MirrorEngine.init(scene, 460);
      MirrorEngine.addPhantomPlatform(scene, 220, 430, 75, 26, true);
      MirrorEngine.addPhantomPlatform(scene, 330, 390, 75, 26, false);
      MirrorEngine.addPhantomPlatform(scene, 330, 460, 75, 26, true);
      addMovingPlat(440, 380, 80, 26, 540, 380, 1200);
      MirrorEngine.addPhantomPlatform(scene, 620, 340, 80, 26, true);
      addPlat(740, 460, 300, 80);
      scene.exitGate = scene.createExitDoor(880, 435);
      scene.showTrollToast("💀 BRUTAL CHALLENGE #1: THE GRAND PRISM\nTrust only the verified mirror reflections!");
    }

    // =========================================================================
    //  CHAPTER 2: DISTORTION (Levels 11 - 20: Time Zones & Moving World)
    //  Biome: Distorted Valley
    // =========================================================================
    else if (lvl === 10) { // Level 11: Slow Motion (First Slow Zone)
      addPlat(-80, 460, 300, 80);
      ChronoEngine.addZone(scene, 450, 390, "slow", 100);
      var slowPlat = addMovingPlat(360, 420, 120, 26, 520, 420, 2400);
      addPlat(660, 460, 380, 80);
      scene.exitGate = scene.createExitDoor(900, 435);
      scene.showTrollToast("DISTORTED VALLEY: SLOW ZONE ⏳\nObjects inside move at 0.35x speed!");
    }
    else if (lvl === 11) { // Level 12: Hyper Velocity (First Fast Zone)
      addPlat(-80, 460, 260, 80);
      ChronoEngine.addZone(scene, 440, 430, "fast", 95);
      addPlat(640, 460, 400, 80);
      scene.exitGate = scene.createExitDoor(900, 435);
      scene.showTrollToast("HYPER VELOCITY: FAST ZONE ⚡\nSprint into the field for a boosted leap!");
    }
    else if (lvl === 12) { // Level 13: Chrono Shift (Alternating Slow & Fast)
      addPlat(-80, 460, 240, 80);
      ChronoEngine.addZone(scene, 320, 410, "slow", 80);
      addPlat(280, 430, 90, 26);
      ChronoEngine.addZone(scene, 520, 370, "fast", 80);
      addPlat(480, 380, 90, 26);
      addPlat(680, 460, 360, 80);
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 13) { // Level 14: The Clockwork Spire (Vertical Lift)
      addPlat(-80, 460, 220, 80);
      var lift14 = addPlat(320, 420, 110, 28);
      lift14.isMovingPlatform = true;
      lift14.moveTween = scene.tweens.add({ targets: lift14, y: 220, duration: 2000, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      ChronoEngine.addZone(scene, 380, 320, "slow", 90);
      addPlat(580, 300, 460, 80);
      scene.exitGate = scene.createExitDoor(880, 275);
    }
    else if (lvl === 14) { // Level 15: Rotating Bridges (Oscillating Spire)
      addPlat(-80, 460, 240, 80);
      var b15 = addMovingPlat(360, 400, 120, 26, 520, 400, 1600);
      ChronoEngine.addZone(scene, 440, 400, "slow", 85);
      addPlat(680, 460, 360, 80);
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 15) { // Level 16: Mirror of Time (Mirror + Time Combination)
      addPlat(-80, 460, 280, 80);
      MirrorEngine.init(scene, 460);
      ChronoEngine.addZone(scene, 450, 400, "slow", 85);
      MirrorEngine.addPhantomPlatform(scene, 380, 420, 100, 26, true);
      addPlat(620, 460, 420, 80);
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 16) { // Level 17: Desynchronized (Fast vs Slow Timing)
      addPlat(-80, 460, 220, 80);
      ChronoEngine.addZone(scene, 320, 430, "fast", 75);
      addPlat(280, 430, 85, 26);
      ChronoEngine.addZone(scene, 510, 390, "slow", 75);
      addPlat(470, 400, 85, 26);
      addPlat(660, 460, 380, 80);
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 17) { // Level 18: Temporal Hazard Dash
      addPlat(-80, 460, 260, 80);
      ChronoEngine.addZone(scene, 380, 390, "slow", 80);
      addMovingPlat(340, 420, 100, 26, 440, 420, 1800);
      ChronoEngine.addZone(scene, 580, 390, "fast", 80);
      addPlat(680, 460, 360, 80);
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 18) { // Level 19: The Shifting Room (Geometry Displacement)
      addPlat(-80, 460, 240, 80);
      var roomBlock = addPlat(360, 420, 140, 28);
      scene.tweens.add({ targets: roomBlock, x: 460, duration: 1600, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      ChronoEngine.addZone(scene, 420, 420, "slow", 85);
      addPlat(680, 460, 360, 80);
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 19) { // Level 20: 💀 BRUTAL CHALLENGE #2 — Chrono-Collapse
      addPlat(-80, 460, 180, 80);
      MirrorEngine.init(scene, 460);
      ChronoEngine.addZone(scene, 270, 410, "fast", 75);
      MirrorEngine.addPhantomPlatform(scene, 230, 430, 80, 26, true);
      ChronoEngine.addZone(scene, 460, 360, "slow", 80);
      var m20 = addMovingPlat(380, 390, 90, 26, 480, 390, 2000);
      MirrorEngine.addPhantomPlatform(scene, 580, 340, 80, 26, true);
      addPlat(720, 460, 320, 80);
      scene.exitGate = scene.createExitDoor(880, 435);
      scene.showTrollToast("💀 BRUTAL CHALLENGE #2: CHRONO-COLLAPSE\nAlternate between fast acceleration and slow precision!");
    }

    // =========================================================================
    //  CHAPTER 3: ECHO (Levels 21 - 30: Shadow / Echo Player)
    //  Biome: Echo Forest
    // =========================================================================
    else if (lvl === 20) { // Level 21: Past Self (Echo Tutorial)
      addPlat(-80, 460, width + 160, 80);
      EchoEngine.init(scene);
      addSwitch(300, 452, "gate_21");
      addEnergyGate(580, 410, "gate_21");
      scene.exitGate = scene.createExitDoor(880, 435);
      scene.showTrollToast("ECHO FOREST: Step on the switch, then move ahead...\nYour past self will trigger it 2.0s later! 👤");
    }
    else if (lvl === 21) { // Level 22: Pressure Hold (Hold to Open)
      addPlat(-80, 460, 280, 80);
      EchoEngine.init(scene);
      addPressurePlate(180, 452, "gate_22");
      addEnergyGate(380, 410, "gate_22");
      addPlat(420, 460, 620, 80);
      scene.exitGate = scene.createExitDoor(900, 435);
      scene.showTrollToast("Stand on the pressure plate for 3s, then run!\nEcho will hold it down for you!");
    }
    else if (lvl === 22) { // Level 23: The Relay (Two Sequential Gates)
      addPlat(-80, 460, 240, 80);
      EchoEngine.init(scene);
      addSwitch(140, 452, "gate_23a");
      addEnergyGate(340, 410, "gate_23a");
      addPlat(380, 460, 180, 80);
      addSwitch(460, 452, "gate_23b");
      addEnergyGate(620, 410, "gate_23b");
      addPlat(660, 460, 380, 80);
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 23) { // Level 24: Echo Bait (Trigger Hazard Reset Window)
      addPlat(-80, 460, width + 160, 80);
      EchoEngine.init(scene);
      var c24 = addCrusher(460, 60);
      addSwitch(260, 452, "gate_24");
      addEnergyGate(660, 410, "gate_24");
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 24) { // Level 25: Ghost Leap (Pressure Bridge)
      addPlat(-80, 460, 260, 80);
      EchoEngine.init(scene);
      addPressurePlate(180, 452, "gate_25");
      addEnergyGate(440, 410, "gate_25");
      addPlat(480, 460, 560, 80);
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 25) { // Level 26: Mirror & Echo (Reflection Pressure)
      addPlat(-80, 460, width + 160, 80);
      MirrorEngine.init(scene, 460);
      EchoEngine.init(scene);
      addSwitch(340, 452, "gate_26");
      addEnergyGate(640, 410, "gate_26");
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 26) { // Level 27: Echo in Time (Echo in Slow Zone)
      addPlat(-80, 460, width + 160, 80);
      EchoEngine.init(scene);
      ChronoEngine.addZone(scene, 280, 430, "slow", 85);
      addSwitch(280, 452, "gate_27");
      addEnergyGate(620, 410, "gate_27");
      scene.exitGate = scene.createExitDoor(900, 435);
      scene.showTrollToast("Echo in a Slow Zone activates switches longer!");
    }
    else if (lvl === 27) { // Level 28: The Triad Path (3 Gates)
      addPlat(-80, 460, 220, 80);
      EchoEngine.init(scene);
      addSwitch(120, 452, "gate_28a");
      addEnergyGate(300, 410, "gate_28a");
      addPlat(340, 460, 140, 80);
      addSwitch(380, 452, "gate_28b");
      addEnergyGate(520, 410, "gate_28b");
      addPlat(560, 460, 140, 80);
      addSwitch(600, 452, "gate_28c");
      addEnergyGate(740, 410, "gate_28c");
      addPlat(780, 460, 260, 80);
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 28) { // Level 29: Phantom Coordination
      addPlat(-80, 460, 240, 80);
      EchoEngine.init(scene);
      MirrorEngine.init(scene, 460);
      MirrorEngine.addPhantomPlatform(scene, 280, 430, 90, 26, true);
      addPressurePlate(310, 422, "gate_29");
      addEnergyGate(520, 410, "gate_29");
      addPlat(560, 460, 480, 80);
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 29) { // Level 30: 💀 BRUTAL CHALLENGE #3 — Paradox Engine
      addPlat(-80, 460, 200, 80);
      MirrorEngine.init(scene, 460);
      EchoEngine.init(scene);
      ChronoEngine.addZone(scene, 260, 410, "slow", 75);
      addPressurePlate(140, 452, "gate_30a");
      addEnergyGate(360, 410, "gate_30a");
      MirrorEngine.addPhantomPlatform(scene, 400, 420, 85, 26, true);
      addSwitch(430, 412, "gate_30b");
      addEnergyGate(620, 410, "gate_30b");
      addPlat(660, 460, 380, 80);
      scene.exitGate = scene.createExitDoor(890, 435);
      scene.showTrollToast("💀 BRUTAL CHALLENGE #3: PARADOX ENGINE\nSingle-player co-op synchronized with your past self!");
    }

    // =========================================================================
    //  CHAPTER 4: COLLAPSE (Levels 31 - 40: Magnetic Mechanics & Multi-Switches)
    //  Biome: Broken Ruins
    // =========================================================================
    else if (lvl === 30) { // Level 31: Polarity (First Magnet Repulsion)
      addPlat(-80, 460, 300, 80);
      MagnetEngine.addNode(scene, 260, 390, "repel", 300);
      addPlat(480, 340, 180, 36);
      addPlat(720, 460, 320, 80);
      scene.exitGate = scene.createExitDoor(900, 435);
      scene.showTrollToast("BROKEN RUINS: Magnetic Repulsion Field 🧲\nRed node repels; ride the flux upward!");
    }
    else if (lvl === 31) { // Level 32: Magnetic Rail (Moveable Metal Crate)
      addPlat(-80, 460, 260, 80);
      MagnetEngine.addNode(scene, 420, 330, "attract", 280);
      MagnetEngine.addCrate(scene, 200, 430);
      addPlat(560, 460, 480, 80);
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 32) { // Level 33: Inverse Pull (Attraction Across Void)
      addPlat(-80, 460, 240, 80);
      MagnetEngine.addNode(scene, 390, 260, "attract", 320);
      addPlat(540, 460, 160, 80);
      MagnetEngine.addNode(scene, 700, 410, "repel", 280);
      addPlat(800, 360, 240, 36);
      scene.exitGate = scene.createExitDoor(900, 335);
    }
    else if (lvl === 33) { // Level 34: Circuitry (Multi-Switch Network)
      addPlat(-80, 460, width + 160, 80);
      addSwitch(260, 452, "gate_34a");
      addEnergyGate(420, 410, "gate_34a");
      addSwitch(520, 452, "gate_34b");
      addEnergyGate(680, 410, "gate_34b");
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 34) { // Level 35: The Gravity Well (Dual Opposing Magnets)
      addPlat(-80, 460, 220, 80);
      MagnetEngine.addNode(scene, 380, 220, "attract", 280);
      MagnetEngine.addNode(scene, 540, 470, "repel", 280);
      addPlat(680, 460, 360, 80);
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 35) { // Level 36: Room Rotation (Assembly Shift)
      addPlat(-80, 460, 220, 80);
      var rot1 = addPlat(360, 420, 120, 26);
      var rot2 = addPlat(520, 380, 120, 26);
      addSwitch(160, 452, "gate_36");
      scene.customUpdateHandlers.push(function() {
        if (scene.switches[0] && scene.switches[0].isPressed && !scene.rotatedDone) {
          scene.rotatedDone = true;
          ShiftEngine.rotateAssembly(scene, [rot1, rot2], 90, 1200);
        }
      });
      addPlat(720, 460, 320, 80);
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 36) { // Level 37: Magnetic Echo (Echo Moving Crate)
      addPlat(-80, 460, width + 160, 80);
      EchoEngine.init(scene);
      MagnetEngine.addNode(scene, 440, 380, "repel", 260);
      addSwitch(260, 452, "gate_37");
      addEnergyGate(650, 410, "gate_37");
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 37) { // Level 38: Polarity Reversal (Toggle Inversion)
      addPlat(-80, 460, 240, 80);
      var mag38 = MagnetEngine.addNode(scene, 420, 360, "repel", 300);
      addSwitch(180, 452, "gate_38");
      scene.customUpdateHandlers.push(function() {
        if (scene.switches[0] && scene.switches[0].isPressed && !scene.polaritySwapped) {
          scene.polaritySwapped = true;
          MagnetEngine.togglePolarity();
          scene.showTrollToast("⚡ POLARITY REVERSED: Attract Mode!");
        }
      });
      addPlat(640, 460, 400, 80);
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 38) { // Level 39: Tectonic Shift (Stair Transformation)
      addPlat(-80, 460, 220, 80);
      var s1 = addPlat(280, 440, 95, 26);
      var s2 = addPlat(430, 400, 95, 26);
      var s3 = addPlat(580, 360, 95, 26);
      addSwitch(160, 452, "gate_39");
      addPlat(740, 460, 300, 80);
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 39) { // Level 40: 💀 BRUTAL CHALLENGE #4 — Magnetic Labyrinth
      addPlat(-80, 460, 180, 80);
      EchoEngine.init(scene);
      MagnetEngine.addNode(scene, 260, 350, "repel", 290);
      addSwitch(140, 452, "gate_40a");
      addEnergyGate(380, 370, "gate_40a");
      MagnetEngine.addNode(scene, 500, 260, "attract", 310);
      addPlat(470, 360, 80, 26);
      addSwitch(500, 352, "gate_40b");
      addEnergyGate(660, 370, "gate_40b");
      addPlat(740, 460, 300, 80);
      scene.exitGate = scene.createExitDoor(890, 435);
      scene.showTrollToast("💀 BRUTAL CHALLENGE #4: MAGNETIC LABYRINTH\nThread the magnetic needle through the ruins!");
    }

    // =========================================================================
    //  CHAPTER 5: SOMETHING IS WRONG... (Levels 41 - 44: Atmospheric Storytelling)
    //  Biome: Unstable World
    // =========================================================================
    else if (lvl === 40) { // Level 41: The Quiet Ruin (Vanishing Sky Monument)
      addPlat(-80, 460, width + 160, 80);
      var monument = scene.add.sprite(width * 0.6, 260, "monolith_tex").setDepth(5).setAlpha(0.35).setScale(0.9);
      scene.customUpdateHandlers.push(function(sc) {
        if (sc.player.x > 320 && monument.alpha > 0) {
          monument.alpha -= 0.015;
        }
      });
      scene.exitGate = scene.createExitDoor(880, 435);
      scene.showTrollToast("...The wind has stopped. Did something just vanish?");
    }
    else if (lvl === 41) { // Level 42: The Shadow That Follows
      addPlat(-80, 460, 300, 80);
      addPlat(380, 460, 220, 80);
      addPlat(680, 460, 360, 80);
      var bgShadow = scene.add.sprite(500, 220, "echo_hero_ghost").setDepth(4).setAlpha(0.25).setTint(0x000000);
      scene.customUpdateHandlers.push(function(sc) {
        bgShadow.x = 500 + (sc.player.x - 480) * 0.3;
        bgShadow.y = 220 + (sc.player.y - 410) * 0.4;
      });
      scene.exitGate = scene.createExitDoor(900, 435);
      scene.showTrollToast("A distant silhouette is mirroring your movements...");
    }
    else if (lvl === 42) { // Level 43: Signal Glitch (Audio & Geometry Warps)
      addPlat(-80, 460, 260, 80);
      MirrorEngine.init(scene, 460);
      MirrorEngine.addPhantomPlatform(scene, 320, 430, 95, 26, true);
      MirrorEngine.addPhantomPlatform(scene, 500, 400, 95, 26, true);
      addPlat(680, 460, 360, 80);
      scene.exitGate = scene.createExitDoor(900, 435);
      scene.showTrollToast("⚠ SIGNAL GLITCH DETECTED: Reality frequency desyncing...");
    }
    else if (lvl === 43) { // Level 44: Reality Tremor (Trembling Foundation)
      addPlat(-80, 460, 300, 80);
      var tremblingBlock = addPlat(420, 440, 140, 28);
      scene.tweens.add({ targets: tremblingBlock, y: "-=8", duration: 80, yoyo: true, repeat: -1 });
      addPlat(660, 460, 380, 80);
      scene.exitGate = scene.createExitDoor(900, 435);
      scene.showTrollToast("The sky is tearing open... The apex is near!");
    }

    // =========================================================================
    //  CHAPTER 6: LEVEL 45 — THE REVEAL & WORLD 3 CINEMATIC TEASER
    // =========================================================================
    else if (lvl === 44) { // Level 45: THE THRESHOLD (The Apex Cinematic Story Event)
      addPlat(-80, 460, width + 160, 80);
      scene.exitGate = scene.createExitDoor(880, 435);
      scene.exitGate.isRevealEvent = true;
      scene.showTrollToast("THE APEX OF WORLD 2: ENTER THE THRESHOLD");
    }

    // =========================================================================
    //  CHAPTER 7: THE DESCENT (Levels 46 - 50: Reality Breakdown & Finale)
    //  Biome: The Descent
    // =========================================================================
    else if (lvl === 45) { // Level 46: Aftermath (Post-Reveal Anomaly)
      addPlat(-80, 460, 260, 80);
      MirrorEngine.init(scene, 460);
      MirrorEngine.addPhantomPlatform(scene, 300, 430, 90, 26, true);
      MirrorEngine.addPhantomPlatform(scene, 460, 390, 90, 26, true);
      addPlat(620, 460, 420, 80);
      scene.exitGate = scene.createExitDoor(900, 435);
      scene.showTrollToast("THE DESCENT: 46 / 50 LEVELS\nReality has fractured...");
    }
    else if (lvl === 46) { // Level 47: The Monolith's Shadow (Alien Gravity Well)
      addPlat(-80, 460, width + 160, 80);
      var monoShadow = scene.add.sprite(500, 230, "monolith_tex").setDepth(5).setAlpha(0.45).setScale(1.6);
      scene.tweens.add({ targets: monoShadow, y: 210, duration: 2600, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      MagnetEngine.addNode(scene, 500, 350, "attract", 290);
      scene.exitGate = scene.createExitDoor(900, 435);
      scene.showTrollToast("An alien artifact hovers in the rift...");
    }
    else if (lvl === 47) { // Level 48: Dimension Rift (Quantum Warp Platform)
      addPlat(-80, 460, 240, 80);
      ChronoEngine.addZone(scene, 350, 380, "slow", 85);
      ChronoEngine.addZone(scene, 550, 380, "fast", 85);
      MirrorEngine.init(scene, 460);
      MirrorEngine.addPhantomPlatform(scene, 320, 410, 85, 26, true);
      MirrorEngine.addPhantomPlatform(scene, 520, 410, 85, 26, true);
      addPlat(680, 460, 360, 80);
      scene.exitGate = scene.createExitDoor(900, 435);
    }
    else if (lvl === 48) { // Level 49: 💀 BRUTAL CHALLENGE #5 — Fractured Continuum
      addPlat(-80, 460, 180, 80);
      MirrorEngine.init(scene, 460);
      EchoEngine.init(scene);
      ChronoEngine.addZone(scene, 270, 400, "fast", 75);
      MirrorEngine.addPhantomPlatform(scene, 230, 420, 80, 26, true);
      addSwitch(130, 452, "gate_49");
      addEnergyGate(370, 380, "gate_49");
      MagnetEngine.addNode(scene, 500, 270, "attract", 295);
      MirrorEngine.addPhantomPlatform(scene, 480, 370, 80, 26, true);
      MirrorEngine.addPhantomPlatform(scene, 620, 340, 80, 26, true);
      addPlat(740, 460, 300, 80);
      scene.exitGate = scene.createExitDoor(890, 435);
      scene.showTrollToast("💀 BRUTAL CHALLENGE #5: FRACTURED CONTINUUM\nMaster all dimensions to reach the finale!");
    }
    else if (lvl === 49) { // Level 50: 👑 GRAND MASTER FINALE — The Shift Complete
      addPlat(-80, 460, 180, 80);
      MirrorEngine.init(scene, 460);
      EchoEngine.init(scene);

      // Multi-Chamber Master Climax
      // Chamber 1: Echo Relay & Mirror Precision
      addPressurePlate(120, 452, "gate_50a");
      MirrorEngine.addPhantomPlatform(scene, 240, 420, 80, 26, true);
      addEnergyGate(350, 390, "gate_50a");

      // Chamber 2: Chrono Leap & Magnetic Polarity
      ChronoEngine.addZone(scene, 450, 340, "slow", 80);
      MagnetEngine.addNode(scene, 470, 260, "repel", 320);
      MirrorEngine.addPhantomPlatform(scene, 460, 380, 80, 26, true);
      addSwitch(470, 372, "gate_50b");
      addEnergyGate(590, 360, "gate_50b");

      // Chamber 3: Hyper Sprint to Celestial Sanctuary
      ChronoEngine.addZone(scene, 680, 350, "fast", 80);
      MirrorEngine.addPhantomPlatform(scene, 660, 360, 90, 26, true);

      // Sanctuary Gate
      addPlat(760, 460, 280, 80);
      scene.exitGate = scene.createExitDoor(890, 435);
      scene.showTrollToast("👑 GRAND FINALE: THE SHIFT COMPLETE!\nConquer the 5-chamber trial to achieve mastery!");
    }
  }
};

window.World2IntroScene = World2IntroScene;
window.World2ThemeManager = World2ThemeManager;
window.MirrorEngine = MirrorEngine;
window.ChronoEngine = ChronoEngine;
window.EchoEngine = EchoEngine;
window.MagnetEngine = MagnetEngine;
window.ShiftEngine = ShiftEngine;
window.World2Cinematics = World2Cinematics;
window.World2Engine = World2Engine;
window.WORLD_2_THEME = WORLD_2_THEME;
window.World2Assets = World2Assets;
