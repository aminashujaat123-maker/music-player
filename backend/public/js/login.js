// ============================================
// LOGIN PAGE LOGIC
// ============================================
if (isLoggedIn()) {
  window.location.href = "/index.html";
}

const loginForm = document.getElementById("loginForm");
const errorMsg = document.getElementById("errorMsg");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorMsg.classList.remove("show");

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    saveSession(data.token, data.user);
    window.location.href = "/index.html";
  } catch (err) {
    errorMsg.textContent = err.message;
    errorMsg.classList.add("show");
  }
});
