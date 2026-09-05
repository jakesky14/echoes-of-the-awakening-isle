// Dungeon Boss: "The Awakened Golem Lord" - Multi-phase battle requiring precision aiming & dodge rolls

import { Enemy, AI_STATE } from './Enemy.js';
import { Physics } from '../../engine/Physics.js';
import { sound } from '../../engine/Sound.js';
import { Projectile } from '../Projectile.js';

export const BOSS_ATTACK = {
  NONE: 'none',
  SLAM: 'slam',
  CHARGE: 'charge',
  SPIRAL: 'spiral'
};

export class BossGolem extends Enemy {
  constructor(x, y) {
    super(x, y, 28, 20); // 20 HP Boss!
    this.name = "Awakened Golem Lord";
    this.speed = 40;
    this.isBoss = true;
    this.contactDamage = 2;

    this.currentAttack = BOSS_ATTACK.NONE;
    this.phase = 1;
    this.actionCooldown = 1.2;

    // Slam attack variables
    this.slamAirborne = false;
    this.slamProgress = 0;
    this.slamTargetX = x;
    this.slamTargetY = y;
    this.slamOrigX = x;
    this.slamOrigY = y;

    // Charge attack variables
    this.isCharging = false;
    this.chargeAngle = 0;
    this.chargeTimer = 0;

    // Spiral attack variables (Phase 2)
    this.isSpiraling = false;
    this.spiralAngle = 0;
    this.spiralShotsLeft = 0;
    this.spiralTimer = 0;

    // Visual pulse
    this.runeGlowTimer = 0;
  }

  updateAI(dt, game) {
    const p = game.player;
    const distToPlayer = Physics.distance(this.x, this.y, p.x, p.y);
    const angleToPlayer = Math.atan2(p.y - this.y, p.x - this.x);
    this.runeGlowTimer += dt * (this.phase === 2 ? 8 : 4);

    // Phase 2 transition check at 50% HP
    if (this.phase === 1 && this.health <= 10) {
      this.phase = 2;
      this.speed = 56;
      sound.bossRoar();
      game.camera.shake(8, 0.4);
      game.particles.createExplosion(this.x, this.y, 48);
    }

    if (this.actionCooldown > 0) {
      this.actionCooldown -= dt;
    }

    // --- State: Ground Slam airborne phase ---
    if (this.slamAirborne) {
      this.slamProgress += dt / 0.65;
      if (this.slamProgress >= 1) {
        // Slam Impact!
        this.slamAirborne = false;
        this.x = this.slamTargetX;
        this.y = this.slamTargetY;
        this.currentAttack = BOSS_ATTACK.NONE;
        this.actionCooldown = this.phase === 2 ? 1.0 : 1.8;

        sound.bossSlam();
        game.camera.shake(9, 0.35);
        game.particles.createShockwave(this.x, this.y, 110, 240, 'rgba(255, 170, 50, 0.9)', 6);
        game.particles.createDust(this.x, this.y, 16);

        // Check shockwave hit against player (DODGE ROLL i-frames protect the player!)
        if (distToPlayer <= 110 && !p.isDodging) {
          p.takeDamage(2, game, angleToPlayer, 280);
        }
      } else {
        this.x = this.slamOrigX + (this.slamTargetX - this.slamOrigX) * this.slamProgress;
        this.y = this.slamOrigY + (this.slamTargetY - this.slamOrigY) * this.slamProgress;
      }
      return;
    }

    // --- State: Bull Charge active ---
    if (this.isCharging) {
      this.chargeTimer -= dt;
      const moveX = Math.cos(this.chargeAngle) * 260 * dt;
      const moveY = Math.sin(this.chargeAngle) * 260 * dt;

      // Check wall crash
      if (game.tileMap.isSolid(this.x + moveX * 1.6, this.y + moveY * 1.6)) {
        // Crashed into stone wall! Stunned!
        this.isCharging = false;
        this.currentAttack = BOSS_ATTACK.NONE;
        this.state = AI_STATE.STUNNED;
        this.stunTimer = 2.8; // vulnerable window for player to attack!
        this.actionCooldown = 3.2;
        sound.bossSlam();
        game.camera.shake(7, 0.25);
        game.particles.createDust(this.x, this.y, 14);
        return;
      }

      this.x += moveX;
      this.y += moveY;
      game.particles.createDust(this.x, this.y + 12, 1);

      if (this.chargeTimer <= 0) {
        this.isCharging = false;
        this.currentAttack = BOSS_ATTACK.NONE;
        this.actionCooldown = 1.4;
      }
      return;
    }

    // --- State: Bullet Hell Spiral (Phase 2) ---
    if (this.isSpiraling) {
      this.spiralTimer -= dt;
      if (this.spiralTimer <= 0 && this.spiralShotsLeft > 0) {
        this.spiralTimer = 0.08;
        this.spiralShotsLeft--;
        this.spiralAngle += 0.45;

        // Emit pair of energy orbs in opposite directions
        for (let dir = 0; dir < 2; dir++) {
          const a = this.spiralAngle + dir * Math.PI;
          const proj = new Projectile(
            this.x + Math.cos(a) * 20,
            this.y + Math.sin(a) * 20,
            Math.cos(a) * 190,
            Math.sin(a) * 190,
            { type: 'energy', damage: 1, owner: 'enemy', radius: 7 }
          );
          game.projectiles.push(proj);
        }
        sound.bowShoot();
      }

      if (this.spiralShotsLeft <= 0) {
        this.isSpiraling = false;
        this.currentAttack = BOSS_ATTACK.NONE;
        this.actionCooldown = 2.0;
      }
      return;
    }

    // --- Attack Decision Maker ---
    if (this.actionCooldown <= 0) {
      const rand = Math.random();

      if (this.phase === 2 && rand < 0.35) {
        // Initiate Bullet Spiral
        this.currentAttack = BOSS_ATTACK.SPIRAL;
        this.isSpiraling = true;
        this.spiralShotsLeft = 14;
        this.spiralTimer = 0;
        this.spiralAngle = 0;
        sound.bossRoar();
        return;
      }

      if (rand < 0.65) {
        // Initiate Ground Slam
        this.currentAttack = BOSS_ATTACK.SLAM;
        this.slamAirborne = true;
        this.slamProgress = 0;
        this.slamOrigX = this.x;
        this.slamOrigY = this.y;
        this.slamTargetX = p.x;
        this.slamTargetY = p.y;
        sound.spinCharge();
        return;
      }

      // Initiate Bull Charge
      this.currentAttack = BOSS_ATTACK.CHARGE;
      this.isCharging = true;
      this.chargeTimer = 1.0;
      this.chargeAngle = angleToPlayer;
      sound.bossRoar();
      return;
    }

    // Stalk towards player
    this.facingAngle = angleToPlayer;
    const nextX = this.x + Math.cos(angleToPlayer) * this.speed * dt;
    const nextY = this.y + Math.sin(angleToPlayer) * this.speed * dt;
    if (!game.tileMap.isSolid(nextX, nextY)) {
      this.x = nextX;
      this.y = nextY;
    }
  }

  takeDamage(amount, game, hitAngle = 0, knockbackPower = 180) {
    // Stunned multiplier: deals 1.5x damage when stunned!
    const effectiveDamage = this.state === AI_STATE.STUNNED ? amount * 1.5 : amount;
    const taken = super.takeDamage(effectiveDamage, game, hitAngle, 60); // Golem is heavy, low knockback
    if (taken) {
      sound.swordHit();
      game.camera.shake(3, 0.1);
      game.particles.createHitSparks(this.x, this.y, hitAngle, 10);
    }
    return taken;
  }

  die(game) {
    super.die(game);
    sound.bossRoar();
    game.camera.shake(12, 0.6);
    game.particles.createExplosion(this.x, this.y, 64);
    game.particles.createShockwave(this.x, this.y, 140, 160, 'rgba(255, 230, 80, 1)', 8);

    // Drop Grand Heart Container and trigger victory portal!
    game.spawnDrop(this.x, this.y, 'heart', 1);
    game.spawnDrop(this.x - 20, this.y, 'rupee', 20);
    game.spawnDrop(this.x + 20, this.y, 'rupee', 20);

    setTimeout(() => {
      game.victory();
    }, 2000);
  }

  render(ctx, camera) {
    const camX = camera.getRenderX();
    const camY = camera.getRenderY();
    const sx = this.x - camX;
    const sy = this.y - camY;

    // Slam Target Telegraph Circle on Ground
    if (this.slamAirborne) {
      const targetScreenX = this.slamTargetX - camX;
      const targetScreenY = this.slamTargetY - camY;
      ctx.save();
      ctx.beginPath();
      ctx.arc(targetScreenX, targetScreenY, 80 * this.slamProgress, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 87, 34, ${0.2 + this.slamProgress * 0.3})`;
      ctx.fill();
      ctx.strokeStyle = '#f44336';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(sx, sy);

    // Jump height offset
    const jumpY = this.slamAirborne ? Math.sin(this.slamProgress * Math.PI) * 55 : 0;

    // Ground shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    const shadowScale = Math.max(0.4, 1 - jumpY / 70);
    ctx.ellipse(0, 16, 26 * shadowScale, 10 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(0, -jumpY);

    // Giant Stone Golem Torso
    if (this.hurtFlash > 0) {
      ctx.fillStyle = '#ffffff';
    } else if (this.phase === 2) {
      ctx.fillStyle = '#4e342e'; // Dark volcanic basalt
    } else {
      ctx.fillStyle = '#546e7a'; // Ancient weathered stone
    }

    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fill();

    // Stone shoulders
    ctx.fillStyle = this.phase === 2 ? '#3e2723' : '#37474f';
    ctx.fillRect(-28, -8, 12, 16);
    ctx.fillRect(16, -8, 12, 16);

    // Glowing Ancient Magma/Rune Core in Chest
    const glowAlpha = 0.5 + Math.sin(this.runeGlowTimer) * 0.4;
    ctx.fillStyle = this.phase === 2 ? `rgba(255, 87, 34, ${glowAlpha})` : `rgba(0, 229, 255, ${glowAlpha})`;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();

    // Golem glowing eye slits
    ctx.fillStyle = this.phase === 2 ? '#ffeb3b' : '#ffffff';
    ctx.fillRect(-8, -12, 5, 4);
    ctx.fillRect(3, -12, 5, 4);

    // Stun indicator
    if (this.state === AI_STATE.STUNNED) {
      const rot = Date.now() * 0.007;
      ctx.fillStyle = '#ffeb3b';
      for (let i = 0; i < 4; i++) {
        const a = rot + (i / 4) * Math.PI * 2;
        const sx = Math.cos(a) * 32;
        const sy = -28 + Math.sin(a) * 10;
        ctx.fillRect(sx - 3, sy - 3, 6, 6);
      }
    }

    ctx.restore();
  }
}
