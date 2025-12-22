// src/client/AdminApp.jsx
import { Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";

import RegisterMerchant from "./pages/RegisterMerchant";
import AdminCategories from "./pages/AdminCategories";
import CreateCampaignAdmin from "./pages/CreateCampaignAdmin";
import ActiveCampaignsAdmin from "./pages/ActiveCampaignsAdmin";

import { adminLocalStorage } from "./services/adminDevice";
import { adminProtectedApi } from "./services/adminProtectedApi";

export const METADATA_KEY = "admin_metadata_v1";

export default function AdminApp() {
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [metadataVersion, setMetadataVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;

    // 1️⃣ Load from cache immediately (fast paint)
    const cached = adminLocalStorage.getItem(METADATA_KEY);
    if (cached) {
      try {
        setMetadata(JSON.parse(cached));
        setLoading(false);
      } catch {
        adminLocalStorage.removeItem(METADATA_KEY);
      }
    }

    // 2️⃣ Always revalidate from server
    Promise.all([
      adminProtectedApi.getCategoriesAndSubcategories(),
      adminProtectedApi.getOfferings(),
    ])
      .then(([catSubRes, offerings]) => {
        if (cancelled) return;

        console.log(catSubRes.categoryList);
        console.log(catSubRes.subcategoryList);
        console.log(offerings);

        const combined = {
          categories: catSubRes.categoryList ?? [],
          subcategories: catSubRes.subcategoryList ?? [],
          offerings: offerings ?? [],
        };

        setMetadata(combined);
        adminLocalStorage.setItem(METADATA_KEY, JSON.stringify(combined));
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [metadataVersion]);

  if (loading) return <div className="p-6">Loading metadata…</div>;
  if (!metadata) return <div className="p-6">Metadata unavailable</div>;

  return (
    <Routes>
      <Route path="/" element={<ActiveCampaignsAdmin />} />

      <Route
        path="/categories"
        element={
          <AdminCategories
            metadata={metadata}
            invalidateMetadata={() => setMetadataVersion((v) => v + 1)}
          />
        }
      />

      <Route
        path="/register-merchant"
        element={<RegisterMerchant metadata={metadata} />}
      />

      <Route path="/create-campaign" element={<CreateCampaignAdmin />} />

      <Route path="/campaigns" element={<ActiveCampaignsAdmin />} />
    </Routes>
  );
}
