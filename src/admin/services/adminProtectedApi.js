// src/services/adminApi.js
// Admin endpoints — use adminFetch so Authorization is attached only here

import { clearAdminAuth } from "../auth/adminAuth";
import { adminFetch } from "./adminHttpClient";

export const adminAuthApi = {
  login: async ({ usernameId, password }) => {
    console.log(usernameId+" "+password)
    return adminFetch("/api/admin-auth/login", {
      method: "POST",
      body: { usernameId, password },
    });
  },
};

export const adminProtectedApi = {
  getCategoriesAndSubcategories: async() => adminFetch("/api/metadata/listCategoriesAndSubcategories"),
  createMerchant: async (payload) =>
    adminFetch(`/api/admin/create-merchant`, {
      method: "POST",
      body: payload,
    }),
  
  createCategory: async (payload) =>
    adminFetch(`/api/admin/create-category`, {
      method: "POST",
      body: payload,
    }),

  createSubcategory: async (payload) =>
    adminFetch(`/api/admin/create-subcategory`, {
      method: "POST",
      body: payload,
    }),
    
  getDashboard: async () => adminFetch("/api/admin/dashboard"),
  getCampaigns: async () => adminFetch("/api/admin/campaigns"),
  getMonthlyDashboardByDay: async (days) =>
    adminFetch(`/api/campaign-stats/consolidated/daily/${days}`),
  issueCouponForCampaign: async (campaignId) =>
    adminFetch(`/api/campaigns/${encodeURIComponent(campaignId)}/issue`, {
      method: "POST",
    }),
  listCampaigns: async () =>
    adminFetch("/api/campaigns/logged-in-admin/campaigns"),
  getValidatedCoupons: async () =>
    adminFetch("/api/redemption/logged-in-admin/validated"),
  getAdminNameId: async (adminIdPk) =>
    adminFetch(`/api/admin/getAdminNameId?adminIdPk=${adminIdPk}`),

  // UPDATED: send RedemptionRequest payload
  // RedemptionRequest(UUID campaignId, String couponCode, Map<String, Object> extras, double billAmount)

  createCampaign: async( payload )=>
    adminFetch(`/api/campaigns/logged-in-admin/create`, {
      method: "POST",
      body: payload,
    }),
};

export function redirectToAdminLogin() {
  if (!window.location.pathname.startsWith("/admin-login")) {
    clearAdminAuth();
    window.location.href = "/admin-login";
  }
}
