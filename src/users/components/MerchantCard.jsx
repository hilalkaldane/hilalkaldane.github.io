import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";

export default function MerchantCard({ merchant }) {
  const nav = useNavigate();

  return (
    <div
      onClick={() => nav(`/merchant/${merchant.merchantNameId}`)}
      className="flex gap-3 items-center p-3 rounded-lg border border-gray-100 bg-white shadow-sm"
      role="button"
      tabIndex={0}
    >
      <div
        className="aspect-video w-full flex-1 rounded-xl bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: merchant.profile
            ? `url("${merchant.profile}${"?w=416&h=160&fit=crop&q=80&auto=format"}")`
            : "none",
        }}
      />
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{merchant.name}</div>
        <div className="text-sm text-gray-500">
          {merchant.distancekm} km • {merchant.tagline}
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          nav(`/merchant/${merchant.merchantNameId}`);
        }}
        className="ml-2 px-3 py-1 bg-gray-100 rounded-md text-sm"
      >
        View
      </button>
    </div>
  );
}
