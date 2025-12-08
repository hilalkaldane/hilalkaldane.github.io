// src/pages/admin/AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import { adminApi, categoryApi } from "../../users/services/api";

const { adminResetData } = adminApi;

export default function AdminDashboard() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    name: "",
    address: "",
  });

  const loadCategories = async () => {
    try {
      const cats = await categoryApi.listCategories();
      setCategories(cats);
      if (cats.length > 0) {
        setFormData((prev) => ({ ...prev, category: cats[0].id }));
      }
      return cats;
    } catch (error) {
      console.error("Failed to load categories:", error);
      alert("Error loading categories");
      return [];
    }
  };

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleadminCreateMerchant = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Merchant name is required");
      return;
    }
    if (!formData.category) {
      alert("Please select a category");
      return;
    }

    try {
      setLoading(true);
      const merchant = await adminApi.adminCreateMerchant(formData);
      alert("Merchant created successfully! "+merchant.name+ " "+merchant.id);
      setFormData((prev) => ({
        ...prev,
        name: "",
        address: "",
      }));
    } catch (error) {
      console.error("Error creating merchant:", error);
      alert("Failed to create merchant");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("Are you sure you want to reset to defaults?")) return;
    try {
      setLoading(true);
      await adminResetData();
      const cats = await loadCategories();
      setFormData((prev) => ({ ...prev, category: cats[0]?.id || "" }));
      alert("Data reset to defaults!");
    } catch (error) {
      console.error("Error resetting data:", error);
      alert("Failed to reset data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Admin Dashboard</h1>

      <form onSubmit={handleadminCreateMerchant} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="border rounded px-2 py-1 w-full"
            disabled={loading}
          >
            <option value="">-- Select Category --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium">Merchant Name</label>
          <input
            type="text"
            name="name"
            placeholder="Enter merchant name"
            value={formData.name}
            onChange={handleChange}
            className="border rounded px-2 py-1 w-full"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Address</label>
          <input
            type="text"
            name="address"
            placeholder="Enter address"
            value={formData.address}
            onChange={handleChange}
            className="border rounded px-2 py-1 w-full"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? "Processing..." : "Create Merchant"}
        </button>
      </form>

      <div className="mt-6">
        <button
          onClick={handleReset}
          className="bg-red-600 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? "Resetting..." : "Reset to Defaults"}
        </button>
      </div>
    </div>
  );
}
