// Dialogue System with typewriter effect and retro speech box

import { sound } from '../engine/Sound.js';

export class DialogueSystem {
  constructor() {
    this.isActive = false;
    this.speaker = '';
    this.pages = [];
    this.currentPage = 0;
    this.displayedText = '';
    this.charIndex = 0;
    this.typeSpeed = 0.025; // seconds per char
    this.typeTimer = 0;
    this.isPageComplete = false;
  }

  show(speaker, text) {
    this.startConversation(speaker, [text]);
  }

  startConversation(speaker, pages) {
    this.isActive = true;
    this.speaker = speaker;
    this.pages = pages;
    this.currentPage = 0;
    this.charIndex = 0;
    this.displayedText = '';
    this.isPageComplete = false;
    sound.rupee(1);
  }

  update(dt, input) {
    if (!this.isActive) return;

    const currentFullText = this.pages[this.currentPage] || '';

    // Typewriter effect
    if (!this.isPageComplete) {
      this.typeTimer += dt;
      if (this.typeTimer >= this.typeSpeed) {
        this.typeTimer = 0;
        this.charIndex++;
        this.displayedText = currentFullText.substring(0, this.charIndex);

        if (this.charIndex % 3 === 0) {
          sound.playTone(380 + (this.charIndex % 5) * 30, 'sine', 0.03, 0.15);
        }

        if (this.charIndex >= currentFullText.length) {
          this.isPageComplete = true;
        }
      }
    }

    // Advance dialogue on Space / Enter / Left Click / E
    if (input.isJustPressed(' ') || input.isJustPressed('enter') || input.isJustPressed('e') || input.isLeftJustPressed()) {
      if (!this.isPageComplete) {
        // Skip typewriter immediately to end of page
        this.displayedText = currentFullText;
        this.charIndex = currentFullText.length;
        this.isPageComplete = true;
      } else {
        // Next page or close
        this.currentPage++;
        if (this.currentPage >= this.pages.length) {
          this.isActive = false;
        } else {
          this.charIndex = 0;
          this.displayedText = '';
          this.isPageComplete = false;
        }
      }
    }
  }

  render(ctx) {
    if (!this.isActive) return;

    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const boxW = Math.min(560, w - 40);
    const boxH = 100;
    const boxX = (w - boxW) / 2;
    const boxY = h - boxH - 24;

    ctx.save();
    // Dark background box
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.fillRect(boxX, boxY, boxW, boxH);

    // Gold/Slate frame
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 3;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Speaker Name Tag
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(boxX + 16, boxY - 14, 130, 20);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(this.speaker, boxX + 22, boxY);

    // Dialogue Text
    ctx.fillStyle = '#ffffff';
    ctx.font = '13px monospace';

    // Simple word wrapping
    this.wrapText(ctx, this.displayedText, boxX + 20, boxY + 28, boxW - 40, 18);

    // Prompt to advance
    if (this.isPageComplete) {
      const promptBlink = Math.floor(Date.now() / 400) % 2 === 0;
      if (promptBlink) {
        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'right';
        ctx.fillText('▼ [SPACE / E]', boxX + boxW - 20, boxY + boxH - 12);
      }
    }

    ctx.restore();
  }

  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let currY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, currY);
        line = words[n] + ' ';
        currY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currY);
  }
}
