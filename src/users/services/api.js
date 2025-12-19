// src/services/api.js
import { createClient } from "@supabase/supabase-js";
import { CATEGORIES, MERCHANTS } from "../../data/sampleData.js";
import { httpGet, httpPost, httpPut } from "./httpClient.js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);
const API_BASE_URL = "http://192.168.1.104:8080"

// --- INIT DATA ---
export async function initData() {
  try {
    await supabase.from("campaigns").delete().neq("id", 0);
    await supabase.from("merchants").delete().neq("id", 0);
    await supabase.from("categories").delete().neq("id", "");

    // Categories
    const { data: existingCats } = await supabase.from("categories").select("id,label,image");
    const existingIds = existingCats.map(c => c.id);
    const catsToInsert = CATEGORIES.filter(c => !existingIds.includes(c.id)).map(c => ({
      id: String(c.id),
      label: c.label,
      image: c.image || null,
    }));
    if (catsToInsert.length) await supabase.from("categories").insert(catsToInsert);

    // Merchants
    const { data: existingMers } = await supabase.from("merchants").select("name");
    const existingNames = existingMers.map(m => m.name);
    const mersToInsert = MERCHANTS.filter(m => !existingNames.includes(m.name)).map(({ category, ...rest }) => ({
      ...rest,
      category_id: String(category),
    }));
    if (mersToInsert.length) await supabase.from("merchants").insert(mersToInsert);

    console.log("✅ Seed completed (idempotent)");
  } catch (err) {
    console.error("❌ initData failed:", err.message);
  }
}

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
  async listAllCampaigns() {
    const { data, error } = await supabase
      .from("campaigns")
      .select("*, merchants(name)")
      .order("id", { ascending: true });
    if (error) throw error;
    return data;
  },
  async listCampaignByMerchant(merchantId) {
    return await httpGet(`/api/campaigns/merchant/${merchantId}`)
  },

  // Placeholder for issuing coupons / redeeming
  async issueCouponForCampaign(campaignId) {
    return await httpPost(`/api/redemption/${campaignId}/issue`)
  },

  async redeemCoupon(merchantId, couponCode) {
    const { data: coupon, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", couponCode)
      .single();

    console.log("First Passed")

    if (error) throw error;

    if (!coupon) {
      return { success: false, message: "Coupon not found" };
    }

    if (coupon.redeemed_at) {
      return { success: false, message: "Coupon already redeemed" };
    }

    // Update redeemed_at timestamp
    const { data, error: redeemErr } = await supabase
      .from("coupons")
      .update({ redeemed_at: new Date().toISOString() })
      .eq("code", couponCode)
      .select()
      .single();

    if (redeemErr) throw redeemErr;

    return { success: true, code: data.code, redeemedAt: data.redeemed_at };
  },

  async createCampaign({ merchantId, name, discountType, discountValue, startDate, endDate, terms }) {
    const discount =
      discountType === "percentage"
        ? `${Number(discountValue)}% off`
        : discountType === "flat"
          ? `₹${Number(discountValue)} off`
          : null;

    const { data, error } = await supabase
      .from("campaigns")
      .insert([
        {
          merchant_id: merchantId,
          title: name,
          description: terms || null,
          discount,
          valid_until: endDate || null,
          created_at: new Date().toISOString().slice(0, 10),
        },
      ])
      .select();
    if (error) throw error;
    return data[0];
  },
};

// ---------------- ADMIN UTILITIES ----------------
export const adminApi = {
  async adminResetData() {
    await initData();
  },
  async adminCreateMerchant({ name, address, category }) {
    if (!name || !category) throw new Error("Name and category are required");
    const { data, error } = await supabase
      .from("merchants")
      .insert([{ name, address, category_id: category }])
      .select();
    if (error) throw error;
    return data[0];
  },
};

// sketch, not required but implied
export const customerApi = {
  getMe: () => httpGet("/api/customer/me"),
  updateMe: (payload) =>
    httpPut("/api/customer/updateMe", payload),
};


function generateRandomCode(length = 8) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
