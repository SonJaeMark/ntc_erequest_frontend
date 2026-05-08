import { apiRequest } from "./baseClient.js";

/**
 * User Management API methods.
 */

/**
 * Registers a new user.
 * @param {Object} data - RegisterRequestDTO
 * @param {string} data.email - User email
 * @param {string} data.password - User password (min 8 chars, 1 upper, 1 special, 1 number)
 * @param {string} data.confirmPassword - Must match password
 * @param {string} data.firstName - User's first name
 * @param {string} data.lastName - User's last name
 * @param {string} data.role - (UserRole enum) "STUDENT" or "REGISTRAR"
 * @returns {Promise} - RegisterResponseDTO
 * @example
 * // Sample Response (RegisterResponseDTO):
 * // {
 * //   "id": 1,
 * //   "email": "student1@email.com",
 * //   "role": "STUDENT"
 * // }
 */
export function registerUser(data, token) {
  return apiRequest("/api/user-management/register", {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
  });
}

/**
 * Toggles a user's active status.
 * @param {string} token - JWT access token (Requires ADMIN role).
 * @param {number} userId - ID of the user to toggle.
 * @returns {Promise} - Boolean indicating new active status.
 */
export function toggleUserActiveStatus(token, userId) {
  return apiRequest(`/api/user-management/toggle-active/${userId}`, {
    method: "PUT",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
  });
}

export function getAllUsers(token) {
  return apiRequest("/api/user-management/all", {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
  });
}