// src/client/MerchantApp.jsx
import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import CreateCampaign from "./pages/CreateCampaign";
import RedeemCoupon from "./pages/RedeemCoupon"

export default function MerchantApp() {
  return (
    <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/create-campaign/" element={<CreateCampaign />} />
            <Route path="/redeem-coupon/" element={<RedeemCoupon />} />
    </Routes>
  );
}
