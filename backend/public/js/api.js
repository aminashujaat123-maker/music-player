// ============================================
// API HELPER — shared across all pages
// ============================================
const API_BASE = "/api";

function getToken() {
  return localStorage.getItem("token");
}

function getUser() {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

function saveSession(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

function isLoggedIn() {
  return !!getToken();
}

// Wrapper around fetch that auto-attaches the JWT and parses JSON
async function apiFetch(path, options = {}) {
  const headers = options.headers || {};
  const token = getToken();

  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!(options.body instanceof FormData) && options.body) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(API_BASE + path, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || "Something went wrong.");
  }
  return data;
}

function logout() {
  clearSession();
  window.location.href = "/login.html";
}
