// Retro Zelda HUD: Heart Containers, Stamina Gauge, Rupee Counter, Keys, Weapons, and Minimap

export class HUD {
  constructor() {
    this.showMinimap = true;
  }

  render(ctx, game) {
    const player = game.player;

    // --- 1. Heart Containers (Top Left) ---
    this.renderHearts(ctx, player);

    // --- 2. Stamina Wheel / Gauge (Near Player or Top Left) ---
    this.renderStamina(ctx, player, game.camera);

    // --- 3. Rupee Counter & Keys (Top Left below Hearts) ---
    this.renderCounters(ctx, player);

    // --- 4. Equipped Weapon Indicators (Top Right / Bottom Right) ---
    this.renderWeaponSlots(ctx, player);

    // --- 5. Boss Health Bar (Top Center if Boss is active) ---
    this.renderBossHealth(ctx, game);

    // --- 6. Minimap (Top Right) ---
    if (this.showMinimap) {
      this.renderMinimap(ctx, game);
    }

    // --- 7. Mouse Aim Reticle / Crosshair ---
    this.renderCrosshair(ctx, game);
  }

  renderHearts(ctx, player) {
    const totalHearts = Math.ceil(player.maxHealth / 2);
    const startX = 20;
    const startY = 22;
    const heartSpacing = 22;

    for (let i = 0; i < totalHearts; i++) {
      const hx = startX + (i % 10) * heartSpacing;
      const hy = startY + Math.floor(i / 10) * 20;
      const hpRemaining = player.health - i * 2;

      this.drawHeart(ctx, hx, hy, hpRemaining >= 2 ? 1 : hpRemaining === 1 ? 0.5 : 0);
    }
  }

  drawHeart(ctx, x, y, fillState) {
    ctx.save();
    ctx.translate(x, y);

    // Heart Outline & Background
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.moveTo(0, 5);
    ctx.bezierCurveTo(-7, -2, -9, -9, -3.5, -9);
    ctx.bezierCurveTo(0, -9, 0, -5, 0, -5);
    ctx.bezierCurveTo(0, -5, 0, -9, 3.5, -9);
    ctx.bezierCurveTo(9, -9, 7, -2, 0, 5);
    ctx.fill();

    // Heart Fill
    if (fillState > 0) {
      ctx.fillStyle = '#e53935'; // Red heart
      ctx.beginPath();
      if (fillState === 1) {
        // Full heart
        ctx.moveTo(0, 4);
        ctx.bezierCurveTo(-6, -2, -8, -8, -3, -8);
        ctx.bezierCurveTo(0, -8, 0, -4, 0, -4);
        ctx.bezierCurveTo(0, -4, 0, -8, 3, -8);
        ctx.bezierCurveTo(8, -8, 6, -2, 0, 4);
      } else {
        // Half heart
        ctx.moveTo(0, 4);
        ctx.bezierCurveTo(-6, -2, -8, -8, -3, -8);
        ctx.bezierCurveTo(0, -8, 0, -4, 0, -4);
        ctx.lineTo(0, 4);
      }
      ctx.fill();

      // Specular highlight
      ctx.fillStyle = '#ffcdd2';
      ctx.fillRect(-3, -7, 2, 2);
    }

    ctx.restore();
  }

  renderStamina(ctx, player, camera) {
    // Render stamina wheel directly adjacent to player while not full
    if (player.stamina < player.maxStamina) {
      const camX = camera.getRenderX();
      const camY = camera.getRenderY();
      const sx = player.x - camX;
      const sy = player.y - camY;

      ctx.save();
      ctx.beginPath();
      ctx.arc(sx, sy, 22, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = 4;
      ctx.stroke();

      const pct = Math.max(0, player.stamina / player.maxStamina);
      ctx.beginPath();
      ctx.arc(sx, sy, 22, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2);
      ctx.strokeStyle = player.staminaExhausted ? '#e53935' : '#4caf50';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();
    }
  }

  renderCounters(ctx, player) {
    ctx.save();
    // Rupee Icon & Text
    const rx = 22;
    const ry = 56;

    // Green rupee
    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.moveTo(rx, ry - 6);
    ctx.lineTo(rx + 4, ry - 2);
    ctx.lineTo(rx + 4, ry + 3);
    ctx.lineTo(rx, ry + 7);
    ctx.lineTo(rx - 4, ry + 3);
    ctx.lineTo(rx - 4, ry - 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`x ${player.rupees}`, rx + 10, ry + 4);

    // Key Icon & Text
    if (player.keys > 0) {
      const kx = rx + 75;
      ctx.fillStyle = '#fbc02d';
      ctx.beginPath();
      ctx.arc(kx, ry - 2, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(kx - 1, ry - 1, 2, 7);
      ctx.fillRect(kx, ry + 2, 2, 2);

      ctx.fillStyle = '#ffffff';
      ctx.fillText(`x ${player.keys}`, kx + 8, ry + 4);
    }

    // Arrows count if bow unlocked
    if (player.hasBow) {
      const ax = rx + (player.keys > 0 ? 140 : 75);
      ctx.fillStyle = '#cfd8dc';
      ctx.fillRect(ax - 2, ry - 5, 2, 10);
      ctx.fillStyle = '#e53935';
      ctx.fillRect(ax - 3, ry - 6, 4, 3);

      ctx.fillStyle = '#ffffff';
      ctx.fillText(`x ${player.arrows}`, ax + 8, ry + 4);
    }

    ctx.restore();
  }

  renderWeaponSlots(ctx, player) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const slotY = h - 50;

    // Primary [L-CLICK]: Sword
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(w - 130, slotY, 44, 40);
    ctx.strokeStyle = '#81d4fa';
    ctx.lineWidth = 2;
    ctx.strokeRect(w - 130, slotY, 44, 40);

    // Sword icon
    ctx.fillStyle = '#cfd8dc';
    ctx.fillRect(w - 109, slotY + 8, 3, 18);
    ctx.fillStyle = '#1976d2';
    ctx.fillRect(w - 113, slotY + 20, 11, 3);

    ctx.fillStyle = '#fff';
    ctx.font = '9px monospace';
    ctx.fillText('L-CLICK', w - 128, slotY + 36);

    // Secondary [R-CLICK / Q]: Bow or Shield
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(w - 74, slotY, 44, 40);
    ctx.strokeStyle = player.hasBow ? '#ffd54f' : '#90caf9';
    ctx.lineWidth = 2;
    ctx.strokeRect(w - 74, slotY, 44, 40);

    if (player.hasBow) {
      // Bow icon
      ctx.strokeStyle = '#8d6e63';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(w - 52, slotY + 18, 10, -Math.PI * 0.4, Math.PI * 0.4);
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = '9px monospace';
      ctx.fillText('R-CLICK', w - 72, slotY + 36);
    } else {
      // Shield icon
      ctx.fillStyle = '#1565c0';
      ctx.fillRect(w - 56, slotY + 8, 8, 14);
      ctx.fillStyle = '#ffd54f';
      ctx.strokeRect(w - 56, slotY + 8, 8, 14);
      ctx.fillStyle = '#fff';
      ctx.font = '9px monospace';
      ctx.fillText('[E] SHIELD', w - 74, slotY + 36);
    }

    ctx.restore();
  }

  renderBossHealth(ctx, game) {
    const boss = game.enemies.find(e => e.isBoss && !e.isDead);
    if (!boss) return;

    const w = ctx.canvas.width;
    const barWidth = 320;
    const barHeight = 16;
    const barX = (w - barWidth) / 2;
    const barY = 24;

    ctx.save();
    // Boss Title
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(boss.name.toUpperCase(), w / 2, barY - 6);

    // Background Bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);
    ctx.strokeStyle = '#d32f2f';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);

    // Health Fill
    const pct = Math.max(0, boss.health / boss.maxHealth);
    ctx.fillStyle = boss.phase === 2 ? '#ff5722' : '#d32f2f';
    ctx.fillRect(barX, barY, barWidth * pct, barHeight);

    ctx.restore();
  }

  renderMinimap(ctx, game) {
    const mapW = 90;
    const mapH = 75;
    const mx = ctx.canvas.width - mapW - 16;
    const my = 16;

    ctx.save();
    // Minimap frame
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(mx, my, mapW, mapH);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.strokeRect(mx, my, mapW, mapH);

    // Player indicator dot
    const p = game.player;
    const worldW = game.tileMap.worldWidth;
    const worldH = game.tileMap.worldHeight;
    const px = mx + (p.x / worldW) * mapW;
    const py = my + (p.y / worldH) * mapH;

    ctx.fillStyle = '#4ade80'; // Green player dot
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();

    // Boss indicator dot
    const boss = game.enemies.find(e => e.isBoss && !e.isDead);
    if (boss) {
      const bx = mx + (boss.x / worldW) * mapW;
      const by = my + (boss.y / worldH) * mapH;
      ctx.fillStyle = '#ef4444'; // Red skull dot
      ctx.beginPath();
      ctx.arc(bx, by, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  renderCrosshair(ctx, game) {
    const mx = game.input.mouse.x;
    const my = game.input.mouse.y;

    ctx.save();
    ctx.translate(mx, my);

    // Precision Aim Reticle
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.stroke();

    // Reticle pips
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.lineTo(0, -5);
    ctx.moveTo(0, 5);
    ctx.lineTo(0, 11);
    ctx.moveTo(-11, 0);
    ctx.lineTo(-5, 0);
    ctx.moveTo(5, 0);
    ctx.lineTo(11, 0);
    ctx.stroke();

    // Center red pip
    ctx.fillStyle = '#e53935';
    ctx.fillRect(-1, -1, 2, 2);

    ctx.restore();
  }
}
