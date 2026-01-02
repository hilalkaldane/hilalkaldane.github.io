import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { merchantApi, campaignApi } from "../services/api";
import ReactGA from "react-ga4";
import { CacheKeys } from "../../shared/cacheKeys";
import MerchantCampaignCard from "../components/MerchantCampaignCard";

const BUCKET_BASE = process.env.REACT_APP_MEDIA_BUCKET_BASE;

function MerchantSkeleton() {
  return (
    <>
      {/* HERO */}
      <div className="w-full bg-slate-100 overflow-hidden">
        <div className="w-full h-[220px] bg-slate-200 animate-pulse" />
      </div>

      {/* CONTENT */}
      <div className="px-6 py-4 space-y-6">
        {/* HEADER */}
        <div className="space-y-2">
          <div className="h-6 w-2/3 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-full bg-slate-200 rounded animate-pulse" />
        </div>

        {/* INFO CARD */}
        <section className="rounded-xl bg-card-light p-4 border border-border-light space-y-4">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </section>

        {/* CAMPAIGNS */}
        <section className="space-y-4">
          <div className="h-5 w-40 bg-slate-200 rounded animate-pulse ml-2" />
          <CampaignSkeleton />
          <CampaignSkeleton />
          <CampaignSkeleton />
        </section>
      </div>
    </>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-start gap-3">
      <div className="w-5 h-5 bg-slate-200 rounded-full animate-pulse" />
      <div className="flex-1 space-y-1">
        <div className="h-3 w-24 bg-slate-200 rounded animate-pulse" />
        <div className="h-4 w-full bg-slate-200 rounded animate-pulse" />
      </div>
    </div>
  );
}

function CampaignSkeleton() {
  return (
    <div className="rounded-xl bg-card-light border border-border-light p-4 space-y-3">
      <div className="h-6 w-3/4 bg-slate-200 rounded animate-pulse" />
      <div className="h-4 w-1/2 bg-slate-200 rounded animate-pulse" />
      <div className="h-4 w-full bg-slate-200 rounded animate-pulse" />
      <div className="h-4 w-2/3 bg-slate-200 rounded animate-pulse" />
      <div className="h-10 w-full bg-slate-200 rounded-lg animate-pulse" />
    </div>
  );
}



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
      merchantName,
    };
    localStorage.setItem(CacheKeys.ISSUED_COUPONS, JSON.stringify(all));
  } catch {}
}

/* ---------------- Emoji Info Row ---------------- */
const InfoRow = ({ emoji, label, children }) => (
  <div className="flex items-start gap-3">
    <span className="text-lg leading-none select-none">{emoji}</span>
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
          category: c.category,
        }));

        mapped.sort((a, b) =>
          a.campaignType === "COUPON" && b.campaignType !== "COUPON" ? -1 : 0
        );

        setCampaigns(mapped);

        const merchantKey =
          m.merchantNameId || m.merchantId || merchantNameId;
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

      saveIssuedCoupon(merchantKey, campaignId, merchant.name, {
        couponCode: coupon.couponCode,
        campaignTitle:
          campaigns.find((c) => c.id === campaignId)?.title || "",
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
  if (loading) return <MerchantSkeleton />;
  if (!merchant)
    return <div className="p-4 text-red-500">Merchant not found</div>;

  return (
    <>
      {/* ---------- HERO ---------- */}
      <div className="w-full bg-slate-100 dark:bg-white/5 overflow-hidden">
        <img
          src={
            merchant.heroImage
              ? `${BUCKET_BASE}${merchant.heroImage}`
              : categoryImages.default
          }
          alt={merchant.name}
          className="w-full h-auto object-contain"
          fetchpriority="high"
        />
      </div>

      {/* ---------- CONTENT ---------- */}
      <div className="px-6 py-4">
        {/* HEADER */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold tracking-tight dark:text-white">
            {merchant.name}
          </h1>
          <p className="mt-1 text-sm text-text-subtle">
            {merchant.address}
          </p>
        </div>

        {/* INFO CARD */}
        <section className="mb-6 rounded-xl bg-card-light dark:bg-card-dark p-4 shadow-soft border border-border-light dark:border-border-dark space-y-5">
          <InfoRow emoji="📍" label="Address">
            {merchant.address}
          </InfoRow>

          <div className="flex items-start gap-3">
            <span className="text-lg select-none">🏷️</span>
            <div>
              <div className="text-text-subtle text-sm mb-1">Category</div>
              <div className="flex gap-2 flex-wrap">
                {merchant.category && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-accent-orange-soft text-primary capitalize">
                    {merchant.category.replaceAll("-", " ")}
                  </span>
                )}
                {merchant.subcategory && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-background-light dark:bg-white/10 text-text-subtle capitalize">
                    {merchant.subcategory.replaceAll("-", " ")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {Array.isArray(merchant.offerings) &&
            merchant.offerings.length > 0 && (
              <div className="flex items-start gap-3">
                <span className="text-lg select-none">🍽️</span>
                <div>
                  <div className="text-text-subtle text-sm mb-1">
                    Specialties
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {merchant.offerings.map((o) => (
                      <span
                        key={o}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-background-light dark:bg-white/10 text-text-subtle capitalize"
                      >
                        {o.replaceAll("-", " ").replaceAll("_", " ")}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

          <InfoRow emoji="✅" label="Status">
            <span
              className={`font-semibold ${
                merchant.status === "ACTIVE"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {merchant.status === "ACTIVE"
                ? "Open for deals"
                : merchant.status}
            </span>
          </InfoRow>
        </section>

        {/* CAMPAIGNS */}
        <section className="space-y-5">
          <h2 className="text-lg font-semibold px-2 dark:text-white">
            Available Deals
          </h2>

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

        {/* MAP */}
        {getMapEmbedUrl(merchant) && (
          <section className="mt-8">
            <h3 className="mb-2 px-2 text-lg font-semibold dark:text-white">
              Location
            </h3>
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
