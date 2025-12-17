// src/client/MerchantApp.jsx
import { Routes, Route } from "react-router-dom";
import RegisterMerchant from "./pages/RegisterMerchant";
import AdminCategories from "./pages/AdminCategories";
import CreateCampaignAdmin from "./pages/CreateCampaignAdmin";
import ActiveCampaignsAdmin from "./pages/ActiveCampaignsAdmin";

export default function AdminApp() {
  return (
    <Routes>
            <Route path="/" element={<ActiveCampaignsAdmin />} />
            <Route path="/register-merchant" element={<RegisterMerchant />} />
            <Route path="/categories" element={<AdminCategories />} />
            <Route path="/create-campaign" element={<CreateCampaignAdmin />} />
            <Route path="/campaigns" element={<ActiveCampaignsAdmin />} />
    </Routes>
  );
}
