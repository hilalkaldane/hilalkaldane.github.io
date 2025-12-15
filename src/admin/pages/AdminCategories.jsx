import React, { useState } from "react";
import { adminProtectedApi, redirectToAdminLogin } from "../services/adminProtectedApi";

export default function AdminCategories() {
  const adminToken = localStorage.getItem("adminAccessToken");
  if (!adminToken) redirectToAdminLogin();

  /* ---------------- CATEGORY STATE ---------------- */
  const [categoryCode, setCategoryCode] = useState("");
  const [categoryName, setCategoryName] = useState("");

  /* ---------------- SUBCATEGORY STATE ---------------- */
  const [subcategoryCode, setSubcategoryCode] = useState("");
  const [subcategoryName, setSubcategoryName] = useState("");

  /* ---------------- UI STATE ---------------- */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  /* ---------------- HANDLERS ---------------- */

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
      setSuccess("Category created successfully");
      setCategoryCode("");
      setCategoryName("");
    } catch (err) {
      setError(err?.body?.message || err.message || "Failed to create category");
    } finally {
      setLoading(false);
    }
  }

  async function createSubcategory(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await adminProtectedApi.createSubcategory({
        subcategoryCode: subcategoryCode.trim(),
        subcategoryName: subcategoryName.trim(),
      });
      setSuccess("Subcategory created successfully");
      setSubcategoryCode("");
      setSubcategoryName("");
    } catch (err) {
      setError(err?.body?.message || err.message || "Failed to create subcategory");
    } finally {
      setLoading(false);
    }
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-8">
      <h1 className="text-2xl font-bold">Admin · Categories & Subcategories</h1>

      {/* -------- CATEGORY -------- */}
      <form onSubmit={createCategory} className="rounded border p-4 space-y-3">
        <h2 className="text-lg font-semibold">Create Category</h2>

        <input
          className="w-full rounded border p-2"
          placeholder="Category Code (e.g. restaurant)"
          value={categoryCode}
          onChange={(e) => setCategoryCode(e.target.value)}
          required
        />

        <input
          className="w-full rounded border p-2"
          placeholder="Category Name (e.g. Restaurant)"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-60"
        >
          Add Category
        </button>
      </form>

      {/* -------- SUBCATEGORY -------- */}
      <form onSubmit={createSubcategory} className="rounded border p-4 space-y-3">
        <h2 className="text-lg font-semibold">Create Subcategory</h2>

        <input
          className="w-full rounded border p-2"
          placeholder="Subcategory Code (e.g. pizza)"
          value={subcategoryCode}
          onChange={(e) => setSubcategoryCode(e.target.value)}
          required
        />

        <input
          className="w-full rounded border p-2"
          placeholder="Subcategory Name (e.g. Pizza)"
          value={subcategoryName}
          onChange={(e) => setSubcategoryName(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-60"
        >
          Add Subcategory
        </button>
      </form>

      {/* -------- FEEDBACK -------- */}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}
    </div>
  );
}
