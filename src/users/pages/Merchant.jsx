import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { merchantApi, campaignApi } from "../services/api";
import { QRCodeCanvas } from "qrcode.react";
import ReactGA from "react-ga4";

export const trackCampaignIssued = ({
  campaignId,
  merchantId
}) => {
console.log(merchantId)
  ReactGA.event("campaign_issued", {
    campaign_id: campaignId,
    merchant_id: merchantId
  });
};

const ISSUED_COUPONS_STORAGE_KEY = "issuedCoupons";

// Read issued coupons for this merchant from localStorage
function loadIssuedCouponsForMerchant(merchantNameId) {
  try {
    const raw = localStorage.getItem(ISSUED_COUPONS_STORAGE_KEY);
    if (!raw) return {};
    const all = JSON.parse(raw);
    if (!all || typeof all !== "object") return {};
    return all[merchantNameId] || {};
  } catch {
    return {};
  }
}

// Persist issued coupon for this merchant+campaign in localStorage
function saveIssuedCoupon(merchantNameId, campaignId, payload) {
  try {
    const raw = localStorage.getItem(ISSUED_COUPONS_STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    const existing = all && typeof all === "object" ? all : {};

    if (!existing[merchantNameId]) {
      existing[merchantNameId] = {};
    }

    existing[merchantNameId][campaignId] = {
      couponCode: payload.couponCode,
      campaignTitle: payload.campaignTitle,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(
      ISSUED_COUPONS_STORAGE_KEY,
      JSON.stringify(existing)
    );
  } catch {
    // ignore localStorage errors
  }
}

export default function Merchant() {
  const { merchantNameId } = useParams();

  const [merchant, setMerchant] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const [redeemResult, setRedeemResult] = useState(null);

  // per-campaign coupon state: { [campaignId]: { loading, code, error } }
  const [campaignCouponState, setCampaignCouponState] = useState({});

  const categoryImages = {
    default: "https://source.unsplash.com/400x300/?shopping",
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const m = await merchantApi.getMerchantLocal(merchantNameId);
        setMerchant(m);

        const cs = await campaignApi.listCampaignByMerchant(merchantNameId);

        const mapped = cs.map((c) => ({
          id: c.id,
          title: c.title,
          campaignType: c.campaignType,
          discountType: c.discount?.includes("%") ? "percentage" : "amount",
          discountValue: c.discount
            ? Number(c.discount.replace(/[^\d]/g, ""))
            : 0,
          startDate: c.created_at || c.createdAt || "",
          endDate: c.valid_until || c.validUntil || "",
          terms: c.description || "",
        }));

        setCampaigns(mapped);

        // hydrate coupon state from localStorage for this merchant
        const merchantKey =
          m.merchantNameId || m.merchantId || merchantNameId;
        const stored = loadIssuedCouponsForMerchant(merchantKey);

        const initialCouponState = {};
        mapped.forEach((c) => {
          const storedEntry = stored[c.id];
          if (storedEntry && storedEntry.couponCode) {
            initialCouponState[c.id] = {
              loading: false,
              code: storedEntry.couponCode,
              error: null,
            };
          }
        });

        setCampaignCouponState(initialCouponState);
      } catch (err) {
        console.error("Failed to load merchant or campaigns", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [merchantNameId]);

  if (loading) {
    return <div className="p-4">Loading merchant…</div>;
  }

  if (!merchant) {
    return <div className="p-4 text-red-500">Merchant not found</div>;
  }

  const redeem = async (offer) => {
    setRedeemResult({ loading: true });
    try {
      const res = await merchantApi.redeemOffer(merchant.id, offer.id);
      setRedeemResult({ loading: false, res });
    } catch (err) {
      setRedeemResult({ loading: false, res: null });
      alert("Failed to redeem: " + err.message);
    }
  };

  const issueCouponForCampaign = async (campaignId) => {
    setCampaignCouponState((prev) => ({
      ...prev,
      [campaignId]: {
        ...(prev[campaignId] || {}),
        loading: true,
        error: null,
      },
    }));

    try {
      const coupon = await campaignApi.issueCouponForCampaign(campaignId);
      const couponCode = coupon.couponCode;

      const merchantKey =
        merchant.merchantNameId || merchant.merchantId || merchantNameId;
      const campaign = campaigns.find((c) => c.id === campaignId);

      // persist in localStorage
      saveIssuedCoupon(merchantKey, campaignId, {
        couponCode,
        campaignTitle: campaign?.title || "",
      });

      // update UI state
      setCampaignCouponState((prev) => ({
        ...prev,
        [campaignId]: {
          ...(prev[campaignId] || {}),
          loading: false,
          code: couponCode,
          error: null,
        },
      }));
      trackCampaignIssued({campaignId,merchantId:merchantKey})
    } catch (err) {
      setCampaignCouponState((prev) => ({
        ...prev,
        [campaignId]: {
          ...(prev[campaignId] || {}),
          loading: false,
          code: null,
          error: err.message || "Failed to generate coupon",
        },
      }));
    }
  };

  return (
    <div className="px-4 pb-24 pt-2">
      {/* Header */}
      <div className="mt-2 mb-3">
        <div className="text-xl font-semibold">{merchant.name}</div>
        {(merchant.distanceKm || merchant.tagline) && (
          <div className="text-sm text-gray-500">
            {merchant.distanceKm ? `${merchant.distanceKm} km` : ""}
            {merchant.distanceKm && merchant.tagline ? " • " : ""}
            {merchant.tagline || ""}
          </div>
        )}
      </div>

      {/* Hero image */}
      <div
        className="mb-4 h-40 w-full rounded-md bg-cover bg-center"
        style={{
          backgroundImage: `url(${
            merchant.profile || categoryImages.default
          }${"?w=416&h=160&fit=crop&q=80&auto=format"})`,
        }}
      />

      {/* Legacy offers (if still used) */}
      {Array.isArray(merchant.offers) && merchant.offers.length > 0 && (
        <div>
          <h3 className="mb-2 font-semibold">Offers</h3>
          <div className="space-y-3">
            {merchant.offers.map((o) => (
              <div key={o.id} className="rounded-lg border bg-white p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{o.title}</div>
                    {o.expires && (
                      <div className="text-sm text-gray-500">
                        Valid until {o.expires}
                      </div>
                    )}
                  </div>
                  <div>
                    <button
                      onClick={() => redeem(o)}
                      className="rounded-md bg-black px-4 py-2 text-white"
                    >
                      Get Code
                    </button>
                  </div>
                </div>
                {redeemResult?.res && (
                  <div className="mt-2 text-sm text-green-700">
                    Code: {redeemResult.res.code}
                  </div>
                )}
                {redeemResult?.loading && (
                  <div className="mt-2 text-sm text-gray-500">
                    Getting code…
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Campaigns with coupon issue + QR */}
      {Array.isArray(campaigns) && campaigns.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-2 font-semibold">Campaigns</h3>
          <div className="space-y-3">
            {campaigns.map((c) => {
              const state = campaignCouponState[c.id] || {};

              return (
                <div
                  key={c.id}
                  className="flex justify-between rounded-lg border bg-white p-3"
                >
                  {/* Left Column - Campaign Details */}
                  <div className="flex-1 pr-4">
                    <div className="font-semibold">{c.title}</div>
                    <div className="mt-1 text-sm text-gray-700">
                      {c.discountType === "percentage"
                        ? `${c.discountValue}% off`
                        : c.discountType === "amount"
                        ? `₹${c.discountValue} off`
                        : ""}
                    </div>
                    {(c.startDate || c.endDate) && (
                      <div className="mt-1 text-xs text-gray-500">
                        Valid from {c.startDate} to {c.endDate}
                      </div>
                    )}
                    {c.terms && (
                      <div className="mt-2 whitespace-pre-wrap text-xs text-gray-500">
                        {c.terms}
                      </div>
                    )}
                  </div>

                  {/* Right Column - Coupon (only for COUPON type) */}
                  <div className="flex w-40 flex-col items-center justify-center">
                    {c.campaignType === "COUPON" ? (
                      <>
                        {state.code ? (
                          <>
                            <div className="mb-1 text-center text-sm font-medium text-green-700">
                              Coupon issued
                            </div>

                            <QRCodeCanvas
                              value={JSON.stringify({
                                merchantNameId:
                                  merchant.merchantNameId ||
                                  merchant.merchantId ||
                                  merchant.id,
                                campaignId: c.id,
                                couponCode: state.code,
                                campaignTitle: c.title,
                              })}
                              size={96}
                            />

                            <div className="mt-1 text-xs text-gray-800">
                              Code:{" "}
                              <span className="font-mono">
                                {state.code}
                              </span>
                            </div>
                          </>
                        ) : (
                          <button
                            onClick={() => issueCouponForCampaign(c.id)}
                            disabled={state.loading}
                            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-60"
                          >
                            {state.loading ? "Generating..." : "Generate Code"}
                          </button>
                        )}

                        {state.error && (
                          <div className="mt-1 text-xs text-red-600">
                            {state.error}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-xs text-gray-500">
                        Non-coupon campaign
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Extra merchant details if present */}
      {merchant.details && (
        <div className="mt-6">
          <h4 className="font-semibold">Details</h4>
          <p className="mt-2 text-sm text-gray-600">{merchant.details}</p>
        </div>
      )}
    </div>
  );
}
