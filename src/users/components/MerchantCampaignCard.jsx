import React, { useState, useMemo } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { buildOfferHeadline, buildCtaCopy } from "../services/campaignCopy";

export default function MerchantCampaignCard({
  campaign,
  issuedState,
  onIssue,
  merchantKey,
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
  } = campaign;

  const isCoupon = campaignType === "COUPON";
  const [showTerms, setShowTerms] = useState(false);

  const safeIssuedState = issuedState ?? {};

  /* ---------- Offer copy ---------- */
  const headline = buildOfferHeadline({ offerType, discount });
  const cta = buildCtaCopy({ offerType, discount });

  /* ---------- Urgency ---------- */
  const hoursLeft = useMemo(() => {
    if (!validUntil) return null;
    const diff = new Date(validUntil).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60));
  }, [validUntil]);

  const isUrgent = hoursLeft !== null && hoursLeft <= 48;

  return (
    <article className="relative rounded-2xl bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark p-4 shadow-soft space-y-3">
      {/* URGENCY BADGE */}
      {isUrgent && (
        <div className="absolute -top-2 right-3 rounded-full bg-red-600 px-3 py-0.5 text-[11px] font-bold text-white animate-pulse">
          Ends in {hoursLeft}h
        </div>
      )}

      {/* PRIMARY HOOK */}
      <div className="text-primary text-xl font-black leading-tight">
        {headline}
      </div>

      {/* TITLE + DESCRIPTION */}
      <div className="space-y-0.5">
        <h3 className="text-[15px] font-semibold leading-snug">{title}</h3>
        {description && (
          <p className="text-sm text-text-subtle leading-snug line-clamp-2">
            {description}
          </p>
        )}
      </div>

      {/* META */}
      <div className="flex items-center gap-3 text-xs text-text-subtle">
        {mov > 0 && (
          <span className="font-semibold text-orange-600">Min bill ₹{mov}</span>
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
      {termsConditions.length > 0 && (
        <div>
          <button
            onClick={() => setShowTerms((v) => !v)}
            className="text-xs font-semibold text-text-subtle underline"
          >
            {showTerms ? "Hide terms" : "View terms"}
          </button>

          {showTerms && (
            <ul className="mt-2 space-y-1">
              {termsConditions.map((t, i) => (
                <li key={i} className="text-xs text-text-subtle">
                  • {t}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* CTA / POST-ISSUANCE */}
      <div
        className={`pt-2 relative overflow-hidden transition-[min-height] duration-300
    ${safeIssuedState.code ? "min-h-[180px]" : "min-h-[52px]"}
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
                className="w-full rounded-full bg-primary hover:bg-primary-dark py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {safeIssuedState.loading ? "Generating…" : cta}
              </button>
            </div>

            {/* QR DRAWER */}
            <div
              className={`absolute inset-0 flex flex-col items-center justify-center gap-2
          transition-transform duration-300 ease-out
          ${safeIssuedState.code ? "translate-y-0" : "translate-y-full"}
        `}
            >
              {safeIssuedState.code && (
                <>
                  <QRCodeCanvas
                    size={110}
                    value={JSON.stringify({
                      merchantNameId: merchantKey,
                      campaignId: id,
                      couponCode: safeIssuedState.code,
                    })}
                  />
                  <p className="text-xs text-orange-600 text-center font-medium">
                    Coupon unlocked 🎉
                    <br />
                    Show before billing
                  </p>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </article>
  );
}
