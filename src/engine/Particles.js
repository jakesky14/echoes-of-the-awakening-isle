// Particle System for visual juice: sword slash arcs, grass cuts, dodge dust, sparks, shockwaves

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.shockwaves = [];
    this.slashTrails = [];
  }

  update(dt) {
    // Update simple particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.age += dt;
      if (p.age >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.pow(p.friction, dt * 60);
      p.vy *= Math.pow(p.friction, dt * 60);
      if (p.gravity) {
        p.vy += p.gravity * dt;
      }
      if (p.spin) {
        p.angle += p.spin * dt;
      }
    }

    // Update expanding shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const s = this.shockwaves[i];
      s.age += dt;
      s.radius += s.speed * dt;
      if (s.age >= s.maxLife || s.radius >= s.maxRadius) {
        this.shockwaves.splice(i, 1);
      }
    }

    // Update slash arcs
    for (let i = this.slashTrails.length - 1; i >= 0; i--) {
      const t = this.slashTrails[i];
      t.age += dt;
      if (t.age >= t.maxLife) {
        this.slashTrails.splice(i, 1);
      }
    }
  }

  render(ctx, camera) {
    const camX = camera.getRenderX();
    const camY = camera.getRenderY();

    // Render shockwaves first (on ground)
    for (const s of this.shockwaves) {
      const alpha = Math.max(0, 1 - (s.age / s.maxLife));
      ctx.save();
      ctx.beginPath();
      ctx.arc(s.x - camX, s.y - camY, Math.max(1, s.radius), 0, Math.PI * 2);
      ctx.strokeStyle = s.color || `rgba(255, 230, 120, ${alpha})`;
      ctx.lineWidth = s.lineWidth || 3;
      ctx.stroke();
      ctx.restore();
    }

    // Render slash trails
    for (const t of this.slashTrails) {
      const progress = t.age / t.maxLife;
      const alpha = Math.max(0, 1 - progress);
      ctx.save();
      ctx.translate(t.x - camX, t.y - camY);
      ctx.beginPath();
      ctx.arc(0, 0, t.radius, t.startAngle, t.endAngle, false);
      ctx.strokeStyle = t.color.replace('ALPHA', alpha.toFixed(2));
      ctx.lineWidth = t.width * (1 - progress * 0.5);
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.restore();
    }

    // Render particles
    for (const p of this.particles) {
      const alpha = Math.max(0, 1 - (p.age / p.maxLife));
      ctx.save();
      ctx.translate(p.x - camX, p.y - camY);
      if (p.angle) ctx.rotate(p.angle);

      if (p.shape === 'rect') {
        ctx.fillStyle = p.color.replace('ALPHA', alpha.toFixed(2));
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      } else if (p.shape === 'leaf') {
        ctx.fillStyle = p.color.replace('ALPHA', alpha.toFixed(2));
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 1.4, p.size * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(0.5, p.size * (1 - p.age / p.maxLife * 0.4)), 0, Math.PI * 2);
        ctx.fillStyle = p.color.replace('ALPHA', alpha.toFixed(2));
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // --- Emitters ---

  addSlashArc(x, y, startAngle, endAngle, radius, color = 'rgba(180, 235, 255, ALPHA)', width = 6, life = 0.15) {
    this.slashTrails.push({
      x, y, startAngle, endAngle, radius, color, width, maxLife: life, age: 0
    });
  }

  createShockwave(x, y, maxRadius = 45, speed = 180, color = null, lineWidth = 4) {
    this.shockwaves.push({
      x, y, radius: 4, speed, maxRadius, maxLife: maxRadius / speed, age: 0, color, lineWidth
    });
  }

  createGrassCut(x, y) {
    const colors = [
      'rgba(82, 178, 62, ALPHA)',
      'rgba(125, 212, 70, ALPHA)',
      'rgba(46, 125, 50, ALPHA)',
      'rgba(180, 230, 80, ALPHA)'
    ];
    for (let i = 0; i < 7; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 80;
      this.particles.push({
        x: x + (Math.random() * 12 - 6),
        y: y + (Math.random() * 12 - 6),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        size: 3 + Math.random() * 3,
        shape: 'leaf',
        color: colors[Math.floor(Math.random() * colors.length)],
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 12,
        friction: 0.9,
        gravity: 120,
        age: 0,
        maxLife: 0.35 + Math.random() * 0.25
      });
    }
  }

  createDust(x, y, count = 4, baseAngle = null) {
    for (let i = 0; i < count; i++) {
      let angle = baseAngle !== null ? baseAngle + (Math.random() * 1.2 - 0.6) : Math.random() * Math.PI * 2;
      const speed = 15 + Math.random() * 35;
      this.particles.push({
        x: x + (Math.random() * 8 - 4),
        y: y + (Math.random() * 8 - 4),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 10,
        size: 3 + Math.random() * 4,
        shape: 'circle',
        color: 'rgba(230, 220, 200, ALPHA)',
        friction: 0.88,
        gravity: -10,
        age: 0,
        maxLife: 0.25 + Math.random() * 0.15
      });
    }
  }

  createHitSparks(x, y, hitAngle, count = 8) {
    for (let i = 0; i < count; i++) {
      const spread = (Math.random() - 0.5) * 1.4;
      const angle = hitAngle + spread;
      const speed = 70 + Math.random() * 130;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 2,
        shape: 'rect',
        color: Math.random() > 0.3 ? 'rgba(255, 230, 80, ALPHA)' : 'rgba(255, 255, 255, ALPHA)',
        angle: angle,
        spin: 0,
        friction: 0.92,
        gravity: 80,
        age: 0,
        maxLife: 0.15 + Math.random() * 0.12
      });
    }
  }

  createBloodOrMagic(x, y, color = 'rgba(220, 50, 50, ALPHA)', count = 6) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 70;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        shape: 'circle',
        color,
        friction: 0.88,
        gravity: 90,
        age: 0,
        maxLife: 0.2 + Math.random() * 0.2
      });
    }
  }

  createDeathPoof(x, y, size = 16) {
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2 + (Math.random() * 0.4);
      const speed = 40 + Math.random() * 60;
      this.particles.push({
        x: x + Math.cos(angle) * (size * 0.3),
        y: y + Math.sin(angle) * (size * 0.3),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 15,
        size: 4 + Math.random() * 6,
        shape: 'circle',
        color: 'rgba(245, 245, 250, ALPHA)',
        friction: 0.85,
        gravity: -20,
        age: 0,
        maxLife: 0.35 + Math.random() * 0.2
      });
    }
  }

  createExplosion(x, y, radius = 32) {
    this.createShockwave(x, y, radius * 1.5, 220, 'rgba(255, 140, 40, ALPHA)', 5);
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 120;
      const isFire = Math.random() > 0.4;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 6,
        shape: 'circle',
        color: isFire ? 'rgba(255, 100, 30, ALPHA)' : 'rgba(100, 100, 100, ALPHA)',
        friction: 0.86,
        gravity: -40,
        age: 0,
        maxLife: 0.3 + Math.random() * 0.25
      });
    }
  }

  createHealSparkles(x, y) {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: x + (Math.random() * 20 - 10),
        y: y + (Math.random() * 20 - 10),
        vx: (Math.random() - 0.5) * 15,
        vy: -25 - Math.random() * 30,
        size: 3 + Math.random() * 2,
        shape: 'circle',
        color: 'rgba(80, 255, 120, ALPHA)',
        friction: 0.96,
        gravity: 0,
        age: 0,
        maxLife: 0.45
      });
    }
  }
}
