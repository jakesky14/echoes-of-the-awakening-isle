// Friendly NPCs and Training Target Dummy

import { sound } from '../engine/Sound.js';

export class NPC {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.x = data.x;
    this.y = data.y;
    this.radius = 14;
    this.dialogue = data.dialogue || [];
    this.isShop = data.isShop || false;
    this.isDummy = data.isDummy || false;

    // Dummy wobble
    this.wobbleTimer = 0;
    this.wobbleAmp = 0;
  }

  interact(game) {
    if (this.isDummy) {
      game.dialogue.show(this.name, "A sturdy straw dummy. Practice your sword slashes, spin attacks, and dodge rolls on it!");
      return;
    }

    if (this.isShop) {
      game.shop.open(game);
      return;
    }

    if (this.dialogue && this.dialogue.length > 0) {
      game.dialogue.startConversation(this.name, this.dialogue);
    }
  }

  takeDamage(amount, game, hitAngle = 0) {
    if (this.isDummy) {
      sound.swordHit();
      this.wobbleAmp = 12;
      game.particles.createDust(this.x, this.y, 4);
      game.particles.createHitSparks(this.x, this.y, hitAngle, 5);
      return true;
    }
    return false;
  }

  update(dt) {
    if (this.wobbleAmp > 0) {
      this.wobbleTimer += dt * 25;
      this.wobbleAmp = Math.max(0, this.wobbleAmp - dt * 20);
    }
  }

  render(ctx, camera) {
    const camX = camera.getRenderX();
    const camY = camera.getRenderY();
    const sx = this.x - camX;
    const sy = this.y - camY;

    ctx.save();
    ctx.translate(sx, sy);

    if (this.isDummy) {
      const wobble = Math.sin(this.wobbleTimer) * this.wobbleAmp;
      ctx.rotate((wobble * Math.PI) / 180);

      // Wooden post base
      ctx.fillStyle = '#6d4c41';
      ctx.fillRect(-3, 4, 6, 12);

      // Straw dummy body
      ctx.fillStyle = '#d7ccc8';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();

      // Straw target ring
      ctx.fillStyle = '#e53935';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();

      // Straw cross arms
      ctx.fillStyle = '#8d6e63';
      ctx.fillRect(-14, -2, 28, 4);

      ctx.restore();
      return;
    }

    // Villager Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 8, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Villager Body
    ctx.fillStyle = this.isShop ? '#1e88e5' : '#8e24aa'; // Blue merchant or purple elder robe
    ctx.beginPath();
    ctx.arc(0, 1, 9, 0, Math.PI * 2);
    ctx.fill();

    // Peach Face
    ctx.fillStyle = '#ffcc80';
    ctx.beginPath();
    ctx.arc(0, -6, 6, 0, Math.PI * 2);
    ctx.fill();

    // White Beard for Elder or Cap for Merchant
    if (this.id === 'elder') {
      ctx.fillStyle = '#eeeeee';
      ctx.beginPath();
      ctx.moveTo(-5, -4);
      ctx.lineTo(0, 4);
      ctx.lineTo(5, -4);
      ctx.closePath();
      ctx.fill();
    } else if (this.isShop) {
      ctx.fillStyle = '#fbc02d'; // Merchant beret
      ctx.fillRect(-6, -11, 12, 4);
    }

    // Friendly eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(-3, -7, 2, 2);
    ctx.fillRect(1, -7, 2, 2);

    // Interactive speech bubble icon above head
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-6, -22, 12, 9);
    ctx.fillStyle = '#000000';
    ctx.fillRect(-4, -18, 2, 2);
    ctx.fillRect(-1, -18, 2, 2);
    ctx.fillRect(2, -18, 2, 2);

    ctx.restore();
  }
}
