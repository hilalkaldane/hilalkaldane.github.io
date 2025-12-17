// src/auth/merchantAuth.js
// Persist tokens only for merchant-side. LocalStorage keys must match backend contract.

import { adminLocalStorage } from "../services/adminDevice";

export function saveAdminAuth({ adminAccessToken, adminRefreshToken, merchantNameId }) {
  if (adminAccessToken) adminLocalStorage.setItem("adminAccessToken", adminAccessToken);
  if (adminRefreshToken) adminLocalStorage.setItem("adminRefreshToken", adminRefreshToken);
  if (merchantNameId != null) adminLocalStorage.setItem("adminUserName", String(merchantNameId));

}

export function clearAdminAuth() {
  adminLocalStorage.removeItem("adminAccessToken");
  adminLocalStorage.removeItem("adminRefreshToken");
}

export function isAdminLoggedIn() {
  return !!adminLocalStorage.getItem("adminAccessToken");
}
