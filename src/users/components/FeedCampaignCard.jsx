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
  } = campaign;

  const headline = buildOfferHeadline({ offerType, discount });
  const cta = buildCtaCopy({ offerType, discount });
  const BUCKET_BASE = process.env.REACT_APP_MEDIA_BUCKET_BASE;

  return (
    <article className="relative flex flex-col bg-card-light dark:bg-card-dark rounded-xl px-3 py-3 border border-border-light dark:border-border-dark active:scale-[0.99] transition-transform">
      <div className="flex gap-3">
        {/* LEFT */}
        <div className="flex flex-1 flex-col">
          {/* Offer */}
          <span className="text-primary text-lg font-extrabold leading-tight mb-2">
            {headline}
          </span>

          {/* Merchant */}
          <h3 className="text-text-main-light dark:text-white text-[15px] font-semibold leading-tight line-clamp-1">
            {merchantName}
          </h3>

          {/* Title */}
          {title && (
            <p className="text-text-subtle text-sm mt-1 line-clamp-2">
              {title}
            </p>
          )}

          {/* Validity */}
          {validUntil && (
            <p className="text-text-subtle text-xs mt-2">
              Ends{" "}
              {new Date(validUntil).toLocaleDateString(undefined, {
                day: "numeric",
                month: "short",
              })}
            </p>
          )}
        </div>

        {/* IMAGE */}
        <div
          className="w-16 h-16 rounded-md bg-cover bg-center bg-slate-100 shrink-0"
          style={{
            backgroundImage: merchantProfile
              ? `url(${BUCKET_BASE}${merchantProfile})`
              : "none",
          }}
        />
      </div>

      {/* CTA */}
      <button
        onClick={onClick}
        className="mt-2 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-md"
      >
        {cta}
      </button>
    </article>
  );
}
