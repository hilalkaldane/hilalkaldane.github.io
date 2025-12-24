import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";

export default function MerchantCard({ merchant }) {
  const nav = useNavigate();
  const BUCKET_BASE = process.env.REACT_APP_MEDIA_BUCKET_BASE;


  return (
    <div
      onClick={() => nav(`/merchant/${merchant.merchantNameId}`)}
      className="group relative flex w-full flex-col overflow-hidden bg-card-light dark:bg-card-dark rounded-3xl shadow-soft dark:shadow-none border border-border-light dark:border-border-dark group active:scale-[0.99] transition-transform duration-100"
      role="button"
    >
      <div className="relative h-52 w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{
            backgroundImage: merchant.listImage
              ? `url(${BUCKET_BASE}${
                  merchant.listImage
                })`
              : "none",
          }}
        />
      </div>
      <div className="flex flex-col p-4 pb-5">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <h3 className="text-text-main-light dark:text-white text-[17px] font-bold">
              {merchant.name}
            </h3>
            <p className="text-[14px] font-medium text-slate-400 mt-1">
              {merchant.address}
            </p>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {merchant.offerings?.map((item, idx) => (
            <span
              key={item}
              className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-500 tracking-wide capitalize"
            >
              {item.trim().replace("-"," ")}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
