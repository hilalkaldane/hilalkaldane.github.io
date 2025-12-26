import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { merchantApi, campaignApi } from "../services/api";
import ReactGA from "react-ga4";
import { CacheKeys } from "../../shared/cacheKeys";
import MerchantCampaignCard from "../components/MerchantCampaignCard";
const BUCKET_BASE = process.env.REACT_APP_MEDIA_BUCKET_BASE;


/* ---------------- Analytics ---------------- */
export const trackCampaignIssued = ({ campaignId, merchantId }) => {
  ReactGA.event("campaign_issued", {
    campaign_id: campaignId,
    merchant_id: merchantId,
  });
};

/* ---------------- LocalStorage helpers ---------------- */
function loadIssuedCouponsForMerchant(merchantNameId) {
  try {
    const raw = localStorage.getItem(CacheKeys.ISSUED_COUPONS);
    if (!raw) return {};
    const all = JSON.parse(raw);
    return all?.[merchantNameId] || {};
  } catch {
    return {};
  }
}

function saveIssuedCoupon(merchantNameId, campaignId, merchantName, payload) {
  try {
    const raw = localStorage.getItem(CacheKeys.ISSUED_COUPONS);
    const all = raw ? JSON.parse(raw) : {};
    if (!all[merchantNameId]) all[merchantNameId] = {};
    all[merchantNameId][campaignId] = {
      couponCode: payload.couponCode,
      campaignTitle: payload.campaignTitle,
      createdAt: new Date().toISOString(),
      merchantName: merchantName
    };

    localStorage.setItem(CacheKeys.ISSUED_COUPONS, JSON.stringify(all));
  } catch {}
}

/* ---------------- Small UI helper ---------------- */
const InfoRow = ({ icon, label, children }) => (
  <div className="flex items-start gap-3">
    <span className="material-symbols-outlined text-text-subtle text-[18px]">
      {icon}
    </span>
    <div className="text-sm">
      <div className="text-text-subtle leading-none">{label}</div>
      <div className="font-medium text-text-main-light dark:text-white">
        {children}
      </div>
    </div>
  </div>
);

/* ---------------- Component ---------------- */
export default function Merchant() {
  const { merchantNameId } = useParams();

  const [merchant, setMerchant] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [campaignCouponState, setCampaignCouponState] = useState({});

  const categoryImages = {
    default: "https://source.unsplash.com/400x300/?restaurant,cafe",
  };

  const getMapEmbedUrl = (m) => {
    if (m?.loc?.[0] && m?.loc?.[1]) {
      return `https://www.google.com/maps?q=${m.loc[0]},${m.loc[1]}&z=15&output=embed`;
    }
    return null;
  };

  /* ---------------- Fetch data ---------------- */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const m = await merchantApi.getMerchant(merchantNameId);
        setMerchant(m);

        const cs = await campaignApi.listCampaignByMerchant(merchantNameId);

        const mapped = cs.map((c) => ({
          id: c.id,
          title: c.title,
          description: c.description,

          offerType: c.offerType,
          discount: c.discount ?? c.parameters?.discount ?? null,

          mov: c.mov,
          validUntil: c.validUntil,
          termsConditions: c.termsConditions || [],
          campaignType: c.campaignType,
        }));

        mapped.sort((a, b) =>
          a.campaignType === "COUPON" && b.campaignType !== "COUPON" ? -1 : 0
        );

        setCampaigns(mapped);

        const merchantKey = m.merchantNameId || m.merchantId || merchantNameId;
        const stored = loadIssuedCouponsForMerchant(merchantKey);

        const initialState = {};
        mapped.forEach((c) => {
          if (stored?.[c.id]?.couponCode) {
            initialState[c.id] = {
              loading: false,
              code: stored[c.id].couponCode,
              error: null,
            };
          }
        });
        setCampaignCouponState(initialState);
      } catch (err) {
        console.error("Failed to load merchant", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [merchantNameId]);

  /* ---------------- Actions ---------------- */
  const issueCouponForCampaign = async (campaignId) => {
    setCampaignCouponState((prev) => ({
      ...prev,
      [campaignId]: { ...(prev[campaignId] || {}), loading: true, error: null },
    }));

    try {
      const coupon = await campaignApi.issueCouponForCampaign(campaignId);
      const merchantKey =
        merchant.merchantNameId || merchant.merchantId || merchantNameId;
      const merchantName =
        merchant.name || "";
      const campaign = campaigns.find((c) => c.id === campaignId);

      saveIssuedCoupon(merchantKey, campaignId, merchant.name , {
        couponCode: coupon.couponCode,
        campaignTitle: campaign?.title || "",
      });

      setCampaignCouponState((prev) => ({
        ...prev,
        [campaignId]: {
          loading: false,
          code: coupon.couponCode,
          error: null,
        },
      }));

      trackCampaignIssued({ campaignId, merchantId: merchantKey });
    } catch (err) {
      setCampaignCouponState((prev) => ({
        ...prev,
        [campaignId]: {
          loading: false,
          code: null,
          error: err.message || "Failed to issue coupon",
        },
      }));
    }
  };

  /* ---------------- Render ---------------- */
  if (loading) return <div className="p-4">Loading merchant…</div>;
  if (!merchant)
    return <div className="p-4 text-red-500">Merchant not found</div>;

  return (
    <>
      {/* ---------- FULL WIDTH HERO ---------- */}
      <div
        className="w-full h-56 bg-cover bg-center bg-slate-100 dark:bg-white/5"
        style={{
          backgroundImage: `url(${BUCKET_BASE}${
            merchant.heroImage || categoryImages.default
          })`,
        }}
      />

      {/* ---------- PADDED CONTENT ---------- */}
      <div className="px-6 py-4">
        {/* ---------- Header (shifted below hero) ---------- */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {merchant.name}
          </h1>
          <p className="mt-1 text-sm text-text-subtle">{merchant.address}</p>
        </div>

        {/* ---------- Merchant Info Card ---------- */}
        <section className="mb-6 rounded-3xl bg-card-light dark:bg-card-dark p-4 shadow-soft border border-border-light dark:border-border-dark space-y-4">
          <InfoRow icon="location_on" label="Address">
            {merchant.address}
          </InfoRow>

          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-text-subtle text-[18px]">
              category
            </span>
            <div>
              <div className="text-text-subtle text-sm">Category</div>
              <div className="flex gap-2 mt-1 flex-wrap">
                {merchant.category && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-accent-orange-soft text-primary capitalize">
                    {merchant.category.replaceAll("-", " ")}
                  </span>
                )}
                {merchant.subcategory && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-white/10 capitalize">
                    {merchant.subcategory.replaceAll("-", " ")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {Array.isArray(merchant.offerings) &&
            merchant.offerings.length > 0 && (
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-text-subtle text-[18px]">
                  restaurant_menu
                </span>
                <div>
                  <div className="text-text-subtle text-sm">Specialties</div>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {merchant.offerings.map((o) => (
                      <span
                        key={o}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-white/10 capitalize"
                      >
                        {o.replaceAll("_","")}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

          <InfoRow icon="verified" label="Status">
            <span
              className={`font-semibold ${
                merchant.status === "ACTIVE" ? "text-green-600" : "text-red-600"
              }`}
            >
              {merchant.status === "ACTIVE"
                ? "Open for deals"
                : merchant.status}
            </span>
          </InfoRow>
        </section>
        {/* ---------- Campaigns ---------- */}
        <section className=" space-y-5">
          <h2 className="text-lg font-semibold px-2">Available Deals</h2>

          {campaigns.map((c) => (
            <MerchantCampaignCard
              key={c.id}
              campaign={c}
              issuedState={campaignCouponState[c.id]}
              merchantKey={merchant.merchantNameId}
              merchantName={merchant.name}
              lat={merchant.loc[0]}
              lng={merchant.loc[1]}
              onIssue={issueCouponForCampaign}
            />
          ))}
        </section>

        {/* ---------- Map ---------- */}
        {getMapEmbedUrl(merchant) && (
          <section className="mt-8">
            <h3 className="mb-2 px-2 text-lg font-semibold">Location</h3>
            <div className="overflow-hidden rounded-2xl border border-border-light dark:border-border-dark">
              <iframe
                title="merchant-location"
                src={getMapEmbedUrl(merchant)}
                width="100%"
                height="220"
                loading="lazy"
              />
            </div>
          </section>
        )}
      </div>
    </>
  );
}
