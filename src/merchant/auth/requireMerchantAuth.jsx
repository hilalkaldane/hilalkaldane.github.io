// src/auth/RequireMerchantAuth.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { isMerchantLoggedIn } from "./merchantAuth";

export default function RequireMerchantAuth() {
  if (!isMerchantLoggedIn()) {
    return <Navigate to="/merchant-login" replace />;
  }
  return <Outlet />;
}
