// Interactive World Objects: Slashable Grass, Pots, Chests, Switches, Doors

import { Physics } from '../engine/Physics.js';
import { sound } from '../engine/Sound.js';

export class GrassPatch {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 14;
    this.isCut = false;
    this.sway = Math.random() * Math.PI;
  }

  update(dt) {
    this.sway += dt * 3;
  }

  cut(game) {
    if (this.isCut) return;
    this.isCut = true;
    sound.grassCut();
    game.particles.createGrassCut(this.x, this.y);

    // Drop loot: 35% chance Rupee, 20% Heart, 15% Arrow
    const rand = Math.random();
    if (rand < 0.35) {
      const val = Math.random() > 0.8 ? 5 : 1;
      game.spawnDrop(this.x, this.y, 'rupee', val);
    } else if (rand < 0.55) {
      game.spawnDrop(this.x, this.y, 'heart', 1);
    } else if (rand < 0.70) {
      game.spawnDrop(this.x, this.y, 'arrow', 3);
    }
  }

  render(ctx, camera) {
    if (this.isCut) return;
    const camX = camera.getRenderX();
    const camY = camera.getRenderY();
    const sx = this.x - camX;
    const sy = this.y - camY;

    // Wind sway offset
    const swayOffset = Math.sin(this.sway) * 1.5;

    // Crisp pixelated Zelda grass clump
    ctx.save();
    ctx.translate(sx, sy);

    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(0, 6, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Grass blades
    ctx.fillStyle = '#388e3c';
    ctx.beginPath();
    ctx.moveTo(-10, 6);
    ctx.lineTo(-6 + swayOffset, -8);
    ctx.lineTo(-2, 6);
    ctx.lineTo(swayOffset, -12);
    ctx.lineTo(2, 6);
    ctx.lineTo(6 + swayOffset, -8);
    ctx.lineTo(10, 6);
    ctx.closePath();
    ctx.fill();

    // Highlight blades
    ctx.fillStyle = '#81c784';
    ctx.beginPath();
    ctx.moveTo(-5, 6);
    ctx.lineTo(-2 + swayOffset, -9);
    ctx.lineTo(0, 6);
    ctx.lineTo(2 + swayOffset, -10);
    ctx.lineTo(4, 6);
    ctx.closePath();
    ctx.fill();

    // Small flower in center
    ctx.fillStyle = '#ffeb3b';
    ctx.fillRect(-2 + swayOffset * 0.5, -2, 4, 4);
    ctx.fillStyle = '#f44336';
    ctx.fillRect(-1 + swayOffset * 0.5, -1, 2, 2);

    ctx.restore();
  }
}

export class Pot {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 12;
    this.isCarried = false;
    this.isFlying = false;
    this.isBroken = false;
    this.vx = 0;
    this.vy = 0;
    this.altitude = 0;
    this.vAltitude = 0;
  }

  pickUp() {
    this.isCarried = true;
  }

  throw(angle, speed = 280) {
    this.isCarried = false;
    this.isFlying = true;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.altitude = 16;
    this.vAltitude = 40; // slight arc
  }

  break(game) {
    if (this.isBroken) return;
    this.isBroken = true;
    sound.potSmash();
    game.particles.createDust(this.x, this.y, 8);
    game.particles.createHitSparks(this.x, this.y, 0, 6);

    // 50% drop rate
    if (Math.random() < 0.6) {
      const val = Math.random() > 0.75 ? 5 : 1;
      game.spawnDrop(this.x, this.y, 'rupee', val);
    } else if (Math.random() < 0.4) {
      game.spawnDrop(this.x, this.y, 'heart', 1);
    }
  }

  update(dt, game) {
    if (this.isBroken) return;

    if (this.isCarried) {
      this.x = game.player.x;
      this.y = game.player.y - 20; // above player head
      return;
    }

    if (this.isFlying) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.altitude += this.vAltitude * dt;
      this.vAltitude -= 140 * dt; // gravity

      // Check collision with tilemap walls
      if (game.tileMap.isSolid(this.x, this.y)) {
        this.break(game);
        return;
      }

      // Check collision with enemies
      for (const enemy of game.enemies) {
        if (!enemy.isDead && Physics.circleCollision(this, enemy)) {
          enemy.takeDamage(2, game, Math.atan2(this.vy, this.vx));
          this.break(game);
          return;
        }
      }

      // Land on ground
      if (this.altitude <= 0) {
        this.break(game);
      }
    }
  }

  render(ctx, camera) {
    if (this.isBroken) return;
    const camX = camera.getRenderX();
    const camY = camera.getRenderY();
    const sx = this.x - camX;
    const sy = (this.y - this.altitude) - camY;

    ctx.save();
    ctx.translate(sx, sy);

    // Ground shadow when flying or carried
    if (this.altitude > 0 || this.isCarried) {
      const shadowY = this.altitude;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.ellipse(0, shadowY + 6, 10, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ceramic clay pot
    ctx.fillStyle = '#b56538';
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();

    // Pot rim
    ctx.fillStyle = '#d4804d';
    ctx.fillRect(-6, -11, 12, 4);
    ctx.fillStyle = '#8f4621';
    ctx.fillRect(-4, -10, 8, 2);

    // Pot specular shine
    ctx.fillStyle = '#f7ab7e';
    ctx.beginPath();
    ctx.arc(-3, -3, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

export class Chest {
  constructor(id, x, y, reward, label) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.radius = 16;
    this.reward = reward;
    this.label = label;
    this.isOpen = false;
    this.openProgress = 0;
  }

  open(game) {
    if (this.isOpen) return;
    this.isOpen = true;
    sound.chestFanfare();
    game.particles.createShockwave(this.x, this.y, 40, 120, 'rgba(255, 230, 80, 0.8)', 4);
    game.particles.createHealSparkles(this.x, this.y - 16);

    // Award item
    game.awardItem(this.reward, this.label);
  }

  update(dt) {
    if (this.isOpen && this.openProgress < 1) {
      this.openProgress = Math.min(1, this.openProgress + dt * 4);
    }
  }

  render(ctx, camera) {
    const camX = camera.getRenderX();
    const camY = camera.getRenderY();
    const sx = this.x - camX;
    const sy = this.y - camY;

    ctx.save();
    ctx.translate(sx, sy);

    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(-14, 4, 28, 12);

    // Chest base
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(-12, -4, 24, 16);
    ctx.fillStyle = '#5c3818';
    ctx.strokeRect(-12, -4, 24, 16);

    // Gold trim / latch
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(-3, 0, 6, 6);
    ctx.fillRect(-12, 10, 24, 2);

    // Lid (animates open)
    const lidOffset = this.openProgress * 8;
    ctx.fillStyle = '#a06530';
    ctx.fillRect(-13, -12 - lidOffset, 26, 10);
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(-13, -12 - lidOffset, 26, 2);

    if (this.isOpen) {
      // Golden glow from open chest
      ctx.fillStyle = 'rgba(255, 235, 120, 0.6)';
      ctx.fillRect(-8, -6, 16, 6);
    }

    ctx.restore();
  }
}

export class DungeonDoor {
  constructor(id, x, y, width, height, requiresKey = true) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.requiresKey = requiresKey;
    this.isOpen = false;
    this.openOffset = 0;
  }

  tryUnlock(game) {
    if (this.isOpen) return true;
    if (this.requiresKey) {
      if (game.player.keys > 0) {
        game.player.keys--;
        this.unlock(game);
        return true;
      } else {
        if (game.dialogue && game.dialogue.show) {
          game.dialogue.show("Door is locked", "It has a mysterious skull lock. You need the Sunken Temple Key!");
        }
        return false;
      }
    } else {
      this.unlock(game);
      return true;
    }
  }

  unlock(game) {
    this.isOpen = true;
    sound.puzzleSolved();
    game.particles.createDust(this.x + this.width / 2, this.y + this.height / 2, 12);
  }

  update(dt) {
    if (this.isOpen && this.openOffset < this.height) {
      this.openOffset = Math.min(this.height, this.openOffset + dt * 60);
    }
  }

  render(ctx, camera) {
    if (this.openOffset >= this.height) return; // fully open

    const camX = camera.getRenderX();
    const camY = camera.getRenderY();
    const sx = this.x - camX;
    const sy = this.y - camY - this.openOffset;

    ctx.save();
    // Heavy iron portcullis / boss door
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(sx, sy, this.width, this.height);

    // Iron bars & rivets
    ctx.fillStyle = '#1a252f';
    for (let bx = 0; bx < this.width; bx += 16) {
      ctx.fillRect(sx + bx, sy, 4, this.height);
    }

    if (this.requiresKey && !this.isOpen) {
      // Golden Keyhole
      ctx.fillStyle = '#f1c40f';
      const cx = sx + this.width / 2;
      const cy = sy + this.height / 2;
      ctx.beginPath();
      ctx.arc(cx, cy - 3, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(cx - 2, cy - 3, 4, 8);
    }
    ctx.restore();
  }
}

export class PressureSwitch {
  constructor(id, x, y, onActivate) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.radius = 16;
    this.isPressed = false;
    this.onActivate = onActivate;
  }

  update(game) {
    if (this.isPressed) return;

    // Check if player or pot is standing on switch
    const distToPlayer = Physics.distance(this.x, this.y, game.player.x, game.player.y);
    let pressed = distToPlayer < this.radius + 8;

    if (!pressed) {
      for (const prop of game.props) {
        if (prop instanceof Pot && !prop.isCarried && !prop.isFlying && !prop.isBroken) {
          if (Physics.distance(this.x, this.y, prop.x, prop.y) < this.radius + 6) {
            pressed = true;
            break;
          }
        }
      }
    }

    if (pressed) {
      this.isPressed = true;
      sound.puzzleSolved();
      game.particles.createShockwave(this.x, this.y, 25, 100, 'rgba(80, 220, 100, 0.7)');
      if (this.onActivate) this.onActivate(game);
    }
  }

  render(ctx, camera) {
    const camX = camera.getRenderX();
    const camY = camera.getRenderY();
    const sx = this.x - camX;
    const sy = this.y - camY;

    ctx.save();
    ctx.translate(sx, sy);

    // Stone plate border
    ctx.fillStyle = '#546e7a';
    ctx.fillRect(-14, -14, 28, 28);

    // Inner button (sunken when pressed)
    if (this.isPressed) {
      ctx.fillStyle = '#263238';
      ctx.fillRect(-10, -10, 20, 20);
      ctx.fillStyle = '#4caf50'; // glowing green rune
      ctx.fillRect(-4, -4, 8, 8);
    } else {
      ctx.fillStyle = '#78909c';
      ctx.fillRect(-12, -12, 24, 24);
      ctx.fillStyle = '#f44336'; // red indicator
      ctx.fillRect(-4, -4, 8, 8);
    }

    ctx.restore();
  }
}
