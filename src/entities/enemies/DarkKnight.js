// Dark Knight (Armored Sentinel) - Frontal Shield Defense requiring dodge rolls to backstab

import { Enemy, AI_STATE } from './Enemy.js';
import { Physics } from '../../engine/Physics.js';
import { sound } from '../../engine/Sound.js';

export class DarkKnight extends Enemy {
  constructor(x, y) {
    super(x, y, 16, 6);
    this.speed = 42;
    this.sightRange = 180;
    this.attackRange = 46;

    this.isSwinging = false;
    this.isTelegraphing = false;
    this.telegraphTimer = 0;
    this.telegraphDuration = 0.7; // 700ms warning arc
    this.swingTimer = 0;
    this.swingDuration = 0.3;
    this.cooldown = 1.0;
  }

  updateAI(dt, game) {
    const p = game.player;
    const distToPlayer = Physics.distance(this.x, this.y, p.x, p.y);
    const angleToPlayer = Math.atan2(p.y - this.y, p.x - this.x);

    if (this.cooldown > 0) {
      this.cooldown -= dt;
    }

    // Facing always tracks towards player while moving/tracking
    if (!this.isSwinging && !this.isTelegraphing) {
      this.facingAngle = angleToPlayer;
    }

    // --- State: Telegraphing Heavy Sword Sweep ---
    if (this.isTelegraphing) {
      this.telegraphTimer -= dt;
      if (this.telegraphTimer <= 0) {
        this.isTelegraphing = false;
        this.isSwinging = true;
        this.swingTimer = this.swingDuration;
        sound.swordSlash(2);
        game.particles.addSlashArc(this.x, this.y, this.facingAngle - Math.PI * 0.5, this.facingAngle + Math.PI * 0.5, 48, 'rgba(230, 40, 40, ALPHA)', 8);

        // Check if player is hit by the heavy sweep
        if (distToPlayer <= 52 && Physics.isAngleInArc(angleToPlayer, this.facingAngle, Math.PI)) {
          if (!p.isDodging) {
            p.takeDamage(2, game, this.facingAngle, 260);
          }
        }
      }
      return;
    }

    // --- State: Active Swing ---
    if (this.isSwinging) {
      this.swingTimer -= dt;
      if (this.swingTimer <= 0) {
        this.isSwinging = false;
        this.cooldown = 1.5;
      }
      return;
    }

    // --- State: Approach / Windup ---
    if (distToPlayer <= this.attackRange && this.cooldown <= 0) {
      this.isTelegraphing = true;
      this.telegraphTimer = this.telegraphDuration;
      return;
    }

    if (distToPlayer < this.sightRange) {
      const nextX = this.x + Math.cos(angleToPlayer) * this.speed * dt;
      const nextY = this.y + Math.sin(angleToPlayer) * this.speed * dt;
      if (!game.tileMap.isSolid(nextX, nextY)) {
        this.x = nextX;
        this.y = nextY;
      }
    }
  }

  takeDamage(amount, game, hitAngle = 0, knockbackPower = 180) {
    // Check if attack came from FRONT of the knight (Shield block!)
    // If attack came from front (within 120° of facing angle), shield blocks it completely!
    const relativeAngle = Math.abs((hitAngle + Math.PI - this.facingAngle) % (Math.PI * 2));
    const normalized = relativeAngle > Math.PI ? (Math.PI * 2) - relativeAngle : relativeAngle;

    if (normalized < Math.PI * 0.45) {
      // FRONT ATTACK BLOCKED BY SHIELD!
      sound.shieldBlock();
      game.particles.createHitSparks(this.x + Math.cos(this.facingAngle) * 16, this.y + Math.sin(this.facingAngle) * 16, hitAngle + Math.PI, 6);
      game.camera.shake(1.5, 0.08);
      return false; // No damage taken!
    }

    // Back or side attack lands!
    return super.takeDamage(amount, game, hitAngle, knockbackPower * 0.6);
  }

  render(ctx, camera) {
    const camX = camera.getRenderX();
    const camY = camera.getRenderY();
    const sx = this.x - camX;
    const sy = this.y - camY;

    // Render Red Sweep Telegraph Arc
    if (this.isTelegraphing) {
      ctx.save();
      ctx.translate(sx, sy);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 52, this.facingAngle - Math.PI * 0.5, this.facingAngle + Math.PI * 0.5);
      ctx.closePath();
      const pulse = 0.25 + Math.sin(Date.now() * 0.03) * 0.15;
      ctx.fillStyle = `rgba(244, 67, 54, ${pulse})`;
      ctx.fill();
      ctx.strokeStyle = '#f44336';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(sx, sy);

    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 9, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dark Iron Knight Body
    if (this.hurtFlash > 0) {
      ctx.fillStyle = '#ffffff';
    } else {
      ctx.fillStyle = '#37474f'; // Dark slate iron
    }

    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();

    // Cape / Helmet Plume
    ctx.fillStyle = '#b71c1c';
    ctx.beginPath();
    ctx.arc(0, -5, 6, 0, Math.PI * 2);
    ctx.fill();

    // Rotate equipment to facing direction
    ctx.save();
    ctx.rotate(this.facingAngle);

    // Giant Frontal Tower Shield
    ctx.fillStyle = '#263238';
    ctx.fillRect(10, -12, 6, 24);
    ctx.fillStyle = '#cfd8dc'; // Iron boss
    ctx.strokeRect(10, -12, 6, 24);
    ctx.fillRect(11, -3, 4, 6);

    // Heavy Claymore Sword
    ctx.fillStyle = '#90a4ae';
    ctx.fillRect(6, 10, 22, 5);
    ctx.fillStyle = '#cfd8dc';
    ctx.beginPath();
    ctx.moveTo(28, 10);
    ctx.lineTo(33, 12.5);
    ctx.lineTo(28, 15);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Visor glowing red slit
    ctx.save();
    ctx.rotate(this.facingAngle);
    ctx.fillStyle = '#ff1744';
    ctx.fillRect(4, -2, 4, 4);
    ctx.restore();

    ctx.restore();
  }
}
