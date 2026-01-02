import React, { useState, useMemo } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { buildOfferHeadline } from "../services/campaignCopy";

export default function MerchantCampaignCard({
  campaign,
  issuedState,
  onIssue,
  merchantKey,
  merchantName,
  lat,
  lng,
}) {
  const {
    id,
    title,
    description,
    offerType,
    discount,
    validUntil,
    termsConditions = [],
    mov,
    campaignType,
    category,
  } = campaign;

  const isCoupon = campaignType === "COUPON";
  const [showTerms, setShowTerms] = useState(false);
  const safeIssuedState = issuedState ?? {};
  const shouldDisplayMov = offerType !== "FIXED";

  /* ---------- Offer copy ---------- */
  const headline = buildOfferHeadline({ offerType, discount });
  const cta = "Issue coupon";

  /* ---------- Urgency ---------- */
  const hoursLeft = useMemo(() => {
    if (!validUntil) return null;
    const diff = new Date(validUntil).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60));
  }, [validUntil]);

  const isUrgent = hoursLeft !== null && hoursLeft <= 48;

  const buildMapsUrl = ({ lat, lng }) => {
    if (lat == null || lng == null) return null;
    return `https://maps.google.com/?q=${lat},${lng}`;
  };

  const shareCampaign = ({ headline, merchantName, lat, lng }) => {
    const mapsUrl = buildMapsUrl({ lat, lng });

    const lines = [
      `🔥 ${headline} at ${merchantName}`,
      "",
      title ? `Offer: ${title}` : "",
      "",
      mapsUrl ? `📍 Location: ${mapsUrl}` : "",
      "",
      "Issued via FaydaPoint https://www.faydapoint.com?utm_source=whatsapp&utm_medium=share",
    ].filter(Boolean);

    const waUrl = `https://wa.me/?text=${encodeURIComponent(lines.join("\n"))}`;
    window.open(waUrl, "_blank");
  };

  /* ---------- Terms ---------- */
  const SYSTEM_TERMS = {
    COMMONS: ["Mention FaydaPoint before ordering"],
    COUPON_ONLY: ["Show QR at billing (for loyalty points)"],
    FIXED_ORDER: ["Final bill already includes this deal"],
    MENU_NOTE: [
      "Free / discounted item applies only to listed menu items",
      "You may order other items as well",
    ],
    BARGAINING: ["Final price must include the deal"],
  };

  const resolvedTerms = useMemo(() => {
    const terms = [];

    terms.push(...termsConditions.filter((t) => t && t.trim().length > 0));
    terms.push(...SYSTEM_TERMS.COMMONS);

    if (category !== "food") {
      terms.push(...SYSTEM_TERMS.BARGAINING);
    }

    if (offerType === "FIXED") {
      terms.push(...SYSTEM_TERMS.MENU_NOTE);
    }

    if (offerType === "FLAT" || offerType === "PERCENTAGE") {
      terms.push(...SYSTEM_TERMS.FIXED_ORDER);
    }

    if (isCoupon) {
      terms.push(...SYSTEM_TERMS.COUPON_ONLY);
    }

    return terms;
  }, [category, offerType, isCoupon, termsConditions]);

  return (
    <article className="relative rounded-xl bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark p-4 shadow-soft space-y-3">
      {/* URGENCY BADGE */}
      {isUrgent && (
        <div className="absolute -top-2 right-3 rounded-full bg-red-600 px-3 py-0.5 text-[11px] font-bold text-white animate-pulse">
          ⏰ Ends in {hoursLeft}h
        </div>
      )}

      {/* PRIMARY HOOK */}
      <div className="text-primary text-[22px] font-extrabold leading-snug tracking-tight">
        {headline}
      </div>

      <div className="h-px bg-border-light dark:bg-border-dark opacity-50" />

      {/* TITLE + DESCRIPTION */}
      <div className="space-y-0.5">
        <h3 className="text-[15px] font-semibold leading-snug dark:text-white">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-text-subtle leading-snug line-clamp-2">
            {description}
          </p>
        )}
      </div>

      {/* META */}
      <div className="flex items-center gap-3 text-sm text-text-subtle">
        {shouldDisplayMov && mov > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 text-orange-700 px-3 py-1 text-xs font-semibold">
            💰 Min bill ₹{mov}
          </span>
        )}
        {validUntil && (
          <span>
            📅 Valid till{" "}
            {new Date(validUntil).toLocaleDateString(undefined, {
              day: "numeric",
              month: "short",
            })}
          </span>
        )}
      </div>

      {/* TERMS (COLLAPSIBLE) */}
      {resolvedTerms.length > 0 && (
        <div>
          <button
            onClick={() => setShowTerms(!showTerms)}
            className="mt-1 text-[11px] text-text-subtle underline underline-offset-2"
          >
            {showTerms ? "Hide conditions" : "View conditions"}
          </button>

          {showTerms && (
            <ul className="mt-2 space-y-1">
              {resolvedTerms.map((t, i) => (
                <li key={i} className="text-xs text-text-subtle">
                  • {t}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* HOW IT WORKS */}
      <div className="pt-2 border-t border-border-light dark:border-border-dark space-y-1">
        <p className="text-[11px] uppercase tracking-wide text-text-subtle/70">
          How it works
        </p>

        <p className="flex items-center gap-1 text-xs text-text-subtle">
          💳 Pay directly at the shop. No payment on app.
        </p>

        {isCoupon && (
          <p className="flex items-center gap-1 text-xs text-text-subtle">
            🔳 Show the QR to the merchant at billing
          </p>
        )}
      </div>

      {/* CTA / POST-ISSUANCE */}
      <div className="pt-2">
        {!isCoupon && (
          <p className="text-s text-text-subtle font-medium">
            Listing-only deal. Visit the shop directly.
          </p>
        )}

        {isCoupon && (
          <>
            {/* ISSUE CTA */}
            {!safeIssuedState.code && (
              <>
                <button
                  onClick={() => onIssue(id)}
                  disabled={safeIssuedState.loading}
                  className="w-full rounded-xl bg-primary hover:bg-primary-dark py-2.5 text-sm font-bold text-white disabled:opacity-60"
                >
                  {safeIssuedState.loading ? "Generating…" : cta}
                </button>
                <p className="mt-1 text-[11px] text-text-subtle text-center">
                  QR shown after clicking
                </p>
              </>
            )}

            {/* DRAWER (ACCORDION, NOT OVERLAY) */}
            <div
              className={`transition-[max-height,opacity] duration-300 ease-out ${
                safeIssuedState.code
                  ? "max-h-[420px] opacity-100"
                  : "max-h-0 opacity-0"
              } overflow-hidden`}
            >
              {safeIssuedState.code && (
                <div className="mt-4 flex flex-col items-center gap-3">
                  <QRCodeCanvas
                    size={110}
                    value={JSON.stringify({
                      merchantNameId: merchantKey,
                      campaignId: id,
                      couponCode: safeIssuedState.code,
                    })}
                  />

                  <p className="text-xs text-orange-600 font-medium text-center">
                    Show at billing to earn loyalty points
                  </p>

                  <div className="w-full rounded-lg bg-slate-50 dark:bg-white/5 p-2">
                    <p className="mb-1 text-[11px] uppercase tracking-wide text-text-subtle/70">
                      Conditions
                    </p>
                    <ul className="space-y-1 text-xs text-text-subtle">
                      {resolvedTerms.map((t, i) => (
                        <li key={i}>• {t}</li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() =>
                      shareCampaign({ headline, merchantName, lat, lng })
                    }
                    className="flex items-center gap-1 rounded-full border border-border-light dark:border-border-dark px-4 py-1.5 text-xs font-semibold text-text-subtle hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    🔗 Share
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </article>
  );
}
