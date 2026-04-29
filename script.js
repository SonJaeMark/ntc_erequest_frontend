document.addEventListener("DOMContentLoaded", () => {

  // ============================================================
  // CONSTANTS & CONFIGURATION
  // ============================================================

  const AUTH_TOKEN_KEY = "ntc_access_token";
  const AUTH_REFRESH_KEY = "ntc_refresh_token";
  const AUTH_ROLE_KEY = "ntc_user_role";
  const BASE_URL = "https://ntc-erquest-system-1.onrender.com";
  const form = document.getElementById("login-form");
  const submitBtn = document.getElementById("submit-btn");
  const btnText = document.getElementById("btn-text");
  const errorEl = document.getElementById("login-error");

  // ============================================================
  // HELPERS: Loading state
  // ============================================================

  /**
   * Switch button to loading state — spinner + text, disabled
   */
  const setLoading = () => {
    submitBtn.disabled = true;
    btnText.textContent = "Signing in...";
    const spinner = document.createElement("span");
    spinner.className = "spinner";
    spinner.id = "btn-spinner";
    submitBtn.prepend(spinner);
  };

  /**
   * Reset button back to default state
   */
  const resetLoading = () => {
    submitBtn.disabled = false;
    btnText.textContent = "Sign In";
    const spinner = document.getElementById("btn-spinner");
    if (spinner) spinner.remove();
  };

  /**
   * Show the error message block
   */
  const showError = (message) => {
    errorEl.textContent = message || "Invalid email or password. Please try again.";
    errorEl.classList.remove("hidden");
  };

  /**
   * Hide the error message block
   */
  const hideError = () => {
    errorEl.classList.add("hidden");
  };

  // ============================================================
  // HELPERS: Auth
  // ============================================================

  /**
   * Extract and normalize the user role from the API response
   */
  const getRoleFromResponse = (data) => {
    const rawRole =
      data?.role ??
      data?.user?.role ??
      data?.data?.role ??
      data?.accountType ??
      "";
    return String(rawRole).trim().toUpperCase();
  };

  /**
   * Persist auth tokens and user info to storage
   * - accessToken  → sessionStorage (short-lived)
   * - refreshToken → localStorage (less ideal)
   * - user info    → sessionStorage
   */
  const storeAuthData = (data) => {
    // Access token (short-lived)
    sessionStorage.setItem(AUTH_TOKEN_KEY, data.accessToken);
    // Refresh token (less ideal)
    localStorage.setItem(AUTH_REFRESH_KEY, data.refreshToken);
    // User info
    sessionStorage.setItem("userId", data.userId);
    sessionStorage.setItem("email", data.email);
    sessionStorage.setItem("role", data.role);
    sessionStorage.setItem(AUTH_ROLE_KEY, data.role);
  };

  /**
   * Redirect user to the correct dashboard based on their role.
   * Uses replace() to prevent back-button loop to login page.
   */
  const redirectByRole = (role) => {
    switch (role) {
      case "STUDENT":
        window.location.replace("student-dashboard.html");
        return;
      case "ADMIN":
      case "REGISTRAR":
        window.location.replace("registrar-dashboard.html");
        return;
      default:
        throw new Error(`Unknown role returned by API: ${role || "empty response"}`);
    }
  };

  // ============================================================
  // FORM SUBMISSION
  // ============================================================

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    // --- Reset UI state ---
    hideError();
    setLoading();

    // --- Get form values ---
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
      console.log("Submitting login request for:", email);

      // --- Send login request ---
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const text = await response.text();

      if (!response.ok) {
        throw new Error(`Login failed: ${response.status} - ${text}`);
      }

      // --- Parse response ---
      const data = text ? JSON.parse(text) : null;

      if (!data || !data.accessToken) {
        throw new Error("Invalid response from server. Please try again.");
      }

      const role = getRoleFromResponse(data);

      // --- Store auth data & redirect ---
      storeAuthData(data);
      redirectByRole(role);

      // Note: resetLoading() is intentionally NOT called here —
      // button stays disabled while redirect is in progress

    } catch (error) {
      console.error("Login error:", error.message);
      showError("Invalid email or password. Please try again.");
      resetLoading();
    }
  });

});