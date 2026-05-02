import { apiRequest } from "./baseClient.js";

export function login(email, password) {
  return apiRequest("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
}

export function logout(refreshToken, accessToken){
  return apiRequest("/auth/logout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken, accessToken }),
  });
}
