const ORBIT_URL = 'https://eqjsmfegpwuakpsepryj.supabase.co/functions/v1';
const ORBIT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxanNtZmVncHd1YWtwc2VwcnlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MzU3ODUsImV4cCI6MjA4MzUxMTc4NX0.RDn_USIFbd83-K1DmQ6Slqct7CnrNgl5M40hdD3DTKk';
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

var authHeaders = {
  'Content-Type': 'application/json',
  'apikey': ORBIT_ANON_KEY,
  'Authorization': 'Bearer ' + ORBIT_ANON_KEY,
};

async function checkUserStatus(email) {
  const res = await fetch(`${ORBIT_URL}/check-user-status`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  });
  return res.json();
}

async function createPassword(email, password) {
  const res = await fetch(`${ORBIT_URL}/create-password`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });
  return res.json();
}

async function loginWithPassword(email, password) {
  const res = await fetch(`${ORBIT_URL}/login-with-password`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });
  return res.json();
}

async function forgotPassword(email) {
  const res = await fetch(`${ORBIT_URL}/forgot-password`, {
    method: 'POST',
    headers: authHeaders,
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
