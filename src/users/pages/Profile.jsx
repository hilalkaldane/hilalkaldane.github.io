import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { customerApi } from "../services/api";
import { CacheKeys } from "../../shared/cacheKeys";

function loadAllIssuedCoupons() {
  try {
    const raw = localStorage.getItem(CacheKeys.ISSUED_COUPONS);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return [];

    const result = [];

    Object.entries(parsed).forEach(([merchantKey, campaigns]) => {
      Object.entries(campaigns || {}).forEach(([campaignId, c]) => {
        result.push({
          merchantKey,
          campaignId,
          couponCode: c.couponCode,
          campaignTitle: c.campaignTitle,
          createdAt: c.createdAt,
          merchantName: c.merchantName,
        });
      });
    });

    return result;
  } catch {
    return [];
  }
}

const GENDER_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "NOT_SPECIFIED", label: "Not Specified" },
];

const FAQS = [
  {
    q: "Do I need to pay on the app?",
    a: "No. You pay the merchant directly at the shop. The app does not collect any payment.",
  },
  {
    q: "How do I use a deal?",
    a: "Open a deal, get the QR/code, and show it at the shop before paying.",
  },
  {
    q: "Do I need to login?",
    a: "No login is required. Your activity is saved on this device.",
  },
  {
    q: "Can I use a deal more than once?",
    a: "Most deals are one-time use per device. This depends on the merchant’s offer.",
  },
  {
    q: "What if the shop refuses the deal?",
    a: "Deals are created by merchants. If there is any issue, please contact us at +91 8655190873",
  },
  {
    q: "Who runs this app?",
    a: "This app helps you discover nearby merchant deals. Merchants manage their own offers.",
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl bg-card-light dark:bg-card-dark p-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-sm font-medium text-text-main-light dark:text-text-main-dark">
          {q}
        </span>
        <span className="text-text-subtle text-sm">{open ? "–" : "+"}</span>
      </button>

      {open && <p className="mt-2 text-sm text-text-subtle">{a}</p>}
    </div>
  );
}

export default function Profile() {
  const [customer, setCustomer] = useState(null);
  const [name, setName] = useState("");
  const [gender, setGender] = useState("NOT_SPECIFIED");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [issuedCoupons, setIssuedCoupons] = useState([]);

  const [editingName, setEditingName] = useState(false);
  const [editingGender, setEditingGender] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await customerApi.getMe();
        setCustomer(res);
        setName(res?.name || "");
        setGender(res?.gender || "NOT_SPECIFIED");

        const allCoupons = loadAllIssuedCoupons()
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);

        setIssuedCoupons(allCoupons);
      } catch (e) {
        setError(e.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const dirty = useMemo(() => {
    if (!customer) return false;
    return name !== (customer.name || "") || gender !== (customer.gender || "");
  }, [customer, name, gender]);

  const handleUpdate = async () => {
    if (!dirty) return;
    setSaving(true);
    setError(null);
    setSuccessMessage("");
    try {
      const payload = {
        name: name.trim() || null,
        gender: gender || null,
      };
      const updated = await customerApi.updateMe(payload);
      setCustomer(updated);
      setSuccessMessage("Profile updated.");
      setEditingName(false);
      setEditingGender(false);
    } catch (e) {
      setError(e.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 pt-4 text-sm text-text-subtle">Loading profile…</div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-24 bg-background-light dark:bg-background-dark">
      {/* Profile Card */}
      <div className="rounded-2xl bg-card-light dark:bg-card-dark p-4">
        <div className="flex flex-col items-center gap-2">
          {/* Avatar */}
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background-light dark:bg-background-dark text-2xl">
            🙂
          </div>

          {/* Name */}
          <div className="flex items-center gap-2">
            {editingName ? (
              <input
                className="rounded-lg border border-border-light dark:border-border-dark bg-transparent px-3 py-1 text-sm text-text-main-light dark:text-text-main-dark"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            ) : (
              <div className="text-lg font-semibold text-text-main-light dark:text-text-main-dark">
                {name || "Guest"}
              </div>
            )}

            <button
              className="text-xs text-text-subtle"
              onClick={() => setEditingName((v) => !v)}
            >
              ✏️
            </button>
          </div>

          {/* Gender */}
          <div className="flex items-center gap-2 text-sm text-text-subtle">
            {editingGender ? (
              <select
                className="rounded-lg border border-border-light dark:border-border-dark bg-transparent px-2 py-1 text-xs text-text-main-light dark:text-text-main-dark"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                {GENDER_OPTIONS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            ) : (
              <span>
                {GENDER_OPTIONS.find((g) => g.value === gender)?.label}
              </span>
            )}

            <button
              className="text-xs text-text-subtle"
              onClick={() => setEditingGender((v) => !v)}
            >
              ✏️
            </button>
          </div>

          {dirty && (
            <button
              onClick={handleUpdate}
              disabled={saving}
              className="mt-2 rounded-full bg-text-main-light dark:bg-text-main-dark px-4 py-1.5 text-xs font-semibold text-white dark:text-background-dark disabled:opacity-60"
            >
              {saving ? "Updating…" : "Save"}
            </button>
          )}

          {error && <div className="mt-1 text-xs text-red-500">{error}</div>}
          {successMessage && (
            <div className="mt-1 text-xs text-green-500">{successMessage}</div>
          )}
        </div>
      </div>

      {/* Coupons */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-text-main-light dark:text-text-main-dark">
          Recent Coupons
        </h3>

        {issuedCoupons.length === 0 ? (
          <div className="mt-2 text-sm text-text-subtle">
            You haven’t issued any coupons yet.
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {issuedCoupons.map((c) => (
              <Link
                key={`${c.merchantKey}-${c.campaignId}`}
                to={`/merchant/${c.merchantKey}`}
                className="flex items-center justify-between rounded-xl bg-card-light dark:bg-card-dark p-3"
              >
                <div>
                  <div className="text-sm font-medium text-text-main-light dark:text-text-main-dark">
                    {c.campaignTitle}
                  </div>
                  <div className="text-xs text-text-subtle font-mono">
                    {c.merchantName}
                  </div>
                </div>

                <div className="text-xs text-text-subtle">
                  {new Date(c.createdAt).toLocaleDateString()}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* FAQs */}
      <div className="mt-8">
        <h3 className="text-sm font-semibold text-text-main-light dark:text-text-main-dark">
          FAQs
        </h3>

        <div className="mt-3 space-y-2">
          {FAQS.map((f) => (
            <FAQItem key={f.q} q={f.q} a={f.a} />
          ))}
        </div>
      </div>

      {/*Contact Us*/}
      <div className="mt-6 text-sm text-text-subtle">
        Need help? Call us at{" "}
        <a href="tel:+918655190873" className="underline">
          +91 8655190873
        </a>
      </div>

      {/* Preferences */}
      {false && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-text-main-light dark:text-text-main-dark">
            Preferences
          </h3>
          <div className="mt-2 rounded-xl bg-card-light dark:bg-card-dark p-3 text-sm text-text-subtle">
            Manage categories and notification preferences.
          </div>
        </div>
      )}
    </div>
  );
}
