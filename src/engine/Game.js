// Main Game Engine & Scene Coordinator

import { InputManager } from './Input.js';
import { Camera } from './Camera.js';
import { sound } from './Sound.js';
import { ParticleSystem } from './Particles.js';
import { Physics } from './Physics.js';
import { TileMap, TILE_SIZE } from '../world/TileMap.js';
import { buildWorldMap, MAP_WIDTH, MAP_HEIGHT, WORLD_SPAWNS } from '../world/WorldData.js';
import { GrassPatch, Pot, Chest, DungeonDoor, PressureSwitch } from '../world/Interactables.js';
import { Player } from '../entities/Player.js';
import { Slime } from '../entities/enemies/Slime.js';
import { Octorok } from '../entities/enemies/Octorok.js';
import { Spearman } from '../entities/enemies/Spearman.js';
import { DarkKnight } from '../entities/enemies/DarkKnight.js';
import { BossGolem } from '../entities/enemies/BossGolem.js';
import { NPC } from '../entities/NPC.js';
import { Drop } from '../entities/Drops.js';
import { HUD } from '../ui/HUD.js';
import { DialogueSystem } from '../ui/Dialogue.js';
import { InventoryScreen } from '../ui/Inventory.js';
import { ShopInterface } from '../ui/Shop.js';

export const GAME_STATE = {
  TITLE: 'title',
  PLAYING: 'playing',
  GAMEOVER: 'gameover',
  VICTORY: 'victory'
};

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;

    // Viewport resolution
    this.viewportWidth = canvas.width;
    this.viewportHeight = canvas.height;

    // State: Start immediately in PLAYING mode so movement works on first frame
    this.state = GAME_STATE.PLAYING;
    this.lastTime = 0;
    this.awardBanner = null;
    this.titleBannerTimer = 5.0;

    // Core Systems
    this.input = new InputManager(canvas);
    this.camera = new Camera(this.viewportWidth, this.viewportHeight);
    this.particles = new ParticleSystem();
    this.hud = new HUD();
    this.dialogue = new DialogueSystem();
    this.inventory = new InventoryScreen();
    this.shop = new ShopInterface();

    this.initWorld();
  }

  initWorld() {
    // 1. Build Tilemap
    const tiles = buildWorldMap();
    this.tileMap = new TileMap(MAP_WIDTH, MAP_HEIGHT, tiles);
    this.camera.setBounds(0, 0, this.tileMap.worldWidth, this.tileMap.worldHeight);

    // 2. Player
    this.player = new Player(WORLD_SPAWNS.player.x, WORLD_SPAWNS.player.y);

    // 3. NPCs
    this.npcs = WORLD_SPAWNS.npcs.map(data => new NPC(data));

    // 4. Props (Chests, Doors, Switches, Pots, Grass)
    this.props = [];

    // Add static props from spawn data
    for (const p of WORLD_SPAWNS.props) {
      if (p.type === 'chest') {
        this.props.push(new Chest(p.id, p.x, p.y, p.reward, p.label));
      } else if (p.type === 'door') {
        this.props.push(new DungeonDoor(p.id, p.x, p.y, p.width, p.height, p.requiresKey));
      } else if (p.type === 'switch') {
        this.props.push(new PressureSwitch(p.id, p.x, p.y, (game) => {
          // Open temple door or forest gate
          const door = game.props.find(d => d.id === 'temple_door');
          if (door) door.unlock(game);
        }));
      }
    }

    // Scatter Pots around Village and Dungeon
    const potPositions = [
      [14, 43], [14, 45], [23, 38], [25, 38], // Village
      [42, 22], [42, 24], [62, 22], [62, 24], // Dungeon hall
      [58, 38] // Near forest switch
    ];
    potPositions.forEach(([tx, ty]) => {
      this.props.push(new Pot(tx * TILE_SIZE + 16, ty * TILE_SIZE + 16));
    });

    // Scatter Grass Patches across Wilds and Village Outskirts
    for (let y = 6; y < 54; y += 2) {
      for (let x = 6; x < 64; x += 2) {
        // Place grass in open fields if not solid and random
        if (!this.tileMap.isSolid(x * TILE_SIZE + 16, y * TILE_SIZE + 16) && Math.random() < 0.25) {
          // Avoid placing directly on paths
          const tile = this.tileMap.getTile(x, y);
          if (tile === 1) { // grass tile
            this.props.push(new GrassPatch(x * TILE_SIZE + 16, y * TILE_SIZE + 16));
          }
        }
      }
    }

    // 5. Enemies
    this.enemies = [];
    this.spawnEnemies();

    // 6. Projectiles & Drops
    this.projectiles = [];
    this.drops = [];
  }

  spawnEnemies() {
    this.enemies = [];
    for (const e of WORLD_SPAWNS.enemies) {
      if (e.type === 'slime') {
        this.enemies.push(new Slime(e.x, e.y));
      } else if (e.type === 'octorok') {
        this.enemies.push(new Octorok(e.x, e.y));
      } else if (e.type === 'spearman') {
        this.enemies.push(new Spearman(e.x, e.y));
      } else if (e.type === 'knight') {
        this.enemies.push(new DarkKnight(e.x, e.y));
      } else if (e.type === 'boss') {
        this.enemies.push(new BossGolem(e.x, e.y));
      }
    }
  }

  spawnDrop(x, y, type, value) {
    this.drops.push(new Drop(x, y, type, value));
  }

  awardItem(reward, label) {
    if (reward === 'bow') {
      this.player.hasBow = true;
      this.player.inventory.bow = true;
      this.player.arrows = Math.max(this.player.arrows, 20);
    } else if (reward === 'temple_key') {
      this.player.keys++;
      this.player.inventory.templeKey = true;
    } else if (reward === 'heart_container') {
      this.player.maxHealth += 2;
      this.player.health = this.player.maxHealth;
      this.player.inventory.heartContainers++;
    }

    this.awardBanner = {
      title: "ITEM OBTAINED!",
      text: label,
      timer: 3.5
    };
  }

  gameOver() {
    this.state = GAME_STATE.GAMEOVER;
    sound.stopMusic();
    sound.playerHurt();
  }

  victory() {
    this.state = GAME_STATE.VICTORY;
    sound.stopMusic();
    sound.chestFanfare();
  }

  respawn() {
    this.state = GAME_STATE.PLAYING;
    this.player.health = this.player.maxHealth;
    this.player.x = WORLD_SPAWNS.player.x;
    this.player.y = WORLD_SPAWNS.player.y;
    this.player.isDead = false;
    this.player.invulnTimer = 1.0;
    this.spawnEnemies();
    sound.playMusic('village');
  }

  updateMusic() {
    const px = this.player.x / TILE_SIZE;
    const py = this.player.y / TILE_SIZE;

    if (px > 36 && py < 30) {
      // Inside Sunken Temple
      sound.playMusic('boss');
    } else if (px < 32 && py > 30) {
      // Mabe Village
      sound.playMusic('village');
    } else {
      // Overworld Wilds
      sound.playMusic('overworld');
    }
  }

  start() {
    sound.init();
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }

  loop(currentTime) {
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.08); // cap delta time
    this.lastTime = currentTime;

    this.update(dt);
    this.render();

    this.input.clearJustPressed();
    requestAnimationFrame(this.loop.bind(this));
  }

  update(dt) {
    // --- 0. INTRO TITLE BANNER TIMER ---
    if (this.titleBannerTimer > 0) {
      this.titleBannerTimer -= dt;
      if (this.player.vx !== 0 || this.player.vy !== 0) {
        this.titleBannerTimer = Math.min(this.titleBannerTimer, 0.8);
      }
    }

    // --- 1. TITLE SCREEN (Any key or click starts immediately) ---
    if (this.state === GAME_STATE.TITLE) {
      if (this.input.isAnyKeyDown() || this.input.isLeftJustPressed() || this.input.isRightJustPressed()) {
        this.state = GAME_STATE.PLAYING;
        sound.chestFanfare();
        sound.playMusic('village');
        // Do not return; immediately process gameplay so first keystroke moves character!
      } else {
        return;
      }
    }

    // --- 2. GAME OVER SCREEN ---
    if (this.state === GAME_STATE.GAMEOVER) {
      if (this.input.isJustPressed(' ') || this.input.isJustPressed('enter') || this.input.isLeftJustPressed()) {
        this.respawn();
      }
      return;
    }

    // --- 3. VICTORY SCREEN ---
    if (this.state === GAME_STATE.VICTORY) {
      if (this.input.isJustPressed(' ') || this.input.isJustPressed('enter') || this.input.isLeftJustPressed()) {
        this.respawn();
      }
      return;
    }

    // --- 4. MODALS (Dialogue, Inventory, Shop) ---
    if (this.dialogue.isActive) {
      this.dialogue.update(dt, this.input);
      return; // Pause action during dialogue
    }

    this.inventory.update(this.input);
    if (this.inventory.isOpen) {
      return; // Pause action during inventory
    }

    if (this.shop.isOpen) {
      this.shop.update(this.input, this);
      return; // Pause action during shop
    }

    // --- 5. AWARD BANNER ---
    if (this.awardBanner) {
      this.awardBanner.timer -= dt;
      if (this.awardBanner.timer <= 0) {
        this.awardBanner = null;
      }
    }

    // --- 6. CORE GAMEPLAY UPDATE ---
    this.tileMap.update(dt);
    this.player.update(dt, this);

    // Update Camera
    this.camera.update(dt, this.player.x, this.player.y, this.input.mouse.worldX, this.input.mouse.worldY);

    // Dynamic Biome Music
    this.updateMusic();

    // Update NPCs
    for (const npc of this.npcs) {
      npc.update(dt);
    }

    // Update Props
    for (const prop of this.props) {
      if (prop.update) prop.update(dt, this);
    }

    // Update Enemies & Collisions
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.isDead) {
        this.enemies.splice(i, 1);
        continue;
      }
      e.update(dt, this);

      // Separate enemy collision with other enemies
      for (let j = i - 1; j >= 0; j--) {
        Physics.separateCircles(e, this.enemies[j]);
      }
    }

    // Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.update(dt, this);
      if (proj.isDead) {
        this.projectiles.splice(i, 1);
      }
    }

    // Update Drops
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const drop = this.drops[i];
      drop.update(dt, this);
      if (drop.isDead) {
        this.drops.splice(i, 1);
      }
    }

    // Update Particles
    this.particles.update(dt);
  }

  render() {
    this.ctx.clearRect(0, 0, this.viewportWidth, this.viewportHeight);

    // --- Title Screen Render ---
    if (this.state === GAME_STATE.TITLE) {
      this.renderTitleScreen();
      return;
    }

    // --- Game World Render ---
    // 1. Tilemap terrain
    this.tileMap.render(this.ctx, this.camera);

    // 2. Floor Props (Cuttable Grass, Switches, Doors)
    for (const prop of this.props) {
      prop.render(this.ctx, this.camera);
    }

    // 3. Ground Drops
    for (const drop of this.drops) {
      drop.render(this.ctx, this.camera);
    }

    // 4. Enemy telegraph arcs/lasers
    for (const enemy of this.enemies) {
      if (enemy.renderTelegraph) enemy.renderTelegraph(this.ctx, this.camera);
    }

    // 5. Y-Sorted Entity Layer (Player, Enemies, NPCs, Pots)
    const renderList = [
      this.player,
      ...this.enemies,
      ...this.npcs,
      ...this.props.filter(p => p instanceof Pot && !p.isCarried)
    ];

    renderList.sort((a, b) => a.y - b.y);

    for (const actor of renderList) {
      actor.render(this.ctx, this.camera);
    }

    // 6. Projectiles
    for (const proj of this.projectiles) {
      proj.render(this.ctx, this.camera);
    }

    // 7. Particle FX (dust, sparks, slash arcs, explosions)
    this.particles.render(this.ctx, this.camera);

    // 9. Intro Title Floating Banner
    if (this.titleBannerTimer > 0) {
      this.renderIntroBanner();
    }

    // 10. Item Award Banner
    if (this.awardBanner) {
      this.renderAwardBanner();
    }

    // 10. Dialogue Modal
    this.dialogue.render(this.ctx);

    // 11. Inventory Modal
    this.inventory.render(this.ctx, this);

    // 12. Shop Modal
    this.shop.render(this.ctx, this);

    // 13. Game Over / Victory Overlays
    if (this.state === GAME_STATE.GAMEOVER) {
      this.renderGameOver();
    } else if (this.state === GAME_STATE.VICTORY) {
      this.renderVictory();
    }
  }

  renderTitleScreen() {
    const w = this.viewportWidth;
    const h = this.viewportHeight;

    // Lush Title Backdrop
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, w, h);

    // Golden Triforce / Crest
    const cx = w / 2;
    const cy = h / 2 - 40;

    this.ctx.fillStyle = '#f1c40f';
    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy - 60);
    this.ctx.lineTo(cx + 50, cy + 20);
    this.ctx.lineTo(cx - 50, cy + 20);
    this.ctx.closePath();
    this.ctx.fill();

    // Inner triangle
    this.ctx.fillStyle = '#0f172a';
    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy + 20);
    this.ctx.lineTo(cx + 25, cy - 20);
    this.ctx.lineTo(cx - 25, cy - 20);
    this.ctx.closePath();
    this.ctx.fill();

    // Title text
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 26px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText("ECHOES OF THE AWAKENING ISLE", cx, cy + 65);

    this.ctx.fillStyle = '#38bdf8';
    this.ctx.font = '13px monospace';
    this.ctx.fillText("Top-Down Action RPG — Precision Aiming & Dodge Battles", cx, cy + 92);

    const blink = Math.floor(Date.now() / 450) % 2 === 0;
    if (blink) {
      this.ctx.fillStyle = '#f1c40f';
      this.ctx.font = 'bold 15px monospace';
      this.ctx.fillText("PRESS SPACE OR CLICK TO EMBARK", cx, cy + 140);
    }

    this.ctx.textAlign = 'left';
  }

  renderIntroBanner() {
    const w = this.viewportWidth;
    const cx = w / 2;
    const cy = 40;
    const alpha = Math.min(1, this.titleBannerTimer);

    this.ctx.save();
    this.ctx.globalAlpha = alpha;

    // Header banner box
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    this.ctx.fillRect(cx - 250, cy - 20, 500, 42);
    this.ctx.strokeStyle = '#f1c40f';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(cx - 250, cy - 20, 500, 42);

    this.ctx.fillStyle = '#f1c40f';
    this.ctx.font = 'bold 12px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText("⚔️ ECHOES OF THE AWAKENING ISLE ⚔️", cx, cy - 4);

    this.ctx.fillStyle = '#38bdf8';
    this.ctx.font = '10px monospace';
    this.ctx.fillText("Move: [WASD / Arrows]  |  Attack: [L-Click / J]  |  Dodge: [Space / K]", cx, cy + 12);

    this.ctx.restore();
  }

  renderAwardBanner() {
    const w = this.viewportWidth;
    const cx = w / 2;
    const cy = 90;

    this.ctx.save();
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    this.ctx.fillRect(cx - 180, cy - 25, 360, 50);
    this.ctx.strokeStyle = '#f1c40f';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(cx - 180, cy - 25, 360, 50);

    this.ctx.fillStyle = '#f1c40f';
    this.ctx.font = 'bold 11px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(this.awardBanner.title, cx, cy - 6);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 13px monospace';
    this.ctx.fillText(this.awardBanner.text, cx, cy + 14);

    this.ctx.restore();
  }

  renderGameOver() {
    const w = this.viewportWidth;
    const h = this.viewportHeight;

    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    this.ctx.fillRect(0, 0, w, h);

    this.ctx.fillStyle = '#ef4444';
    this.ctx.font = 'bold 28px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText("GAME OVER", w / 2, h / 2 - 20);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '14px monospace';
    this.ctx.fillText("Press [SPACEBAR] or CLICK to Revive at Mabe Village", w / 2, h / 2 + 25);

    this.ctx.restore();
  }

  renderVictory() {
    const w = this.viewportWidth;
    const h = this.viewportHeight;

    this.ctx.save();
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    this.ctx.fillRect(0, 0, w, h);

    this.ctx.fillStyle = '#f1c40f';
    this.ctx.font = 'bold 26px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText("VICTORY! THE ISLE IS SAVED!", w / 2, h / 2 - 30);

    this.ctx.fillStyle = '#4ade80';
    this.ctx.font = '14px monospace';
    this.ctx.fillText("The Awakened Golem Lord has been vanquished.", w / 2, h / 2 + 5);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '12px monospace';
    this.ctx.fillText("Press [SPACEBAR] or CLICK to Continue Exploring", w / 2, h / 2 + 45);

    this.ctx.restore();
  }
}
