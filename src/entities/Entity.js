// Base Actor Entity with physics, health, hurtboxes, i-frames, and knockback

import { sound } from '../engine/Sound.js';

export class Entity {
  constructor(x, y, radius = 14, maxHealth = 6) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.maxHealth = maxHealth;
    this.health = maxHealth;

    this.vx = 0;
    this.vy = 0;
    this.kbVx = 0; // Knockback X
    this.kbVy = 0; // Knockback Y

    this.invulnTimer = 0;
    this.maxInvuln = 0.35;
    this.hurtFlash = 0;

    this.facingAngle = 0;
    this.isDead = false;
  }

  takeDamage(amount, game, hitAngle = 0, knockbackPower = 180) {
    if (this.invulnTimer > 0 || this.isDead) return false;

    this.health -= amount;
    this.invulnTimer = this.maxInvuln;
    this.hurtFlash = 0.2;

    // Apply knockback
    this.kbVx = Math.cos(hitAngle) * knockbackPower;
    this.kbVy = Math.sin(hitAngle) * knockbackPower;

    if (this.health <= 0) {
      this.health = 0;
      this.die(game);
    }

    return true;
  }

  die(game) {
    this.isDead = true;
    sound.enemyDeath();
    game.particles.createDeathPoof(this.x, this.y, this.radius);
  }

  updateBasePhysics(dt, game) {
    // Apply knockback with high friction
    this.x += this.kbVx * dt;
    this.y += this.kbVy * dt;
    this.kbVx *= Math.pow(0.01, dt);
    this.kbVy *= Math.pow(0.01, dt);
    if (Math.abs(this.kbVx) < 2) this.kbVx = 0;
    if (Math.abs(this.kbVy) < 2) this.kbVy = 0;

    // Update invulnerability timers
    if (this.invulnTimer > 0) {
      this.invulnTimer -= dt;
    }
    if (this.hurtFlash > 0) {
      this.hurtFlash -= dt;
    }

    // Resolve tilemap wall collisions for this entity
    this.resolveTileCollision(game.tileMap);
  }

  resolveTileCollision(tileMap) {
    const minTileX = Math.floor((this.x - this.radius) / 32);
    const maxTileX = Math.floor((this.x + this.radius) / 32);
    const minTileY = Math.floor((this.y - this.radius) / 32);
    const maxTileY = Math.floor((this.y + this.radius) / 32);

    for (let ty = minTileY; ty <= maxTileY; ty++) {
      for (let tx = minTileX; tx <= maxTileX; tx++) {
        if (tileMap.isSolid(tx * 32 + 16, ty * 32 + 16)) {
          const box = { x: tx * 32, y: ty * 32, width: 32, height: 32 };
          // Closest point on box
          const cx = Math.max(box.x, Math.min(this.x, box.x + box.width));
          const cy = Math.max(box.y, Math.min(this.y, box.y + box.height));
          const dx = this.x - cx;
          const dy = this.y - cy;
          const distSq = dx * dx + dy * dy;

          if (distSq < this.radius * this.radius) {
            const dist = Math.sqrt(distSq);
            if (dist === 0) {
              this.y -= this.radius;
            } else {
              const overlap = this.radius - dist;
              this.x += (dx / dist) * overlap;
              this.y += (dy / dist) * overlap;
            }
          }
        }
      }
    }
  }
}
