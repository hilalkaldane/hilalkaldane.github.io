// src/services/merchantApi.js
// Merchant endpoints — use merchantFetch so Authorization is attached only here

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
  getMonthlyDashboardByDay: async (days) => merchantFetch(`/api/campaign-stats/consolidated/daily/${days}`),
  issueCouponForCampaign: async (campaignId) =>
    merchantFetch(`/campaigns/${encodeURIComponent(campaignId)}/issue`, {
      method: "POST",
    }),
  // add other merchant-only calls here
};
