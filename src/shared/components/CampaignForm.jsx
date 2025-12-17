// src/shared/components/CampaignFormisonForm.jsx
import React, { useEffect, useState } from "react";

const TERMS_REGEX = /^[a-zA-Z0-9\s\-,.\(\)]*$/;

export default function CampaignForm({
  headerText = "Create Campaign",
  activeCampaigns = [],
  onSubmit,
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [offerMode, setOfferMode] = useState("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState(10);
  const [minimumOrderValue, setMinimumOrderValue] = useState(200);

  const [originalPrice, setOriginalPrice] = useState("");
  const [offerPrice, setOfferPrice] = useState("");

  const [validUntilDate, setValidUntilDate] = useState("");
  const [terms, setTerms] = useState("");
  const [campaignType, setCampaignType] = useState("COUPON");

  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ open: false, ok: true, msg: "" });

  /* ---------------- DEFAULT DATE ---------------- */

  useEffect(() => {
    const end = new Date(Date.now() + 7 * 86400000)
      .toISOString()
      .slice(0, 10);
    setValidUntilDate(end);
  }, []);

  /* ---------------- DERIVED STATE ---------------- */

  const activeListings = activeCampaigns.filter(
    (c) => c.campaignType === "LISTING"
  );

  const activeCoupons = activeCampaigns.filter(
    (c) => c.campaignType === "COUPON"
  );

  /* ---------------- HELPERS ---------------- */

  const fail = (msg) =>
    setModal({ open: true, ok: false, msg });

  const success = (msg) =>
    setModal({ open: true, ok: true, msg });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setOfferMode("PERCENTAGE");
    setDiscountValue(10);
    setMinimumOrderValue(200);
    setOriginalPrice("");
    setOfferPrice("");
    setTerms("");
    setCampaignType("COUPON");
  };

  /* ---------------- SUBMIT ---------------- */

  const submit = async () => {
    if (!title || title.trim().length < 5 || title.length > 40)
      return fail("Title must be between 5 and 40 characters.");

    if (description.length > 200)
      return fail("Description cannot exceed 200 characters.");

    if (campaignType === "COUPON" && activeCoupons.length >= 3)
      return fail(
        "You already have 3 active coupon campaigns. Make one inactive first."
      );

    for (const line of terms.split("\n")) {
      if (!TERMS_REGEX.test(line.trim()))
        return fail("Terms contain unsupported characters.");
    }

    const mov = Number(minimumOrderValue);
    if (Number.isNaN(mov) || mov < 0)
      return fail("Minimum order value must be ≥ 0.");

    let offerType;
    let parameters = {};

    if (offerMode === "FLAT") {
      const d = Number(discountValue);
      if (d <= 0) return fail("Flat discount must be > 0.");
      offerType = "FLAT";
      parameters = { discount: d };
    }

    if (offerMode === "PERCENTAGE") {
      const d = Number(discountValue);
      if (d <= 0 || d > 100)
        return fail("Percentage must be between 1 and 100.");
      offerType = "PERCENTAGE";
      parameters = { discount: d };
    }

    if (offerMode === "FIXED") {
      const o = Number(originalPrice);
      const p = Number(offerPrice);
      if (o <= 0 || p <= 0 || p >= o)
        return fail("Offer price must be less than original price.");
      offerType = "FIXED";
      parameters = {
        discount: o - p,
        originalPrice: o,
        offerPrice: p,
      };
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      offerType,
      parameters,
      mov,
      validUntil: new Date(`${validUntilDate}T23:59:59`).toISOString(),
      termsConditions: terms
        .split("\n")
        .map((t) => t.trim())
        .filter(Boolean),
      campaignType,
    };

    setLoading(true);
    try {
      await onSubmit(payload);
      success("Campaign created successfully.");
      resetForm();
    } catch (e) {
      fail(e.message || "Failed to create campaign.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="flex justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">
          {headerText}
        </h2>

        {/* Campaign type */}
        <div className="mb-4">
          <div className="mb-1 text-xs font-semibold uppercase text-gray-500">
            Campaign type
          </div>
          <div className="flex gap-2">
            {["COUPON", "LISTING"].map((t) => (
              <button
                key={t}
                type="button"
                className={`flex-1 rounded-full px-3 py-1 text-xs border ${
                  campaignType === t
                    ? "bg-black text-white"
                    : "bg-white"
                }`}
                onClick={() => setCampaignType(t)}
              >
                {t}
              </button>
            ))}
          </div>

          {campaignType === "LISTING" && activeListings.length > 0 && (
            <div className="mt-2 rounded bg-amber-50 p-2 text-xs text-amber-800">
              Creating a new listing will deactivate:
              <ul className="list-disc pl-4">
                {activeListings.map((c) => (
                  <li key={c.id}>{c.title}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Title */}
        <label className="text-sm font-medium">Campaign title</label>
        <input
          className="mb-3 w-full rounded border p-2 text-sm"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Flat ₹100 off above ₹500"
        />

        {/* Description */}
        <label className="text-sm font-medium">
          Description (optional)
        </label>
        <textarea
          className="mb-3 w-full rounded border p-2 text-sm"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* Valid until */}
        <label className="text-sm font-medium">Valid until</label>
        <input
          type="date"
          className="mb-3 w-full rounded border p-2 text-sm"
          value={validUntilDate}
          onChange={(e) => setValidUntilDate(e.target.value)}
        />

        {/* Terms */}
        <label className="text-sm font-medium">
          Terms & Conditions
        </label>
        <textarea
          className="mb-4 w-full rounded border p-2 text-sm"
          rows={3}
          value={terms}
          onChange={(e) => setTerms(e.target.value)}
          placeholder="One condition per line"
        />

        <button
          disabled={loading}
          onClick={submit}
          className="w-full rounded-full bg-black py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Creating…" : "Create Campaign"}
        </button>
      </div>

      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded bg-white p-4">
            <div className="mb-2 font-semibold">
              {modal.ok ? "Success" : "Error"}
            </div>
            <div className="mb-3 text-sm">{modal.msg}</div>
            <button
              className="border px-3 py-1 text-xs"
              onClick={() => setModal({ ...modal, open: false })}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
