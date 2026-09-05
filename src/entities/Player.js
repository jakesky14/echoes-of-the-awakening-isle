// Player Hero with Aim-based Combat, Charged Spin Attack, Dodge Roll with I-Frames, and Shield

import { Entity } from './Entity.js';
import { Physics } from '../engine/Physics.js';
import { sound } from '../engine/Sound.js';
import { Projectile } from './Projectile.js';
import { Pot } from '../world/Interactables.js';

export class Player extends Entity {
  constructor(x, y) {
    super(x, y, 12, 6); // 6 HP = 3 Hearts (2 HP per heart)
    this.speed = 135;
    this.aimAngle = 0;

    // Stamina system (for dodge rolls & charged attacks)
    this.maxStamina = 100;
    this.stamina = 100;
    this.staminaRegen = 40; // per second
    this.staminaExhausted = false;

    // Dodge roll mechanics
    this.isDodging = false;
    this.dodgeTimer = 0;
    this.dodgeDuration = 0.28;
    this.dodgeSpeed = 310;
    this.dodgeDirX = 0;
    this.dodgeDirY = 0;
    this.dodgeCooldown = 0;

    // Sword attack combo
    this.isAttacking = false;
    this.attackTimer = 0;
    this.attackDuration = 0.22;
    this.comboStep = 0;
    this.comboResetTimer = 0;
    this.swordRange = 36;
    this.swordArc = Math.PI * 0.75; // ~135 degrees swing arc

    // Charged Spin Attack
    this.isCharging = false;
    this.chargeTimer = 0;
    this.chargeThreshold = 0.45;
    this.isSpinning = false;
    this.spinTimer = 0;
    this.spinDuration = 0.32;

    // Bow & Arrow
    this.hasBow = false;
    this.arrows = 15;
    this.bowCooldown = 0;

    // Shield defense
    this.isShielding = false;

    // Carried prop (e.g. pot)
    this.carriedProp = null;

    // RPG Progression & Inventory
    this.rupees = 0;
    this.keys = 0;
    this.inventory = {
      sword: true,
      bow: false,
      templeKey: false,
      heartContainers: 0
    };

    // Animation bobbing
    this.walkAnimTimer = 0;
  }

  update(dt, game) {
    const input = game.input;
    input.updateWorldMouse(game.camera);

    // Calculate aim angle from player center to mouse crosshair
    this.aimAngle = input.getAimAngle(this.x, this.y);

    // Stamina regeneration
    if (!this.isDodging && !this.isCharging) {
      this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRegen * dt);
      if (this.stamina >= 25) {
        this.staminaExhausted = false;
      }
    }

    // Cooldown timers
    if (this.dodgeCooldown > 0) this.dodgeCooldown -= dt;
    if (this.bowCooldown > 0) this.bowCooldown -= dt;
    if (this.comboResetTimer > 0) {
      this.comboResetTimer -= dt;
      if (this.comboResetTimer <= 0) {
        this.comboStep = 0;
      }
    }

    // --- State 1: Dodge Rolling (Invulnerability Frames) ---
    if (this.isDodging) {
      this.dodgeTimer -= dt;
      this.x += this.dodgeDirX * this.dodgeSpeed * dt;
      this.y += this.dodgeDirY * this.dodgeSpeed * dt;

      // Trail dust particles
      if (Math.random() < 0.6) {
        game.particles.createDust(this.x, this.y + 4, 2, Math.atan2(this.dodgeDirY, this.dodgeDirX) + Math.PI);
      }

      if (this.dodgeTimer <= 0) {
        this.isDodging = false;
        this.dodgeCooldown = 0.12;
      }

      this.updateBasePhysics(dt, game);
      return;
    }

    // --- State 2: Spin Attacking ---
    if (this.isSpinning) {
      this.spinTimer -= dt;
      this.facingAngle += dt * 25; // full 360 spin
      // Hit surrounding enemies throughout spin
      this.checkMeleeHits(game, 42, Math.PI * 2, 2.5);

      if (this.spinTimer <= 0) {
        this.isSpinning = false;
      }
      this.updateBasePhysics(dt, game);
      return;
    }

    // --- State 3: Normal Action & Movement ---
    const move = input.getMovementVector();
    let currentSpeed = this.speed;

    // Slow down slightly while charging or shielding
    if (this.isCharging || this.isShielding) {
      currentSpeed *= 0.55;
    }

    if (move.dx !== 0 || move.dy !== 0) {
      this.vx = move.dx * currentSpeed;
      this.vy = move.dy * currentSpeed;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.walkAnimTimer += dt * 10;
    } else {
      this.vx = 0;
      this.vy = 0;
      this.walkAnimTimer = 0;
    }

    // --- Action: Dodge Roll Trigger ---
    if ((input.isJustPressed(' ') || input.isJustPressed('shift')) && this.dodgeCooldown <= 0 && !this.isDodging) {
      if (this.stamina >= 25 && !this.staminaExhausted) {
        this.startDodgeRoll(move, game);
        this.updateBasePhysics(dt, game);
        return;
      }
    }

    // --- Action: Throw Carried Prop ---
    if (this.carriedProp) {
      if (input.isLeftJustPressed() || input.isJustPressed('e')) {
        this.carriedProp.throw(this.aimAngle);
        this.carriedProp = null;
        sound.swordSlash(0);
      }
      this.updateBasePhysics(dt, game);
      return;
    }

    // --- Action: Pick Up Prop or Interact with Chest/NPC ---
    if (input.isJustPressed('e')) {
      if (this.tryInteract(game)) {
        this.updateBasePhysics(dt, game);
        return;
      }
    }

    // --- Action: Shield Defense ---
    this.isShielding = input.isDown('e') || input.isRightMouseDown() && !this.hasBow;

    // --- Action: Bow & Arrow (Right Click or Q) ---
    if (this.hasBow && (input.isRightJustPressed() || input.isJustPressed('q')) && this.bowCooldown <= 0) {
      if (this.arrows > 0) {
        this.fireArrow(game);
      }
    }

    // --- Action: Melee Slash & Charged Spin Attack ---
    if (input.isLeftMouseDown() && !this.isAttacking) {
      this.isCharging = true;
      this.chargeTimer += dt;

      if (this.chargeTimer > this.chargeThreshold && Math.random() < 0.4) {
        // Glowing charge sparkles
        game.particles.createHealSparkles(this.x, this.y);
      }
    } else if (this.isCharging) {
      // Button released!
      if (this.chargeTimer >= this.chargeThreshold) {
        // Unleash Spin Attack!
        this.executeSpinAttack(game);
      } else {
        // Normal slash combo
        this.executeSwordSlash(game);
      }
      this.isCharging = false;
      this.chargeTimer = 0;
    }

    // Update attack animation timer
    if (this.isAttacking) {
      this.attackTimer -= dt;
      if (this.attackTimer <= 0) {
        this.isAttacking = false;
      }
    }

    this.updateBasePhysics(dt, game);
  }

  startDodgeRoll(move, game) {
    this.isDodging = true;
    this.dodgeTimer = this.dodgeDuration;
    this.stamina -= 25;
    if (this.stamina <= 0) {
      this.stamina = 0;
      this.staminaExhausted = true;
    }

    // Roll in movement direction, or towards mouse aim if stationary
    if (move.dx !== 0 || move.dy !== 0) {
      this.dodgeDirX = move.dx;
      this.dodgeDirY = move.dy;
    } else {
      this.dodgeDirX = Math.cos(this.aimAngle);
      this.dodgeDirY = Math.sin(this.aimAngle);
    }

    sound.dodgeRoll();
    game.particles.createDust(this.x, this.y, 6, Math.atan2(this.dodgeDirY, this.dodgeDirX) + Math.PI);
  }

  executeSwordSlash(game) {
    this.isAttacking = true;
    this.attackTimer = this.attackDuration;
    this.comboResetTimer = 0.55;

    sound.swordSlash(this.comboStep);

    // Directional slash arc trail
    const arcHalf = this.swordArc / 2;
    const startAngle = this.aimAngle - arcHalf;
    const endAngle = this.aimAngle + arcHalf;
    game.particles.addSlashArc(this.x, this.y, startAngle, endAngle, this.swordRange + 4);

    // Check hit against enemies and interactables in the aimed arc
    this.checkMeleeHits(game, this.swordRange, this.swordArc, 1.0);

    this.comboStep = (this.comboStep + 1) % 3;
  }

  executeSpinAttack(game) {
    this.isSpinning = true;
    this.spinTimer = this.spinDuration;
    sound.spinRelease();
    game.camera.shake(4, 0.15);

    // Visual 360 shockwave & slash ring
    game.particles.createShockwave(this.x, this.y, 50, 200, 'rgba(120, 220, 255, 0.9)', 5);
    game.particles.addSlashArc(this.x, this.y, 0, Math.PI * 2, 44, 'rgba(255, 255, 255, ALPHA)', 8, 0.25);

    this.checkMeleeHits(game, 48, Math.PI * 2, 2.5);
  }

  checkMeleeHits(game, reach, arcSpread, damageMultiplier = 1.0) {
    let hitAnything = false;

    // 1. Cut Grass & Break Pots in arc
    for (const prop of game.props) {
      if (prop.cut && !prop.isCut && Physics.distance(this.x, this.y, prop.x, prop.y) <= reach + prop.radius) {
        const propAngle = Math.atan2(prop.y - this.y, prop.x - this.x);
        if (arcSpread >= Math.PI * 1.9 || Physics.isAngleInArc(propAngle, this.aimAngle, arcSpread)) {
          prop.cut(game);
        }
      } else if (prop instanceof Pot && !prop.isCarried && !prop.isBroken && Physics.distance(this.x, this.y, prop.x, prop.y) <= reach + prop.radius) {
        const propAngle = Math.atan2(prop.y - this.y, prop.x - this.x);
        if (arcSpread >= Math.PI * 1.9 || Physics.isAngleInArc(propAngle, this.aimAngle, arcSpread)) {
          prop.break(game);
        }
      }
    }

    // 2. Damage Enemies in arc
    for (const enemy of game.enemies) {
      if (enemy.isDead) continue;
      const dist = Physics.distance(this.x, this.y, enemy.x, enemy.y);
      if (dist <= reach + enemy.radius) {
        const enemyAngle = Math.atan2(enemy.y - this.y, enemy.x - this.x);
        if (arcSpread >= Math.PI * 1.9 || Physics.isAngleInArc(enemyAngle, this.aimAngle, arcSpread)) {
          const hit = enemy.takeDamage(damageMultiplier, game, enemyAngle, 220 * damageMultiplier);
          if (hit) {
            hitAnything = true;
            sound.swordHit();
            game.camera.shake(3 * damageMultiplier, 0.1);
            game.particles.createHitSparks(enemy.x, enemy.y, enemyAngle, 8);
          }
        }
      }
    }
  }

  fireArrow(game) {
    this.bowCooldown = 0.35;
    this.arrows--;
    sound.bowShoot();

    const arrowSpeed = 460;
    const vx = Math.cos(this.aimAngle) * arrowSpeed;
    const vy = Math.sin(this.aimAngle) * arrowSpeed;

    const arrow = new Projectile(
      this.x + Math.cos(this.aimAngle) * 16,
      this.y + Math.sin(this.aimAngle) * 16,
      vx,
      vy,
      { type: 'arrow', damage: 1.5, owner: 'player', radius: 5 }
    );
    game.projectiles.push(arrow);
  }

  tryInteract(game) {
    // Check NPCs
    for (const npc of game.npcs) {
      if (Physics.distance(this.x, this.y, npc.x, npc.y) < 36) {
        npc.interact(game);
        return true;
      }
    }

    // Check Chests
    for (const prop of game.props) {
      if (prop.open && !prop.isOpen && Physics.distance(this.x, this.y, prop.x, prop.y) < 36) {
        prop.open(game);
        return true;
      }
    }

    // Check Doors
    for (const prop of game.props) {
      if (prop.tryUnlock && !prop.isOpen && Physics.distance(this.x, this.y, prop.x + prop.width / 2, prop.y + prop.height / 2) < 42) {
        prop.tryUnlock(game);
        return true;
      }
    }

    // Check Pots to pick up
    for (const prop of game.props) {
      if (prop instanceof Pot && !prop.isCarried && !prop.isFlying && !prop.isBroken) {
        if (Physics.distance(this.x, this.y, prop.x, prop.y) < 28) {
          prop.pickUp();
          this.carriedProp = prop;
          sound.rupee(1);
          return true;
        }
      }
    }

    return false;
  }

  takeDamage(amount, game, hitAngle = 0, knockbackPower = 180) {
    // If dodging, invulnerability frames protect the player!
    if (this.isDodging) {
      return false;
    }

    const taken = super.takeDamage(amount, game, hitAngle, knockbackPower);
    if (taken) {
      sound.playerHurt();
      game.camera.shake(7, 0.25);
      game.particles.createBloodOrMagic(this.x, this.y, 'rgba(230, 40, 40, ALPHA)', 8);

      if (this.health <= 0) {
        game.gameOver();
      }
    }
    return taken;
  }

  render(ctx, camera) {
    const camX = camera.getRenderX();
    const camY = camera.getRenderY();
    const sx = this.x - camX;
    const sy = this.y - camY;

    // Bobbing offset when walking
    const walkBob = (this.vx !== 0 || this.vy !== 0) ? Math.sin(this.walkAnimTimer) * 2 : 0;

    ctx.save();
    ctx.translate(sx, sy + walkBob);

    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 8 - walkBob, 11, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Invulnerability flicker (flashes white/transparent when hit)
    if (this.invulnTimer > 0 && Math.floor(this.invulnTimer * 20) % 2 === 0) {
      ctx.globalAlpha = 0.45;
    }

    // Hero Body (Zelda Link's Awakening Green Tunic)
    ctx.fillStyle = '#2e7d32'; // Green Tunic
    ctx.beginPath();
    ctx.arc(0, 1, 9, 0, Math.PI * 2);
    ctx.fill();

    // Brown Belt & Boots
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(-6, 4, 12, 3);
    ctx.fillRect(-7, 7, 5, 4);
    ctx.fillRect(2, 7, 5, 4);

    // Hero Head
    ctx.fillStyle = '#ffcc80'; // Peach skin
    ctx.beginPath();
    ctx.arc(0, -6, 7, 0, Math.PI * 2);
    ctx.fill();

    // Blonde Hair
    ctx.fillStyle = '#fbc02d';
    ctx.beginPath();
    ctx.arc(0, -9, 7, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-7, -8, 4, 5);
    ctx.fillRect(3, -8, 4, 5);

    // Green Pointy Hero Cap
    ctx.fillStyle = '#388e3c';
    ctx.beginPath();
    ctx.moveTo(-6, -9);
    ctx.lineTo(6, -9);
    // Point of cap bends backwards slightly
    const capAngle = this.aimAngle + Math.PI;
    const capTipX = Math.cos(capAngle) * 9;
    const capTipY = -12 + Math.sin(capAngle) * 6;
    ctx.lineTo(capTipX, capTipY);
    ctx.closePath();
    ctx.fill();

    // Hero Eyes looking towards aim angle
    const eyeOffsetX = Math.cos(this.aimAngle) * 2.5;
    const eyeOffsetY = Math.sin(this.aimAngle) * 2;
    ctx.fillStyle = '#1a237e';
    ctx.fillRect(-3 + eyeOffsetX, -7 + eyeOffsetY, 2, 3);
    ctx.fillRect(1 + eyeOffsetX, -7 + eyeOffsetY, 2, 3);

    // --- Render Shield (Raised toward Aim Angle) ---
    if (this.isShielding) {
      ctx.save();
      ctx.rotate(this.aimAngle);
      // Hero Hylian Shield
      ctx.fillStyle = '#1565c0'; // Blue shield
      ctx.fillRect(8, -7, 5, 14);
      ctx.fillStyle = '#c62828'; // Red crest
      ctx.fillRect(9, -3, 3, 6);
      ctx.fillStyle = '#ffd54f'; // Gold rim
      ctx.strokeRect(8, -7, 5, 14);
      ctx.restore();
    }

    // --- Render Sword / Slash Animation ---
    if (this.isAttacking || this.isCharging) {
      ctx.save();
      ctx.rotate(this.aimAngle);

      let swordOffsetAngle = 0;
      if (this.isAttacking) {
        const progress = 1 - (this.attackTimer / this.attackDuration);
        swordOffsetAngle = (progress - 0.5) * this.swordArc;
      } else if (this.isCharging) {
        // Pulled back preparing to spin
        swordOffsetAngle = -this.swordArc * 0.5 + Math.sin(Date.now() * 0.03) * 0.15;
      }

      ctx.rotate(swordOffsetAngle);

      // Master Sword Blade
      ctx.fillStyle = '#b0bec5';
      ctx.fillRect(6, -2, 18, 4);
      // Sword Tip
      ctx.beginPath();
      ctx.moveTo(24, -2);
      ctx.lineTo(28, 0);
      ctx.lineTo(24, 2);
      ctx.closePath();
      ctx.fill();
      // Blue Crossguard & Gold Pommel
      ctx.fillStyle = '#1976d2';
      ctx.fillRect(6, -5, 3, 10);
      ctx.fillStyle = '#fbc02d';
      ctx.fillRect(3, -2, 3, 4);

      ctx.restore();
    }

    // --- Render Aiming Crosshair / Reticle in World ---
    ctx.restore(); // back to world coordinates
  }
}
