// TileMap engine with Zelda Link's Awakening aesthetic tiles and collision handling

export const TILE_SIZE = 32;

export const TILE_TYPES = {
  EMPTY: 0,
  GRASS: 1,
  PATH: 2,
  WATER: 3,
  CLIFF: 4,
  WOOD_BRIDGE: 5,
  DUNGEON_FLOOR: 6,
  DUNGEON_WALL: 7,
  HOUSE_WALL: 8,
  HOUSE_ROOF: 9,
  TREE: 10,
  SAND: 11
};

export class TileMap {
  constructor(widthInTiles, heightInTiles, mapData = null) {
    this.width = widthInTiles;
    this.height = heightInTiles;
    this.worldWidth = this.width * TILE_SIZE;
    this.worldHeight = this.height * TILE_SIZE;

    // Flat array of tile IDs
    this.tiles = mapData || new Array(this.width * this.height).fill(TILE_TYPES.GRASS);
    this.animationTimer = 0;

    // Cache pre-rendered pattern canvases for ultra-crisp, high-performance pixel drawing
    this.patternCache = {};
    this.initPatterns();
  }

  initPatterns() {
    // Generate crisp 32x32 procedural pixel art textures for all tiles
    this.patternCache[TILE_TYPES.GRASS] = this.createTileCanvas((ctx) => {
      ctx.fillStyle = '#56ad43';
      ctx.fillRect(0, 0, 32, 32);
      // Grass blade tufts
      ctx.fillStyle = '#419230';
      ctx.fillRect(6, 8, 4, 6);
      ctx.fillRect(8, 6, 2, 8);
      ctx.fillRect(20, 20, 4, 6);
      ctx.fillRect(22, 18, 2, 8);
      // Highlights
      ctx.fillStyle = '#73c75e';
      ctx.fillRect(4, 6, 2, 4);
      ctx.fillRect(18, 18, 2, 4);
    });

    this.patternCache[TILE_TYPES.PATH] = this.createTileCanvas((ctx) => {
      ctx.fillStyle = '#ddb575';
      ctx.fillRect(0, 0, 32, 32);
      // Sand/dirt pebbles
      ctx.fillStyle = '#c49954';
      ctx.fillRect(4, 6, 4, 4);
      ctx.fillRect(18, 14, 5, 4);
      ctx.fillRect(10, 24, 4, 3);
      ctx.fillStyle = '#eed19a';
      ctx.fillRect(5, 5, 2, 2);
      ctx.fillRect(19, 13, 2, 2);
    });

    this.patternCache[TILE_TYPES.SAND] = this.createTileCanvas((ctx) => {
      ctx.fillStyle = '#e8c983';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#d6b162';
      ctx.fillRect(8, 12, 3, 2);
      ctx.fillRect(24, 20, 3, 2);
    });

    this.patternCache[TILE_TYPES.WOOD_BRIDGE] = this.createTileCanvas((ctx) => {
      ctx.fillStyle = '#8f5c38';
      ctx.fillRect(0, 0, 32, 32);
      // Wood plank dividers
      ctx.fillStyle = '#5c381e';
      ctx.fillRect(0, 7, 32, 2);
      ctx.fillRect(0, 15, 32, 2);
      ctx.fillRect(0, 23, 32, 2);
      ctx.fillRect(0, 31, 32, 2);
      // Plank nail highlights
      ctx.fillStyle = '#b0794e';
      ctx.fillRect(2, 2, 2, 2);
      ctx.fillRect(28, 2, 2, 2);
      ctx.fillRect(2, 10, 2, 2);
      ctx.fillRect(28, 10, 2, 2);
    });

    this.patternCache[TILE_TYPES.DUNGEON_FLOOR] = this.createTileCanvas((ctx) => {
      ctx.fillStyle = '#39465e';
      ctx.fillRect(0, 0, 32, 32);
      // Flagstone grid
      ctx.strokeStyle = '#273145';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, 30, 30);
      // Inner subtle texture
      ctx.fillStyle = '#4c5c7d';
      ctx.fillRect(6, 6, 6, 6);
      ctx.fillRect(18, 18, 8, 8);
    });

    this.patternCache[TILE_TYPES.DUNGEON_WALL] = this.createTileCanvas((ctx) => {
      ctx.fillStyle = '#1c2230';
      ctx.fillRect(0, 0, 32, 32);
      // Wall bricks
      ctx.fillStyle = '#2f3b52';
      ctx.fillRect(2, 2, 28, 13);
      ctx.fillRect(2, 17, 13, 13);
      ctx.fillRect(17, 17, 13, 13);
      // Brick cracks / top highlight
      ctx.fillStyle = '#465675';
      ctx.fillRect(2, 2, 28, 2);
      ctx.fillRect(2, 17, 13, 2);
      ctx.fillRect(17, 17, 13, 2);
    });

    this.patternCache[TILE_TYPES.CLIFF] = this.createTileCanvas((ctx) => {
      ctx.fillStyle = '#655342';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#47392b';
      ctx.fillRect(0, 22, 32, 10);
      ctx.fillStyle = '#836f5c';
      ctx.fillRect(4, 4, 24, 6);
    });

    this.patternCache[TILE_TYPES.HOUSE_WALL] = this.createTileCanvas((ctx) => {
      ctx.fillStyle = '#e8dec8';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#8f5c38';
      ctx.fillRect(0, 0, 4, 32);
      ctx.fillRect(28, 0, 4, 32);
      ctx.fillRect(0, 28, 32, 4);
    });

    this.patternCache[TILE_TYPES.HOUSE_ROOF] = this.createTileCanvas((ctx) => {
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#962d22';
      ctx.fillRect(0, 8, 32, 3);
      ctx.fillRect(0, 18, 32, 3);
      ctx.fillRect(0, 28, 32, 3);
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(0, 0, 32, 3);
    });

    this.patternCache[TILE_TYPES.TREE] = this.createTileCanvas((ctx) => {
      // Lush round tree top (Link's Awakening style)
      ctx.fillStyle = '#2b7525';
      ctx.beginPath();
      ctx.arc(16, 16, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3da334';
      ctx.beginPath();
      ctx.arc(14, 13, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#59c74e';
      ctx.beginPath();
      ctx.arc(11, 10, 7, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  createTileCanvas(drawFn) {
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas');
    c.width = TILE_SIZE;
    c.height = TILE_SIZE;
    const ctx = c.getContext('2d');
    drawFn(ctx);
    return c;
  }

  getTile(tx, ty) {
    if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) {
      return TILE_TYPES.CLIFF; // Out of bounds is impassable cliff
    }
    return this.tiles[ty * this.width + tx];
  }

  setTile(tx, ty, type) {
    if (tx >= 0 && tx < this.width && ty >= 0 && ty < this.height) {
      this.tiles[ty * this.width + tx] = type;
    }
  }

  isSolid(worldX, worldY) {
    const tx = Math.floor(worldX / TILE_SIZE);
    const ty = Math.floor(worldY / TILE_SIZE);
    const tile = this.getTile(tx, ty);

    return (
      tile === TILE_TYPES.WATER ||
      tile === TILE_TYPES.CLIFF ||
      tile === TILE_TYPES.DUNGEON_WALL ||
      tile === TILE_TYPES.HOUSE_WALL ||
      tile === TILE_TYPES.HOUSE_ROOF ||
      tile === TILE_TYPES.TREE
    );
  }

  update(dt) {
    this.animationTimer += dt;
  }

  render(ctx, camera) {
    const camX = camera.getRenderX();
    const camY = camera.getRenderY();

    const startCol = Math.max(0, Math.floor(camX / TILE_SIZE));
    const endCol = Math.min(this.width, Math.ceil((camX + camera.viewportWidth) / TILE_SIZE));
    const startRow = Math.max(0, Math.floor(camY / TILE_SIZE));
    const endRow = Math.min(this.height, Math.ceil((camY + camera.viewportHeight) / TILE_SIZE));

    // Water wave offset
    const waveOffset = Math.sin(this.animationTimer * 3) * 2;

    for (let r = startRow; r < endRow; r++) {
      for (let c = startCol; c < endCol; c++) {
        const tileType = this.tiles[r * this.width + c];
        const screenX = c * TILE_SIZE - camX;
        const screenY = r * TILE_SIZE - camY;

        if (tileType === TILE_TYPES.WATER) {
          // Dynamic animated water
          ctx.fillStyle = '#2f7ec4';
          ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = '#4ba3f0';
          ctx.fillRect(screenX + 4 + waveOffset, screenY + 8, 14, 3);
          ctx.fillRect(screenX + 12 - waveOffset, screenY + 20, 16, 3);
          ctx.fillStyle = '#e8f4fc';
          ctx.fillRect(screenX + 6 + waveOffset, screenY + 7, 6, 2);
        } else {
          const pattern = this.patternCache[tileType];
          if (pattern) {
            ctx.drawImage(pattern, screenX, screenY);
          } else {
            ctx.fillStyle = '#56ad43';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
          }
        }
      }
    }
  }
}
