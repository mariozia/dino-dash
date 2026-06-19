class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.state = "idle"; // idle | playing | dead | gameover
    this.score = 0;
    this.t = 0;
    this.lastTime = null;
    this.scrollX = 0;
    this.meteors = [];
    this.spawnTimer = 0;
    this.onGameOver = null;

    this.resize();
    window.addEventListener("resize", () => this.resize());

    this.player = new Player(0, 0);
    this.placePlayer();

    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.groundH = Math.max(48, this.height * 0.12);
    this.groundY = this.height - this.groundH;
    if (this.player) this.placePlayer();
  }

  placePlayer() {
    this.player.x = this.width * 0.28;
    this.player.startY = this.height * 0.42;
    if (this.player.mode === "shm") this.player.y = this.player.startY;
  }

  setCharacter(character) {
    this.player.setCharacter(character);
  }

  goIdle() {
    this.state = "idle";
    this.player.mode = "shm";
    this.player.y = this.player.startY;
    this.meteors = [];
    this.score = 0;
  }

  start() {
    this.state = "playing";
    this.score = 0;
    this.meteors = [];
    this.spawnTimer = 0;
    this.player.reset();
    this.placePlayer();
    // first meteor a bit further out so the player has time to react
    this.spawnTimer = -0.6;
  }

  flap() {
    if (this.state === "idle") return;
    if (this.state !== "playing") return;
    this.player.flap();
  }

  meteorSpeed() {
    return -(140 + Math.min(70, this.score * 3)); // ramps up slightly with score
  }

  spawnMeteor() {
    const gapHeight = Math.max(140, Math.min(210, this.height * 0.24));
    const margin = 60;
    const gapY = margin + Math.random() * (this.groundY - margin * 2 - gapHeight) + gapHeight / 2;
    const width = Math.max(54, this.width * 0.14);
    this.meteors.push(new MeteorPair(this.width + width, gapY, gapHeight, width, this.meteorSpeed()));
  }

  update(dt) {
    this.t += dt * 1000;
    this.scrollX += 90 * dt;

    if (this.state === "idle") {
      this.player.update(dt, this.groundY);
      return;
    }

    if (this.state === "playing") {
      this.spawnTimer += dt;
      const spawnInterval = Math.max(1.05, 1.7 - this.score * 0.02);
      if (this.spawnTimer >= spawnInterval) {
        this.spawnTimer = 0;
        this.spawnMeteor();
      }

      for (const m of this.meteors) m.update(dt);
      this.meteors = this.meteors.filter((m) => !m.offscreen());

      this.player.update(dt, this.groundY);

      for (const m of this.meteors) {
        if (!m.scored && m.x + m.width < this.player.x) {
          m.scored = true;
          this.score++;
        }
        const hit =
          circleRectCollide(this.player.x, this.player.y, this.player.radius, m.topRect(this.groundY)) ||
          circleRectCollide(this.player.x, this.player.y, this.player.radius, m.bottomRect(this.groundY));
        if (hit) this.crash();
      }

      if (this.player.y >= this.groundY - this.player.radius * 0.7) this.crash();
    } else if (this.state === "dead") {
      this.player.update(dt, this.groundY);
      if (this.player.landed) {
        this.state = "gameover";
        if (this.onGameOver) this.onGameOver(this.score);
      }
    }
  }

  crash() {
    if (this.state !== "playing") return;
    this.state = "dead";
    this.player.startCrash();
    for (const m of this.meteors) m.vel = 0;
  }

  draw() {
    const { ctx, width: w, height: h } = this;
    drawBackground(ctx, w, h, this.scrollX);
    for (const m of this.meteors) m.draw(ctx, this.groundY, h);
    this.player.draw(ctx, this.t);
  }

  _loop(now) {
    if (this.lastTime == null) this.lastTime = now;
    const dt = Math.min(0.033, (now - this.lastTime) / 1000);
    this.lastTime = now;
    this.update(dt);
    this.draw();
    requestAnimationFrame(this._loop);
  }
}
