import React from "react";
import { buildOfferHeadline, buildCtaCopy } from "../services/campaignCopy";

export default function FeedCampaignCard({ campaign, onClick }) {
  const {
    merchantName,
    merchantProfile,
    title,
    description,
    validUntil,
    offerType,
    discount,
    category,
  } = campaign;

  const CATEGORY_ICON = {
    "food": "🍴",
    "fashion": "👟",
    "modest-wear": "🧕🏽",
  };

  const headline = buildOfferHeadline({ offerType, discount });
  const cta = buildCtaCopy({ offerType, discount });
  const BUCKET_BASE = process.env.REACT_APP_MEDIA_BUCKET_BASE;

  return (
    <article className="relative flex flex-col bg-card-light dark:bg-card-dark rounded-xl px-3 py-3 border border-border-light dark:border-border-dark active:scale-[0.99] transition-transform">
      {false && category && CATEGORY_ICON[category] && (
        <span
          className="
      absolute top-2 right-2
      border
      rounded-full
      bg-slate-100
      p-1
      text-[16px]
      text-slate-400 dark:text-slate-500
      pointer-events-none
      select-none
    "
          title={category}
        >
          {CATEGORY_ICON[category]}
        </span>
      )}
      <div className="flex gap-3">
        {/* LEFT */}
        <div className="flex flex-1 flex-col">
          {/* Offer */}
          <span className="text-primary text-lg font-extrabold leading-tight mb-1">
            {headline}
          </span>

          {/* Merchant */}
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-text-main-light dark:text-white text-[15px] font-bold leading-tight line-clamp-1">
              {merchantName}
            </h3>
          </div>

          {/* Title */}
          {title && (
            <p className="text-text-subtle text-sm mt-1 line-clamp-2">
              {title}
            </p>
          )}

          {/* Validity */}
          {validUntil && (
            <p className="flex items-center gap-1 text-text-subtle text-xs mt-1">
              <span className="material-symbols-outlined text-[14px]">
                schedule
              </span>
              Till{" "}
              {new Date(validUntil).toLocaleDateString(undefined, {
                day: "numeric",
                month: "short",
              })}
            </p>
          )}
        </div>

        {/* IMAGE */}
        <div
          className="w-16 h-16 rounded-md bg-cover bg-center bg-slate-100 shrink-0 m-2"
          style={{
            backgroundImage: merchantProfile
              ? `url(${BUCKET_BASE}${merchantProfile})`
              : "none",
          }}
        />
      </div>

      {/* CTA */}
      <div
        onClick={onClick}
        className="
          mt-2 flex items-center justify-between
          rounded-md border border-border-light
          px-3 py-2
          text-primary text-sm font-semibold
          transition-colors
          hover:bg-primary/10
        "
      >
        <span>View details</span>
        <span className="material-symbols-outlined text-[18px]">
          arrow_forward
        </span>
      </div>
    </article>
  );
}
