import React, { useEffect, useState, useMemo } from "react";
import { MERCHANTS } from "../../data/sampleData";
import { Link } from "react-router-dom";
import { customerApi } from "../services/api";

const GENDER_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "NOT_SPECIFIED", label: "Not Specified" },
];

export default function Profile() {
  const [customer, setCustomer] = useState(null);
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

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
        setGender(res?.gender || "");
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
      setSuccessMessage("Profile updated successfully.");
      setEditingName(false);
      setEditingGender(false);
    } catch (e) {
      setError(e.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading profile…</div>;
  }

  return (
    <div className="px-4 pb-24 pt-4">
      <div className="flex flex-col items-center gap-2">
        {/* Avatar */}
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100 text-3xl">
          😀
        </div>

        {/* NAME */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[11px] uppercase tracking-wide text-gray-400">
            Name
          </span>

          <div className="flex items-center gap-2">
            {editingName ? (
              <input
                className="rounded border px-2 py-1 text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            ) : (
              <div className="text-lg font-semibold">
                {name || "Guest"}
              </div>
            )}

            <button
              type="button"
              className="text-xs text-gray-500 hover:text-gray-700"
              onClick={() => setEditingName((v) => !v)}
            >
              ✏️
            </button>
          </div>
        </div>

        {/* GENDER */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[11px] uppercase tracking-wide text-gray-400">
            Gender
          </span>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            {editingGender ? (
              <select
                className="rounded border px-2 py-1 text-xs"
                value={gender || ""}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">Select gender</option>
                {GENDER_OPTIONS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            ) : (
              <span>
                {gender
                  ? GENDER_OPTIONS.find((g) => g.value === gender)?.label
                  : "Not specified"}
              </span>
            )}

            <button
              type="button"
              className="text-xs text-gray-500 hover:text-gray-700"
              onClick={() => setEditingGender((v) => !v)}
            >
              ✏️
            </button>
          </div>
        </div>

        {/* STATUS */}
        {error && (
          <div className="mt-2 text-xs text-red-600">{error}</div>
        )}

        {successMessage && (
          <div className="mt-1 text-xs text-green-600">
            {successMessage}
          </div>
        )}

        {/* UPDATE BUTTON */}
        {dirty && (
          <button
            type="button"
            onClick={handleUpdate}
            disabled={saving}
            className="mt-2 rounded-full bg-black px-4 py-1 text-xs font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Updating…" : "Update profile"}
          </button>
        )}
      </div>

      {/* Coupons – unchanged */}
      <div className="mt-6">
        <h3 className="text-md font-semibold">Coupons</h3>
        <div className="mt-3 space-y-2">
          {MERCHANTS.slice(0, 2).map((m) => (
            <Link
              to={`/merchant/${m.id}`}
              key={m.id}
              className="flex items-center justify-between rounded-lg border bg-white p-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-md bg-gray-100" />
                <div>
                  <div className="font-medium">{m.name}</div>
                  <div className="text-xs text-gray-500">
                    {m.distanceKm} km
                  </div>
                </div>
              </div>
              <div>›</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Preferences – unchanged */}
      <div className="mt-6">
        <h3 className="text-md font-semibold">Preferences</h3>
        <div className="mt-2 rounded-lg border bg-white p-3">
          <div className="text-sm">
            Manage categories, notification preferences, and coupon alerts.
          </div>
        </div>
      </div>
    </div>
  );
}
