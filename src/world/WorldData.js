// World Layout and Map Generator for "Echoes of the Awakening Isle"
import { TILE_TYPES } from './TileMap.js';

export const MAP_WIDTH = 70;
export const MAP_HEIGHT = 60;

export function buildWorldMap() {
  const tiles = new Array(MAP_WIDTH * MAP_HEIGHT).fill(TILE_TYPES.GRASS);

  const setT = (x, y, t) => {
    if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
      tiles[y * MAP_WIDTH + x] = t;
    }
  };

  const fillRect = (x, y, w, h, t) => {
    for (let r = y; r < y + h; r++) {
      for (let c = x; c < x + w; c++) {
        setT(c, r, t);
      }
    }
  };

  // 1. Surrounding Cliffs (world borders)
  for (let x = 0; x < MAP_WIDTH; x++) {
    setT(x, 0, TILE_TYPES.CLIFF);
    setT(x, 1, TILE_TYPES.CLIFF);
    setT(x, MAP_HEIGHT - 1, TILE_TYPES.CLIFF);
    setT(x, MAP_HEIGHT - 2, TILE_TYPES.CLIFF);
  }
  for (let y = 0; y < MAP_HEIGHT; y++) {
    setT(0, y, TILE_TYPES.CLIFF);
    setT(1, y, TILE_TYPES.CLIFF);
    setT(MAP_WIDTH - 1, y, TILE_TYPES.CLIFF);
    setT(MAP_WIDTH - 2, y, TILE_TYPES.CLIFF);
  }

  // 2. Winding River dividing West and East (North side)
  for (let y = 2; y < 32; y++) {
    const rx = 32 + Math.floor(Math.sin(y * 0.3) * 3);
    fillRect(rx - 2, y, 5, 1, TILE_TYPES.WATER);
  }
  // Wooden bridges across the river
  fillRect(30, 10, 6, 2, TILE_TYPES.WOOD_BRIDGE);
  fillRect(30, 24, 6, 2, TILE_TYPES.WOOD_BRIDGE);

  // 3. ZONE 1: Mabe Village (South-West: x: 2..30, y: 32..58)
  // Cobblestone/dirt paths
  fillRect(6, 42, 24, 3, TILE_TYPES.PATH);
  fillRect(16, 34, 3, 22, TILE_TYPES.PATH);
  fillRect(8, 50, 16, 2, TILE_TYPES.PATH);

  // House 1: Village Elder (x: 6, y: 35, 6x5)
  fillRect(6, 35, 7, 2, TILE_TYPES.HOUSE_ROOF);
  fillRect(6, 37, 7, 3, TILE_TYPES.HOUSE_WALL);
  setT(9, 39, TILE_TYPES.PATH); // door entrance

  // House 2: Item Shop (x: 20, y: 35, 7x5)
  fillRect(20, 35, 8, 2, TILE_TYPES.HOUSE_ROOF);
  fillRect(20, 37, 8, 3, TILE_TYPES.HOUSE_WALL);
  setT(24, 39, TILE_TYPES.PATH); // shop door

  // House 3: Hero's Cottage (x: 6, y: 52, 6x5)
  fillRect(6, 52, 7, 2, TILE_TYPES.HOUSE_ROOF);
  fillRect(6, 54, 7, 3, TILE_TYPES.HOUSE_WALL);
  setT(9, 56, TILE_TYPES.PATH);

  // Village pond/fountain
  fillRect(21, 48, 5, 4, TILE_TYPES.WATER);

  // Village perimeter trees & fences
  for (let x = 2; x < 32; x += 2) {
    if (x < 14 || x > 18) setT(x, 32, TILE_TYPES.TREE);
  }
  for (let y = 33; y < 58; y += 3) {
    setT(2, y, TILE_TYPES.TREE);
  }

  // 4. ZONE 2: Verdant Wilds (North-West: x: 2..32, y: 2..32)
  // Pathways
  fillRect(16, 10, 16, 2, TILE_TYPES.PATH);
  fillRect(16, 2, 3, 30, TILE_TYPES.PATH);
  // Sand clearing by the water
  fillRect(22, 14, 7, 6, TILE_TYPES.SAND);
  // Tree groves
  const nwTrees = [
    [4, 4], [5, 4], [8, 6], [9, 6], [4, 15], [5, 15], [6, 20], [7, 20],
    [24, 4], [25, 4], [28, 6], [29, 6], [6, 26], [7, 26], [10, 28]
  ];
  nwTrees.forEach(([tx, ty]) => setT(tx, ty, TILE_TYPES.TREE));

  // 5. ZONE 3: Whispering Forest & Ancient Ruins (South-East: x: 34..68, y: 32..58)
  // Dense forest labyrinth
  fillRect(36, 43, 30, 2, TILE_TYPES.PATH);
  fillRect(48, 34, 3, 22, TILE_TYPES.PATH);
  fillRect(60, 36, 2, 18, TILE_TYPES.PATH);

  const forestTrees = [
    [36, 34], [37, 34], [40, 35], [41, 35], [44, 37], [45, 37],
    [54, 34], [55, 34], [58, 35], [59, 35], [64, 37], [65, 37],
    [36, 48], [37, 48], [42, 49], [43, 49], [40, 54], [41, 54],
    [52, 48], [53, 48], [56, 51], [57, 51], [62, 53], [63, 53],
    [44, 47], [45, 47], [50, 40], [51, 40]
  ];
  forestTrees.forEach(([tx, ty]) => setT(tx, ty, TILE_TYPES.TREE));

  // Ancient ruins stone wall divider
  fillRect(35, 32, 33, 2, TILE_TYPES.CLIFF);
  // Temple entrance opening
  fillRect(50, 32, 4, 2, TILE_TYPES.PATH);

  // 6. ZONE 4: The Sunken Temple & Boss Arena (North-East: x: 36..68, y: 2..32)
  // Dungeon stone foundation
  fillRect(38, 4, 28, 26, TILE_TYPES.DUNGEON_FLOOR);

  // Dungeon exterior & interior masonry walls
  // Outer perimeter walls
  for (let x = 38; x < 66; x++) {
    setT(x, 4, TILE_TYPES.DUNGEON_WALL);
    setT(x, 29, TILE_TYPES.DUNGEON_WALL);
  }
  for (let y = 4; y < 30; y++) {
    setT(38, y, TILE_TYPES.DUNGEON_WALL);
    setT(66, y, TILE_TYPES.DUNGEON_WALL);
  }

  // Dungeon Entrance Gateway at bottom
  fillRect(50, 29, 4, 1, TILE_TYPES.DUNGEON_FLOOR);

  // Interior dividing wall separating Entrance Hall and Boss Chamber
  for (let x = 38; x < 66; x++) {
    if (x < 50 || x > 53) {
      setT(x, 16, TILE_TYPES.DUNGEON_WALL);
    }
  }

  // Decorative stone pillars inside temple
  const pillars = [
    [42, 8], [42, 12], [62, 8], [62, 12],
    [43, 20], [43, 25], [61, 20], [61, 25]
  ];
  pillars.forEach(([px, py]) => setT(px, py, TILE_TYPES.CLIFF));

  return tiles;
}

export const WORLD_SPAWNS = {
  // Player starting position in Mabe Village
  player: { x: 12 * 32, y: 44 * 32 },

  // Friendly NPCs
  npcs: [
    {
      id: 'elder',
      name: 'Elder Ulrira',
      x: 10 * 32,
      y: 40 * 32,
      dialogue: [
        "Welcome, young traveler! Strange beasts have emerged from the Sunken Temple.",
        "Use [WASD] to move, and your MOUSE to aim your strikes!",
        "Left Click delivers a swift sword slash combo. HOLD Left Click to charge a 360° SPIN ATTACK!",
        "Press [SPACEBAR] to Dodge Roll. It grants brief INVULNERABILITY against attacks!",
        "Seek the Hunter's Bow in the North Wilds and find the Temple Key in the Whispering Forest."
      ]
    },
    {
      id: 'shopkeeper',
      name: 'Tarin the Merchant',
      x: 24 * 32,
      y: 41 * 32,
      isShop: true,
      dialogue: [
        "Welcome to the Village Shop! Got plenty of supplies for your quest.",
        "Break pots and slice bushes to collect Rupees!"
      ]
    },
    {
      id: 'dummy',
      name: 'Training Target',
      x: 14 * 32,
      y: 48 * 32,
      isDummy: true
    }
  ],

  // Interactive Props (Chests, Grass, Pots, Switches, Doors)
  props: [
    // Chests
    {
      type: 'chest',
      id: 'chest_bow',
      x: 6 * 32,
      y: 8 * 32,
      reward: 'bow',
      label: "Hero's Bow"
    },
    {
      type: 'chest',
      id: 'chest_key',
      x: 62 * 32,
      y: 48 * 32,
      reward: 'temple_key',
      label: "Sunken Temple Key"
    },
    {
      type: 'chest',
      id: 'chest_heart',
      x: 26 * 32,
      y: 6 * 32,
      reward: 'heart_container',
      label: "Heart Container (+1 Max Heart)"
    },

    // Dungeon Gate (Locked Door)
    {
      type: 'door',
      id: 'temple_door',
      x: 50 * 32,
      y: 16 * 32,
      width: 4 * 32,
      height: 32,
      requiresKey: true
    },

    // Pressure Plate Puzzle in Forest
    {
      type: 'switch',
      id: 'forest_switch',
      x: 56 * 32,
      y: 38 * 32,
      targetDoor: 'forest_gate'
    }
  ],

  // Initial Enemy Encounters
  enemies: [
    // Slimes in the training and village outskirts
    { type: 'slime', x: 22 * 32, y: 26 * 32 },
    { type: 'slime', x: 10 * 32, y: 22 * 32 },
    { type: 'slime', x: 28 * 32, y: 20 * 32 },
    { type: 'slime', x: 44 * 32, y: 44 * 32 },

    // Octoroks in the River / Verdant Wilds
    { type: 'octorok', x: 14 * 32, y: 14 * 32 },
    { type: 'octorok', x: 25 * 32, y: 8 * 32 },
    { type: 'octorok', x: 8 * 32, y: 12 * 32 },

    // Spearmen in the Whispering Forest
    { type: 'spearman', x: 42 * 32, y: 52 * 32 },
    { type: 'spearman', x: 56 * 32, y: 46 * 32 },
    { type: 'spearman', x: 62 * 32, y: 42 * 32 },

    // Dark Knights guarding the Temple entrance hall
    { type: 'knight', x: 44 * 32, y: 23 * 32 },
    { type: 'knight', x: 58 * 32, y: 23 * 32 },

    // Dungeon Boss in Boss Arena
    { type: 'boss', x: 52 * 32, y: 10 * 32 }
  ]
};
