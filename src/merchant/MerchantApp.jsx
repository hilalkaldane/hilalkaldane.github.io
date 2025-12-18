// src/client/MerchantApp.jsx
import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import CreateCampaign from "./pages/CreateCampaign";
import RedeemCoupon from "./pages/RedeemCoupon"
import ActiveCampaigns from "./pages/ActiveCampaigns";
import { RoleBasedGuard } from "./auth/roleBasedGuard";
import MerchantProfile from "./pages/MerchantProfile";

export default function MerchantApp() {
  return (
    <Routes>

            <Route path="/" element={<RedeemCoupon />} />
            <Route element={<RoleBasedGuard allowedRoles={["OWNER"]} />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/campaigns" element={<ActiveCampaigns />} />
              <Route path="/create-campaign/" element={<CreateCampaign />} />
            </Route>
            <Route path="/redeem-coupon/" element={<RedeemCoupon />} />
            <Route path="/profile/" element={<MerchantProfile />} />
    </Routes>
  );
}
