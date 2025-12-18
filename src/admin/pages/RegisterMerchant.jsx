import React, { useEffect, useState } from "react";
import {
  adminProtectedApi,
  redirectToAdminLogin,
} from "../services/adminProtectedApi";
import { adminLocalStorage } from "../services/adminDevice";

export default function RegisterMerchant() {
    const adminToken = adminLocalStorage.getItem("adminAccessToken");

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  const [form, setForm] = useState({
    name: "",
    merchantNameId: "",
    ownerName: "",
    phone: "",
    address: "",
    location: ["", ""], // lat, lng
    categoryId: "",
    subcategoryIds: [],
    banner: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  /* ------------------ AUTH + META ------------------ */
  useEffect(() => {
    if (!adminToken) redirectToAdminLogin();

    async function loadMeta() {
      const res = await adminProtectedApi.getCategoriesAndSubcategories();
      setCategories(res.categoryList || []);
      setSubcategories(res.subcategoryList || []);
    }

    loadMeta();
  }, []);

  /* ------------------ DEVICE LOCATION ------------------ */
  function pickDeviceLocation() {
    if (!navigator.geolocation) {
      setErrors((e) => ({ ...e, location: "Geolocation not supported" }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setForm((f) => ({ ...f, location: [lat, lng] }));
        setErrors((e) => ({ ...e, location: null }));
      },
      () => {
        setErrors((e) => ({ ...e, location: "Location permission denied" }));
      }
    );
  }

  /* ------------------ VALIDATION ------------------ */
  useEffect(() => {
    const e = {};

    // Business name
    if (!/^[A-Za-z ,\-'.]{2,60}$/.test(form.name))
      e.name = "2–60 chars. Letters and , - ' . only";

    // Username
    if (!/^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)?$/.test(form.merchantNameId))
      e.merchantNameId = "3–15 chars, max 2 words, '-' separated";

    if (form.merchantNameId.length < 3 || form.merchantNameId.length > 15)
      e.merchantNameId = "Username must be 3–15 characters";

    // Phone
    if (!/^[0-9]{10}$/.test(form.phone))
      e.phone = "10-digit Indian number required";

    if (!/^[A-Za-z]{3,20}$/.test(form.ownerName))
    e.ownerName = "3–20 chars. Letters only";

    // Location
    if (!form.location[0] || !form.location[1])
      e.location = "Precise location required";

    // Category
    if (!form.categoryId) e.categoryId = "Category is required";

    // Subcategories
    if (form.subcategoryIds.length > 5)
      e.subcategoryIds = "Max 5 subcategories allowed";

    // Banner
    if (!form.banner) e.banner = "Banner is required";

    setErrors(e);
  }, [form]);

  /* ------------------ HELPERS ------------------ */
  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleSubcategory(code) {
    setForm((f) => {
      if (f.subcategoryIds.includes(code)) {
        return {
          ...f,
          subcategoryIds: f.subcategoryIds.filter((c) => c !== code),
        };
      }
      if (f.subcategoryIds.length >= 5) return f;
      return { ...f, subcategoryIds: [...f.subcategoryIds, code] };
    });
  }

  /* ------------------ SUBMIT ------------------ */
  async function submit(e) {
    e.preventDefault();
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      await adminProtectedApi.createMerchant({
        ...form,
        location: [Number(form.location[0]), Number(form.location[1])],
      });
      setSuccess("Merchant registered successfully");
    } finally {
      setLoading(false);
    }
  }

  /* ------------------ UI ------------------ */
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
          placeholder="Username"
          value={form.merchantNameId}
          onChange={(e) => updateField("merchantNameId", e.target.value)}
        />
        {errors.merchantNameId && (
          <p className="text-red-600 text-sm">{errors.merchantNameId}</p>
        )}

        <input
          className="w-full rounded border p-2"
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => updateField("phone", e.target.value)}
        />
        {errors.phone && <p className="text-red-600 text-sm">{errors.phone}</p>}

        <input
          className="w-full rounded border p-2"
          placeholder="Owner Name"
          value={form.ownerName}
          onChange={(e) => updateField("ownerName", e.target.value)}
        />
        {errors.ownerName && <p className="text-red-600 text-sm">{errors.ownerName}</p>}

        <textarea
          className="w-full rounded border p-2"
          placeholder="Address"
          value={form.address}
          onChange={(e) => updateField("address", e.target.value)}
        />

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
          onChange={(e) => updateField("categoryId", e.target.value)}
        >
          <option value="">Select Category</option>
          {categories.map((c) => (
            <option key={c.categoryCode} value={c.categoryCode}>
              {c.categoryName}
            </option>
          ))}
        </select>

        {errors.categoryId && (
          <p className="text-red-600 text-sm">{errors.categoryId}</p>
        )}

        <div>
          <p className="font-semibold text-sm">Subcategories (max 5)</p>

          <div className="flex flex-wrap gap-2">
            {subcategories.map((s) => {
              const active = form.subcategoryIds.includes(s.subcategoryCode);
              const disabled = !active && form.subcategoryIds.length >= 5;

              return (
                <button
                  key={s.subcategoryCode}
                  type="button"
                  disabled={disabled}
                  onClick={() => toggleSubcategory(s.subcategoryCode)}
                  className={`rounded-full border px-3 py-1 text-sm ${
                    active ? "bg-black text-white" : "bg-gray-100"
                  } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {s.subcategoryName}
                </button>
              );
            })}
          </div>

          {form.subcategoryIds.length >= 5 && (
            <p className="mt-1 text-xs text-gray-600">
              Maximum 5 subcategories allowed
            </p>
          )}
        </div>

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
    </div>
  );
}
