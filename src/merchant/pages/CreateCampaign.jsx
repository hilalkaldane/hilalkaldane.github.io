import React, { useState, useEffect } from "react";
import { merchantProtectedApi } from "../services/merchantProtectedApi";

export default function CreateCampaign() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // 1) FLAT -> Flat X on min Y
  // 2) PERCENTAGE  -> X% on min Y
  // 3) MENU        -> direct menu offer (original vs offer price)
  const [offerMode, setOfferMode] = useState("PERCENTAGE");

  // X in 1 & 2
  const [discountValue, setDiscountValue] = useState(10);
  // Y (min spend)
  const [minimumOrderValue, setMinimumOrderValue] = useState(200);

  // For MENU offers
  const [originalPrice, setOriginalPrice] = useState("");
  const [offerPrice, setOfferPrice] = useState("");

  const [validUntilDate, setValidUntilDate] = useState("");
  const [terms, setTerms] = useState("");

  const [campaignType, setCampaignType] = useState("COUPON"); // COUPON | LISTING

  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(true);
  const [modalMessage, setModalMessage] = useState("");

  useEffect(() => {
    const end = new Date(Date.now() + 7 * 24 * 3600 * 1000)
      .toISOString()
      .slice(0, 10);
    setValidUntilDate(end);
  }, []);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setOfferMode("PERCENTAGE");
    setDiscountValue(10);
    setMinimumOrderValue(200);
    setOriginalPrice("");
    setOfferPrice("");
    const end = new Date(Date.now() + 7 * 24 * 3600 * 1000)
      .toISOString()
      .slice(0, 10);
    setValidUntilDate(end);
    setTerms("");
    setCampaignType("COUPON");
    setCreated(null);
  };

  const submit = async () => {
    if (!title || title.trim().length < 5) {
      setModalSuccess(false);
      setModalMessage("Title must be at least 5 characters.");
      setModalOpen(true);
      return;
    }

    if (!validUntilDate) {
      setModalSuccess(false);
      setModalMessage("Please select a valid-until date.");
      setModalOpen(true);
      return;
    }

    const mov = Number(minimumOrderValue);
    if (Number.isNaN(mov) || mov < 0) {
      setModalSuccess(false);
      setModalMessage("Minimum spend must be ≥ 0.");
      setModalOpen(true);
      return;
    }

    let offerType; // backend OfferType enum
    let parameters = {};

    if (offerMode === "FLAT") {
      const discountNumber = Number(discountValue);
      if (Number.isNaN(discountNumber) || discountNumber <= 0) {
        setModalSuccess(false);
        setModalMessage("Flat discount must be > 0.");
        setModalOpen(true);
        return;
      }
      offerType = "FIXED";
      parameters = { discount: discountNumber };
    } else if (offerMode === "PERCENTAGE") {
      const percentNumber = Number(discountValue);
      if (
        Number.isNaN(percentNumber) ||
        percentNumber <= 0 ||
        percentNumber > 100
      ) {
        setModalSuccess(false);
        setModalMessage("Percentage must be between 1 and 100.");
        setModalOpen(true);
        return;
      }
      offerType = "PERCENTAGE";
      parameters = { discount: percentNumber };
    } else if (offerMode === "MENU") {
      const orig = Number(originalPrice);
      const offer = Number(offerPrice);
      if (Number.isNaN(orig) || Number.isNaN(offer) || orig <= 0 || offer <= 0) {
        setModalSuccess(false);
        setModalMessage("Original and offer price must be > 0.");
        setModalOpen(true);
        return;
      }
      if (offer >= orig) {
        setModalSuccess(false);
        setModalMessage("Offer price must be less than original price.");
        setModalOpen(true);
        return;
      }
      const discount = orig - offer;
      offerType = "FIXED";
      parameters = {
        discount,
        originalPrice: orig,
        offerPrice: offer,
      };
    } else {
      setModalSuccess(false);
      setModalMessage("Invalid offer type.");
      setModalOpen(true);
      return;
    }

    const validUntilIso = new Date(
      `${validUntilDate}T23:59:59`
    ).toISOString();

    const termsArray = terms
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      title: title.trim(),
      description: description?.trim() || "",
      offerType,                 // PERCENTAGE | FIXED
      parameters,                // must contain "discount"
      mov: mov,    // correct field for CreateCampaignRequest
      validUntil: validUntilIso,
      termsConditions: termsArray,
      campaignType,              // COUPON | LISTING
    };

    setLoading(true);
    try {
      const res = await merchantProtectedApi.createCampaign(payload);
      setCreated(res);
      setModalSuccess(true);
      setModalMessage("Campaign created successfully.");
      setModalOpen(true);
      // clear fields only on success
      resetForm();
    } catch (e) {
      console.error(e);
      setModalSuccess(false);
      setModalMessage(e.message || "Failed to create campaign.");
      setModalOpen(true);
      // do NOT clear fields
    } finally {
      setLoading(false);
    }
  };

  const offerModeButtonClasses = (mode) =>
    [
      "flex-1 flex items-center justify-center gap-1 rounded-full border px-3 py-2 text-xs font-medium transition",
      offerMode === mode
        ? "bg-[#131118] text-white border-[#131118]"
        : "bg-white text-gray-700 border-gray-200",
    ].join(" ");

  const campaignTypeButtonClasses = (type) =>
    [
      "flex-1 rounded-full px-3 py-1 text-xs font-medium border transition",
      campaignType === type
        ? "bg-slate-900 text-white border-slate-900"
        : "bg-white text-gray-700 border-gray-200",
    ].join(" ");

  const renderOfferFields = () => {
    if (offerMode === "FLAT") {
      return (
        <>
          <label className="mb-2 block text-sm font-medium">
            Flat discount (₹ X off)
          </label>
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">
              ₹
            </span>
            <input
              type="number"
              className="w-full rounded border p-2"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              min="0"
              step="1"
            />
          </div>

          <label className="mb-2 block text-sm font-medium">
            Minimum spend (₹ Y)
          </label>
          <input
            type="number"
            className="mb-3 w-full rounded border p-2"
            value={minimumOrderValue}
            onChange={(e) => setMinimumOrderValue(e.target.value)}
            min="0"
            step="1"
          />
        </>
      );
    }

    if (offerMode === "PERCENTAGE") {
      return (
        <>
          <label className="mb-2 block text-sm font-medium">
            Discount percentage (X%)
          </label>
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">
              %
            </span>
            <input
              type="number"
              className="w-full rounded border p-2"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              min="1"
              max="100"
              step="1"
            />
          </div>

          <label className="mb-2 block text-sm font-medium">
            Minimum spend (₹ Y)
          </label>
          <input
            type="number"
            className="mb-3 w-full rounded border p-2"
            value={minimumOrderValue}
            onChange={(e) => setMinimumOrderValue(e.target.value)}
            min="0"
            step="1"
          />
        </>
      );
    }

    // MENU mode
    return (
      <>
        <label className="mb-2 block text-sm font-medium">
          Original price (without coupon)
        </label>
        <div className="mb-3 flex items-center gap-2">
          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">
            ₹
          </span>
          <input
            type="number"
            className="w-full rounded border p-2"
            value={originalPrice}
            onChange={(e) => setOriginalPrice(e.target.value)}
            min="0"
            step="1"
          />
        </div>

        <label className="mb-2 block text-sm font-medium">
          Offer price (with coupon)
        </label>
        <div className="mb-3 flex items-center gap-2">
          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">
            ₹
          </span>
          <input
            type="number"
            className="w-full rounded border p-2"
            value={offerPrice}
            onChange={(e) => setOfferPrice(e.target.value)}
            min="0"
            step="1"
          />
        </div>

        <div className="mb-2 text-xs text-gray-600">
          Customers will see both prices: original and offer price. Backend
          still treats this as a flat discount on the bill.
        </div>
      </>
    );
  };

  return (
    <div className="flex justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          Create Campaign
        </h2>

        {/* Campaign type pills */}
        <div className="mb-4">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Campaign type
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className={campaignTypeButtonClasses("COUPON")}
              onClick={() => setCampaignType("COUPON")}
            >
              🎟 Coupon
            </button>
            <button
              type="button"
              className={campaignTypeButtonClasses("LISTING")}
              onClick={() => setCampaignType("LISTING")}
            >
              📌 Listing only
            </button>
          </div>
        </div>

        {/* Title */}
        <label className="mb-1 block text-sm font-medium text-gray-800">
          Campaign title
        </label>
        <input
          className="mb-3 w-full rounded-lg border border-gray-200 p-2 text-sm focus:border-gray-700 focus:outline-none"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Flat ₹100 off on orders above ₹500"
        />

        {/* Description */}
        <label className="mb-1 block text-sm font-medium text-gray-800">
          Description <span className="text-xs text-gray-400">(optional)</span>
        </label>
        <textarea
          className="mb-4 w-full rounded-lg border border-gray-200 p-2 text-sm focus:border-gray-700 focus:outline-none"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description shown below the title."
        />

        {/* Offer mode fancy toggle */}
        <div className="mb-3">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Offer type
          </div>
          <div className="mb-3 flex gap-2 text-xs">
            <button
              type="button"
              className={offerModeButtonClasses("FLAT")}
              onClick={() => setOfferMode("FLAT")}
            >
              <span>₹</span>
              <span>Flat amount</span>
            </button>
            <button
              type="button"
              className={offerModeButtonClasses("PERCENTAGE")}
              onClick={() => setOfferMode("PERCENTAGE")}
            >
              <span>%</span>
              <span>Percentage</span>
            </button>
            <button
              type="button"
              className={offerModeButtonClasses("MENU")}
              onClick={() => setOfferMode("MENU")}
            >
              <span>🍽</span>
              <span>Menu price</span>
            </button>
          </div>
        </div>

        {/* Offer fields */}
        {renderOfferFields()}

        {/* Valid until date */}
        <div className="mb-3">
          <label className="mb-1 block text-sm font-medium text-gray-800">
            Valid until
          </label>
          <input
            type="date"
            value={validUntilDate}
            onChange={(e) => setValidUntilDate(e.target.value)}
            className="w-full rounded-lg border border-gray-200 p-2 text-sm focus:border-gray-700 focus:outline-none"
          />
          <div className="mt-1 text-xs text-gray-500">
            Coupon will be valid until end of this day.
          </div>
        </div>

        {/* Terms & conditions */}
        <label className="mb-1 block text-sm font-medium text-gray-800">
          Terms &amp; conditions
          <span className="text-xs text-gray-400"> (one per line)</span>
        </label>
        <textarea
          className="mb-4 w-full rounded-lg border border-gray-200 p-2 text-sm focus:border-gray-700 focus:outline-none"
          rows={3}
          value={terms}
          onChange={(e) => setTerms(e.target.value)}
          placeholder={"Valid once per customer\nShow coupon before billing"}
        />

        <button
          onClick={submit}
          className="w-full rounded-full bg-black py-2 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Creating…" : "Create Campaign"}
        </button>

        {created && (
          <div className="mt-3 rounded-lg border border-green-100 bg-green-50 p-3 text-xs text-gray-800">
            <div className="font-semibold">Campaign created</div>
            <div>ID: {created.id}</div>
          </div>
        )}
      </div>

      {/* Result modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-lg">
            <div className="mb-2 flex items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                  modalSuccess
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {modalSuccess ? "✓" : "!"}
              </span>
              <div className="text-sm font-semibold text-gray-900">
                {modalSuccess ? "Success" : "Something went wrong"}
              </div>
            </div>
            <div className="mb-4 text-sm text-gray-700">{modalMessage}</div>
            <div className="flex justify-end">
              <button
                type="button"
                className="rounded-full border border-gray-300 px-4 py-1 text-xs font-medium text-gray-800 hover:bg-gray-50"
                onClick={() => setModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
