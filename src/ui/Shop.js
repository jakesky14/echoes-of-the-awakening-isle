// Village Item Shop Interface

import { sound } from '../engine/Sound.js';

export class ShopInterface {
  constructor() {
    this.isOpen = false;
    this.items = [
      { id: 'potion', name: 'Red Potion', desc: 'Restores all hearts immediately', cost: 10 },
      { id: 'arrows', name: 'Bundle of 15 Arrows', desc: 'Ammunition for your Hunter\'s Bow', cost: 15 },
      { id: 'heart', name: 'Heart Container', desc: '+1 Permanent Max Heart container', cost: 40 }
    ];
  }

  open(game) {
    this.isOpen = true;
    sound.rupee(5);
  }

  close() {
    this.isOpen = false;
  }

  update(input, game) {
    if (!this.isOpen) return;

    if (input.isJustPressed('escape') || input.isJustPressed('e')) {
      this.close();
      return;
    }

    if (input.isJustPressed('1')) this.buy(0, game);
    if (input.isJustPressed('2')) this.buy(1, game);
    if (input.isJustPressed('3')) this.buy(2, game);
  }

  buy(index, game) {
    const item = this.items[index];
    if (!item) return;
    const p = game.player;

    if (p.rupees < item.cost) {
      sound.playTone(180, 'sawtooth', 0.15, 0.4); // buzzer
      return;
    }

    p.rupees -= item.cost;
    sound.chestFanfare();

    if (item.id === 'potion') {
      p.health = p.maxHealth;
      game.particles.createHealSparkles(p.x, p.y);
    } else if (item.id === 'arrows') {
      p.arrows += 15;
    } else if (item.id === 'heart') {
      p.maxHealth += 2;
      p.health = p.maxHealth;
      p.inventory.heartContainers++;
      game.particles.createHealSparkles(p.x, p.y);
    }
  }

  render(ctx, game) {
    if (!this.isOpen) return;

    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const modalW = 500;
    const modalH = 290;
    const mx = (w - modalW) / 2;
    const my = (h - modalH) / 2;
    const p = game.player;

    ctx.save();
    // Backdrop
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, w, h);

    // Shop Frame
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(mx, my, modalW, modalH);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.strokeRect(mx, my, modalW, modalH);

    // Header
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 16px monospace';
    ctx.fillText("TARIN'S VILLAGE GOODS", mx + 24, my + 32);

    // Wallet display
    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`Your Rupees: ${p.rupees}`, mx + modalW - 170, my + 32);

    ctx.strokeStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(mx + 20, my + 46);
    ctx.lineTo(mx + modalW - 20, my + 46);
    ctx.stroke();

    // Items list
    this.items.forEach((item, idx) => {
      const iy = my + 75 + idx * 56;
      const canAfford = p.rupees >= item.cost;

      ctx.fillStyle = canAfford ? '#1e293b' : '#182030';
      ctx.fillRect(mx + 24, iy - 14, modalW - 48, 46);
      ctx.strokeStyle = canAfford ? '#f59e0b' : '#475569';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(mx + 24, iy - 14, modalW - 48, 46);

      // Key shortcut tag [1], [2], [3]
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(`[${idx + 1}]`, mx + 36, iy + 14);

      // Item Name
      ctx.fillStyle = canAfford ? '#ffffff' : '#94a3b8';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(item.name, mx + 70, iy + 6);

      // Item Description
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.fillText(item.desc, mx + 70, iy + 22);

      // Price Tag
      ctx.fillStyle = canAfford ? '#4ade80' : '#ef4444';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${item.cost} Rupees`, mx + modalW - 44, iy + 14);
      ctx.textAlign = 'left';
    });

    // Close Hint
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText('Press [1], [2], or [3] to buy | [E / ESC] Close', mx + 24, my + modalH - 16);

    ctx.restore();
  }
}
