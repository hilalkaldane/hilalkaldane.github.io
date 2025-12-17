import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminProtectedApi } from "../services/adminProtectedApi";
import { adminLocalStorage } from "../services/adminDevice";
import { redirectToAdminLogin } from "../services/adminProtectedApi";

export default function ActiveCampaignsAdmin() {
    const adminToken = adminLocalStorage.getItem("adminAccessToken");
    if (!adminToken) redirectToAdminLogin();
  const navigate = useNavigate();

  /* ---------------- MERCHANT ---------------- */

  const [merchants, setMerchants] = useState([]);
  const [merchantNameId, setMerchantNameId] = useState("");
  const [loadingMerchants, setLoadingMerchants] = useState(false);

  /* ---------------- CAMPAIGNS ---------------- */

  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [error, setError] = useState(null);
  const [disablingId, setDisablingId] = useState(null);

  /* ---------------- LOAD MERCHANTS ---------------- */

  useEffect(() => {
    const loadMerchants = async () => {
      setLoadingMerchants(true);
      try {
        const res = await adminProtectedApi.listMerchants();
        setMerchants(res || []);
      } catch {
        setMerchants([]);
      } finally {
        setLoadingMerchants(false);
      }
    };
    loadMerchants();
  }, []);

  /* ---------------- LOAD CAMPAIGNS ---------------- */

  useEffect(() => {
    if (!merchantNameId) {
      setCampaigns([]);
      return;
    }

    const loadCampaigns = async () => {
      setLoadingCampaigns(true);
      setError(null);
      try {
        const res =
          await adminProtectedApi.getActiveCampaignsForMerchant(
            merchantNameId
          );
        setCampaigns(res || []);
      } catch {
        setError("Failed to load campaigns");
        setCampaigns([]);
      } finally {
        setLoadingCampaigns(false);
      }
    };

    loadCampaigns();
  }, [merchantNameId]);

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
    console.log("disabling campaing "+campaign.id)
    setDisablingId(campaign.id);
    try {
      await adminProtectedApi.deactivateCampaign(campaign.id, merchantNameId);
      const res =
        await adminProtectedApi.getActiveCampaignsForMerchant(
          merchantNameId
        );
      setCampaigns(res || []);
    } catch {
      alert("Failed to disable campaign.");
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

  const canCreateCampaign = couponCampaigns.length < 3;

  /* ---------------- UI STATES ---------------- */

  if (loadingMerchants) {
    return <div className="p-4">Loading merchants…</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  /* ---------------- JSX ---------------- */

  return (
    <div className="p-4 space-y-6">

      {/* MERCHANT SELECT */}
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
          Select Merchant
        </label>

        <select
          className="w-full rounded-lg border border-gray-200 p-2 text-sm"
          value={merchantNameId}
          onChange={(e) => setMerchantNameId(e.target.value)}
        >
          <option value="">-- Select merchant --</option>
          {merchants.map((m) => (
            <option key={m.merchantNameId} value={m.merchantNameId}>
              {m.name} ({m.merchantNameId})
            </option>
          ))}
        </select>
      </div>

      {/* CREATE CAMPAIGN */}
      <button
        onClick={() =>
          navigate("/admin/create-campaign", {
            state: { merchantNameId },
          })
        }
        disabled={!merchantNameId || !canCreateCampaign}
        className="w-full rounded-lg bg-black py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        Create Campaign
      </button>

      {!merchantNameId && (
        <div className="text-xs text-gray-600">
          Select a merchant to view campaigns
        </div>
      )}

      {merchantNameId && !canCreateCampaign && (
        <div className="text-xs text-red-600">
          Merchant has reached the maximum allowed coupon campaigns.
        </div>
      )}

      {loadingCampaigns && (
        <div className="text-sm text-gray-500">
          Loading campaigns…
        </div>
      )}

      {merchantNameId && (
        <>
          {/* LISTING */}
          <Section
            title="Listing Campaign"
            count={`${listingCampaigns.length}/1 active`}
            emptyText="No active listing campaign"
            campaigns={listingCampaigns}
            onDisable={disableCoupon}
            disablingId={disablingId}
          />

          {/* COUPONS */}
          <Section
            title="Coupon Campaigns"
            count={`${couponCampaigns.length}/3 active`}
            emptyText="No active coupon campaigns"
            campaigns={couponCampaigns}
            onDisable={disableCoupon}
            disablingId={disablingId}
          />
        </>
      )}
    </div>
  );
}

/* ---------------- SECTION ---------------- */

function Section({
  title,
  count,
  emptyText,
  campaigns,
  onDisable,
  disablingId,
}) {
  return (
    <section className="space-y-2">
      <div className="flex justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="text-xs text-gray-500">{count}</span>
      </div>

      {campaigns.length === 0 && (
        <div className="text-sm text-gray-500">{emptyText}</div>
      )}

      {campaigns.map((c) => (
        <CampaignCard
          key={c.id}
          campaign={c}
          onDisable={onDisable}
          disabling={disablingId === c.id}
        />
      ))}
    </section>
  );
}

/* ---------------- CAMPAIGN CARD ---------------- */

function CampaignCard({ campaign, onDisable, disabling }) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex justify-between">
        <div>
          <h4 className="font-semibold">{campaign.title}</h4>
          <p className="text-xs text-gray-500">
            {campaign.campaignType}
          </p>
        </div>
        <span className="text-xs rounded bg-green-100 px-2 py-1 text-green-700">
          ACTIVE
        </span>
      </div>

      {campaign.description && (
        <p className="mt-2 text-sm text-gray-700">
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
