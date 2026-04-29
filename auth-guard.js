const AUTH_ROLE_KEY = "ntc_user_role";

const normalizeRole = (value) => String(value || "").trim().toUpperCase();

const getStoredRole = () => normalizeRole(sessionStorage.getItem(AUTH_ROLE_KEY));

const DASHBOARD_BY_ROLE = {
  STUDENT: "student-dashboard.html",
  ADMIN: "admin-dashboard.html",
  REGISTRAR: "registrar-dashboard.html",
};

const getDashboardForRole = (role) => DASHBOARD_BY_ROLE[normalizeRole(role)] || "index.html";

const isCurrentPage = (pageName) => {
  const currentPage = window.location.pathname.split("/").pop().toLowerCase();
  return currentPage === pageName.toLowerCase();
};

const requireRole = (allowedRoles) => {
  const currentRole = getStoredRole();
  const allowed = allowedRoles.map(normalizeRole);

  if (!currentRole) {
    window.location.replace("index.html");
    return false;
  }

  const expectedDashboard = getDashboardForRole(currentRole);
  if (!isCurrentPage(expectedDashboard)) {
    window.location.replace(expectedDashboard);
    return false;
  }

  if (!allowed.includes(currentRole)) {
    window.location.replace("index.html");
    return false;
  }

