# Echoes of the Awakening Isle

A 2D top-down action RPG inspired by *The Legend of Zelda: Link's Awakening*, featuring real-time aiming and dodge roll combat with invulnerability frames, open-world exploration, puzzles, and a multi-phase boss encounter.

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Zero Dependencies](https://img.shields.io/badge/dependencies-none-brightgreen.svg)

---

## Features

- **Open World Exploration**: Handcrafted connected world featuring Mabe Village, Verdant Wilds with river crossings, Whispering Forest ruins, and the Sunken Temple Dungeon.
- **Real-Time Aimed Combat**: Mouse-aimed crosshair for directional 3-hit sword combos, hold-to-charge 360° spin attacks, aimed bow shots, and shield deflection.
- **Dodge Roll with I-Frames**: Tactical Spacebar dodge roll granting invulnerability frames (i-frames) to dodge through projectiles, charging enemies, and boss shockwaves.
- **Interactive Environment**: Slashable grass dropping rupees/hearts, liftable and throwable ceramic pots, chests, pressure switches, and locked dungeon doors.
- **Dynamic Chiptune Audio**: Built-in Web Audio API 8-bit synthesizer generating sound effects and background melodies for village, overworld, and boss zones with zero external assets.
- **Telegraphed Enemy Battles & Dungeon Boss**: Enemies with clear attack warnings (Octorok rock spit, Spearman laser charge, Dark Knight frontal shield) and the multi-phase Awakened Golem Lord boss fight.

---

## Controls

| Action | Key / Input |
| :--- | :--- |
| **Move** | `W`, `A`, `S`, `D` or Arrow Keys |
| **Aim** | `Mouse Cursor` |
| **Sword Slash** | `Left Click` (3-Hit combo) |
| **Spin Attack** | Hold `Left Click` (0.45s) |
| **Dodge Roll** | `Spacebar` or `Shift` (i-frames) |
| **Bow & Arrow** | `Right Click` or `Q` |
| **Shield Deflect** | `E` or Secondary Mouse |
| **Interact / Throw Pot** | `E` |
| **Inventory & Quests** | `Tab` or `I` |

---

## Local Development

No build step or dependencies required. Simply serve static files:

```bash
# Using Python
python3 -m http.server 8080

# Or using Node / npm
npm start
```

Then visit `http://localhost:8080` in your browser.

---

## Deployment

This repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically deploys the game to GitHub Pages upon pushing to the `main` branch.

To enable GitHub Pages manually:
1. Go to your repository settings on GitHub (`Settings` -> `Pages`).
2. Under **Build and deployment** > **Source**, select **GitHub Actions**.
3. Pushes to `main` will automatically build and publish the game URL.
