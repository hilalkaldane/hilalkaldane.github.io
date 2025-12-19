import React from "react";
import { NavLink } from "react-router-dom";
import { FiHome, FiSearch, FiPlusSquare, FiInbox, FiUser } from "react-icons/fi";

export default function BottomTabBar() {
  const tabs = [
    { to: "/", label: "Home", icon: <FiHome /> },
    { to: "/explore", label: "Explore", icon: <FiSearch /> },
    { to: "/profile", label: "Profile", icon: <FiUser /> }
  ];

  return (
<nav className="fixed bottom-0 h-16 border-t border-gray-200 flex items-center justify-between z-40 max-w-md w-full mx-auto border px-12 bg-[#f2f0f4] drop-shadow-md">
  {tabs.map((t) => (
    <NavLink
      key={t.label}
      to={t.to}
      className="flex flex-col items-center text-xs"
    >
      <div className="w-4 h-4">{t.icon}</div>
      <span className="text-[#131118] text-xs font-medium leading-normal tracking-[0.015em]">
        {t.label}
      </span>
    </NavLink>
  ))}
</nav>

  );
}
