import React from "react";
import { NavLink } from "react-router-dom";
import { FiHome, FiSearch, FiUser } from "react-icons/fi";

export default function BottomTabBar() {
  const tabs = [
    { to: "/", label: "Home", icon: FiHome },
    /* { to: "/explore", label: "Explore", icon: FiSearch }, */
    { to: "/profile", label: "Profile", icon: FiUser },
  ];

  return (
    <nav className="fixed bottom-0 z-40 w-full max-w-md mx-auto bg-[#f2f0f4] border-t border-black/1">
      <div className="h-14 px-6 flex items-center justify-around">
        {tabs.map((t) => {
          const Icon = t.icon;

          return (
            <NavLink
              key={t.label}
              to={t.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 ${
                  isActive ? "text-primary" : "text-[#131118]/70"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={16}
                    className={isActive ? "stroke-[2.2]" : "stroke-[1.8]"}
                  />

                  <span
                    className={`text-[11px] font-semibold tracking-tight ${
                      isActive ? "text-primary" : "text-[#131118]/70"
                    }`}
                  >
                    {t.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
