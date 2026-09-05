// Inventory and Equipment Screen (Tab / I)

export class InventoryScreen {
  constructor() {
    this.isOpen = false;
  }

  toggle() {
    this.isOpen = !this.isOpen;
  }

  update(input) {
    if (input.isJustPressed('tab') || input.isJustPressed('i') || input.isJustPressed('escape')) {
      this.toggle();
    }
  }

  render(ctx, game) {
    if (!this.isOpen) return;

    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const modalW = 540;
    const modalH = 340;
    const mx = (w - modalW) / 2;
    const my = (h - modalH) / 2;
    const p = game.player;

    ctx.save();
    // Backdrop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, w, h);

    // Modal Background
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(mx, my, modalW, modalH);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.strokeRect(mx, my, modalW, modalH);

    // Title Header
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 16px monospace';
    ctx.fillText("HERO'S INVENTORY & STATUS", mx + 24, my + 34);

    // Close Hint
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText('[TAB / I] CLOSE', mx + modalW - 120, my + 34);

    // Dividers
    ctx.strokeStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(mx + 20, my + 48);
    ctx.lineTo(mx + modalW - 20, my + 48);
    ctx.stroke();

    // Left Column: Stats & Equipment
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('EQUIPMENT:', mx + 24, my + 75);

    const items = [
      { name: "Master Blade", desc: "Left Click slash / Hold for 360° Spin Attack", owned: true },
      { name: "Hylian Shield", desc: "Press [E] to block & deflect projectiles", owned: true },
      { name: "Hunter's Bow", desc: p.hasBow ? `Right Click to fire (${p.arrows} arrows)` : "Hidden in the North Wilds", owned: p.hasBow },
      { name: "Sunken Temple Key", desc: p.keys > 0 ? "Unlocks the Temple Gate" : "Hidden in the Whispering Forest", owned: p.keys > 0 }
    ];

    items.forEach((item, idx) => {
      const iy = my + 102 + idx * 44;
      // Item Box
      ctx.fillStyle = item.owned ? '#0f172a' : '#1e293b';
      ctx.fillRect(mx + 24, iy - 14, 280, 36);
      ctx.strokeStyle = item.owned ? '#38bdf8' : '#475569';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(mx + 24, iy - 14, 280, 36);

      ctx.fillStyle = item.owned ? '#38bdf8' : '#64748b';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(item.name, mx + 34, iy + 2);

      ctx.fillStyle = item.owned ? '#cbd5e1' : '#475569';
      ctx.font = '10px monospace';
      ctx.fillText(item.desc, mx + 34, iy + 16);
    });

    // Right Column: Quests & Controls
    const rx = mx + 330;
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('QUEST LOG:', rx, my + 75);

    const quests = [
      { text: "1. Talk to Elder Ulrira", done: true },
      { text: "2. Find Hunter's Bow (North)", done: p.hasBow },
      { text: "3. Find Temple Key (Forest)", done: p.keys > 0 },
      { text: "4. Defeat the Golem Lord!", done: game.enemies.some(e => e.isBoss && e.isDead) }
    ];

    quests.forEach((q, idx) => {
      const qy = my + 102 + idx * 24;
      ctx.fillStyle = q.done ? '#4ade80' : '#94a3b8';
      ctx.font = '11px monospace';
      ctx.fillText(`${q.done ? '✓ ' : '○ '}${q.text}`, rx, qy);
    });

    // Controls Legend at bottom
    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('CONTROLS QUICK REFERENCE:', rx, my + 215);

    const controls = [
      "WASD: Move hero",
      "Mouse: Aim attacks / skills",
      "L-Click: Sword combo",
      "Hold L-Click: 360° Spin",
      "Space: Dodge Roll (i-frames)",
      "R-Click: Shoot Bow (aimed)",
      "E: Shield Deflect / Interact"
    ];

    controls.forEach((c, idx) => {
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '10px monospace';
      ctx.fillText(c, rx, my + 233 + idx * 14);
    });

    ctx.restore();
  }
}
