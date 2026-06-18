(function () {
  const save = loadSave();

  const canvas = document.getElementById("game-canvas");
  const game = new Game(canvas);
  game.setCharacter(getCharacter(save.equipped));

  const screens = {
    start: document.getElementById("screen-start"),
    gameover: document.getElementById("screen-gameover"),
    store: document.getElementById("screen-store"),
  };
  const hud = document.getElementById("hud");
  const scoreEl = document.getElementById("score");

  function showScreen(name) {
    Object.values(screens).forEach((el) => el.classList.add("hidden"));
    if (name && screens[name]) screens[name].classList.remove("hidden");
  }

  function goMenu() {
    game.goIdle();
    hud.classList.add("hidden");
    showScreen("start");
  }

  function startGame() {
    showScreen(null);
    hud.classList.remove("hidden");
    game.start();
  }

  game.onGameOver = (score) => {
    recordScore(save, score);
    document.getElementById("final-score").textContent = score;
    document.getElementById("best-score").textContent = save.bestScore;
    hud.classList.add("hidden");
    showScreen("gameover");
  };

  document.getElementById("btn-play").onclick = startGame;
  document.getElementById("btn-retry").onclick = startGame;
  document.getElementById("btn-menu").onclick = goMenu;

  function openStore() {
    showScreen("store");
    const refresh = () => {
      game.setCharacter(getCharacter(save.equipped));
      renderStore(save, refresh);
    };
    renderStore(save, refresh);
  }
  document.getElementById("btn-store").onclick = openStore;

  document.getElementById("btn-store-back").onclick = goMenu;

  // score HUD sync
  setInterval(() => {
    if (!hud.classList.contains("hidden")) scoreEl.textContent = game.score;
  }, 50);

  function flapInput(e) {
    if (e) e.preventDefault();
    game.flap();
  }
  canvas.addEventListener("pointerdown", flapInput);
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") flapInput(e);
  });

  goMenu();
})();
