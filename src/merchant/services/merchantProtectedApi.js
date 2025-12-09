// src/services/merchantApi.js
// Merchant endpoints — use merchantFetch so Authorization is attached only here

import { clearMerchantAuth } from "../auth/merchantAuth";
import { merchantFetch } from "./merchantHttpClient";

export const merchantAuthApi = {
  login: async ({ merchantUserNameId, merchantUserPassword }) => {
    return merchantFetch("/api/merchant-auth/login", {
      method: "POST",
      body: { merchantUserNameId, merchantUserPassword },
    });
  },
};

export const merchantProtectedApi = {
  getDashboard: async () => merchantFetch("/api/merchant/dashboard"),
  getCampaigns: async () => merchantFetch("/api/merchant/campaigns"),
  getMonthlyDashboardByDay: async (days) =>
    merchantFetch(`/api/campaign-stats/consolidated/daily/${days}`),
  issueCouponForCampaign: async (campaignId) =>
    merchantFetch(`/api/campaigns/${encodeURIComponent(campaignId)}/issue`, {
      method: "POST",
    }),
  listCampaigns: async () =>
    merchantFetch("/api/campaigns/logged-in-merchant/campaigns"),
  getValidatedCoupons: async () =>
    merchantFetch("/api/redemption/logged-in-merchant/validated"),
  getMerchantNameId: async (merchantIdPk) =>
    merchantFetch(`/api/merchant/getMerchantNameId?merchantIdPk=${merchantIdPk}`),

  // UPDATED: send RedemptionRequest payload
  // RedemptionRequest(UUID campaignId, String couponCode, Map<String, Object> extras, double billAmount)
  redeemCoupon: async (payload) =>
    merchantFetch(`/api/redemption/redeem`, {
      method: "POST",
      body: payload,
    }),
  createCampaign: async( payload )=>
    merchantFetch(`/api/campaigns/logged-in-merchant/create`, {
      method: "POST",
      body: payload,
    }),
};

export function redirectToMerchantLogin() {
  if (!window.location.pathname.startsWith("/merchant-login")) {
    clearMerchantAuth();
    window.location.href = "/merchant-login";
  }
}
