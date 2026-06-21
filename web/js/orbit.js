const ORBIT_URL = 'https://eqjsmfegpwuakpsepryj.supabase.co/functions/v1';
const DINO_API_KEY = 'dino_sk_b8c4d2e1f3a5069712345abcdef67890';
const SESSION_KEY = 'dino-dash-session';

function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
}

function saveSession(data) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

async function checkUserStatus(email) {
  const res = await fetch(`${ORBIT_URL}/check-user-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  });
  return res.json();
}

async function createPassword(email, password) {
  const res = await fetch(`${ORBIT_URL}/create-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });
  return res.json();
}

async function loginWithPassword(email, password) {
  const res = await fetch(`${ORBIT_URL}/login-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });
  return res.json();
}

async function forgotPassword(email) {
  const res = await fetch(`${ORBIT_URL}/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase(), language: 'en' }),
  });
  return res.json();
}

async function getTournaments() {
  const res = await fetch(`${ORBIT_URL}/dino-get-tournaments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-dino-api-key': DINO_API_KEY },
    body: JSON.stringify({}),
  });
  const data = await res.json();
  return data.tournaments || [];
}

async function submitScore(email, tournamentId, score) {
  const res = await fetch(`${ORBIT_URL}/dino-submit-score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-dino-api-key': DINO_API_KEY },
    body: JSON.stringify({ user_id: email, tournament_id: tournamentId, score }),
  });
  return res.json();
}
