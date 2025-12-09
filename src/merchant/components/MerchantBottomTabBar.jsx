import React from "react";
import { NavLink, useParams } from "react-router-dom";
import { FiBarChart2, FiPlusSquare, FiCheckSquare } from "react-icons/fi";
import { useLocation } from 'react-router-dom';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}


export default function MerchantBottomTabBar() {
  const query = useQuery();
  const merchantId = query.get('merchantId');
  const tabs = [
    { to: `/client/dashboard`, label: "Dashboard", icon: <FiBarChart2 /> },
    { to: `/client/create-campaign`, label: "Create", icon: <FiPlusSquare /> },
    { to: `/client/redeem-coupon`, label: "Validate", icon: <FiCheckSquare /> },
  ];

  return (
<nav className="fixed bottom-0 h-14 border-t border-gray-200 z-40 max-w-md w-full mx-auto border px-12 bg-[#f2f0f4] drop-shadow-md">
  <div className="max-w-sm mx-auto flex items-center justify-between h-full w-full px-6">
    {tabs.map((t) => (
      <NavLink
        key={t.label}
        to={t.to}
        className={({ isActive }) =>
          `flex flex-col items-center text-xs ${isActive ? "text-blue-600" : "text-gray-500"}`
        }
      >
        <div className="w-5 h-5">{t.icon}</div>
        <span className="mt-0.5">{t.label}</span>
      </NavLink>
    ))}
  </div>
</nav>
  );
}
