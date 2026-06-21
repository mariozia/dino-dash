(function () {
  var HOWTO_KEY = "dino-dash-howto-seen";
  var save = loadSave();
  var canvas = document.getElementById("game-canvas");
  var game = new Game(canvas);
  game.setCharacter(getCharacter(save.equipped));

  var screens = {
    login: document.getElementById("screen-login"),
    createPassword: document.getElementById("screen-create-password"),
    password: document.getElementById("screen-password"),
    forgot: document.getElementById("screen-forgot"),
    howto: document.getElementById("screen-howto"),
    start: document.getElementById("screen-start"),
    gameover: document.getElementById("screen-gameover"),
    tournamentOver: document.getElementById("screen-tournament-over"),
    store: document.getElementById("screen-store"),
    tournaments: document.getElementById("screen-tournaments"),
    admin: document.getElementById("screen-admin"),
  };
  var hud = document.getElementById("hud");
  var scoreEl = document.getElementById("score");
  var hudTournament = document.getElementById("hud-tournament");

  var session = getSession();
  var activeTournament = null;
  var pendingEmail = "";

  var ADMIN_ACCOUNTS = {
    "support@ziarocks.com": "Zia2026!"
  };

  function showScreen(name) {
    Object.values(screens).forEach(function(el) { el.classList.add("hidden"); });
    if (name && screens[name]) screens[name].classList.remove("hidden");
  }

  function setLoading(btn, loading, key) {
    btn.disabled = loading;
    btn.textContent = loading ? "..." : t(key);
  }

  // ── i18n ──
  function updateUI() {
    document.querySelectorAll("[data-i18n]").forEach(function(el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function(el) {
      el.placeholder = t(el.getAttribute("data-i18n-placeholder"));
    });
    var langBtn = document.getElementById("btn-lang");
    langBtn.textContent = (LANGS[currentLang] ? LANGS[currentLang].langName : "EN") + " ▾";
  }

  // ── Language picker ──
  var langBtn = document.getElementById("btn-lang");
  var langDropdown = document.getElementById("lang-dropdown");

  function buildLangDropdown() {
    langDropdown.innerHTML = "";
    Object.keys(LANGS).forEach(function(code) {
      var opt = document.createElement("button");
      opt.className = "lang-option" + (code === currentLang ? " active" : "");
      opt.textContent = LANGS[code].langName;
      opt.onclick = function() {
        setLang(code);
        updateUI();
        langDropdown.classList.add("hidden");
      };
      langDropdown.appendChild(opt);
    });
  }

  langBtn.onclick = function(e) {
    e.stopPropagation();
    buildLangDropdown();
    langDropdown.classList.toggle("hidden");
  };
  document.addEventListener("click", function() { langDropdown.classList.add("hidden"); });

  // ── Step 1: Email check ──
  var emailInput = document.getElementById("login-email");
  var loginError = document.getElementById("login-error");
  var btnCheckEmail = document.getElementById("btn-check-email");

  async function doCheckEmail() {
    var email = emailInput.value.trim().toLowerCase();
    if (!email) return;
    loginError.classList.add("hidden");
    setLoading(btnCheckEmail, true, "loginNext");

    if (ADMIN_ACCOUNTS[email]) {
      pendingEmail = email;
      document.getElementById("login-pw-email").textContent = email;
      document.getElementById("login-pw-input").value = "";
      document.getElementById("login-pw-error").classList.add("hidden");
      showScreen("password");
      setLoading(btnCheckEmail, false, "loginNext");
      return;
    }

    try {
      var res = await checkUserStatus(email);
      if (!res.isActive) {
        loginError.textContent = res.error === "Failed to verify membership"
          ? t("loginVerifyFail") : t("loginNoSub");
        loginError.classList.remove("hidden");
        setLoading(btnCheckEmail, false, "loginNext");
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
      loginError.textContent = t("loginConnError");
      loginError.classList.remove("hidden");
    }
    setLoading(btnCheckEmail, false, "loginNext");
  }

  btnCheckEmail.onclick = doCheckEmail;
  emailInput.addEventListener("keydown", function(e) { if (e.key === "Enter") doCheckEmail(); });

  // ── Step 2a: Create password ──
  var createPwInput = document.getElementById("create-pw-input");
  var createPwConfirm = document.getElementById("create-pw-confirm");
  var createPwError = document.getElementById("create-pw-error");
  var btnCreatePw = document.getElementById("btn-create-pw");

  async function doCreatePassword() {
    var pw = createPwInput.value;
    var pw2 = createPwConfirm.value;
    createPwError.classList.add("hidden");
    if (!pw || pw.length < 6) {
      createPwError.textContent = t("createPwMin");
      createPwError.classList.remove("hidden");
      return;
    }
    if (pw !== pw2) {
      createPwError.textContent = t("createPwMatch");
      createPwError.classList.remove("hidden");
      return;
    }
    setLoading(btnCreatePw, true, "createPwBtn");
    try {
      var res = await createPassword(pendingEmail, pw);
      if (res.success) {
        var loginRes = await loginWithPassword(pendingEmail, pw);
        if (loginRes.success) {
          session = { email: pendingEmail, name: loginRes.user?.display_name || pendingEmail.split("@")[0], user: loginRes.user };
        } else {
          session = { email: pendingEmail, name: pendingEmail.split("@")[0] };
        }
        saveSession(session);
        enterGame();
      } else {
        createPwError.textContent = res.error || t("createPwFail");
        createPwError.classList.remove("hidden");
      }
    } catch (e) {
      createPwError.textContent = t("loginConnError");
      createPwError.classList.remove("hidden");
    }
    setLoading(btnCreatePw, false, "createPwBtn");
  }

  btnCreatePw.onclick = doCreatePassword;
  createPwConfirm.addEventListener("keydown", function(e) { if (e.key === "Enter") doCreatePassword(); });
  document.getElementById("btn-create-pw-back").onclick = function() { showScreen("login"); };

  // ── Step 2b: Login with password ──
  var loginPwInput = document.getElementById("login-pw-input");
  var loginPwError = document.getElementById("login-pw-error");
  var btnLoginPw = document.getElementById("btn-login-pw");

  async function doLogin() {
    var pw = loginPwInput.value;
    loginPwError.classList.add("hidden");
    if (!pw) return;
    setLoading(btnLoginPw, true, "loginPwBtn");

    if (ADMIN_ACCOUNTS[pendingEmail]) {
      if (pw === ADMIN_ACCOUNTS[pendingEmail]) {
        session = { email: pendingEmail, name: "Admin", admin: true };
        saveSession(session);
        enterGame();
      } else {
        loginPwError.textContent = t("loginPwInvalid");
        loginPwError.classList.remove("hidden");
      }
      setLoading(btnLoginPw, false, "loginPwBtn");
      return;
    }

    try {
      var res = await loginWithPassword(pendingEmail, pw);
      if (res.success) {
        session = { email: pendingEmail, name: res.user?.display_name || pendingEmail.split("@")[0], user: res.user };
        saveSession(session);
        enterGame();
      } else {
        loginPwError.textContent = res.error || t("loginPwInvalid");
        loginPwError.classList.remove("hidden");
      }
    } catch (e) {
      loginPwError.textContent = t("loginConnError");
      loginPwError.classList.remove("hidden");
    }
    setLoading(btnLoginPw, false, "loginPwBtn");
  }

  btnLoginPw.onclick = doLogin;
  loginPwInput.addEventListener("keydown", function(e) { if (e.key === "Enter") doLogin(); });
  document.getElementById("btn-login-pw-back").onclick = function() { showScreen("login"); };

  // ── Forgot password ──
  document.getElementById("btn-forgot-pw").onclick = async function() {
    try { await forgotPassword(pendingEmail); } catch (e) {}
    document.getElementById("forgot-msg").textContent = t("forgotMsg");
    showScreen("forgot");
  };
  document.getElementById("btn-forgot-back").onclick = function() { showScreen("login"); };

  // ── How to play ──
  function enterGame() {
    if (!localStorage.getItem(HOWTO_KEY)) {
      showScreen("howto");
    } else {
      goMenu();
    }
  }

  document.getElementById("btn-howto-ok").onclick = function() {
    localStorage.setItem(HOWTO_KEY, "1");
    goMenu();
  };
  document.getElementById("btn-howto-skip").onclick = function() {
    localStorage.setItem(HOWTO_KEY, "1");
    goMenu();
  };

  // ── Main menu ──
  var btnAdmin = document.getElementById("btn-admin");

  function goMenu() {
    game.goIdle();
    hud.classList.add("hidden");
    hudTournament.classList.add("hidden");
    activeTournament = null;
    if (session) {
      document.getElementById("welcome-name").textContent =
        "Welcome, " + (session.name || session.email);
      if (session.admin) {
        btnAdmin.classList.remove("hidden");
      } else {
        btnAdmin.classList.add("hidden");
      }
      showScreen("start");
    } else {
      showScreen("login");
    }
  }

  // ── Admin panel ──
  var adminTab = "live";

  function openAdmin() {
    showScreen("admin");
    loadAdminTab(adminTab);
  }

  document.querySelectorAll(".admin-tab").forEach(function(tab) {
    tab.addEventListener("click", function() {
      document.querySelectorAll(".admin-tab").forEach(function(t) { t.classList.remove("active"); });
      tab.classList.add("active");
      adminTab = tab.getAttribute("data-tab");
      loadAdminTab(adminTab);
    });
  });

  async function loadAdminTab(tab) {
    var content = document.getElementById("admin-content");
    content.innerHTML = '<p class="hint">' + t("adminLoading") + '</p>';
    try {
      if (tab === "players") {
        var players = await getAdminPlayers();
        if (!players || !players.length) {
          content.innerHTML = '<p class="admin-empty">' + t("adminNoPlayers") + '</p>';
          return;
        }
        content.innerHTML = "";
        players.forEach(function(p) {
          var row = document.createElement("div");
          row.className = "admin-player-row";
          row.innerHTML =
            '<div>' +
              '<div class="admin-player-email">' + (p.display_name || "Player") + '</div>' +
              '<div class="admin-player-info">' + p.email + '</div>' +
            '</div>' +
            '<div>' +
              '<div class="admin-player-info">' + t("adminHigh") + ': ' + (p.high_score || 0) + '</div>' +
              '<div class="admin-player-info">' + t("adminGames") + ': ' + (p.games_played || 0) + '</div>' +
            '</div>';
          content.appendChild(row);
        });
      } else {
        var tournaments = await getAdminTournaments(tab);
        if (!tournaments || !tournaments.length) {
          content.innerHTML = '<p class="admin-empty">' + t("adminNoTournaments").replace("{status}", t("admin" + tab.charAt(0).toUpperCase() + tab.slice(1))) + '</p>';
          return;
        }
        content.innerHTML = "";
        tournaments.forEach(function(tr) {
          var card = document.createElement("div");
          card.className = "admin-card";
          var badgeClass = tab === "live" ? "badge-live" : tab === "upcoming" ? "badge-upcoming" : "badge-ended";
          var badgeText = tab === "live" ? t("adminLive") : tab === "upcoming" ? t("adminUpcoming") : t("adminPast");
          var prizes = tr.prize_pool
            ? Object.entries(tr.prize_pool).map(function(e) { return e[0] + ": " + e[1] + " ⭐"; }).join(" | ")
            : "";
          card.innerHTML =
            '<div class="admin-card-header">' +
              '<span class="admin-card-name">' + tr.name + '</span>' +
              '<span class="admin-card-badge ' + badgeClass + '">' + badgeText + '</span>' +
            '</div>' +
            '<div class="admin-card-detail">' + t("adminStarts") + ': ' + new Date(tr.starts_at).toLocaleString() + '</div>' +
            '<div class="admin-card-detail">' + t("adminEnds") + ': ' + new Date(tr.ends_at).toLocaleString() + '</div>' +
            '<div class="admin-card-detail">' + t("adminParticipants") + ': ' + (tr.max_participants || "—") + '</div>' +
            (tr.invite_code ? '<div class="admin-card-detail">' + t("adminCode") + ': ' + tr.invite_code + '</div>' : '') +
            (prizes ? '<div class="admin-card-prizes">' + prizes + '</div>' : '');
          content.appendChild(card);
        });
      }
    } catch (e) {
      content.innerHTML = '<p class="error-text">' + t("adminFail") + '</p>';
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

  game.onGameOver = async function(score) {
    recordScore(save, score);
    hud.classList.add("hidden");
    if (activeTournament) {
      document.getElementById("t-final-score").textContent = score;
      document.getElementById("t-rank").textContent = "-";
      document.getElementById("t-submit-status").textContent = t("gameoverSubmitting");
      showScreen("tournamentOver");
      try {
        var res = await submitScore(session.email, activeTournament.id, score);
        if (res.rank) {
          document.getElementById("t-rank").textContent = "#" + res.rank;
          document.getElementById("t-submit-status").textContent = t("gameoverSubmitted");
        } else {
          document.getElementById("t-submit-status").textContent = res.error || t("gameoverSubmitted");
        }
      } catch (e) {
        document.getElementById("t-submit-status").textContent = t("gameoverSubmitFail");
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
    var list = document.getElementById("tournament-list");
    list.innerHTML = '<p class="hint">' + t("tournamentsLoading") + '</p>';
    try {
      var tournaments = await getTournaments();
      if (!tournaments.length) {
        list.innerHTML = '<p class="t-no-tournaments">' + t("tournamentsEmpty") + '</p>';
        return;
      }
      list.innerHTML = "";
      tournaments.forEach(function(tr) {
        var card = document.createElement("div");
        card.className = "t-card";
        var isActive = tr.status === "active";
        var statusClass = isActive ? "t-status-active" : "t-status-upcoming";
        var statusText = isActive ? t("tournamentsLive") : t("tournamentsUpcoming");
        var timeLabel = isActive
          ? t("tournamentsEnds") + ": " + new Date(tr.ends_at).toLocaleString()
          : t("tournamentsStarts") + ": " + new Date(tr.starts_at).toLocaleString();
        var prizes = tr.prize_pool
          ? Object.entries(tr.prize_pool).map(function(e) { return e[0] + ": " + e[1] + " ⭐"; }).join(" | ")
          : "";
        card.innerHTML =
          '<div class="t-card-header">' +
            '<span class="t-card-name">' + tr.name + '</span>' +
            '<span class="t-card-status ' + statusClass + '">' + statusText + '</span>' +
          '</div>' +
          (prizes ? '<div class="t-card-prizes">' + prizes + '</div>' : '') +
          '<div class="t-card-time">' + timeLabel + '</div>' +
          (isActive ? '<button class="btn btn-primary t-enter-btn">' + t("tournamentsPlay") + '</button>' : '');
        if (isActive) {
          card.querySelector(".t-enter-btn").onclick = function() { startGame(tr); };
        }
        list.appendChild(card);
      });
    } catch (e) {
      list.innerHTML = '<p class="error-text">' + t("tournamentsFail") + '</p>';
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
  document.getElementById("btn-admin").onclick = openAdmin;
  document.getElementById("btn-admin-back").onclick = goMenu;
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

  // ── Init ──
  updateUI();
  if (session) {
    goMenu();
  } else {
    showScreen("login");
    game.goIdle();
  }
})();
