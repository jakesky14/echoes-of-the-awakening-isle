// Universal Input Manager supporting Keyboard (WASD, Arrows, e.code, e.keyCode), Mouse Aiming, and Gamepad

export class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = {};
    this.keysJustPressed = {};
    this.hasMovedMouse = false;

    this.mouse = {
      x: 320,
      y: 180,
      worldX: 384 + 40,
      worldY: 1408,
      leftDown: false,
      rightDown: false,
      leftJustPressed: false,
      rightJustPressed: false,
      middleDown: false
    };

    this.setupListeners();
  }

  normalizeKey(keyStr) {
    if (!keyStr) return '';
    return String(keyStr).toLowerCase().replace(/\s+/g, '');
  }

  registerKeyDown(k, code, keyCode) {
    const keysToSet = [];
    if (k) keysToSet.push(this.normalizeKey(k));
    if (code) keysToSet.push(this.normalizeKey(code));
    if (keyCode) keysToSet.push(String(keyCode));

    for (const key of keysToSet) {
      if (!this.keys[key]) {
        this.keysJustPressed[key] = true;
      }
      this.keys[key] = true;
    }
  }

  registerKeyUp(k, code, keyCode) {
    const keysToUnset = [];
    if (k) keysToUnset.push(this.normalizeKey(k));
    if (code) keysToUnset.push(this.normalizeKey(code));
    if (keyCode) keysToUnset.push(String(keyCode));

    for (const key of keysToUnset) {
      this.keys[key] = false;
      this.keysJustPressed[key] = false;
    }
  }

  setupListeners() {
    if (typeof window === 'undefined') return;
    const onKeyDown = (e) => {
      this.registerKeyDown(e.key, e.code, e.keyCode);

      // Prevent scrolling page when pressing game keys
      const code = e.code ? e.code.toLowerCase() : '';
      const key = e.key ? e.key.toLowerCase() : '';
      if (
        ['space', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'tab'].includes(code) ||
        [' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'tab'].includes(key)
      ) {
        e.preventDefault();
      }
    };

    const onKeyUp = (e) => {
      this.registerKeyUp(e.key, e.code, e.keyCode);
    };

    // Listen on both window and canvas to ensure keystrokes are always received
    window.addEventListener('keydown', onKeyDown, { passive: false });
    window.addEventListener('keyup', onKeyUp);
    if (this.canvas) {
      this.canvas.addEventListener('keydown', onKeyDown, { passive: false });
      this.canvas.addEventListener('keyup', onKeyUp);
    }

    // Reset all pressed keys if window loses focus (prevent sticky running)
    window.addEventListener('blur', () => {
      this.keys = {};
      this.keysJustPressed = {};
    });

    // Mouse movement tracking
    const onMouseMove = (e) => {
      this.hasMovedMouse = true;
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;

      this.mouse.x = Math.max(0, Math.min(this.canvas.width, (e.clientX - rect.left) * scaleX));
      this.mouse.y = Math.max(0, Math.min(this.canvas.height, (e.clientY - rect.top) * scaleY));
    };

    window.addEventListener('mousemove', onMouseMove);

    // Mouse clicks on canvas and window
    if (this.canvas) {
      this.canvas.addEventListener('mousedown', (e) => {
        this.canvas.focus();
        if (e.button === 0) {
          this.mouse.leftDown = true;
          this.mouse.leftJustPressed = true;
        } else if (e.button === 2) {
          this.mouse.rightDown = true;
          this.mouse.rightJustPressed = true;
        }
        e.preventDefault();
      });
    }

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouse.leftDown = false;
      if (e.button === 2) this.mouse.rightDown = false;
    });

    if (this.canvas) {
      this.canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
      });
    }
  }

  updateWorldMouse(camera) {
    this.mouse.worldX = this.mouse.x + camera.getRenderX();
    this.mouse.worldY = this.mouse.y + camera.getRenderY();
  }

  isDown(key) {
    const k = this.normalizeKey(key);
    return !!this.keys[k];
  }

  isJustPressed(key) {
    const k = this.normalizeKey(key);
    return !!this.keysJustPressed[k];
  }

  isAnyKeyDown() {
    for (const k in this.keys) {
      if (this.keys[k]) return true;
    }
    return false;
  }

  isLeftMouseDown() {
    return this.mouse.leftDown;
  }

  isLeftJustPressed() {
    return this.mouse.leftJustPressed;
  }

  isRightMouseDown() {
    return this.mouse.rightDown;
  }

  isRightJustPressed() {
    return this.mouse.rightJustPressed;
  }

  getMovementVector() {
    let dx = 0;
    let dy = 0;

    // Up: W, ArrowUp, KeyW, Z (AZERTY), KeyZ, KeyCode 87, KeyCode 38
    const up = this.isDown('w') || this.isDown('keyw') || this.isDown('arrowup') ||
               this.isDown('z') || this.isDown('keyz') || this.isDown('87') || this.isDown('38');

    // Down: S, ArrowDown, KeyS, KeyCode 83, KeyCode 40
    const down = this.isDown('s') || this.isDown('keys') || this.isDown('arrowdown') ||
                 this.isDown('83') || this.isDown('40');

    // Left: A, ArrowLeft, KeyA, Q (AZERTY), KeyQ, KeyCode 65, KeyCode 37
    const left = this.isDown('a') || this.isDown('keya') || this.isDown('arrowleft') ||
                 this.isDown('q') || this.isDown('keyq') || this.isDown('65') || this.isDown('37');

    // Right: D, ArrowRight, KeyD, KeyCode 68, KeyCode 39
    const right = this.isDown('d') || this.isDown('keyd') || this.isDown('arrowright') ||
                  this.isDown('68') || this.isDown('39');

    if (up) dy -= 1;
    if (down) dy += 1;
    if (left) dx -= 1;
    if (right) dx += 1;

    // Normalize diagonal movement speed
    if (dx !== 0 && dy !== 0) {
      const invLen = 1 / Math.SQRT2;
      dx *= invLen;
      dy *= invLen;
    }

    return { dx, dy };
  }

  getAimAngle(originX, originY) {
    return Math.atan2(this.mouse.worldY - originY, this.mouse.worldX - originX);
  }

  clearJustPressed() {
    this.keysJustPressed = {};
    this.mouse.leftJustPressed = false;
    this.mouse.rightJustPressed = false;
  }
}
