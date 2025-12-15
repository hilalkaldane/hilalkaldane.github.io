// src/auth/RequireMerchantAuth.jsx
import { Navigate, Outlet } from "react-router-dom";
import { isAdminLoggedIn } from "./adminAuth";

export default function RequireAdminAuth() {
  if (!isAdminLoggedIn()) {
    return <Navigate to="/admin-login" replace />;
  }
  return <Outlet />;
}
