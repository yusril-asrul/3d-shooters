# Undead Kingdom

> 3D FPS survival shooter built with Three.js — defend your kingdom against waves of zombies.
>
> **▶ [Play now on GitHub Pages](https://yusril-asrul.github.io/3d-shooters/)**

![screenshot](https://i.ibb.co.com/5hNbjpSp/game1.jpg)

## Features

- **Wave-based survival** — survive progressively harder waves of zombies
- **Boss fights** — face the King Zombie every 5 waves with tiered scaling
- **Kingdom map** — castle keep, outer walls, towers, village, and courtyard
- **2 weapons** — rifle (30 rounds) and knife (infinite, high damage)
- **Zombie types** — normal, tank, and boss with unique behaviors
- **Minecraft-style visuals** — all geometry box-based, no external assets
- **Procedural audio** — 100% Web Audio API, no audio files

## Screenshots

![gameplay](https://i.ibb.co.com/s9Xd0RS6/game2.jpg)
![boss](https://i.ibb.co.com/4ZSyXqkR/game4.jpg)
![map](https://i.ibb.co.com/FLS5nyG0/game3.jpg)

## Quick Start

```bash
npx serve .
# or
python -m http.server
```

Open `http://localhost:3000` in your browser.

## Controls

| Key | Action |
|-----|--------|
| WASD | Move |
| Mouse | Look around |
| Left click | Shoot / Attack |
| Right click | Aim down sights |
| R | Reload |
| Space | Jump |
| Shift | Sprint |
| 1 | Rifle |
| 2 | Knife |
| ESC | Pause |

## Gameplay

- Survive waves of zombies — each wave gets harder
- Collect **health** (red) and **ammo** (brown) drops from killed zombies
- Every **5th wave** spawns a King Zombie boss in the courtyard
- Use **kill score** to track your performance (shop coming soon)
- The map features a castle with interior, village houses, and defensive walls

## Tech Stack

- **Three.js** v0.170.0 (CDN via importmap)
- **ES modules** — no bundler or build step
- **Web Audio API** — 100% procedural sound effects
- **No external assets** — all visuals are box-based geometry

## Project Structure

```
index.html      — Entry point, CSS, crosshair
state.js        — Shared game state
audio.js        — Procedural Web Audio
world.js        — Kingdom map + collision
weapons.js      — Rifle & knife mechanics
zombies.js      — Zombie AI, pool, drops, particles
ui.js           — HUD, minimap, menus, game over
game.js         — Scene setup, input, game loop
```

## Architecture

- No classes — plain functions + module-level scope
- Spatial hash grid (CELL_SIZE=10) for collision detection
- Object pool (30) for zombie recycling
- Single `state` object shared across all modules

## License

MIT
