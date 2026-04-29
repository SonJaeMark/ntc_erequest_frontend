document.addEventListener("DOMContentLoaded", () => {
  const AUTH_ROLE_KEY = "ntc_user_role";
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

      const response = await fetch(
        "https://ntc-erquest-system-1.onrender.com/auth/login",
        {
          method: "POST",
          credentials: "include", // important for cookies
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const text = await response.text();

      if (!response.ok) {
        throw new Error(`Login failed: ${response.status} - ${text}`);
      }

      console.log("Login success:", text);

      const data = text ? JSON.parse(text) : null;
      const role = getRoleFromResponse(data);
      console.log("Detected role:", role, "Full response:", data);

      sessionStorage.setItem(AUTH_ROLE_KEY, role);

      redirectByRole(role);

      return data;
    } catch (error) {
      console.error("Login error:", error);
    }
  });
});
