const AUTH_ROLE_KEY = "ntc_user_role";

const normalizeRole = (value) => String(value || "").trim().toUpperCase();

const getStoredRole = () => normalizeRole(sessionStorage.getItem(AUTH_ROLE_KEY));

const requireRole = (allowedRoles) => {
  const currentRole = getStoredRole();
  const allowed = allowedRoles.map(normalizeRole);

  if (!currentRole || !allowed.includes(currentRole)) {
    window.location.replace("index.html");
    return false;
  }

  return true;
};
