import { Navigate, Outlet } from "react-router-dom";
import { merchantLocalStorage } from "../services/merchantDevice";

export function RoleBasedGuard({ allowedRoles }) {
  const role = merchantLocalStorage.getItem("merchantUserRole"); // or context

  if (!role) return <Navigate to="/merchant-login" replace />;
  if (!allowedRoles.includes(role)) return <Navigate to="/client/redeem-coupon" replace />;

  return <Outlet />;
}
