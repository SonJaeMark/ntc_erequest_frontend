// ============================================================
// CONSTANTS
// ============================================================

const AUTH_ROLE_KEY = "ntc_user_role";

const DASHBOARD_BY_ROLE = {
  STUDENT: "student-dashboard.html",
  ADMIN: "admin-dashboard.html",
  REGISTRAR: "registrar-dashboard.html",
};

// ============================================================
// HELPERS
// ============================================================

/**
 * Normalize a role value to a consistent uppercase string
 */
const normalizeRole = (value) => String(value || "").trim().toUpperCase();

/**
 * Retrieve and normalize the stored role from sessionStorage
 */
const getStoredRole = () => normalizeRole(sessionStorage.getItem(AUTH_ROLE_KEY));

/**
 * Get the dashboard URL for a given role
 * Falls back to index.html if role is unknown
 */
const getDashboardForRole = (role) => DASHBOARD_BY_ROLE[normalizeRole(role)] || "index.html";

/**
 * Check if the current page matches the given page name
 */
const isCurrentPage = (pageName) => {
  const currentPage = window.location.pathname.split("/").pop().toLowerCase();
  return currentPage === pageName.toLowerCase();
};

// ============================================================
// AUTH GUARD
// ============================================================

/**
 * Verify the current user has one of the allowed roles.
 * Redirects to the correct dashboard or login page if not authorized.
 * @param {string[]} allowedRoles - List of roles permitted to view this page
 * @returns {boolean} true if authorized, false if redirected
 */
const requireRole = (allowedRoles) => {
  const currentRole = getStoredRole();
  const allowed = allowedRoles.map(normalizeRole);
  const isActive = sessionStorage.getItem("isActive");

  // --- Check if account is active ---
  if (isActive === "false") {
    sessionStorage.clear();
    localStorage.clear();
    window.location.replace("unauthorized.html");
    return false;
  }

  // --- No role found: redirect to login ---
  if (!currentRole) {
    window.location.replace("index.html");
    return false;
  }

  // --- Wrong page for role: redirect to correct dashboard ---
  const expectedDashboard = getDashboardForRole(currentRole);
  if (!isCurrentPage(expectedDashboard)) {
    window.location.replace(expectedDashboard);
    return false;
  }

  // --- Role not in allowed list: redirect to login ---
  if (!allowed.includes(currentRole)) {
    window.location.replace("index.html");
    return false;
  }

  return true;
};