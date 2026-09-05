// Automated Unit and Integration Test Suite for Echoes of the Awakening Isle

import assert from 'node:assert';
import { Physics } from '../src/engine/Physics.js';
import { TileMap, TILE_TYPES } from '../src/world/TileMap.js';
import { buildWorldMap, MAP_WIDTH, MAP_HEIGHT } from '../src/world/WorldData.js';
import { Player } from '../src/entities/Player.js';
import { Slime } from '../src/entities/enemies/Slime.js';
import { Octorok } from '../src/entities/enemies/Octorok.js';
import { Spearman } from '../src/entities/enemies/Spearman.js';
import { DarkKnight } from '../src/entities/enemies/DarkKnight.js';
import { BossGolem, BOSS_ATTACK } from '../src/entities/enemies/BossGolem.js';
import { Projectile } from '../src/entities/Projectile.js';
import { DungeonDoor, Chest, Pot, GrassPatch } from '../src/world/Interactables.js';

console.log('--- RUNNING ACTION RPG ENGINE TESTS ---');

// 1. Tilemap & World Data Tests
{
  console.log('Test 1: TileMap & World Generation...');
  const tiles = buildWorldMap();
  assert.strictEqual(tiles.length, MAP_WIDTH * MAP_HEIGHT, 'World tiles array must match MAP_WIDTH * MAP_HEIGHT');

  const tileMap = new TileMap(MAP_WIDTH, MAP_HEIGHT, tiles);
  // Border cliffs should be solid
  assert.strictEqual(tileMap.isSolid(16, 16), true, 'Border cliffs must be solid');
  // Starting village center should be walkable
  assert.strictEqual(tileMap.isSolid(12 * 32 + 16, 44 * 32 + 16), false, 'Village center must be walkable');
  console.log('✓ TileMap & World Generation Passed');
}

// 2. Physics & Collision Calculations
{
  console.log('Test 2: Physics & Arc Targeting...');
  const c1 = { x: 0, y: 0, radius: 10 };
  const c2 = { x: 15, y: 0, radius: 10 };
  assert.strictEqual(Physics.circleCollision(c1, c2), true, 'Overlapping circles must collide');

  const c3 = { x: 30, y: 0, radius: 10 };
  assert.strictEqual(Physics.circleCollision(c1, c3), false, 'Separated circles must not collide');

  // Arc check for directional melee aiming: target at angle 0, swing facing 0 with spread PI/2
  assert.strictEqual(Physics.isAngleInArc(0.1, 0, Math.PI / 2), true, 'Angle within arc spread should be inside');
  assert.strictEqual(Physics.isAngleInArc(Math.PI, 0, Math.PI / 2), false, 'Angle opposite arc should be outside');
  console.log('✓ Physics & Arc Targeting Passed');
}

// 2b. Universal Keyboard Input & Movement Vector Test
{
  console.log('Test 2b: Keyboard Key Codes & Movement Vectors...');
  const { InputManager } = await import('../src/engine/Input.js');
  const input = new InputManager(null);

  // Test standard WASD
  input.registerKeyDown('w', 'KeyW', 87);
  let move = input.getMovementVector();
  assert.strictEqual(move.dy, -1, 'W must move Up');
  assert.strictEqual(move.dx, 0, 'W has no horizontal movement');
  input.registerKeyUp('w', 'KeyW', 87);

  // Test Arrow Keys
  input.registerKeyDown('ArrowRight', 'ArrowRight', 39);
  move = input.getMovementVector();
  assert.strictEqual(move.dx, 1, 'ArrowRight must move Right');
  assert.strictEqual(move.dy, 0, 'ArrowRight has no vertical movement');
  input.registerKeyUp('ArrowRight', 'ArrowRight', 39);

  // Test AZERTY (Z for Up, Q for Left)
  input.registerKeyDown('z', 'KeyZ', 90);
  input.registerKeyDown('q', 'KeyQ', 81);
  move = input.getMovementVector();
  assert.strictEqual(move.dy < 0, true, 'Z must move Up on AZERTY');
  assert.strictEqual(move.dx < 0, true, 'Q must move Left on AZERTY');
  input.registerKeyUp('z', 'KeyZ', 90);
  input.registerKeyUp('q', 'KeyQ', 81);

  // Test e.code alone (when IME active)
  input.registerKeyDown('Process', 'KeyS', 229);
  move = input.getMovementVector();
  assert.strictEqual(move.dy, 1, 'KeyS must move Down even during IME composition');
  input.registerKeyUp('Process', 'KeyS', 229);

  console.log('✓ Universal Keyboard Input & Movement Vectors Passed');
}

// 3. Mock Game Context for Actor Testing
function createMockGame() {
  const tiles = buildWorldMap();
  const tileMap = new TileMap(MAP_WIDTH, MAP_HEIGHT, tiles);
  const player = new Player(12 * 32, 44 * 32);
  return {
    tileMap,
    player,
    enemies: [],
    props: [],
    projectiles: [],
    drops: [],
    npcs: [],
    camera: {
      shake: () => {},
      getRenderX: () => 0,
      getRenderY: () => 0
    },
    particles: {
      createDust: () => {},
      createHitSparks: () => {},
      createGrassCut: () => {},
      createShockwave: () => {},
      createBloodOrMagic: () => {},
      createExplosion: () => {},
      createHealSparkles: () => {},
      createDeathPoof: () => {},
      addSlashArc: () => {}
    },
    spawnDrop: function(x, y, type, val) {
      this.drops.push({ x, y, type, val });
    },
    awardItem: function(reward, label) {},
    gameOver: function() { this.isGameOver = true; },
    victory: function() { this.isVictory = true; }
  };
}

// 4. Player Mechanics: Aiming, Combos, Dodge Roll & I-Frames
{
  console.log('Test 3: Player Dodge Roll & Invulnerability Frames...');
  const game = createMockGame();
  const player = game.player;

  // Initial stats
  assert.strictEqual(player.health, 6, 'Player starting health must be 6 (3 full hearts)');
  assert.strictEqual(player.stamina, 100, 'Starting stamina must be 100');

  // Trigger Dodge Roll
  player.startDodgeRoll({ dx: 1, dy: 0 }, game);
  assert.strictEqual(player.isDodging, true, 'Player should enter dodging state');
  assert.strictEqual(player.stamina, 75, 'Dodge roll must consume 25 stamina');

  // While dodging, player takes NO damage (I-Frames!)
  const damageTaken = player.takeDamage(2, game, 0);
  assert.strictEqual(damageTaken, false, 'Player must be INVULNERABLE while dodging');
  assert.strictEqual(player.health, 6, 'Health should remain intact during dodge i-frames');

  // End dodge
  player.isDodging = false;
  player.invulnTimer = 0;

  // Normal hit should now apply damage
  const normalHit = player.takeDamage(2, game, 0);
  assert.strictEqual(normalHit, true, 'Player should take damage when not dodging');
  assert.strictEqual(player.health, 4, 'Player health should decrease to 4');
  console.log('✓ Player Dodge & I-Frames Passed');
}

// 5. Dark Knight Frontal Shield vs Backstab
{
  console.log('Test 4: Dark Knight Frontal Shield vs Backstab...');
  const game = createMockGame();
  const knight = new DarkKnight(200, 200);
  knight.facingAngle = 0; // Facing East (right)
  game.enemies.push(knight);

  // Attack 1: Frontal strike (attacking from East towards West, hitAngle = Math.PI)
  const frontHit = knight.takeDamage(2, game, Math.PI);
  assert.strictEqual(frontHit, false, 'Frontal attack must be deflected by Dark Knight shield');
  assert.strictEqual(knight.health, 6, 'Knight health must not decrease from frontal block');

  // Attack 2: Backstab (attacking from West towards East, hitAngle = 0)
  const backstabHit = knight.takeDamage(2, game, 0);
  assert.strictEqual(backstabHit, true, 'Back attack must bypass Dark Knight shield and hit');
  assert.strictEqual(knight.health, 4, 'Knight health must decrease by 2 from backstab');
  console.log('✓ Dark Knight Shield & Backstab Mechanics Passed');
}

// 6. Projectile Reflection with Shield
{
  console.log('Test 5: Shield Deflection of Projectiles...');
  const game = createMockGame();
  const p = game.player;
  p.x = 100;
  p.y = 100;
  p.aimAngle = 0; // Shield facing East (right)
  p.isShielding = true;

  // Incoming enemy rock flying West towards player (from x: 105, y: 100)
  const rock = new Projectile(105, 100, -200, 0, { type: 'rock', owner: 'enemy', radius: 6 });
  game.projectiles.push(rock);

  // Update projectile collision with player
  rock.update(0.016, game);

  // Rock should be deflected: owner changed to player and velocity inverted!
  assert.strictEqual(rock.owner, 'player', 'Deflected rock must become owned by player');
  assert.strictEqual(rock.vx > 0, true, 'Deflected rock velocity must be reflected back');
  console.log('✓ Projectile Deflection Passed');
}

// 7. Boss Multi-Phase & Ground Slam Shockwaves
{
  console.log('Test 6: Boss Golem Multi-Phase & Ground Slam...');
  const game = createMockGame();
  const boss = new BossGolem(500, 500);
  game.enemies.push(boss);

  assert.strictEqual(boss.phase, 1, 'Boss must start in Phase 1');
  assert.strictEqual(boss.health, 20, 'Boss starting health should be 20');

  // Damage boss to 10 HP (50%)
  boss.takeDamage(10, game, 0);
  boss.updateAI(0.016, game);

  assert.strictEqual(boss.phase, 2, 'Boss must enter Phase 2 (Enraged) at 50% HP');
  assert.strictEqual(boss.speed > 40, true, 'Boss speed should increase in Phase 2');

  // Test Wall Crash Stun
  boss.isCharging = true;
  boss.chargeAngle = 0;
  boss.x = 20; // near left cliff border
  boss.y = 16;
  boss.updateAI(0.016, game);
  assert.strictEqual(boss.state, 'stunned', 'Boss must be stunned upon crashing into solid wall');
  console.log('✓ Boss Golem Multi-Phase & Stun Mechanics Passed');
}

// 8. Dungeon Door & Key Puzzle
{
  console.log('Test 7: Dungeon Key & Door Unlock...');
  const game = createMockGame();
  const door = new DungeonDoor('test_door', 100, 100, 64, 32, true);
  game.props.push(door);

  // Without key: cannot unlock
  game.player.keys = 0;
  const unlockFail = door.tryUnlock(game);
  assert.strictEqual(unlockFail, false, 'Door must remain locked without key');
  assert.strictEqual(door.isOpen, false, 'Door should not be open');

  // With key: unlocks and consumes key
  game.player.keys = 1;
  const unlockSuccess = door.tryUnlock(game);
  assert.strictEqual(unlockSuccess, true, 'Door must unlock with key');
  assert.strictEqual(door.isOpen, true, 'Door should be marked open');
  assert.strictEqual(game.player.keys, 0, 'Key must be consumed upon unlocking door');
  console.log('✓ Dungeon Key & Door Unlock Passed');
}

console.log('\n=============================================');
console.log('ALL TESTS PASSED WITH 100% SUCCESS!');
console.log('=============================================');
