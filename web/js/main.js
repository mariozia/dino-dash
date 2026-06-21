(function () {
  const save = loadSave();
  const canvas = document.getElementById("game-canvas");
  const game = new Game(canvas);
  game.setCharacter(getCharacter(save.equipped));

  const screens = {
    login: document.getElementById("screen-login"),
    start: document.getElementById("screen-start"),
    gameover: document.getElementById("screen-gameover"),
    tournamentOver: document.getElementById("screen-tournament-over"),
    store: document.getElementById("screen-store"),
    tournaments: document.getElementById("screen-tournaments"),
  };
  const hud = document.getElementById("hud");
  const scoreEl = document.getElementById("score");
  const hudTournament = document.getElementById("hud-tournament");

  let session = getSession();
  let activeTournament = null;

  function showScreen(name) {
    Object.values(screens).forEach((el) => el.classList.add("hidden"));
    if (name && screens[name]) screens[name].classList.remove("hidden");
  }

  // --- Login ---
  const loginEmail = document.getElementById("login-email");
  const loginError = document.getElementById("login-error");
  const btnLogin = document.getElementById("btn-login");

  async function doLogin() {
    const email = loginEmail.value.trim();
    if (!email) return;
    btnLogin.disabled = true;
    btnLogin.textContent = "Verifying...";
    loginError.classList.add("hidden");
    try {
      const res = await verifyAccess(email);
      if (res.allowed) {
        session = { email, name: res.name, user_id: res.user_id, monthsActive: res.monthsActive };
        saveSession(session);
        goMenu();
      } else {
        loginError.textContent = res.reason === "user_not_found"
          ? "Email not found in ZiaRocks"
          : res.reason === "no_active_subscription"
          ? "No active subscription"
          : "Access denied: " + (res.reason || "unknown");
        loginError.classList.remove("hidden");
      }
    } catch (e) {
      loginError.textContent = "Connection error. Try again.";
      loginError.classList.remove("hidden");
    }
    btnLogin.disabled = false;
    btnLogin.textContent = "Enter";
  }

  btnLogin.onclick = doLogin;
  loginEmail.addEventListener("keydown", (e) => { if (e.key === "Enter") doLogin(); });

  // --- Menu ---
  function goMenu() {
    game.goIdle();
    hud.classList.add("hidden");
    hudTournament.classList.add("hidden");
    activeTournament = null;
    if (session) {
      document.getElementById("welcome-name").textContent =
        "Welcome, " + (session.name || session.email);
      showScreen("start");
    } else {
      showScreen("login");
    }
  }

  // --- Game ---
  function startGame(tournament) {
    activeTournament = tournament || null;
    showScreen(null);
    hud.classList.remove("hidden");
    if (activeTournament) {
      hudTournament.textContent = activeTournament.name;
      hudTournament.classList.remove("hidden");
    } else {
      hudTournament.classList.add("hidden");
    }
    game.start();
  }

  game.onGameOver = async (score) => {
    recordScore(save, score);
    hud.classList.add("hidden");

    if (activeTournament) {
      document.getElementById("t-final-score").textContent = score;
      document.getElementById("t-rank").textContent = "-";
      document.getElementById("t-submit-status").textContent = "Submitting score...";
      showScreen("tournamentOver");
      try {
        const res = await submitScore(session.email, activeTournament.id, score);
        if (res.rank) {
          document.getElementById("t-rank").textContent = "#" + res.rank;
          document.getElementById("t-submit-status").textContent = "Score submitted!";
        } else {
          document.getElementById("t-submit-status").textContent = res.error || "Submitted";
        }
      } catch (e) {
        document.getElementById("t-submit-status").textContent = "Failed to submit";
      }
    } else {
      document.getElementById("final-score").textContent = score;
      document.getElementById("best-score").textContent = save.bestScore;
      showScreen("gameover");
    }
  };

  // --- Tournaments ---
  async function openTournaments() {
    showScreen("tournaments");
    const list = document.getElementById("tournament-list");
    list.innerHTML = '<p class="hint">Loading tournaments...</p>';
    try {
      const tournaments = await getTournaments();
      if (!tournaments.length) {
        list.innerHTML = '<p class="t-no-tournaments">No tournaments available right now</p>';
        return;
      }
      list.innerHTML = "";
      tournaments.forEach((t) => {
        const card = document.createElement("div");
        card.className = "t-card";
        const isActive = t.status === "active";
        const statusClass = isActive ? "t-status-active" : "t-status-upcoming";
        const statusText = isActive ? "LIVE" : "UPCOMING";
        const timeLabel = isActive
          ? "Ends: " + new Date(t.ends_at).toLocaleString()
          : "Starts: " + new Date(t.starts_at).toLocaleString();
        const prizes = t.prize_pool
          ? Object.entries(t.prize_pool).map(([k, v]) => k + ": " + v + " ⭐").join(" | ")
          : "";
        card.innerHTML =
          '<div class="t-card-header">' +
            '<span class="t-card-name">' + t.name + '</span>' +
            '<span class="t-card-status ' + statusClass + '">' + statusText + '</span>' +
          '</div>' +
          (prizes ? '<div class="t-card-prizes">' + prizes + '</div>' : '') +
          '<div class="t-card-time">' + timeLabel + '</div>' +
          (isActive ? '<button class="btn btn-primary t-enter-btn">Play</button>' : '');
        if (isActive) {
          card.querySelector(".t-enter-btn").onclick = () => startGame(t);
        }
        list.appendChild(card);
      });
    } catch (e) {
      list.innerHTML = '<p class="error-text">Failed to load tournaments</p>';
    }
  }

  // --- Store ---
  function openStore() {
    showScreen("store");
    const refresh = () => {
      game.setCharacter(getCharacter(save.equipped));
      renderStore(save, refresh);
    };
    renderStore(save, refresh);
  }

  // --- Logout ---
  function doLogout() {
    clearSession();
    session = null;
    showScreen("login");
    loginEmail.value = "";
  }

  // --- Buttons ---
  document.getElementById("btn-play").onclick = () => startGame(null);
  document.getElementById("btn-retry").onclick = () => startGame(null);
  document.getElementById("btn-menu").onclick = goMenu;
  document.getElementById("btn-tournaments").onclick = openTournaments;
  document.getElementById("btn-tournaments-back").onclick = goMenu;
  document.getElementById("btn-store").onclick = openStore;
  document.getElementById("btn-store-back").onclick = goMenu;
  document.getElementById("btn-logout").onclick = doLogout;
  document.getElementById("btn-t-retry").onclick = () => startGame(activeTournament);
  document.getElementById("btn-t-menu").onclick = goMenu;

  // --- HUD sync ---
  setInterval(() => {
    if (!hud.classList.contains("hidden")) scoreEl.textContent = game.score;
  }, 50);

  // --- Input ---
  function flapInput(e) {
    if (e) e.preventDefault();
    game.flap();
  }
  canvas.addEventListener("pointerdown", flapInput);
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") flapInput(e);
  });

  // --- Init ---
  if (session) {
    goMenu();
  } else {
    showScreen("login");
    game.goIdle();
  }
})();
