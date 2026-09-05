// Octorok - Spits deflectable rock projectiles with clear telegraph windup

import { Enemy, AI_STATE } from './Enemy.js';
import { Physics } from '../../engine/Physics.js';
import { Projectile } from '../Projectile.js';
import { sound } from '../../engine/Sound.js';

export class Octorok extends Enemy {
  constructor(x, y) {
    super(x, y, 14, 3);
    this.speed = 35;
    this.sightRange = 220;
    this.attackCooldown = 1.5;
    this.isTelegraphing = false;
    this.aimAngle = 0;
    this.wanderTimer = 1.0;
    this.wanderDir = 0;
  }

  updateAI(dt, game) {
    const p = game.player;
    const distToPlayer = Physics.distance(this.x, this.y, p.x, p.y);

    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }

    if (this.isTelegraphing) {
      this.telegraphTimer -= dt;
      this.aimAngle = Math.atan2(p.y - this.y, p.x - this.x);

      // Warning shudder particles
      if (Math.random() < 0.3) {
        game.particles.createDust(this.x, this.y + 4, 1);
      }

      if (this.telegraphTimer <= 0) {
        // Spit rock projectile!
        this.spitRock(game);
        this.isTelegraphing = false;
        this.attackCooldown = 2.0;
      }
      return;
    }

    // If player in sight, line-of-sight clear, and attack ready
    if (distToPlayer < this.sightRange && this.attackCooldown <= 0) {
      this.isTelegraphing = true;
      this.telegraphTimer = 0.65; // 650ms windup telegraph!
      this.aimAngle = Math.atan2(p.y - this.y, p.x - this.x);
      return;
    }

    // Simple wander
    this.wanderTimer -= dt;
    if (this.wanderTimer <= 0) {
      this.wanderTimer = 1.5 + Math.random() * 2;
      this.wanderDir = Math.random() * Math.PI * 2;
    }
    const nextX = this.x + Math.cos(this.wanderDir) * this.speed * dt;
    const nextY = this.y + Math.sin(this.wanderDir) * this.speed * dt;
    if (!game.tileMap.isSolid(nextX, nextY)) {
      this.x = nextX;
      this.y = nextY;
    } else {
      this.wanderDir += Math.PI; // bounce off wall
    }
  }

  spitRock(game) {
    sound.bowShoot();
    const rockSpeed = 260;
    const vx = Math.cos(this.aimAngle) * rockSpeed;
    const vy = Math.sin(this.aimAngle) * rockSpeed;

    const rock = new Projectile(
      this.x + Math.cos(this.aimAngle) * 16,
      this.y + Math.sin(this.aimAngle) * 16,
      vx,
      vy,
      { type: 'rock', damage: 1, owner: 'enemy', radius: 6 }
    );
    game.projectiles.push(rock);
  }

  render(ctx, camera) {
    const camX = camera.getRenderX();
    const camY = camera.getRenderY();
    const sx = this.x - camX;
    const sy = this.y - camY;

    ctx.save();
    ctx.translate(sx, sy);

    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 7, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Red puff-up telegraph effect
    const puff = this.isTelegraphing ? 1.25 + Math.sin(Date.now() * 0.03) * 0.1 : 1.0;
    ctx.scale(puff, puff);

    if (this.hurtFlash > 0) {
      ctx.fillStyle = '#ffffff';
    } else if (this.isTelegraphing) {
      ctx.fillStyle = '#d32f2f'; // Warning Crimson
    } else {
      ctx.fillStyle = '#e64a19'; // Classic Orange/Red Octorok
    }

    // Octopus body
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();

    // Snout / Spout pointing towards aim
    ctx.save();
    ctx.rotate(this.aimAngle);
    ctx.fillStyle = this.isTelegraphing ? '#b71c1c' : '#bf360c';
    ctx.beginPath();
    ctx.arc(10, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    // Mouth hole
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.arc(12, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Big round eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-4, -6, 4, 0, Math.PI * 2);
    ctx.arc(4, -6, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.fillRect(-5, -7, 2, 3);
    ctx.fillRect(3, -7, 2, 3);

    ctx.restore();
  }
}
