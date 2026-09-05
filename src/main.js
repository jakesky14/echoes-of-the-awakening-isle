// Game Entry Point

import { Game } from './engine/Game.js';
import { sound } from './engine/Sound.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  const game = new Game(canvas);

  // Sound toggle button
  const muteBtn = document.getElementById('muteBtn');
  if (muteBtn) {
    muteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isMuted = sound.toggleMute();
      muteBtn.textContent = isMuted ? '🔇 Unmute Sound' : '🔊 Sound: ON';
      muteBtn.classList.toggle('muted', isMuted);
    });
  }

  // Fullscreen toggle button
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const container = document.getElementById('gameContainer');
      if (!document.fullscreenElement) {
        container.requestFullscreen().catch(err => console.log(err));
      } else {
        document.exitFullscreen();
      }
    });
  }

  // Audio unlock listener on first user interaction
  const unlockAudio = () => {
    sound.ensureContext();
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };
  window.addEventListener('click', unlockAudio);
  window.addEventListener('keydown', unlockAudio);

  // Launch game
  game.start();
});
