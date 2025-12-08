import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { merchantApi } from "../services/api";
import MerchantCard from "../components/MerchantCard";

export default function Discover() {
  const { category } = useParams();
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(""); // "near" | "budget" | ""
  const [error, setError] = useState(null);
  const nav = useNavigate();

  const loadMerchants = useCallback(() => {
    setLoading(true);
    setError(null);

    merchantApi
      .listMerchants({ category, search, filter })
      .then((data) => {
        setMerchants(data || []);
      })
      .catch((err) => {
        console.error("Failed to load merchants:", err);
        setError("Failed to load merchants.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [category, search, filter]);

  useEffect(() => {
    loadMerchants();
  }, [loadMerchants]);

  return (
    <div className="px-4 pb-2">
      {/* Search Bar */}
      <div className="flex gap-3 items-center mt-2 mb-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && loadMerchants()}
          placeholder="Search merchants or deals"
          className="flex-1 py-2 px-3 rounded-lg border border-gray-200"
        />
        <button
          onClick={loadMerchants}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg"
        >
          Search
        </button>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 overflow-auto mb-3">
        <button
          onClick={() => {
            setFilter("");
            nav("/");
          }}
          className={`px-3 py-2 rounded-full text-sm ${
            filter === "" ? "bg-blue-500 text-white" : "bg-gray-100"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter("near")}
          className={`px-3 py-2 rounded-full text-sm ${
            filter === "near" ? "bg-blue-500 text-white" : "bg-gray-100"
          }`}
        >
          Near me
        </button>
        <button
          onClick={() => setFilter("budget")}
          className={`px-3 py-2 rounded-full text-sm ${
            filter === "budget" ? "bg-blue-500 text-white" : "bg-gray-100"
          }`}
        >
          Budget
        </button>
      </div>

      {/* Content */}
      {loading && <div className="text-gray-500">Loading merchants…</div>}
      {error && <div className="text-red-500">{error}</div>}

      {!loading && !error && (
        <div className="space-y-3">
          {merchants.map((m) => (
            <MerchantCard key={m.id} merchant={m} />
          ))}

          {merchants.length === 0 && (
            <div className="text-gray-500">
              No merchants found in this category.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
