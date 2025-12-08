// src/auth/merchantAuth.js
// Persist tokens only for merchant-side. LocalStorage keys must match backend contract.

export function saveMerchantAuth({ accessToken, refreshToken, merchantUserIdPk }) {
  if (accessToken) localStorage.setItem("accessToken", accessToken);
  if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
  if (merchantUserIdPk != null) localStorage.setItem("merchantUserIdPk", String(merchantUserIdPk));
}

export function clearMerchantAuth() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("merchantUserIdPk");
}

export function isMerchantLoggedIn() {
  return !!localStorage.getItem("accessToken");
}
