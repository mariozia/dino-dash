(function () {
  const save = loadSave();
  const canvas = document.getElementById("game-canvas");
  const game = new Game(canvas);
  game.setCharacter(getCharacter(save.equipped));

  const screens = {
    login: document.getElementById("screen-login"),
    createPassword: document.getElementById("screen-create-password"),
    password: document.getElementById("screen-password"),
    forgot: document.getElementById("screen-forgot"),
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
  let pendingEmail = "";

  var ADMIN_ACCOUNTS = {
    "support@ziarocks.com": "Zia2026!"
  };

  function showScreen(name) {
    Object.values(screens).forEach((el) => el.classList.add("hidden"));
    if (name && screens[name]) screens[name].classList.remove("hidden");
  }

  function setLoading(btn, loading, originalText) {
    btn.disabled = loading;
    btn.textContent = loading ? "Loading..." : originalText;
  }

  // ── Step 1: Email check ──
  const emailInput = document.getElementById("login-email");
  const loginError = document.getElementById("login-error");
  const btnCheckEmail = document.getElementById("btn-check-email");

  async function doCheckEmail() {
    const email = emailInput.value.trim().toLowerCase();
    if (!email) return;
    loginError.classList.add("hidden");
    setLoading(btnCheckEmail, true, "Next");

    if (ADMIN_ACCOUNTS[email]) {
      pendingEmail = email;
      document.getElementById("login-pw-email").textContent = email;
      document.getElementById("login-pw-input").value = "";
      document.getElementById("login-pw-error").classList.add("hidden");
      showScreen("password");
      setLoading(btnCheckEmail, false, "Next");
      return;
    }

    try {
      const res = await checkUserStatus(email);
      if (!res.isActive) {
        loginError.textContent = res.error === "Failed to verify membership"
          ? "Could not verify. Try again."
          : "No active ZiaRocks subscription found.";
        loginError.classList.remove("hidden");
        setLoading(btnCheckEmail, false, "Next");
        return;
      }
      pendingEmail = email;
      if (res.exists && res.hasPassword) {
        document.getElementById("login-pw-email").textContent = email;
        document.getElementById("login-pw-input").value = "";
        document.getElementById("login-pw-error").classList.add("hidden");
        showScreen("password");
      } else {
        document.getElementById("create-pw-email").textContent = email;
        document.getElementById("create-pw-input").value = "";
        document.getElementById("create-pw-confirm").value = "";
        document.getElementById("create-pw-error").classList.add("hidden");
        showScreen("createPassword");
      }
    } catch (e) {
      loginError.textContent = "Connection error. Try again.";
      loginError.classList.remove("hidden");
    }
    setLoading(btnCheckEmail, false, "Next");
  }

  btnCheckEmail.onclick = doCheckEmail;
  emailInput.addEventListener("keydown", (e) => { if (e.key === "Enter") doCheckEmail(); });

  // ── Step 2a: Create password ──
  const createPwInput = document.getElementById("create-pw-input");
  const createPwConfirm = document.getElementById("create-pw-confirm");
  const createPwError = document.getElementById("create-pw-error");
  const btnCreatePw = document.getElementById("btn-create-pw");

  async function doCreatePassword() {
    const pw = createPwInput.value;
    const pw2 = createPwConfirm.value;
    createPwError.classList.add("hidden");
    if (!pw || pw.length < 6) {
      createPwError.textContent = "Password must be at least 6 characters.";
      createPwError.classList.remove("hidden");
      return;
    }
    if (pw !== pw2) {
      createPwError.textContent = "Passwords don't match.";
      createPwError.classList.remove("hidden");
      return;
    }
    setLoading(btnCreatePw, true, "Create Account");
    try {
      const res = await createPassword(pendingEmail, pw);
      if (res.success) {
        const loginRes = await loginWithPassword(pendingEmail, pw);
        if (loginRes.success) {
          session = { email: pendingEmail, name: loginRes.user?.display_name || pendingEmail.split("@")[0], user: loginRes.user };
          saveSession(session);
          goMenu();
        } else {
          session = { email: pendingEmail, name: pendingEmail.split("@")[0] };
          saveSession(session);
          goMenu();
        }
      } else {
        createPwError.textContent = res.error || "Failed to create account.";
        createPwError.classList.remove("hidden");
      }
    } catch (e) {
      createPwError.textContent = "Connection error. Try again.";
      createPwError.classList.remove("hidden");
    }
    setLoading(btnCreatePw, false, "Create Account");
  }

  btnCreatePw.onclick = doCreatePassword;
  createPwConfirm.addEventListener("keydown", (e) => { if (e.key === "Enter") doCreatePassword(); });
  document.getElementById("btn-create-pw-back").onclick = () => showScreen("login");

  // ── Step 2b: Login with password ──
  const loginPwInput = document.getElementById("login-pw-input");
  const loginPwError = document.getElementById("login-pw-error");
  const btnLoginPw = document.getElementById("btn-login-pw");

  async function doLogin() {
    const pw = loginPwInput.value;
    loginPwError.classList.add("hidden");
    if (!pw) return;
    setLoading(btnLoginPw, true, "Log In");

    if (ADMIN_ACCOUNTS[pendingEmail]) {
      if (pw === ADMIN_ACCOUNTS[pendingEmail]) {
        session = { email: pendingEmail, name: "Admin", admin: true };
        saveSession(session);
        goMenu();
      } else {
        loginPwError.textContent = "Invalid password.";
        loginPwError.classList.remove("hidden");
      }
      setLoading(btnLoginPw, false, "Log In");
      return;
    }

    try {
      const res = await loginWithPassword(pendingEmail, pw);
      if (res.success) {
        session = { email: pendingEmail, name: res.user?.display_name || pendingEmail.split("@")[0], user: res.user };
        saveSession(session);
        goMenu();
      } else {
        loginPwError.textContent = res.error || "Invalid password.";
        loginPwError.classList.remove("hidden");
      }
    } catch (e) {
      loginPwError.textContent = "Connection error. Try again.";
      loginPwError.classList.remove("hidden");
    }
    setLoading(btnLoginPw, false, "Log In");
  }

  btnLoginPw.onclick = doLogin;
  loginPwInput.addEventListener("keydown", (e) => { if (e.key === "Enter") doLogin(); });
  document.getElementById("btn-login-pw-back").onclick = () => showScreen("login");

  // ── Forgot password ──
  document.getElementById("btn-forgot-pw").onclick = async () => {
    try {
      await forgotPassword(pendingEmail);
    } catch (e) {}
    document.getElementById("forgot-msg").textContent =
      "A password reset link has been sent to " + pendingEmail;
    showScreen("forgot");
  };
  document.getElementById("btn-forgot-back").onclick = () => showScreen("login");

  // ── Main menu ──
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

  // ── Game ──
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

  // ── Tournaments ──
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
          ? Object.entries(t.prize_pool).map(function(e) { return e[0] + ": " + e[1] + " ⭐"; }).join(" | ")
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
          card.querySelector(".t-enter-btn").onclick = function() { startGame(t); };
        }
        list.appendChild(card);
      });
    } catch (e) {
      list.innerHTML = '<p class="error-text">Failed to load tournaments</p>';
    }
  }

  // ── Store ──
  function openStore() {
    showScreen("store");
    var refresh = function() {
      game.setCharacter(getCharacter(save.equipped));
      renderStore(save, refresh);
    };
    renderStore(save, refresh);
  }

  // ── Logout ──
  function doLogout() {
    clearSession();
    session = null;
    pendingEmail = "";
    emailInput.value = "";
    showScreen("login");
  }

  // ── Button bindings ──
  document.getElementById("btn-play").onclick = function() { startGame(null); };
  document.getElementById("btn-retry").onclick = function() { startGame(null); };
  document.getElementById("btn-menu").onclick = goMenu;
  document.getElementById("btn-tournaments").onclick = openTournaments;
  document.getElementById("btn-tournaments-back").onclick = goMenu;
  document.getElementById("btn-store").onclick = openStore;
  document.getElementById("btn-store-back").onclick = goMenu;
  document.getElementById("btn-logout").onclick = doLogout;
  document.getElementById("btn-t-retry").onclick = function() { startGame(activeTournament); };
  document.getElementById("btn-t-menu").onclick = goMenu;

  // ── HUD sync ──
  setInterval(function() {
    if (!hud.classList.contains("hidden")) scoreEl.textContent = game.score;
  }, 50);

  // ── Input ──
  function flapInput(e) {
    if (e) e.preventDefault();
    game.flap();
  }
  canvas.addEventListener("pointerdown", flapInput);
  window.addEventListener("keydown", function(e) {
    if (e.code === "Space") flapInput(e);
  });

  // ── Password visibility toggles ──
  document.querySelectorAll(".btn-eye").forEach(function(btn) {
    btn.addEventListener("click", function() {
      var input = document.getElementById(btn.getAttribute("data-target"));
      if (input.type === "password") {
        input.type = "text";
        btn.classList.add("active");
      } else {
        input.type = "password";
        btn.classList.remove("active");
      }
    });
  });

  // ── Init ──
  if (session) {
    goMenu();
  } else {
    showScreen("login");
    game.goIdle();
  }
})();
