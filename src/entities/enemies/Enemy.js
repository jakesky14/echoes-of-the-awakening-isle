// Base Enemy Class with AI States, Telegraph Indicators, and Combat Logic

import { Entity } from '../Entity.js';
import { Physics } from '../../engine/Physics.js';
import { sound } from '../../engine/Sound.js';

export const AI_STATE = {
  IDLE: 'idle',
  PATROL: 'patrol',
  CHASE: 'chase',
  TELEGRAPH: 'telegraph',
  ATTACK: 'attack',
  STUNNED: 'stunned',
  RECOVER: 'recover'
};

export class Enemy extends Entity {
  constructor(x, y, radius = 14, maxHealth = 3) {
    super(x, y, radius, maxHealth);
    this.state = AI_STATE.IDLE;
    this.stateTimer = 0;
    this.speed = 60;
    this.sightRange = 180;
    this.attackRange = 40;
    this.contactDamage = 1;

    // Telegraph visual parameters
    this.telegraphTimer = 0;
    this.telegraphDuration = 0.5;

    // Stunned
    this.stunTimer = 0;

    // Home / Spawn position
    this.homeX = x;
    this.homeY = y;
  }

  update(dt, game) {
    if (this.isDead) return;

    // Stunned state recovery
    if (this.state === AI_STATE.STUNNED) {
      this.stunTimer -= dt;
      if (this.stunTimer <= 0) {
        this.state = AI_STATE.IDLE;
      }
      this.updateBasePhysics(dt, game);
      return;
    }

    // Call subclass specific AI implementation
    this.updateAI(dt, game);

    // Check contact damage with player
    this.checkContactDamage(game);

    this.updateBasePhysics(dt, game);
  }

  updateAI(dt, game) {
    // Override in subclasses
  }

  checkContactDamage(game) {
    const p = game.player;
    if (this.contactDamage > 0 && Physics.circleCollision(this, p)) {
      const angle = Math.atan2(p.y - this.y, p.x - this.x);
      p.takeDamage(this.contactDamage, game, angle, 200);
    }
  }

  takeDamage(amount, game, hitAngle = 0, knockbackPower = 180) {
    const taken = super.takeDamage(amount, game, hitAngle, knockbackPower);
    if (taken) {
      sound.enemyHurt();
      // Brief stagger
      if (this.state !== AI_STATE.STUNNED && amount >= 1.5) {
        this.state = AI_STATE.STUNNED;
        this.stunTimer = 0.25;
      }
    }
    return taken;
  }

  die(game) {
    super.die(game);
    // 60% chance to drop loot
    const rand = Math.random();
    if (rand < 0.35) {
      const val = Math.random() > 0.8 ? 5 : 1;
      game.spawnDrop(this.x, this.y, 'rupee', val);
    } else if (rand < 0.55) {
      game.spawnDrop(this.x, this.y, 'heart', 1);
    } else if (rand < 0.70) {
      game.spawnDrop(this.x, this.y, 'arrow', 4);
    }
  }

  renderTelegraph(ctx, camera) {
    // Optional danger zone rendering
  }
}
