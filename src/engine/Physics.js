// 2D Collision and Movement Physics Engine

export class Physics {
  static distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static distanceSq(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return dx * dx + dy * dy;
  }

  static circleCollision(c1, c2) {
    const minDist = c1.radius + c2.radius;
    return this.distanceSq(c1.x, c1.y, c2.x, c2.y) < minDist * minDist;
  }

  static circleAABBCollision(circle, box) {
    // Find closest point on box to circle center
    const closestX = Math.max(box.x, Math.min(circle.x, box.x + box.width));
    const closestY = Math.max(box.y, Math.min(circle.y, box.y + box.height));

    const distanceX = circle.x - closestX;
    const distanceY = circle.y - closestY;

    return (distanceX * distanceX + distanceY * distanceY) < (circle.radius * circle.radius);
  }

  // Resolve entity colliding into static impassable tile/box
  static resolveCircleAgainstAABB(circle, box) {
    const closestX = Math.max(box.x, Math.min(circle.x, box.x + box.width));
    const closestY = Math.max(box.y, Math.min(circle.y, box.y + box.height));

    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    const distSq = dx * dx + dy * dy;

    if (distSq < circle.radius * circle.radius) {
      const dist = Math.sqrt(distSq);
      if (dist === 0) {
        // Center is inside box, push along nearest edge
        circle.y -= circle.radius;
        return true;
      }
      const overlap = circle.radius - dist;
      circle.x += (dx / dist) * overlap;
      circle.y += (dy / dist) * overlap;
      return true;
    }
    return false;
  }

  // Push two dynamic circular actors away from each other
  static separateCircles(c1, c2, pushFactor = 0.5) {
    const dx = c2.x - c1.x;
    const dy = c2.y - c1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = c1.radius + c2.radius;

    if (dist < minDist && dist > 0.001) {
      const overlap = (minDist - dist);
      const nx = dx / dist;
      const ny = dy / dist;

      c1.x -= nx * overlap * (1 - pushFactor);
      c1.y -= ny * overlap * (1 - pushFactor);
      c2.x += nx * overlap * pushFactor;
      c2.y += ny * overlap * pushFactor;
      return true;
    }
    return false;
  }

  // Check if an angle is within an arc sector (for sword slash hit detection)
  static isAngleInArc(targetAngle, arcCenterAngle, arcSpread) {
    let diff = (targetAngle - arcCenterAngle) % (Math.PI * 2);
    if (diff < -Math.PI) diff += Math.PI * 2;
    if (diff > Math.PI) diff -= Math.PI * 2;
    return Math.abs(diff) <= arcSpread / 2;
  }

  // Line of sight raycast across impassable grid
  static hasLineOfSight(x1, y1, x2, y2, isSolidAt) {
    const dist = this.distance(x1, y1, x2, y2);
    const stepSize = 16;
    const steps = Math.ceil(dist / stepSize);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const checkX = x1 + (x2 - x1) * t;
      const checkY = y1 + (y2 - y1) * t;
      if (isSolidAt(checkX, checkY)) {
        return false;
      }
    }
    return true;
  }
}
