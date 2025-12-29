import React, { useState, useMemo } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { buildOfferHeadline, buildCtaCopy } from "../services/campaignCopy";
import { formatDate } from "../../shared/utilities";

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
  const shouldDisplayMov = offerType != "FIXED";

  /* ---------- Offer copy ---------- */
  const headline = buildOfferHeadline({ offerType, discount });
  const cta = buildCtaCopy({ offerType, discount });

  /* ---------- Urgency ---------- */
  const hoursLeft = useMemo(() => {
    if (!validUntil) return null;
    const diff = new Date(validUntil).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60));
  }, [validUntil]);

  const buildMapsUrl = ({ lat, lng }) => {
    if (lat == null || lng == null) return null;
    return `https://maps.google.com/?q=${lat},${lng}`;
  };

  const isUrgent = hoursLeft !== null && hoursLeft <= 48;
  const shareCampaign = ({ headline, merchantName, lat, lng }) => {
    const mapsUrl = buildMapsUrl({ lat, lng });

    const lines = [
      `🔥 ${headline} at ${merchantName}`,
      " ",
      `Offer Name: ${title ? title : ""}`,
      " ",
      mapsUrl ? `📍 Location: ${mapsUrl}` : "",
      " ",
      "Issued via FaydaPoint https://www.faydapoint.com?utm_source=whatsapp&utm_medium=share",
    ].filter(Boolean);

    const text = lines.join("\n");
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;

    window.open(waUrl, "_blank");
  };

  const SYSTEM_TERMS = {
    FIXED_ORDER: [
      "Mention FaydaPoint before ordering",
      "Final bill already includes this deal",
      "Show QR at billing (for loyalty points)",
    ],

    MENU_NOTE: [
      "Mention FaydaPoint before ordering",
      "Free / discounted item applies only to listed menu items",
      "You may order other items as well",
      "Show QR at billing (for loyalty points)",
    ],

    BARGAINING: [
      "Mention FaydaPoint before bargaining",
      "Final price must include the deal",
      "Show QR at billing (for tracking & loyalty)",
    ],
  };
  const resolvedTerms = useMemo(() => {
    const terms = [];

    // Case 1: Non-food → bargaining
    if (category !== "food") {
      terms.push(...SYSTEM_TERMS.BARGAINING);
      return terms;
    }

    // Case 2: Food + menu-based (FIXED)
    if (offerType === "FIXED") {
      terms.push(...SYSTEM_TERMS.MENU_NOTE);
      return terms;
    }

    // Case 3: Food + flat / percentage
    if (offerType === "FLAT" || offerType === "PERCENTAGE") {
      terms.push(...SYSTEM_TERMS.FIXED_ORDER);
      return terms;
    }

    return terms;
  }, [category, offerType]);

  return (
    <article className="relative rounded-xl bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark p-4 shadow-soft space-y-3">
      {/* URGENCY BADGE */}
      {isUrgent && (
        <div className="absolute -top-2 right-3 rounded-full bg-red-600 px-3 py-0.5 text-[11px] font-bold text-white animate-pulse">
          Ends in {hoursLeft}h
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
          <span
            className="inline-flex items-center gap-1 rounded-full
  bg-orange-50 text-orange-700 px-3 py-1 text-xs font-semibold"
          >
            Min bill ₹{mov}
          </span>
        )}
        {validUntil && (
          <span>
            Valid till{" "}
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

      <div className="pt-2 border-t border-border-light dark:border-border-dark space-y-1">
        <p className="text-[11px] uppercase tracking-wide text-text-subtle/70">
          How it works
        </p>

        <p className="flex items-center gap-1 text-xs text-text-subtle">
          <span className="material-symbols-outlined text-[14px]">
            payments
          </span>
          Pay directly at the shop. No payment on app.
        </p>

        <p className="flex items-center gap-1 text-xs text-text-subtle">
          <span className="material-symbols-outlined text-[14px]">qr_code</span>
          Show the QR to the merchant at billing
        </p>
      </div>

      {/* CTA / POST-ISSUANCE */}
      <div
        className={`pt-2 relative overflow-hidden transition-[min-height] duration-300
    ${safeIssuedState.code ? "min-h-[260px]" : "min-h-[52px]"}
  `}
      >
        {" "}
        {/* NON-COUPON */}
        {!isCoupon && (
          <p className="text-s text-text-subtle font-medium">
            Listing-only deal. Visit the shop directly.
          </p>
        )}
        {/* COUPON */}
        {isCoupon && (
          <>
            {/* ISSUE CTA */}
            <div
              className={`transition-all duration-300 ${
                safeIssuedState.code
                  ? "opacity-0 pointer-events-none"
                  : "opacity-100"
              }`}
            >
              <button
                onClick={() => onIssue(id)}
                disabled={safeIssuedState.loading}
                className="w-full rounded-lg bg-primary hover:bg-primary-dark py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {safeIssuedState.loading ? "Generating…" : cta}
              </button>
            </div>

            {!safeIssuedState.code && (
              <p className="mt-1 text-[11px] text-text-subtle text-center">
                QR shown after clicking
              </p>
            )}

            {/* QR DRAWER */}
            <div
              className={`absolute inset-0
  transition-transform duration-300 ease-out
  ${safeIssuedState.code ? "translate-y-0" : "translate-y-full"}
`}
            >
              {safeIssuedState.code && (
                <div
                  className="flex flex-col items-center justify-start
      pt-4 pb-3 px-2
      h-full "
                >
                  {/* QR */}
                  <QRCodeCanvas
                    size={110}
                    value={JSON.stringify({
                      merchantNameId: merchantKey,
                      campaignId: id,
                      couponCode: safeIssuedState.code,
                    })}
                  />

                  {/* Instruction */}
                  <p className="mt-2 text-xs text-orange-600 font-medium text-center">
                    Show at billing to earn loyalty points
                  </p>

                  {/* TERMS — NOW VISIBLE */}
                  <div className="mt-3 w-full rounded-lg bg-slate-50 dark:bg-white/5 p-2">
                    <p className="mb-1 text-[11px] uppercase tracking-wide text-text-subtle/70">
                      Conditions
                    </p>
                    <ul className="space-y-1 text-xs text-text-subtle text-left">
                      {resolvedTerms.map((t, i) => (
                        <li key={i}>• {t}</li>
                      ))}
                    </ul>
                  </div>

                  {/* ACTION */}
                  <button
                    onClick={() =>
                      shareCampaign({ headline, title, merchantName, lat, lng })
                    }
                    className="mt-3 flex items-center gap-1 rounded-full
        border border-border-light dark:border-border-dark
        px-4 py-1.5 text-xs font-semibold
        text-text-subtle hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      share
                    </span>
                    Share
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
