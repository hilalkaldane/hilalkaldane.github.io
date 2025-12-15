// src/auth/merchantAuth.js
// Persist tokens only for merchant-side. LocalStorage keys must match backend contract.

export function saveAdminAuth({ adminAccessToken, adminRefreshToken, merchantNameId }) {
  if (adminAccessToken) localStorage.setItem("adminAccessToken", adminAccessToken);
  if (adminRefreshToken) localStorage.setItem("adminRefreshToken", adminRefreshToken);
  if (merchantNameId != null) localStorage.setItem("adminUserName", String(merchantNameId));

}

export function clearAdminAuth() {
  localStorage.removeItem("adminAccessToken");
  localStorage.removeItem("adminRefreshToken");
}

export function isAdminLoggedIn() {
  return !!localStorage.getItem("adminAccessToken");
}
