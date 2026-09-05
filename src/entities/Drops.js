// Collectible Drops: Rupees, Hearts, Arrows, Keys with bounce physics and magnetic attraction

import { Physics } from '../engine/Physics.js';
import { sound } from '../engine/Sound.js';

export class Drop {
  constructor(x, y, type = 'rupee', value = 1) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.value = value;
    this.radius = 8;
    this.altitude = 8;
    this.vz = 80;
    this.vx = (Math.random() - 0.5) * 50;
    this.vy = (Math.random() - 0.5) * 50;
    this.life = 0;
    this.maxLife = 25; // stays for 25 seconds
    this.isDead = false;
    this.magnetDistance = 55;
    this.magnetSpeed = 220;
    this.bobTimer = Math.random() * Math.PI * 2;
  }

  update(dt, game) {
    this.life += dt;
    this.bobTimer += dt * 4;

    // Bounce physics
    if (this.altitude > 0 || this.vz > 0) {
      this.altitude += this.vz * dt;
      this.vz -= 220 * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      if (this.altitude <= 0) {
        this.altitude = 0;
        this.vz = -this.vz * 0.4;
        if (Math.abs(this.vz) < 20) this.vz = 0;
      }
    }

    // Magnet to player
    const p = game.player;
    const distToPlayer = Physics.distance(this.x, this.y, p.x, p.y);

    if (distToPlayer < this.magnetDistance) {
      const angle = Math.atan2(p.y - this.y, p.x - this.x);
      this.x += Math.cos(angle) * this.magnetSpeed * dt;
      this.y += Math.sin(angle) * this.magnetSpeed * dt;
    }

    // Pickup check
    if (distToPlayer < p.radius + this.radius) {
      this.collect(game);
    }
  }

  collect(game) {
    if (this.isDead) return;
    this.isDead = true;

    if (this.type === 'rupee') {
      game.player.rupees += this.value;
      sound.rupee(this.value);
      game.particles.createHealSparkles(this.x, this.y);
    } else if (this.type === 'heart') {
      if (game.player.health < game.player.maxHealth) {
        game.player.health = Math.min(game.player.maxHealth, game.player.health + 2);
        sound.heart();
        game.particles.createHealSparkles(this.x, this.y);
      }
    } else if (this.type === 'arrow') {
      game.player.arrows += this.value;
      sound.rupee(1);
    } else if (this.type === 'key') {
      game.player.keys += this.value;
      sound.chestFanfare();
    }
  }

  render(ctx, camera) {
    if (this.isDead) return;
    const camX = camera.getRenderX();
    const camY = camera.getRenderY();
    const bob = Math.sin(this.bobTimer) * 2;
    const sx = this.x - camX;
    const sy = (this.y - this.altitude + bob) - camY;

    ctx.save();
    ctx.translate(sx, sy);

    // Ground Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, this.altitude - bob + 5, 7, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    if (this.type === 'rupee') {
      // Classic Zelda gem / rupee diamond
      let color = '#4caf50'; // green (1)
      let hiColor = '#a5d6a7';
      if (this.value >= 20) {
        color = '#e53935'; // red (20)
        hiColor = '#ef9a9a';
      } else if (this.value >= 5) {
        color = '#1e88e5'; // blue (5)
        hiColor = '#90caf9';
      }

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(5, -4);
      ctx.lineTo(5, 4);
      ctx.lineTo(0, 9);
      ctx.lineTo(-5, 4);
      ctx.lineTo(-5, -4);
      ctx.closePath();
      ctx.fill();

      // Rupee facet shine
      ctx.fillStyle = hiColor;
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(-5, -4);
      ctx.lineTo(0, -1);
      ctx.closePath();
      ctx.fill();
    } else if (this.type === 'heart') {
      // Floating Zelda recovery heart
      ctx.fillStyle = '#e53935';
      ctx.beginPath();
      ctx.moveTo(0, 4);
      ctx.bezierCurveTo(-6, -2, -8, -8, -3, -8);
      ctx.bezierCurveTo(0, -8, 0, -4, 0, -4);
      ctx.bezierCurveTo(0, -4, 0, -8, 3, -8);
      ctx.bezierCurveTo(8, -8, 6, -2, 0, 4);
      ctx.fill();
      // White heart shine
      ctx.fillStyle = '#ffcdd2';
      ctx.fillRect(-3, -6, 2, 2);
    } else if (this.type === 'arrow') {
      // Arrow bundle
      ctx.fillStyle = '#8d6e63';
      ctx.fillRect(-6, -1, 12, 2);
      ctx.fillStyle = '#e53935';
      ctx.fillRect(-7, -2, 2, 4);
    } else if (this.type === 'key') {
      // Golden Key
      ctx.fillStyle = '#fbc02d';
      ctx.beginPath();
      ctx.arc(0, -4, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-1, -2, 3, 9);
      ctx.fillRect(1, 3, 3, 2);
    }

    ctx.restore();
  }
}
