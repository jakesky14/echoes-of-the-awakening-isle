// Camera with smooth tracking, lookahead aiming, screen shake, and boundary clamping

export class Camera {
  constructor(viewportWidth, viewportHeight) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.smoothSpeed = 0.12;

    // Bounds
    this.minX = 0;
    this.minY = 0;
    this.maxX = 2000;
    this.maxY = 2000;

    // Screen Shake
    this.shakeDuration = 0;
    this.shakeIntensity = 0;
    this.shakeX = 0;
    this.shakeY = 0;

    // Lookahead toward mouse aim
    this.lookAheadDistance = 40;
  }

  setBounds(minX, minY, maxX, maxY) {
    this.minX = minX;
    this.minY = minY;
    this.maxX = maxX;
    this.maxY = maxY;
  }

  shake(intensity = 6, duration = 0.2) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeDuration = Math.max(this.shakeDuration, duration);
  }

  update(dt, targetX, targetY, mouseWorldX = null, mouseWorldY = null) {
    // Lookahead bias toward mouse
    let aimOffsetX = 0;
    let aimOffsetY = 0;
    if (mouseWorldX !== null && mouseWorldY !== null) {
      const angle = Math.atan2(mouseWorldY - targetY, mouseWorldX - targetX);
      aimOffsetX = Math.cos(angle) * this.lookAheadDistance;
      aimOffsetY = Math.sin(angle) * this.lookAheadDistance;
    }

    const desiredX = targetX + aimOffsetX - this.viewportWidth / 2;
    const desiredY = targetY + aimOffsetY - this.viewportHeight / 2;

    // Smooth Lerp
    this.x += (desiredX - this.x) * (1 - Math.pow(0.001, dt));
    this.y += (desiredY - this.y) * (1 - Math.pow(0.001, dt));

    // Shake update
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      const decay = Math.max(0, this.shakeDuration / 0.2);
      this.shakeX = (Math.random() * 2 - 1) * this.shakeIntensity * decay;
      this.shakeY = (Math.random() * 2 - 1) * this.shakeIntensity * decay;
      if (this.shakeDuration <= 0) {
        this.shakeIntensity = 0;
        this.shakeX = 0;
        this.shakeY = 0;
      }
    }

    // Clamp within world bounds
    const maxCamX = Math.max(this.minX, this.maxX - this.viewportWidth);
    const maxCamY = Math.max(this.minY, this.maxY - this.viewportHeight);
    this.x = Math.max(this.minX, Math.min(this.x, maxCamX));
    this.y = Math.max(this.minY, Math.min(this.y, maxCamY));
  }

  getRenderX() {
    return Math.round(this.x + this.shakeX);
  }

  getRenderY() {
    return Math.round(this.y + this.shakeY);
  }
}
