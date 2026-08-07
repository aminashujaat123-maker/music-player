// ============================================
// SIGNUP PAGE LOGIC
// ============================================
if (isLoggedIn()) {
  window.location.href = "/index.html";
}

const signupForm = document.getElementById("signupForm");
const errorMsg = document.getElementById("errorMsg");

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorMsg.classList.remove("show");

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    const data = await apiFetch("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    });
    saveSession(data.token, data.user);
    window.location.href = "/index.html";
  } catch (err) {
    errorMsg.textContent = err.message;
    errorMsg.classList.add("show");
  }
});
