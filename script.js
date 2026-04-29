document.addEventListener("DOMContentLoaded", () => {
  const AUTH_TOKEN_KEY = "ntc_access_token";
  const AUTH_REFRESH_KEY = "ntc_refresh_token";
  const AUTH_ROLE_KEY = "ntc_user_role";
  const BASE_URL = "https://ntc-erquest-system-1.onrender.com";
  const form = document.getElementById("login-form");

  const getRoleFromResponse = (data) => {
    const rawRole =
      data?.role ??
      data?.user?.role ??
      data?.data?.role ??
      data?.accountType ??
      "";
    return String(rawRole).trim().toUpperCase();
  };

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

  const redirectByRole = (role) => {
    switch (role) {
      case "STUDENT":
        window.location.href = "student-dashboard.html";
        return;
      case "ADMIN":
      case "REGISTRAR":
        window.location.href = "registrar-dashboard.html";
        return;
      default:
        throw new Error(`Unknown role returned by API: ${role || "empty response"}`);
    }
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
      console.log("Submitting login request for:", email);

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

      const data = text ? JSON.parse(text) : null;
      const role = getRoleFromResponse(data);

      storeAuthData(data);
      redirectByRole(role);

      return data;
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed: " + error.message);
    }
  });
});