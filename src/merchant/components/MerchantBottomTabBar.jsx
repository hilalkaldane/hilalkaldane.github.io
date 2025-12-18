import React from "react";
import { NavLink } from "react-router-dom";
import { FiBarChart2, FiCheckSquare, FiList, FiUser } from "react-icons/fi";
import { merchantLocalStorage } from "../services/merchantDevice";

export default function MerchantBottomTabBar() {
  const role = merchantLocalStorage.getItem("merchantUserRole"); // OWNER / EMPLOYEE
  const isEmployee = role === "EMPLOYEE";

  const allTabs = [
    {
      to: "/client/dashboard",
      label: "Dashboard",
      icon: <FiBarChart2 />,
      roles: ["OWNER"],
    },
    {
      to: "/client/redeem-coupon",
      label: "Validate",
      icon: <FiCheckSquare />,
      roles: ["OWNER", "EMPLOYEE"],
    },
    {
      to: "/client/campaigns",
      label: "Campaigns",
      icon: <FiList />,
      roles: ["OWNER"],
    },
    {
      to: "/client/profile",
      label: "Profile",
      icon: <FiUser />,
      roles: ["OWNER", "EMPLOYEE"],
    },
  ];

  // 🔒 Filter tabs strictly by role
  const visibleTabs = allTabs.filter((tab) => tab.roles.includes(role));

  return (
    <nav className="fixed bottom-0 z-40 h-16 w-full max-w-md mx-auto border-t border-gray-200 bg-[#f2f0f4] drop-shadow-md">
      <div
        className={`flex h-full items-center ${
          visibleTabs.length <= 2
            ? "justify-around px-6"
            : "justify-between px-12"
        }`}
      >
        {visibleTabs.map((t) => (
          <NavLink
            key={t.label}
            to={t.to}
            className={({ isActive }) =>
              `flex flex-col items-center text-xs ${
                isActive ? "text-blue-600" : "text-gray-500"
              }`
            }
          >
            <div className="h-5 w-5">{t.icon}</div>
            <span className="mt-0.5">{t.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
