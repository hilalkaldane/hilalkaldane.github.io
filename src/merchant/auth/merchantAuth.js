// src/auth/merchantAuth.js
// Persist tokens only for merchant-side. LocalStorage keys must match backend contract.

export function saveMerchantAuth({ accessToken, refreshToken, merchantUserIdPk, merchantIdPk, merchantNameId }) {
  if (accessToken) localStorage.setItem("accessToken", accessToken);
  if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
  if (merchantUserIdPk != null) localStorage.setItem("merchantUserIdPk", String(merchantUserIdPk));
  if (merchantIdPk != null) localStorage.setItem("merchantIdPk", String(merchantIdPk));
  if (merchantNameId != null) localStorage.setItem("merchantNameId", String(merchantNameId));

}

export function clearMerchantAuth() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("merchantUserIdPk");
  localStorage.removeItem("merchantIdPk");
  localStorage.removeItem("merchantNameId");
}

export function isMerchantLoggedIn() {
  return !!localStorage.getItem("accessToken");
}
