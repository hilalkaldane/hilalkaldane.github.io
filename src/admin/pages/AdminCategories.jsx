// src/client/pages/AdminCategories.jsx
import React, { useState, useMemo } from "react";
import {
  adminProtectedApi,
  redirectToAdminLogin,
} from "../services/adminProtectedApi";
import { adminLocalStorage } from "../services/adminDevice";
import { METADATA_KEY } from "../AdminApp";

export default function AdminCategories({
  metadata,
  invalidateMetadata,
}) {
  const adminToken = adminLocalStorage.getItem("adminAccessToken");
  if (!adminToken) redirectToAdminLogin();

  /* ---------------- SORTED METADATA ---------------- */

  const categories = [...(metadata?.categories ?? [])].sort((a, b) =>
    a.categoryName.localeCompare(b.categoryName)
  );

  const subcategories = [...(metadata?.subcategories ?? [])].sort((a, b) =>
    a.subcategoryName.localeCompare(b.subcategoryName)
  );

  const offerings = [...(metadata?.offerings ?? [])].sort((a, b) =>
    a.offeringName.localeCompare(b.offeringName)
  );

  /* ---------------- GROUPED VIEWS ---------------- */

  const subcategoriesByCategory = useMemo(() => {
    const map = {};
    for (const c of categories) map[c.categoryCode] = [];
    for (const s of subcategories) {
      if (!map[s.categoryCode]) map[s.categoryCode] = [];
      map[s.categoryCode].push(s);
    }
    return map;
  }, [categories, subcategories]);

  const offeringsByCategory = useMemo(() => {
    const map = {};
    for (const c of categories) map[c.categoryCode] = [];
    for (const o of offerings) {
      if (!map[o.categoryCode]) map[o.categoryCode] = [];
      map[o.categoryCode].push(o);
    }
    return map;
  }, [categories, offerings]);

  /* ---------------- CATEGORY STATE ---------------- */

  const [categoryCode, setCategoryCode] = useState("");
  const [categoryName, setCategoryName] = useState("");

  /* ---------------- SUBCATEGORY STATE ---------------- */

  const [selectedCategoryCode, setSelectedCategoryCode] =
    useState("");
  const [subcategoryCode, setSubcategoryCode] = useState("");
  const [subcategoryName, setSubcategoryName] = useState("");

  /* ---------------- OFFERING STATE ---------------- */

  const [offeringCategoryCode, setOfferingCategoryCode] =
    useState("");
  const [offeringCode, setOfferingCode] = useState("");
  const [offeringName, setOfferingName] = useState("");

  /* ---------------- UI STATE ---------------- */

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  function invalidate() {
    adminLocalStorage.removeItem(METADATA_KEY);
    invalidateMetadata();
  }

  /* ---------------- CREATE CATEGORY ---------------- */

  async function createCategory(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await adminProtectedApi.createCategory({
        categoryCode: categoryCode.trim(),
        categoryName: categoryName.trim(),
      });

      invalidate();
      setSuccess("Category created successfully");
      setCategoryCode("");
      setCategoryName("");
    } catch (err) {
      setError(err?.body?.message || err.message);
    } finally {
      setLoading(false);
    }
  }

  /* ---------------- CREATE SUBCATEGORY ---------------- */

  async function createSubcategory(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!selectedCategoryCode) {
      setError("Category selection is required");
      setLoading(false);
      return;
    }

    try {
      await adminProtectedApi.createSubcategory({
        subcategoryCode: subcategoryCode.trim(),
        subcategoryName: subcategoryName.trim(),
        categoryCode: selectedCategoryCode,
      });

      invalidate();
      setSuccess("Subcategory created successfully");
      setSubcategoryCode("");
      setSubcategoryName("");
    } catch (err) {
      setError(err?.body?.message || err.message);
    } finally {
      setLoading(false);
    }
  }

  /* ---------------- CREATE OFFERING ---------------- */

  async function createOffering(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!offeringCategoryCode) {
      setError("Category selection is required");
      setLoading(false);
      return;
    }

    try {
      await adminProtectedApi.createOfferings({
        offeringCode: offeringCode.trim(),
        offeringName: offeringName.trim(),
        categoryCode: offeringCategoryCode,
      });

      invalidate();
      setSuccess("Offering created successfully");
      setOfferingCode("");
      setOfferingName("");
    } catch (err) {
      setError(err?.body?.message || err.message);
    } finally {
      setLoading(false);
    }
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-10">
      <h1 className="text-2xl font-bold">
        Admin · Categories, Subcategories & Offerings
      </h1>

      {/* ================= CREATE CATEGORY ================= */}
      <form onSubmit={createCategory} className="rounded border p-4 space-y-3">
        <h2 className="text-lg font-semibold">Create Category</h2>


        <input
          className="w-full rounded border p-2"
          placeholder="Category Name"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          required
        />

        <input
          className="w-full rounded border p-2"
          placeholder="Category Code"
          value={categoryCode}
          onChange={(e) => setCategoryCode(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="rounded bg-black px-4 py-2 text-white"
        >
          Add Category
        </button>
      </form>

      {/* ================= CREATE SUBCATEGORY ================= */}
      <form onSubmit={createSubcategory} className="rounded border p-4 space-y-3">
        <h2 className="text-lg font-semibold">Create Subcategory</h2>

        <select
          className="w-full rounded border p-2"
          value={selectedCategoryCode}
          onChange={(e) => setSelectedCategoryCode(e.target.value)}
          required
        >
          <option value="">Select Category</option>
          {categories.map((c) => (
            <option key={c.categoryCode} value={c.categoryCode}>
              {c.categoryName}
            </option>
          ))}
        </select>


        <input
          className="w-full rounded border p-2"
          placeholder="Subcategory Name"
          value={subcategoryName}
          onChange={(e) => setSubcategoryName(e.target.value)}
          required
        />
        <input
          className="w-full rounded border p-2"
          placeholder="Subcategory Code"
          value={subcategoryCode}
          onChange={(e) => setSubcategoryCode(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="rounded bg-black px-4 py-2 text-white"
        >
          Add Subcategory
        </button>
      </form>

      {/* ================= CREATE OFFERING ================= */}
      <form onSubmit={createOffering} className="rounded border p-4 space-y-3">
        <h2 className="text-lg font-semibold">Create Offering</h2>

        <select
          className="w-full rounded border p-2"
          value={offeringCategoryCode}
          onChange={(e) => setOfferingCategoryCode(e.target.value)}
          required
        >
          <option value="">Select Category</option>
          {categories.map((c) => (
            <option key={c.categoryCode} value={c.categoryCode}>
              {c.categoryName}
            </option>
          ))}
        </select>


        <input
          className="w-full rounded border p-2"
          placeholder="Offering Name"
          value={offeringName}
          onChange={(e) => setOfferingName(e.target.value)}
          required
        />

        <input
          className="w-full rounded border p-2"
          placeholder="Offering Code"
          value={offeringCode}
          onChange={(e) => setOfferingCode(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-black px-4 py-2 text-white"
        >
          Add Offering
        </button>
      </form>

      {/* ================= LISTS ================= */}

      <div className="rounded border p-4 space-y-4">
        <h2 className="text-lg font-semibold">Subcategories</h2>
        {categories.map((c) => (
          <div key={c.categoryCode}>
            <p className="font-semibold">{c.categoryName}</p>
            <ul className="ml-6 list-disc text-sm">
              {(subcategoriesByCategory[c.categoryCode] || []).map((s) => (
                <li key={s.subcategoryCode}>{s.subcategoryName}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="rounded border p-4 space-y-4">
        <h2 className="text-lg font-semibold">Offerings</h2>
        {categories.map((c) => (
          <div key={c.categoryCode}>
            <p className="font-semibold">{c.categoryName}</p>
            <ul className="ml-6 list-disc text-sm">
              {(offeringsByCategory[c.categoryCode] || []).map((o) => (
                <li key={o.offeringCode}>{o.offeringName}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}
    </div>
  );
}
