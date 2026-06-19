// Physics is identical for every character — only the art drawn at the
// player's position changes when you equip a different dino in the store.

const PHYSICS = {
  gravity: 1900, // px/s^2
  flapVelocity: -480, // px/s, set instantly on flap
  maxFallSpeed: 620, // px/s
  maxRiseSpeed: -480, // px/s
  shmAmplitude: 16, // idle bob amplitude on menu screen
};

class Player {
  constructor(x, y) {
    this.x = x;
    this.startY = y;
    this.y = y;
    this.velY = 0;
    this.rotation = 0;
    this.radius = 22; // collision hitbox, same for every character
    this.mode = "shm"; // shm | normal | crash
    this.shmT = 0;
    this.character = CHARACTERS[0];
  }

  setCharacter(character) {
    this.character = character;
  }

  reset() {
    this.y = this.startY;
    this.velY = -120;
    this.rotation = 0;
    this.mode = "normal";
  }

  flap() {
    if (this.mode !== "normal") return;
    this.velY = PHYSICS.flapVelocity;
    this.rotation = -28;
  }

  startCrash() {
    this.mode = "crash";
  }

  update(dt, groundY) {
    if (this.mode === "shm") {
      this.shmT += dt;
      this.y = this.startY + Math.sin(this.shmT * 0.0028) * PHYSICS.shmAmplitude;
      this.rotation = Math.sin(this.shmT * 0.0028) * 6;
      return;
    }

    this.velY = Math.min(this.velY + PHYSICS.gravity * dt, PHYSICS.maxFallSpeed);
    this.velY = Math.max(this.velY, PHYSICS.maxRiseSpeed);
    this.y += this.velY * dt;

    const floor = groundY - this.radius * 0.7;
    if (this.y > floor) {
      this.y = floor;
      if (this.mode === "crash") this.landed = true;
    }
    if (this.y < this.radius) this.y = this.radius;

    const targetRot = this.velY < 0 ? -28 : Math.min(90, this.rotation + dt * 0.45 * 1000 * 0.18 + this.velY * 0.05);
    if (this.mode === "crash") {
      this.rotation = Math.min(90, this.rotation + dt * 260);
    } else {
      this.rotation += (targetRot - this.rotation) * Math.min(1, dt * 10);
      this.rotation = Math.max(-28, Math.min(90, this.rotation));
    }
  }

  draw(ctx, t) {
    ctx.save();
    ctx.translate(this.x, this.y);
    drawDino(ctx, this.character, t, this.rotation);
    ctx.restore();
  }
}

class MeteorPair {
  constructor(x, gapY, gapHeight, width, vel) {
    this.x = x;
    this.gapY = gapY;
    this.gapHeight = gapHeight;
    this.width = width;
    this.vel = vel;
    this.scored = false;
  }

  update(dt) {
    this.x += this.vel * dt;
  }

  offscreen() {
    return this.x + this.width < -10;
  }

  topRect(groundY) {
    return { x: this.x, y: 0, w: this.width, h: this.gapY - this.gapHeight / 2 };
  }

  bottomRect(groundY) {
    const top = this.gapY + this.gapHeight / 2;
    return { x: this.x, y: top, w: this.width, h: groundY - top };
  }

  draw(ctx, groundY, canvasHeight) {
    const top = this.topRect(groundY);
    const bot = this.bottomRect(groundY);
    drawMeteor(ctx, top.x, top.y, top.w, top.h, true);
    // the hitbox still stops at groundY (the actual floor), but the rock is
    // drawn further down to the real screen edge so it doesn't float with a
    // gap underneath now that there's no separate ground strip to hide it.
    const bottomDrawH = canvasHeight - bot.y;
    drawMeteor(ctx, bot.x, bot.y, bot.w, bottomDrawH, false);
  }
}

function circleRectCollide(cx, cy, r, rect) {
  const closestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const closestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy < r * r;
}
