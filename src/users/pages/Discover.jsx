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
  const [ searchEnabled, setSearchEnabled] = useState(false);

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
    return (
      merchants
        .filter((m) => m.category === category)
        .filter((m) => {
          if (selectedSubcats.length === 0) return true;
          return selectedSubcats.includes(m.subcategory);
        })
    );
  }, [merchants, category, search, selectedSubcats]);

  const toggleSubcat = (code) =>
    setSelectedSubcats((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );

  const isAllSelected = selectedSubcats.length === 0;

  /* ---------- UI ---------- */
  return (
    <div className="px-4 pb-4">
      {/* Category title */}
      <h2 className="mt-2 mb-3 text-xl font-semibold capitalize">
        {category.replaceAll("_", " ")}
      </h2>

      {/* Search */}
      { searchEnabled && (<div className="flex gap-3 items-center mb-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search merchants"
          className="flex-1 py-2 px-3 rounded-lg border border-gray-200"
        />
      </div>)}

      {/* Subcategory pills */}
      <div className="flex gap-2 overflow-auto mb-4">
        <button
          onClick={() => setSelectedSubcats([])}
          className={`px-3 py-2 rounded-full text-sm ${
            isAllSelected ? "bg-black text-white" : "bg-gray-100"
          }`}
        >
          All
        </button>

        {subcategories.map((s) => {
          const active = selectedSubcats.includes(s.subcategoryCode);
          return (
            <button
              key={s.subcategoryCode}
              onClick={() => toggleSubcat(s.subcategoryCode)}
              className={`px-3 py-2 rounded-full text-sm ${
                active ? "bg-black text-white" : "bg-gray-100"
              }`}
            >
              {s.subcategoryName}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading && <div className="text-gray-500">Loading merchants…</div>}
      {error && <div className="text-red-500">{error}</div>}

      {!loading && !error && (
        <div className="space-y-3">
          {filteredMerchants.map((m) => (
            <MerchantCard key={m.id} merchant={m} />
          ))}

          {filteredMerchants.length === 0 && (
            <div className="text-gray-500">No merchants found.</div>
          )}
        </div>
      )}
    </div>
  );
}
