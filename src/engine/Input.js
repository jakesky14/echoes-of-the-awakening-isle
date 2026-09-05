// Input Manager for Keyboard, Mouse Aiming, and Gamepad

export class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = {};
    this.keysJustPressed = {};
    this.mouse = {
      x: 0,
      y: 0,
      worldX: 0,
      worldY: 0,
      leftDown: false,
      rightDown: false,
      leftJustPressed: false,
      rightJustPressed: false,
      middleDown: false
    };

    this.setupListeners();
  }

  setupListeners() {
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (!this.keys[k]) {
        this.keysJustPressed[k] = true;
      }
      this.keys[k] = true;
      if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'tab'].includes(k)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      this.keys[k] = false;
      this.keysJustPressed[k] = false;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;

      this.mouse.x = (e.clientX - rect.left) * scaleX;
      this.mouse.y = (e.clientY - rect.top) * scaleY;
    });

    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.mouse.leftDown = true;
        this.mouse.leftJustPressed = true;
      } else if (e.button === 2) {
        this.mouse.rightDown = true;
        this.mouse.rightJustPressed = true;
      }
      e.preventDefault();
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouse.leftDown = false;
      if (e.button === 2) this.mouse.rightDown = false;
    });

    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }

  updateWorldMouse(camera) {
    this.mouse.worldX = this.mouse.x + camera.x;
    this.mouse.worldY = this.mouse.y + camera.y;
  }

  isDown(key) {
    return !!this.keys[key.toLowerCase()];
  }

  isJustPressed(key) {
    return !!this.keysJustPressed[key.toLowerCase()];
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

    if (this.isDown('w') || this.isDown('arrowup')) dy -= 1;
    if (this.isDown('s') || this.isDown('arrowdown')) dy += 1;
    if (this.isDown('a') || this.isDown('arrowleft')) dx -= 1;
    if (this.isDown('d') || this.isDown('arrowright')) dx += 1;

    // Normalize diagonal movement
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
