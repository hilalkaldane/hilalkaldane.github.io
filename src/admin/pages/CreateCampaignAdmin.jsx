import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { adminProtectedApi } from "../services/adminProtectedApi";
import { adminLocalStorage } from "../services/adminDevice";
import { redirectToAdminLogin } from "../services/adminProtectedApi";

const TERMS_REGEX = /^[a-zA-Z0-9\s\-,.\(\)]*$/;

export default function CreateCampaignAdmin() {
    const adminToken = adminLocalStorage.getItem("adminAccessToken");
    if (!adminToken) redirectToAdminLogin();
  /* ---------------- MERCHANT ---------------- */

  const { state } = useLocation();
  const navigate = useNavigate();

  const merchantNameId = state?.merchantNameId;

  /* ---------------- GUARD ---------------- */

  useEffect(() => {
    if (!merchantNameId) {
      navigate("/admin/campaigns");
    }
  }, [merchantNameId, navigate]);

  /* ---------------- FORM STATE ---------------- */

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

  const [activeCampaigns, setActiveCampaigns] = useState([]);

  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(true);
  const [modalMessage, setModalMessage] = useState("");

  /* ---------------- DEFAULT DATE ---------------- */

  useEffect(() => {
    const end = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    setValidUntilDate(end);
  }, []);


  /* ---------------- LOAD ACTIVE CAMPAIGNS ---------------- */

  useEffect(() => {
    if (!merchantNameId) {
      setActiveCampaigns([]);
      return;
    }

    adminProtectedApi
      .getActiveCampaignsForMerchant(merchantNameId)
      .then((res) => setActiveCampaigns(res || []))
      .catch(() => setActiveCampaigns([]));
  }, [merchantNameId]);

  const activeListings = activeCampaigns.filter(
    (c) => c.campaignType === "LISTING"
  );

  const activeCoupons = activeCampaigns.filter(
    (c) => c.campaignType === "COUPON"
  );

  /* ---------------- HELPERS ---------------- */

  const showError = (msg) => {
    setModalSuccess(false);
    setModalMessage(msg);
    setModalOpen(true);
  };

  const showSuccess = (msg) => {
    setModalSuccess(true);
    setModalMessage(msg);
    setModalOpen(true);
  };

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
    setCreated(null);
  };

  /* ---------------- SUBMIT ---------------- */

  const submit = async () => {
    if (!merchantNameId) {
      return showError("Please select a merchant.");
    }

    if (!title || title.trim().length < 5 || title.length > 40) {
      return showError("Title must be between 5 and 40 characters.");
    }

    if (description.length > 200) {
      return showError("Description cannot exceed 200 characters.");
    }

    if (campaignType === "COUPON" && activeCoupons.length >= 3) {
      return showError("Merchant already has 3 active coupon campaigns.");
    }

    for (const line of terms.split("\n")) {
      if (!TERMS_REGEX.test(line.trim())) {
        return showError("Terms contain unsupported characters.");
      }
    }

    const mov = Number(minimumOrderValue);
    if (Number.isNaN(mov) || mov < 0) {
      return showError("Minimum spend must be ≥ 0.");
    }

    let offerType;
    let parameters = {};

    if (offerMode === "FLAT") {
      const d = Number(discountValue);
      if (d <= 0) return showError("Flat discount must be > 0.");
      offerType = "FLAT";
      parameters = { discount: d };
    }

    if (offerMode === "PERCENTAGE") {
      const d = Number(discountValue);
      if (d <= 0 || d > 100)
        return showError("Percentage must be between 1 and 100.");
      offerType = "PERCENTAGE";
      parameters = { discount: d };
    }

    if (offerMode === "FIXED") {
      const o = Number(originalPrice);
      const p = Number(offerPrice);
      if (o <= 0 || p <= 0 || p >= o)
        return showError("Offer price must be less than original price.");
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
      const res = await adminProtectedApi.createCampaignForMerchant(
        merchantNameId,
        payload
      );
      setCreated(res);
      showSuccess("Campaign created successfully.");
      resetForm();
    } catch (e) {
      showError(e.message || "Failed to create campaign.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI HELPERS ---------------- */

  const offerModeButtonClasses = (mode) =>
    [
      "flex-1 rounded-full border px-3 py-2 text-xs font-medium",
      offerMode === mode
        ? "bg-black text-white border-black"
        : "bg-white text-gray-700 border-gray-200",
    ].join(" ");

  const campaignTypeButtonClasses = (type) =>
    [
      "flex-1 rounded-full px-3 py-1 text-xs font-medium border",
      campaignType === type
        ? "bg-black text-white border-black"
        : "bg-white text-gray-700 border-gray-200",
    ].join(" ");

  const renderOfferFields = () => {
    if (offerMode === "FLAT" || offerMode === "PERCENTAGE") {
      return (
        <>
          <label className="text-sm font-medium">Discount value</label>
          <input
            type="number"
            className="mb-2 w-full rounded border p-2"
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
          />

          <label className="text-sm font-medium">Minimum order value</label>
          <input
            type="number"
            className="mb-3 w-full rounded border p-2"
            value={minimumOrderValue}
            onChange={(e) => setMinimumOrderValue(e.target.value)}
          />
        </>
      );
    }

    return (
      <>
        <label className="text-sm font-medium">Original price</label>
        <input
          type="number"
          className="mb-2 w-full rounded border p-2"
          value={originalPrice}
          onChange={(e) => setOriginalPrice(e.target.value)}
        />

        <label className="text-sm font-medium">Offer price</label>
        <input
          type="number"
          className="mb-3 w-full rounded border p-2"
          value={offerPrice}
          onChange={(e) => setOfferPrice(e.target.value)}
        />
      </>
    );
  };

  /* ---------------- JSX ---------------- */

  return (
    <div className="flex justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Create Campaign (Admin) for Merchant </h2><span className="text-blue-700 center">{merchantNameId}</span>

        {/* WARNINGS */}
        {campaignType === "COUPON" && activeCoupons.length >= 3 && (
          <div className="mb-3 rounded bg-red-50 p-2 text-xs text-red-700">
            Merchant already has 3 active coupon campaigns.
          </div>
        )}

        {campaignType === "LISTING" && activeListings.length >= 1 && (
          <div className="mb-3 rounded bg-amber-50 p-2 text-xs text-amber-800">
            Creating a new listing will deactivate:
            <ul className="list-disc pl-4">
              {activeListings.map((c) => (
                <li key={c.id}>{c.title}</li>
              ))}
            </ul>
          </div>
        )}

        {/* CAMPAIGN TYPE */}
        <div className="mb-3 flex gap-2">
          <button
            className={campaignTypeButtonClasses("COUPON")}
            onClick={() => setCampaignType("COUPON")}
          >
            Coupon
          </button>
          <button
            className={campaignTypeButtonClasses("LISTING")}
            onClick={() => setCampaignType("LISTING")}
          >
            Listing
          </button>
        </div>

        {/* TITLE */}
        <label className="text-sm font-medium">Campaign title</label>
        <input
          className="mb-3 w-full rounded border p-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* DESCRIPTION */}
        <label className="text-sm font-medium">Description</label>
        <textarea
          className="mb-3 w-full rounded border p-2"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* OFFER MODE */}
        <div className="mb-3 flex gap-2">
          <button
            className={offerModeButtonClasses("FLAT")}
            onClick={() => setOfferMode("FLAT")}
          >
            Flat
          </button>
          <button
            className={offerModeButtonClasses("PERCENTAGE")}
            onClick={() => setOfferMode("PERCENTAGE")}
          >
            %
          </button>
          <button
            className={offerModeButtonClasses("FIXED")}
            onClick={() => setOfferMode("FIXED")}
          >
            Fixed
          </button>
        </div>

        {renderOfferFields()}

        {/* VALID UNTIL */}
        <label className="text-sm font-medium">Valid until</label>
        <input
          type="date"
          className="mb-3 w-full rounded border p-2"
          value={validUntilDate}
          onChange={(e) => setValidUntilDate(e.target.value)}
        />

        {/* TERMS */}
        <label className="text-sm font-medium">Terms</label>
        <textarea
          className="mb-4 w-full rounded border p-2"
          rows={3}
          value={terms}
          onChange={(e) => setTerms(e.target.value)}
        />

        <button
          onClick={submit}
          disabled={loading}
          className="w-full rounded bg-black py-2 text-white"
        >
          {loading ? "Creating…" : "Create Campaign"}
        </button>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-4 rounded w-80">
            <div className="font-semibold mb-2">
              {modalSuccess ? "Success" : "Error"}
            </div>
            <div className="mb-3 text-sm">{modalMessage}</div>
            <button
              className="border px-3 py-1 text-xs"
              onClick={() => setModalOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
