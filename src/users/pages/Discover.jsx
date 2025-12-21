import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { merchantApi, metadataApi } from "../services/api";
import { CacheKeys, CacheTTL } from "../../shared/cacheKeys";
import MerchantCard from "../components/MerchantCard";

/* Cache */

export default function Discover() {
  const { category } = useParams(); // categoryCode from path

  const [merchants, setMerchants] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [searchEnabled, setSearchEnabled] = useState(false);

  const [selectedSubcats, setSelectedSubcats] = useState([]); // [] = All
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ---------- cache helpers ---------- */
  const readCache = () => {
    try {
      const raw = localStorage.getItem(CacheKeys.DISCOVER_MERCHANTS);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const writeCache = (data) => {
    if (!Array.isArray(data) || data.length === 0) return;

    try {
      localStorage.setItem(
        CacheKeys.DISCOVER_MERCHANTS,
        JSON.stringify({
          storedAt: Date.now(),
          merchants: data,
        })
      );
    } catch {
      // ignore quota / serialization errors
    }
  };

  const isCacheValid = (cache) =>
    cache && Date.now() - cache.storedAt < CacheTTL.HOUR;

  /* ---------- data load ---------- */
  const loadMerchants = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const cache = readCache();
      console.log(cache);

      if (isCacheValid(cache)) {
        setMerchants(cache.merchants || []);
      } else {
        const res = await merchantApi.listMerchants();
        setMerchants(res || []);
        writeCache(res || []);
      }

      const subs = await metadataApi.listSubcategoriesByCategory(category);
      setSubcategories(subs || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load merchants");
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    setSelectedSubcats([]); // reset when category changes
    loadMerchants();
  }, [loadMerchants]);

  /* ---------- filtering ---------- */
  const filteredMerchants = useMemo(() => {
    return merchants
      .filter((m) => m.category === category)
      .filter((m) => {
        if (selectedSubcats.length === 0) return true;
        return selectedSubcats.includes(m.subcategory);
      });
  }, [merchants, category, search, selectedSubcats]);

  const toggleSubcat = (code) =>
    setSelectedSubcats((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );

  const isAllSelected = selectedSubcats.length === 0;

  /* ---------- UI ---------- */
  return (
    <div className="px-6 py-4">
      <header className="flex items-center justify-between z-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white capitalize">
            {category.replaceAll("-", " ")}
          </h1>
          <p className="text-sm font-medium text-slate-400 mt-0.5">
            Explore the merchants around you.
          </p>
        </div>
      </header>
      {/* Search */}
      {searchEnabled && (
        <div className="flex gap-3 items-center mb-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search merchants"
            className="flex-1 py-2 px-3 rounded-lg border border-gray-200"
          />
        </div>
      )}

      <div className="flex overflow-x-auto no-scrollbar gap-3 pb-4 pt-4">
        <button
          onClick={() => setSelectedSubcats([])}
          className={`flex-shrink-0 px-4 py-1.5 border border-border-light text-sm font-semibold rounded-full shadow-sm ${
            isAllSelected
              ? "bg-black dark:bg-white text-white dark:text-black"
              : "bg-white dark:bg-black text-black dark:text-white"
          }`}
        >
          All
        </button>

        {subcategories.map((subcat) => {
          const sel = selectedSubcats.includes(subcat.subcategoryCode);
          return (
            <button
              key={subcat.subcategoryCode}
              onClick={() => toggleSubcat(subcat.subcategoryCode)}
              className={`flex-shrink-0 px-4 py-1.5 border border-border-light text-sm font-semibold rounded-full shadow-sm ${
                sel
                  ? "bg-black dark:bg-white text-white dark:text-black"
                  : "bg-white dark:bg-black text-black dark:text-white"
              }`}
            >
              {subcat.subcategoryName}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading && <div className="text-gray-500">Loading merchants…</div>}
      {error && <div className="text-red-500">{error}</div>}
      <main className="flex flex-col gap-5">
        {!loading && !error && (
          <div className="space-y-5">
            {filteredMerchants.map((m) => (
              <MerchantCard key={m.merchantNameId} merchant={m} />
            ))}

            {filteredMerchants.length === 0 && (
              <div className="text-gray-500">No merchants found.</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
