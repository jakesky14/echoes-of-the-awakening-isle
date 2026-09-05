// Green / Red Slime (Chuchu) - hops with telegraphed squash & leap

import { Enemy, AI_STATE } from './Enemy.js';
import { Physics } from '../../engine/Physics.js';

export class Slime extends Enemy {
  constructor(x, y) {
    super(x, y, 12, 2);
    this.speed = 45;
    this.hopTimer = Math.random() * 1.5;
    this.isAirborne = false;
    this.jumpProgress = 0;
    this.jumpDuration = 0.45;
    this.targetHopX = x;
    this.targetHopY = y;
    this.origHopX = x;
    this.origHopY = y;
  }

  updateAI(dt, game) {
    const p = game.player;
    const distToPlayer = Physics.distance(this.x, this.y, p.x, p.y);

    if (this.isAirborne) {
      this.jumpProgress += dt / this.jumpDuration;
      if (this.jumpProgress >= 1) {
        this.jumpProgress = 1;
        this.isAirborne = false;
        this.x = this.targetHopX;
        this.y = this.targetHopY;
        this.hopTimer = 1.0 + Math.random() * 0.8;
        game.particles.createDust(this.x, this.y, 3);
      } else {
        // Interpolate along jump arc
        this.x = this.origHopX + (this.targetHopX - this.origHopX) * this.jumpProgress;
        this.y = this.origHopY + (this.targetHopY - this.origHopY) * this.jumpProgress;
      }
      return;
    }

    this.hopTimer -= dt;
    if (this.hopTimer <= 0) {
      // Initiate jump
      this.isAirborne = true;
      this.jumpProgress = 0;
      this.origHopX = this.x;
      this.origHopY = this.y;

      let hopAngle = Math.random() * Math.PI * 2;
      let hopDist = 36;
      if (distToPlayer < this.sightRange) {
        // Hop towards player
        hopAngle = Math.atan2(p.y - this.y, p.x - this.x);
        hopDist = 48;
      }

      this.targetHopX = this.x + Math.cos(hopAngle) * hopDist;
      this.targetHopY = this.y + Math.sin(hopAngle) * hopDist;

      // Don't hop into impassable walls
      if (game.tileMap.isSolid(this.targetHopX, this.targetHopY)) {
        this.targetHopX = this.x;
        this.targetHopY = this.y;
      }
    }
  }

  render(ctx, camera) {
    const camX = camera.getRenderX();
    const camY = camera.getRenderY();
    const sx = this.x - camX;
    const sy = this.y - camY;

    // Jump height
    const jumpHeight = this.isAirborne ? Math.sin(this.jumpProgress * Math.PI) * 16 : 0;

    ctx.save();
    ctx.translate(sx, sy);

    // Landing target telegraph / shadow
    const shadowScale = this.isAirborne ? Math.max(0.4, 1 - (jumpHeight / 24)) : 1;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 4, 10 * shadowScale, 4 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Slime body with bounce squash & stretch
    const stretchY = this.isAirborne ? 1.3 : 1.0;
    const stretchX = this.isAirborne ? 0.8 : 1.0;

    ctx.translate(0, -jumpHeight);
    ctx.scale(stretchX, stretchY);

    if (this.hurtFlash > 0) {
      ctx.fillStyle = '#ffffff';
    } else {
      ctx.fillStyle = '#43a047'; // Green jelly
    }

    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();

    // Gelatinous gloss shine
    ctx.fillStyle = '#a5d6a7';
    ctx.beginPath();
    ctx.arc(-3, -4, 4, 0, Math.PI * 2);
    ctx.fill();

    // Cute Chuchu eyes
    ctx.fillStyle = '#fff';
    ctx.fillRect(-5, -2, 3, 5);
    ctx.fillRect(2, -2, 3, 5);
    ctx.fillStyle = '#000';
    ctx.fillRect(-4, 0, 2, 3);
    ctx.fillRect(3, 0, 2, 3);

    ctx.restore();
  }
}
