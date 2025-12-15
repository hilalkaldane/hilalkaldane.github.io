// src/client/MerchantApp.jsx
import { Routes, Route } from "react-router-dom";
import RegisterMerchant from "./pages/RegisterMerchant";
import AdminCategories from "./pages/AdminCategories";

export default function AdminApp() {
  return (
    <Routes>
            <Route path="/" element={<RegisterMerchant />} />
            <Route path="/register-merchant" element={<RegisterMerchant />} />
            <Route path="/categories" element={<AdminCategories />} />
    </Routes>
  );
}
