import { login } from "./apiClient/authApi.js";

document.addEventListener("DOMContentLoaded", () => {
  const existingToken = sessionStorage.getItem("ntc_access_token");
  const existingRole = sessionStorage.getItem("role");

  if (existingToken && existingRole) {
    const role = String(existingRole).trim().toUpperCase();
    if (role === "STUDENT") {
      window.location.replace("student-dashboard.html");
      return;
    }
    if (role === "ADMIN" || role === "REGISTRAR") {
      window.location.replace("registrar-dashboard.html");
      return;
    }
    sessionStorage.clear();
    localStorage.clear();
  }

  const form = document.getElementById("login-form");
  const submitBtn = document.getElementById("submit-btn");
  const btnText = document.getElementById("btn-text");
  const errorEl = document.getElementById("login-error");

  const setLoading = () => {
    submitBtn.disabled = true;
    btnText.textContent = "Signing in...";
    const spinner = document.createElement("span");
    spinner.className = "spinner";
    spinner.id = "btn-spinner";
    submitBtn.prepend(spinner);
  };

  const resetLoading = () => {
    submitBtn.disabled = false;
    btnText.textContent = "Sign In";
    const spinner = document.getElementById("btn-spinner");
    if (spinner) spinner.remove();
  };

  const showError = (message) => {
    errorEl.textContent = message || "Invalid email or password. Please try again.";
    errorEl.classList.remove("hidden");
  };

  const hideError = () => {
    errorEl.classList.add("hidden");
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    hideError();
    setLoading();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const payload = { email, password };
    try {
      const data = await login(payload);

      if (!data || !data.accessToken) {
        throw new Error("Invalid response from server. Please try again.");
      }

      sessionStorage.setItem("ntc_access_token", data.accessToken);
      localStorage.setItem("ntc_refresh_token", data.refreshToken);
      sessionStorage.setItem("userId", data.userId);
      sessionStorage.setItem("email", data.email);
      sessionStorage.setItem("role", data.role);
      sessionStorage.setItem("ntc_user_role", data.role);

      const role = String(data.role).trim().toUpperCase();

      if (role === "STUDENT") {
        window.location.replace("student-dashboard.html");
        return;
      }
      if (role === "ADMIN" || role === "REGISTRAR") {
        window.location.replace("registrar-dashboard.html");
        return;
      }

      sessionStorage.clear();
      localStorage.clear();
      throw new Error(`Unknown role: ${role || "empty"}`);
    } catch (error) {
      console.error("Login error:", error.message);
      showError("Invalid email or password. Please try again.");
      resetLoading();
    }
  });
});
