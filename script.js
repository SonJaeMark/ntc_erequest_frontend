async function login() {
  const email = document.getElementById("email")
  const password = document.getElementById("password")

  const response = await fetch(
    "https://ntc-erquest-system.onrender.com/auth/login",
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

  console.log("Login success:", response);
  return JSON.parse(text);
}

