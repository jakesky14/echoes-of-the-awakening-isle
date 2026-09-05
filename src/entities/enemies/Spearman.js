// Spearman (Moblin) - Telegraphed linear charge attack with red laser indicator

import { Enemy, AI_STATE } from './Enemy.js';
import { Physics } from '../../engine/Physics.js';
import { sound } from '../../engine/Sound.js';

export class Spearman extends Enemy {
  constructor(x, y) {
    super(x, y, 14, 4);
    this.speed = 50;
    this.chargeSpeed = 290;
    this.sightRange = 210;

    this.isCharging = false;
    this.isTelegraphing = false;
    this.telegraphTimer = 0;
    this.telegraphDuration = 0.7; // 700ms red laser warning
    this.chargeTimer = 0;
    this.chargeDuration = 0.75;
    this.chargeAngle = 0;
    this.cooldown = 1.2;
  }

  updateAI(dt, game) {
    const p = game.player;
    const distToPlayer = Physics.distance(this.x, this.y, p.x, p.y);

    if (this.cooldown > 0) {
      this.cooldown -= dt;
    }

    // --- Phase 1: Windup Telegraph with Red Charge Laser ---
    if (this.isTelegraphing) {
      this.telegraphTimer -= dt;
      // Foot dust particles
      if (Math.random() < 0.4) {
        game.particles.createDust(this.x, this.y + 6, 2);
      }

      if (this.telegraphTimer <= 0) {
        // Unleash sprint charge!
        this.isTelegraphing = false;
        this.isCharging = true;
        this.chargeTimer = this.chargeDuration;
        sound.swordSlash(1);
      }
      return;
    }

    // --- Phase 2: Active High-Velocity Rush ---
    if (this.isCharging) {
      this.chargeTimer -= dt;
      const moveX = Math.cos(this.chargeAngle) * this.chargeSpeed * dt;
      const moveY = Math.sin(this.chargeAngle) * this.chargeSpeed * dt;

      // Check wall collision
      if (game.tileMap.isSolid(this.x + moveX * 1.5, this.y + moveY * 1.5)) {
        // Hit wall! Stunned!
        this.isCharging = false;
        this.state = AI_STATE.STUNNED;
        this.stunTimer = 1.4; // heavy vulnerability window for player to attack!
        this.cooldown = 2.0;
        sound.swordHit();
        game.camera.shake(3, 0.1);
        game.particles.createDust(this.x, this.y, 8);
        return;
      }

      this.x += moveX;
      this.y += moveY;
      game.particles.createDust(this.x, this.y + 6, 1, this.chargeAngle + Math.PI);

      if (this.chargeTimer <= 0) {
        this.isCharging = false;
        this.cooldown = 1.8;
      }
      return;
    }

    // --- Phase 3: Patrol / Chase ---
    if (distToPlayer < this.sightRange && this.cooldown <= 0) {
      // Begin telegraphed charge!
      this.isTelegraphing = true;
      this.telegraphTimer = this.telegraphDuration;
      this.chargeAngle = Math.atan2(p.y - this.y, p.x - this.x);
      return;
    }

    if (distToPlayer < this.sightRange) {
      // Approach slowly
      const angle = Math.atan2(p.y - this.y, p.x - this.x);
      this.facingAngle = angle;
      const nextX = this.x + Math.cos(angle) * this.speed * dt;
      const nextY = this.y + Math.sin(angle) * this.speed * dt;
      if (!game.tileMap.isSolid(nextX, nextY)) {
        this.x = nextX;
        this.y = nextY;
      }
    }
  }

  render(ctx, camera) {
    const camX = camera.getRenderX();
    const camY = camera.getRenderY();
    const sx = this.x - camX;
    const sy = this.y - camY;

    // Render Red Telegraph Laser Line
    if (this.isTelegraphing) {
      const laserLen = 220;
      const endX = sx + Math.cos(this.chargeAngle) * laserLen;
      const endY = sy + Math.sin(this.chargeAngle) * laserLen;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(endX, endY);
      const pulse = 0.5 + Math.sin(Date.now() * 0.04) * 0.3;
      ctx.strokeStyle = `rgba(244, 67, 54, ${pulse})`;
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(sx, sy);

    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 8, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Moblin Body (Brown/Red Goblin)
    if (this.hurtFlash > 0) {
      ctx.fillStyle = '#ffffff';
    } else if (this.state === AI_STATE.STUNNED) {
      ctx.fillStyle = '#9e9e9e'; // Grayed out stunned
    } else {
      ctx.fillStyle = '#8d4b38';
    }

    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();

    // Pig-snout face
    const faceAngle = this.isCharging ? this.chargeAngle : this.facingAngle;
    ctx.save();
    ctx.rotate(faceAngle);

    // Horns / Ears
    ctx.fillStyle = '#5d4037';
    ctx.beginPath();
    ctx.moveTo(4, -10);
    ctx.lineTo(8, -16);
    ctx.lineTo(11, -9);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(4, 10);
    ctx.lineTo(8, 16);
    ctx.lineTo(11, 9);
    ctx.fill();

    // Long Spear
    ctx.fillStyle = '#795548';
    ctx.fillRect(8, 6, 26, 3);
    // Spear iron point
    ctx.fillStyle = '#cfd8dc';
    ctx.beginPath();
    ctx.moveTo(34, 4);
    ctx.lineTo(44, 7.5);
    ctx.lineTo(34, 11);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Stun indicator (swirling stars)
    if (this.state === AI_STATE.STUNNED) {
      const starRot = Date.now() * 0.008;
      ctx.fillStyle = '#fdd835';
      for (let i = 0; i < 3; i++) {
        const sa = starRot + (i / 3) * Math.PI * 2;
        const starX = Math.cos(sa) * 14;
        const starY = -14 + Math.sin(sa) * 6;
        ctx.fillRect(starX - 2, starY - 2, 4, 4);
      }
    }

    ctx.restore();
  }
}
