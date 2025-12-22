// ActiveCampaigns.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { merchantProtectedApi } from "../services/merchantProtectedApi";
import { merchantLocalStorage } from "../services/merchantDevice";

const STORAGE_KEY = "active_campaigns";
const TTL_MS = 15 * 60 * 1000; // 15 minutes

export default function ActiveCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [disablingId, setDisablingId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    loadCampaigns();
  }, []);

  /* ---------------- LOAD ---------------- */

  const loadCampaigns = async () => {
    const cached = getFromCache();
    if (cached) {
      setCampaigns(cached);
      return;
    }
    await fetchAndCache();
  };

  const fetchAndCache = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await merchantProtectedApi.listCampaigns();
      const activeOnly = (res || []).filter(
        (c) => c.status === "ACTIVE"
      );
      setCampaigns(activeOnly);
      saveToCache(activeOnly);
    } catch {
      setError("Failed to load campaigns");
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- CACHE ---------------- */

  const getFromCache = () => {
    try {
      const raw = merchantLocalStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const { data, ts } = JSON.parse(raw);
      if (Date.now() - ts > TTL_MS) {
        merchantLocalStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return data;
    } catch {
      merchantLocalStorage.removeItem(STORAGE_KEY);
      return null;
    }
  };

  const saveToCache = (data) => {
    merchantLocalStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ data, ts: Date.now() })
    );
  };

  const invalidateCache = () => {
    merchantLocalStorage.removeItem(STORAGE_KEY);
  };

  /* ---------------- DISABLE COUPON ---------------- */

  const disableCoupon = async (campaign) => {
    const ok = window.confirm(
      "This will inactivate the current coupon.\n\n" +
        "• You will NOT be able to see it in dashboard\n" +
        "• Customers will NOT see it in Trending\n" +
        "• Customers will NOT see it on Merchant page\n\n" +
        "Do you want to continue?"
    );

    if (!ok) return;

    setDisablingId(campaign.id);
    try {
      await merchantProtectedApi.deactivateCampaign(campaign.id);
      invalidateCache();
      await fetchAndCache();
    } catch {
      alert("Failed to disable campaign. Please try again.");
    } finally {
      setDisablingId(null);
    }
  };

  /* ---------------- BIFURCATION ---------------- */

  const listingCampaigns = campaigns.filter(
    (c) => c.campaignType === "LISTING"
  );

  const couponCampaigns = campaigns.filter(
    (c) => c.campaignType === "COUPON"
  );

  const activeListingCount = listingCampaigns.length;
  const activeCouponCount = couponCampaigns.length;

  const canCreateCampaign = activeCouponCount < 3;

  /* ---------------- UI STATES ---------------- */

  if (loading) return <div className="p-4">Loading campaigns…</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="p-4 space-y-6 dark:text-white">

      {/* ---------------- LISTING SECTION ---------------- */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Listing Campaign
          </h3>
          <span className="text-xs text-gray-500">
            {activeListingCount}/1 active
          </span>
        </div>

        <div className="text-xs text-gray-600 dark:text-white">
          Only one listing can be active at a time. Creating a new listing will
          override the existing one.
        </div>

        {listingCampaigns.length === 0 && (
          <div className="text-sm text-gray-500 dark:text-white">
            No active listing campaign
          </div>
        )}

        {listingCampaigns.map((c) => (
          <CampaignCard key={c.id} campaign={c} 
            onDisable={disableCoupon}
            disabling={disablingId === c.id}/>
        ))}
      </section>

      {/* ---------------- COUPON SECTION ---------------- */}
      <section className="space-y-2 dark:text-white">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Coupon Campaigns
          </h3>
          <span className="text-xs text-gray-500 dark:text-white">
            {activeCouponCount}/3 active
          </span>
        </div>

        <div className="text-xs text-gray-600 dark:text-white">
          You can have up to three active coupon campaigns.
        </div>

        {couponCampaigns.length === 0 && (
          <div className="text-sm text-gray-500 dark:text-white">
            No active coupon campaigns
          </div>
        )}

        {couponCampaigns.map((c) => (
          <CampaignCard
            key={c.id}
            campaign={c}
            onDisable={disableCoupon}
            disabling={disablingId === c.id}
          />
        ))}
      </section>
            {/* Create Campaign CTA */}
      <button
        onClick={() => navigate("/client/create-campaign")}
        disabled={!canCreateCampaign}
        className="w-full rounded-lg bg-black py-2 text-sm font-semibold text-white disabled:opacity-50 dark:border dark:border-light"
      >
        Create Campaign
      </button>

      {!canCreateCampaign && (
        <div className="text-xs text-red-600">
          You have reached the maximum allowed active campaigns. Please make an
          existing campaign inactive.
        </div>
      )}

    </div>
  );
}

/* ---------------- CAMPAIGN CARD ---------------- */

function CampaignCard({ campaign, onDisable, disabling }) {
  const isCoupon = campaign.campaignType === "COUPON";

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:bg-card-dark">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white">
            {campaign.title}
          </h4>
          <p className="text-xs text-gray-500">
            {campaign.campaignType}
          </p>
        </div>

        <span className="text-xs rounded bg-green-100 px-2 py-1 text-green-700 dark:bg-white dark:text-black ">
          ACTIVE
        </span>
      </div>

      {campaign.description && (
        <p className="mt-2 text-sm text-gray-700 dark:text-white">
          {campaign.description}
        </p>
      )}

        <button
          onClick={() => onDisable(campaign)}
          disabled={disabling}
          className="mt-3 rounded border border-red-300 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          {disabling ? "Disabling…" : "Disable Campaign"}
        </button>
    </div>
  );
}
