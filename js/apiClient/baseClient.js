// export const BASE_URL = "https://ntc-erquest-system-1.onrender.com";
// export const BASE_URL = "https://ntc-erquest-system-sp1-fix.onrender.com";
export const BASE_URL = "http://localhost:8081";

// http://localhost:8080

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, options);
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} - ${text}`);
  }

  return text ? JSON.parse(text) : null;
}
