// src/services/api.js
import { httpGet, httpPost, httpPut } from "./httpClient.js";


// ---------------- CATEGORY API ----------------
export const metadataApi = {
   listCategoriesAndSubcategories: async()=>
    httpGet('/api/metadata/listCategoriesAndSubcategories'),
   listSubcategoriesByCategory: async(categoryCode) =>
    httpGet(`/api/metadata/listSubcategoriesByCategory?categoryCode=${categoryCode}`)
};

// ---------------- MERCHANT API ----------------
export const merchantApi = {
   listMerchants: async() =>
    httpGet(`/api/merchant/all`),
  getMerchant: async (merchantNameId) => {
    if (!merchantNameId) throw new Error("Merchant ID is required");

    const merchant = await httpGet(`/api/merchant/${merchantNameId}`)

    return {
      ...merchant,
      category: merchant.category || null,
    };
  },
};

export const feedApi = {
  getFeed: async({page,size})=>
  {
    return await httpGet(`/api/feed/updatedFeed?page=${page}&&size=${size}`)
  }
};

// ---------------- CAMPAIGN API ----------------
export const campaignApi = {
  getActiveCampaigns: async () => {
    return await httpGet(`api/campaigns/active-campaigns`)
  },
  async listCampaignByMerchant(merchantId) {
    return await httpGet(`/api/campaigns/merchant/${merchantId}`)
  },

  // Placeholder for issuing coupons / redeeming
  async issueCouponForCampaign(campaignId) {
    return await httpPost(`/api/redemption/${campaignId}/issue`)
  },
};

// ---------------- ADMIN UTILITIES ----------------

// sketch, not required but implied
export const customerApi = {
  getMe: () => httpGet("/api/customer/me"),
  updateMe: (payload) =>
    httpPut("/api/customer/updateMe", payload),
};
