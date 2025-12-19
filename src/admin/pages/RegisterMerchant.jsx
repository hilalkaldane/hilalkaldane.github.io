// src/client/pages/RegisterMerchant.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  adminProtectedApi,
  redirectToAdminLogin,
} from "../services/adminProtectedApi";
import { adminLocalStorage } from "../services/adminDevice";

export default function RegisterMerchant({ metadata }) {
  const adminToken = adminLocalStorage.getItem("adminAccessToken");
  if (!adminToken) redirectToAdminLogin();

  const categories = metadata?.categories ?? [];
  const subcategories = metadata?.subcategories ?? [];
  const offerings = metadata?.offerings ?? [];

  const [credentials, setCredentials] = useState(null);

  /* ---------------- FORM STATE ---------------- */

  const [form, setForm] = useState({
    name: "",
    merchantNameId: "",
    ownerName: "",
    ownerUsername: "",
    phone: "",
    address: "",
    location: ["", ""],
    categoryId: "",
    subcategoryId: "",
    offeringIds: [],
    banner: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  /* ---------------- DERIVED ---------------- */

  const filteredSubcategories = useMemo(
    () => subcategories.filter((s) => s.categoryCode === form.categoryId),
    [subcategories, form.categoryId]
  );

  const filteredOfferings = useMemo(
    () => offerings.filter((o) => o.categoryCode === form.categoryId),
    [offerings, form.categoryId]
  );

  /* ---------------- LOCATION ---------------- */

  function pickDeviceLocation() {
    if (!navigator.geolocation) {
      setErrors((e) => ({ ...e, location: "Geolocation not supported" }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          location: [
            Number(pos.coords.latitude.toFixed(6)),
            Number(pos.coords.longitude.toFixed(6)),
          ],
        }));
        setErrors((e) => ({ ...e, location: null }));
      },
      () =>
        setErrors((e) => ({
          ...e,
          location: "Location permission denied",
        }))
    );
  }

  /* ---------------- VALIDATION ---------------- */

  useEffect(() => {
    const e = {};

    if (!/^[A-Za-z ,\-'.]{2,60}$/.test(form.name))
      e.name = "2–60 chars. Letters and , - ' . only";

    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(form.merchantNameId))
      e.merchantNameId = "3–15 chars, lowercase, '-' allowed";

    if (form.merchantNameId.length < 3 || form.merchantNameId.length > 15)
      e.merchantNameId = "Merchant username must be 3–15 characters";

    if (!/^[A-Za-z ]{3,20}$/.test(form.ownerName))
      e.ownerName = "3–20 chars. Letters only";

    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(form.ownerUsername))
      e.ownerUsername = "3–15 chars, lowercase, '-' allowed";

    if (
      form.ownerUsername.length < 3 ||
      form.ownerUsername.length > 15
    )
      e.ownerUsername = "Owner username must be 3–15 characters";

    if (!/^[0-9]{10}$/.test(form.phone))
      e.phone = "10-digit Indian number required";

    if (!form.location[0] || !form.location[1])
      e.location = "Precise location required";

    if (!form.categoryId) e.categoryId = "Category is required";
    if (!form.subcategoryId)
      e.subcategoryId = "Exactly one subcategory required";

    if (form.offeringIds.length > 5)
      e.offeringIds = "Maximum 5 offerings allowed";

    if (!form.banner) e.banner = "Banner is required";

    setErrors(e);
  }, [form]);

  /* ---------------- HELPERS ---------------- */

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleOffering(code) {
    setForm((f) => {
      if (f.offeringIds.includes(code)) {
        return {
          ...f,
          offeringIds: f.offeringIds.filter((o) => o !== code),
        };
      }
      if (f.offeringIds.length >= 5) return f;
      return { ...f, offeringIds: [...f.offeringIds, code] };
    });
  }

  /* ---------------- SUBMIT ---------------- */

  async function submit(e) {
    e.preventDefault();
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      const res = await adminProtectedApi.createMerchant({
        merchantNameId: form.merchantNameId,
        name: form.name,
        ownerName: form.ownerName,
        ownerUsername: form.ownerUsername,
        phone: form.phone,
        address: form.address,
        latitude: Number(form.location[0]),
        longitude: Number(form.location[1]),
        categoryId: form.categoryId,
        subcategoryId: form.subcategoryId,
        offeringsId: form.offeringIds,
        banner: form.banner,
      });

      setCredentials({
        username: res.username,
        password: res.password,
      });

      setSuccess("Merchant registered successfully");
    } finally {
      setLoading(false);
    }
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="mx-auto max-w-xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Register Merchant</h1>

      <form onSubmit={submit} className="space-y-4">
        <input
          className="w-full rounded border p-2"
          placeholder="Business Name"
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
        />
        {errors.name && <p className="text-red-600 text-sm">{errors.name}</p>}

        <input
          className="w-full rounded border p-2"
          placeholder="Merchant Username"
          value={form.merchantNameId}
          onChange={(e) =>
            updateField("merchantNameId", e.target.value.toLowerCase())
          }
        />
        {errors.merchantNameId && (
          <p className="text-red-600 text-sm">{errors.merchantNameId}</p>
        )}

        <input
          className="w-full rounded border p-2"
          placeholder="Owner Name"
          value={form.ownerName}
          onChange={(e) => updateField("ownerName", e.target.value)}
        />
        {errors.ownerName && (
          <p className="text-red-600 text-sm">{errors.ownerName}</p>
        )}

        <input
          className="w-full rounded border p-2"
          placeholder="Owner Username"
          value={form.ownerUsername}
          onChange={(e) =>
            updateField("ownerUsername", e.target.value.toLowerCase())
          }
        />
        {errors.ownerUsername && (
          <p className="text-red-600 text-sm">{errors.ownerUsername}</p>
        )}

        <input
          className="w-full rounded border p-2"
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => updateField("phone", e.target.value)}
        />
        {errors.phone && <p className="text-red-600 text-sm">{errors.phone}</p>}

        <div className="flex gap-2">
          <input
            className="w-1/2 rounded border p-2"
            placeholder="Latitude"
            value={form.location[0]}
            onChange={(e) =>
              updateField("location", [e.target.value, form.location[1]])
            }
          />
          <input
            className="w-1/2 rounded border p-2"
            placeholder="Longitude"
            value={form.location[1]}
            onChange={(e) =>
              updateField("location", [form.location[0], e.target.value])
            }
          />
        </div>

        <button
          type="button"
          onClick={pickDeviceLocation}
          className="rounded bg-gray-200 px-3 py-1 text-sm"
        >
          Use Device Location
        </button>
        {errors.location && (
          <p className="text-red-600 text-sm">{errors.location}</p>
        )}

        <select
          className="w-full rounded border p-2"
          value={form.categoryId}
          onChange={(e) => {
            updateField("categoryId", e.target.value);
            updateField("subcategoryId", "");
            updateField("offeringIds", []);
          }}
        >
          <option value="">Select Category</option>
          {categories.map((c) => (
            <option key={c.categoryCode} value={c.categoryCode}>
              {c.categoryName}
            </option>
          ))}
        </select>

        <select
          className="w-full rounded border p-2"
          value={form.subcategoryId}
          onChange={(e) => updateField("subcategoryId", e.target.value)}
          disabled={!form.categoryId}
        >
          <option value="">Select Subcategory</option>
          {filteredSubcategories.map((s) => (
            <option key={s.subcategoryCode} value={s.subcategoryCode}>
              {s.subcategoryName}
            </option>
          ))}
        </select>

        {filteredOfferings.length > 0 && (
          <div>
            <p className="font-semibold text-sm">Offerings (max 5)</p>
            <div className="flex flex-wrap gap-2">
              {filteredOfferings.map((o) => {
                const active = form.offeringIds.includes(o.offeringCode);
                return (
                  <button
                    key={o.offeringCode}
                    type="button"
                    onClick={() => toggleOffering(o.offeringCode)}
                    className={`rounded-full border px-3 py-1 text-sm ${
                      active ? "bg-black text-white" : "bg-gray-100"
                    }`}
                  >
                    {o.offeringName}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <input
          className="w-full rounded border p-2"
          placeholder="Banner Image URL"
          value={form.banner}
          onChange={(e) => updateField("banner", e.target.value)}
        />
        {errors.banner && (
          <p className="text-red-600 text-sm">{errors.banner}</p>
        )}

        <button
          type="submit"
          disabled={loading || Object.keys(errors).length > 0}
          className="w-full rounded bg-black py-2 text-white disabled:opacity-60"
        >
          {loading ? "Registering..." : "Register Merchant"}
        </button>

        {success && <p className="text-green-600 text-sm">{success}</p>}
      </form>

      {credentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-2">
              Merchant Login Credentials
            </h2>

            <p className="text-sm text-gray-600 mb-4">
              These credentials are shown <b>only once</b>. Copy securely.
            </p>

            <div className="space-y-3">
              <div className="rounded border p-3">
                <p className="text-xs text-gray-500">Username</p>
                <p className="font-mono text-lg">{credentials.username}</p>
              </div>

              <div className="rounded border p-3">
                <p className="text-xs text-gray-500">Temporary Password</p>
                <p className="font-mono text-lg">{credentials.password}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() =>
                  navigator.clipboard.writeText(
                    `Username: ${credentials.username}\nPassword: ${credentials.password}`
                  )
                }
                className="rounded border px-4 py-2 text-sm"
              >
                Copy
              </button>

              <button
                onClick={() => setCredentials(null)}
                className="rounded bg-black px-4 py-2 text-sm text-white"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
