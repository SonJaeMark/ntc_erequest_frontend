import { apiRequest } from "./baseClient.js";

/**
 * Authentication API methods.
 */

/**
 * Logs in a user.
 * @param {Object} data - LoginRequestDTO
 * @param {string} data.email - User email
 * @param {string} data.password - User password
 * @returns {Promise} - AuthResponseDTO
 * @example
 * // Sample Response (AuthResponseDTO):
 * // {
 * //   "accessToken": "eyJhbG...",
 * //   "refreshToken": "d7b2...",
 * //   "userId": 1,
 * //   "email": "student1@email.com",
 * //   "role": "STUDENT",
 * //   "isActive": true
 * // }
 */
export function login(data) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" }
  });
}

/**
 * Refreshes the access token using a refresh token.
 * @param {Object} data - RefreshTokenDTO
 * @param {string} data.refreshToken - The refresh token string
 * @returns {Promise} - AuthResponseDTO
 * @example
 * // Sample Response: Same as login (AuthResponseDTO)
 */
export function refreshToken(data) {
  return apiRequest("/auth/refresh-token", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" }
  });
}

/**
 * Logs out the user.
 * @param {Object} data - LogoutRequestDTO
 * @param {string} data.accessToken - The current access token
 * @param {string} data.refreshToken - The current refresh token
 * @returns {Promise} - AuthResponseDTO (with null fields)
 */
export function logout(data) {
  return apiRequest("/auth/logout", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" }
  });
}
