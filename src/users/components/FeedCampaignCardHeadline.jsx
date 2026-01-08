import React from "react";
import { buildOfferHeadline } from "../services/campaignCopy";

export default function FeedCampaignCardHeadline({ campaign, onClick }) {
  const {
    merchantName,
    merchantProfile,
    title,
    validUntil,
    offerType,
    discount,
    category,
  } = campaign;

  const CATEGORY_ICON = {
    food: "🍴",
    fashion: "👟",
    "modest-wear": "🧕🏽",
  };

  const headline = buildOfferHeadline({ offerType, discount });
  const BUCKET_BASE = process.env.REACT_APP_MEDIA_BUCKET_BASE;

  /**
   * CTA MODE
   * - CARD
   * - BUTTON
   * - CARD_WITH_HINT (default)
   */
  const CTA_MODE = "CARD_WITH_HINT";
  const isCardClickable =
    CTA_MODE === "CARD" || CTA_MODE === "CARD_WITH_HINT";

  return (
    <article
      onClick={isCardClickable ? onClick : undefined}
      className={`
        relative flex flex-col
        bg-card-light dark:bg-card-dark
        rounded-xl px-4 py-3
        border border-border-light dark:border-border-dark
        transition-transform
        ${isCardClickable ? "cursor-pointer active:scale-[0.99]" : ""}
      `}
    >
      {/* OPTIONAL CATEGORY ICON (still disabled) */}
      {false && category && CATEGORY_ICON[category] && (
        <span
          className="
            absolute top-2 right-2
            border rounded-full
            bg-slate-100
            p-1 text-[16px]
            text-slate-400 dark:text-slate-500
            pointer-events-none select-none
          "
          title={category}
        >
          {CATEGORY_ICON[category]}
        </span>
      )}

      <div className="flex gap-3">
        {/* LEFT CONTENT */}
        <div className="flex flex-1 flex-col">
          {/* OFFER — PRIMARY HOOK */}
          <span className="text-primary text-lg font-extrabold leading-tight mb-0.5">
            {headline}
          </span>

          {/* MERCHANT — IDENTITY */}
          <h3 className="text-text-main-light dark:text-text-main-dark text-[15px] font-bold leading-tight line-clamp-1">
            {merchantName}
          </h3>

          {/* TITLE — CONTEXT (DE-EMPHASIZED) */}
          {title && (
            <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm mt-0.5 line-clamp-2">
              {title}
            </p>
          )}

          {/* META — LOW PRIORITY */}
          {validUntil && (
            <p className="flex items-center gap-1 text-text-subtle text-xs mt-0.5">
              <span className="select-none">📅</span>
              Till{" "}
              {new Date(validUntil).toLocaleDateString(undefined, {
                day: "numeric",
                month: "short",
              })}
            </p>
          )}
        </div>

        {/* IMAGE — VISUAL ANCHOR */}
        <div
          className="w-16 h-16 rounded-md bg-cover bg-center bg-slate-100 shrink-0"
          style={{
            backgroundImage: merchantProfile
              ? `url(${BUCKET_BASE}${merchantProfile})`
              : "none",
          }}
        />
      </div>

      {/* CTA BUTTON MODE (NOT FOR FEED) */}
      {CTA_MODE === "BUTTON" && (
        <div
          onClick={onClick}
          className="
            mt-2 flex items-center justify-between
            rounded-xl border border-border-light
            px-3 py-2
            text-primary text-sm font-semibold
            transition-colors
            hover:bg-primary/10
          "
        >
          <span>View details</span>
          <span className="select-none">➡️</span>
        </div>
      )}

      {/* AFFORDANCE — NOT A CTA */}
      {CTA_MODE === "CARD_WITH_HINT" && (
        <div
          className="
            mt-1
            text-text-subtle text-xs
            tracking-wide
            opacity-60
            select-none pointer-events-none
          "
        >
          <span>view details →</span>
        </div>
      )}
    </article>
  );
}
