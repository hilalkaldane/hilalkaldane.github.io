// src/client/MerchantApp.jsx
import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import CreateCampaign from "./pages/CreateCampaign";
import RedeemCoupon from "./pages/RedeemCoupon"
import ActiveCampaigns from "./pages/ActiveCampaigns";

export default function MerchantApp() {
  return (
    <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/campaigns" element={<ActiveCampaigns />} />
            <Route path="/create-campaign/" element={<CreateCampaign />} />
            <Route path="/redeem-coupon/" element={<RedeemCoupon />} />
    </Routes>
  );
}
