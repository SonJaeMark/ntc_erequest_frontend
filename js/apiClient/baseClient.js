export const BASE_URL = "https://ntc-erquest-system-1.onrender.com";

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, options);
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} - ${text}`);
  }

  return text ? JSON.parse(text) : null;
}
