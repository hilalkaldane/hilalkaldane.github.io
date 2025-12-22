import React from "react";
import {
  buildOfferHeadline,
  buildCtaCopy,
} from "../services/campaignCopy";

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

  return (
    <article className="relative flex flex-col bg-card-light dark:bg-card-dark rounded-3xl p-4 shadow-soft border border-border-light dark:border-border-dark active:scale-[0.99] transition-transform">
      <div className="flex gap-5">
        <div className="flex flex-1 flex-col">
          {/* OFFER HEADLINE */}
          <span className="text-primary text-xl font-black tracking-tight my-1">
            {headline}
          </span>

          {/* Merchant */}
          <h3 className="text-text-main-light dark:text-white text-[17px] font-bold mb-1 line-clamp-1">
            {merchantName}
          </h3>

          {/* Description */}
          {description && (
            <p className="text-text-subtle text-sm font-medium mb-3 line-clamp-1">
              {description}
            </p>
          )}

          {/* Validity */}
          {validUntil && (
            <p className="text-text-subtle text-xs mt-auto">
              Valid till{" "}
              {new Date(validUntil).toLocaleDateString(undefined, {
                day: "numeric",
                month: "short",
              })}
            </p>
          )}
        </div>

        {/* IMAGE */}
        <div
          className="w-24 h-24 rounded-xl bg-cover bg-center bg-slate-100"
          style={{
            backgroundImage: merchantProfile
              ? `url(https://faydapoint-media-dev.s3.ap-south-1.amazonaws.com/${merchantProfile})`
              : "none",
          }}
        />
      </div>

      {/* CTA */}
      <button
        onClick={onClick}
        className="mt-4 w-full py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-bold rounded-3xl shadow-sm"
      >
        {cta}
      </button>
    </article>
  );
}
