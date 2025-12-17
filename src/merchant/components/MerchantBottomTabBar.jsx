import React from "react";
import { NavLink, useParams } from "react-router-dom";
import { FiBarChart2, FiPlusSquare, FiCheckSquare, FiList } from "react-icons/fi";
import { useLocation } from 'react-router-dom';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}


export default function MerchantBottomTabBar() {
  const query = useQuery();
  const merchantId = query.get('merchantId');
  const tabs = [
    { to: `/client/dashboard`, label: "Dashboard", icon: <FiBarChart2 /> },
    { to: `/client/redeem-coupon`, label: "Validate", icon: <FiCheckSquare /> },
    { to: `/client/campaigns`, label: "Campaigns", icon: <FiList /> },
  ];

  return (
<nav className="fixed bottom-0 z-40 h-16 w-full max-w-md mx-auto border-t border-gray-200 bg-[#f2f0f4] drop-shadow-md">
  <div className="flex h-full items-center justify-between px-12">
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
