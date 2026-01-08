import React from "react";
import { NavLink } from "react-router-dom";
import { FiHome, FiUser } from "react-icons/fi";

export default function BottomTabBar() {
  const tabs = [
    { to: "/", label: "Home", icon: FiHome },
    { to: "/profile", label: "Profile", icon: FiUser },
  ];

  return (
    <nav
      className="
        fixed bottom-0 z-40 w-full max-w-md mx-auto
        bg-background-light dark:bg-background-dark
        shadow-[0_-4px_12px_rgba(0,0,0,0.06)]
      "
    >
      <div className="px-6 flex items-center justify-around">
        {tabs.map((t) => {
          const Icon = t.icon;

          return (
            <NavLink
              key={t.label}
              to={t.to}
              className={({ isActive }) =>
                `
                  flex flex-col items-center justify-center
                  py-2 min-w-[64px]
                  transition-transform
                  ${isActive ? "text-primary" : "text-text-subtle"}
                `
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={18}
                    className={`
                      transition-transform
                      ${isActive ? "stroke-[2.2] scale-105" : "stroke-[1.8]"}
                    `}
                  />

                  <span
                    className={`
                      text-[11px] tracking-tight
                      ${isActive ? "font-medium" : "font-normal"}
                    `}
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
