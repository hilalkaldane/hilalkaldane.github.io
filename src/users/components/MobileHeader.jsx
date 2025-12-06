import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiSearch, FiMessageCircle, FiBell } from "react-icons/fi";

export default function MobileHeader() {
  const nav = useNavigate();
  const loc = useLocation();

  // center title changes per screen
  const title = {
    "/": "Categories",
    "/discover": "Discover",
    "/profile": "Profile"
  }[loc.pathname.split("/")[1] ? `/${loc.pathname.split("/")[1]}` : "/"] || "Discover";

  return (
    <div className="flex items-center p-2 bg-[#f2f0f4] justify-between top-0 left-0 drop-shadow-md">
          <h2 className="text-[#131118] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pl-12">Fayda Point !!!</h2>
          <div className="flex w-12 items-center justify-end">
            <button
              className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 bg-transparent text-[#131118] gap-2 text-base font-bold leading-normal tracking-[0.015em] min-w-0 p-0"
            >
              <div className="text-[#131118]" data-icon="ListBullets" data-size="24px" data-weight="regular">
                <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                  <path
                    d="M80,64a8,8,0,0,1,8-8H216a8,8,0,0,1,0,16H88A8,8,0,0,1,80,64Zm136,56H88a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16Zm0,64H88a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16ZM44,52A12,12,0,1,0,56,64,12,12,0,0,0,44,52Zm0,64a12,12,0,1,0,12,12A12,12,0,0,0,44,116Zm0,64a12,12,0,1,0,12,12A12,12,0,0,0,44,180Z"
                  ></path>
                </svg>
              </div>
            </button>
          </div>
        </div>
  );
}
