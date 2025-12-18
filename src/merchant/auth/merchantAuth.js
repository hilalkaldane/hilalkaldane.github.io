// src/auth/merchantAuth.js
// Persist tokens only for merchant-side. merchantLocalStorage keys must match backend contract.

import { merchantLocalStorage } from "../services/merchantDevice";

export function saveMerchantAuth({ accessToken, refreshToken, merchantUserIdPk, merchantIdPk, merchantNameId, merchantUserRole }) {
  if (accessToken) merchantLocalStorage.setItem("accessToken", accessToken);
  if (refreshToken) merchantLocalStorage.setItem("refreshToken", refreshToken);
  if (merchantUserIdPk != null) merchantLocalStorage.setItem("merchantUserIdPk", String(merchantUserIdPk));
  if (merchantIdPk != null) merchantLocalStorage.setItem("merchantIdPk", String(merchantIdPk));
  if (merchantNameId != null) merchantLocalStorage.setItem("merchantNameId", String(merchantNameId));
  if (merchantNameId != null) merchantLocalStorage.setItem("merchantNameId", String(merchantNameId));
  if (merchantUserRole != null) merchantLocalStorage.setItem("merchantUserRole", String(merchantUserRole));

}

export function clearMerchantAuth() {
  merchantLocalStorage.removeItem("accessToken");
  merchantLocalStorage.removeItem("refreshToken");
  merchantLocalStorage.removeItem("merchantUserIdPk");
  merchantLocalStorage.removeItem("merchantIdPk");
  merchantLocalStorage.removeItem("merchantNameId");
  merchantLocalStorage.removeItem("merchantUserRole");
}

export function isMerchantLoggedIn() {
  return !!merchantLocalStorage.getItem("accessToken");
}
