// Projectiles: Hero Arrows, Octorok Rocks, Boss Shockwaves, Deflected Missiles

import { Physics } from '../engine/Physics.js';
import { sound } from '../engine/Sound.js';

export class Projectile {
  constructor(x, y, vx, vy, options = {}) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = options.radius || 4;
    this.damage = options.damage || 1;
    this.owner = options.owner || 'player'; // 'player' or 'enemy'
    this.type = options.type || 'arrow';
    this.maxLife = options.maxLife || 2.5;
    this.life = 0;
    this.isDead = false;
    this.deflectable = options.deflectable ?? true;
    this.color = options.color || '#fff';
    this.rotation = Math.atan2(vy, vx);
  }

  update(dt, game) {
    this.life += dt;
    if (this.life >= this.maxLife) {
      this.isDead = true;
      return;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Check collision with tilemap walls
    if (game.tileMap.isSolid(this.x, this.y)) {
      this.isDead = true;
      game.particles.createDust(this.x, this.y, 3);
      return;
    }

    // Check collision with grass
    for (const prop of game.props) {
      if (prop.cut && !prop.isCut && Physics.circleCollision(this, prop)) {
        prop.cut(game);
        if (this.type === 'arrow' || this.type === 'rock') {
          this.isDead = true;
          return;
        }
      }
    }

    // Player Projectiles colliding with Enemies
    if (this.owner === 'player') {
      for (const enemy of game.enemies) {
        if (!enemy.isDead && Physics.circleCollision(this, enemy)) {
          enemy.takeDamage(this.damage, game, this.rotation);
          this.isDead = true;
          game.particles.createHitSparks(this.x, this.y, this.rotation, 5);
          return;
        }
      }
    }

    // Enemy Projectiles colliding with Player
    if (this.owner === 'enemy') {
      const player = game.player;
      if (Physics.circleCollision(this, player)) {
        // Check if player is dodging (invulnerability frames!)
        if (player.isDodging) {
          // Dodged! (no damage taken)
          return;
        }

        // Check if player is shielding towards projectile
        if (player.isShielding) {
          const projAngle = Math.atan2(this.y - player.y, this.x - player.x);
          if (Physics.isAngleInArc(projAngle, player.aimAngle, Math.PI * 0.7)) {
            // Deflect projectile!
            sound.shieldBlock();
            this.owner = 'player';
            this.vx = -this.vx * 1.3;
            this.vy = -this.vy * 1.3;
            this.rotation = Math.atan2(this.vy, this.vx);
            this.life = 0;
            game.camera.shake(2, 0.1);
            game.particles.createHitSparks(this.x, this.y, this.rotation, 7);
            return;
          }
        }

        // Player takes hit
        player.takeDamage(this.damage, game, this.rotation);
        this.isDead = true;
      }
    }
  }

  render(ctx, camera) {
    const camX = camera.getRenderX();
    const camY = camera.getRenderY();
    const sx = this.x - camX;
    const sy = this.y - camY;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(this.rotation);

    if (this.type === 'arrow') {
      // Crisp pixel wooden arrow with iron tip and feathers
      ctx.fillStyle = '#8d6e63';
      ctx.fillRect(-10, -1.5, 20, 3);
      // Arrowhead
      ctx.fillStyle = '#cfd8dc';
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(4, -4);
      ctx.lineTo(4, 4);
      ctx.closePath();
      ctx.fill();
      // Fletching (red feathers)
      ctx.fillStyle = '#e53935';
      ctx.fillRect(-10, -3, 3, 6);
    } else if (this.type === 'rock') {
      // Spat rock
      ctx.fillStyle = '#795548';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#a1887f';
      ctx.fillRect(-2, -2, 3, 3);
    } else if (this.type === 'energy') {
      // Magic glowing energy ball
      ctx.fillStyle = '#ab47bc';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f3e5f5';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius - 1, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
