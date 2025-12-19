import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { metadataApi } from "../services/api";

export default function Explore() {
    const navigate = useNavigate();
  /* Skeleton */
  function SkeletonCard() {
    return (
      <div className="mb-4 flex flex-col rounded-lg border border-gray-100 bg-white p-4 shadow-sm animate-pulse">
        <div className="mb-2 h-6 w-3/4 rounded bg-gray-300" />
        <div className="mb-1 h-4 w-1/2 rounded bg-gray-200" />
        <div className="h-3 w-1/3 rounded bg-gray-200" />
      </div>
    );
  }

  const [categoryList, setCategoryList] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const loadCategories = async () => {
    setCategoriesLoading(true);
    try {
      const res = await metadataApi.listCategoriesAndSubcategories();
      const cats = res?.categoryList.filter(Boolean).map((c) => ({
        categoryCode: String(c.categoryCode).trim(),
        categoryName: c.categoryName,
        id: c.categoryCode,
      }));
      console.log(cats);
      // dedupe by categoryCode and sort
      const map = new Map();
      for (const c of cats) {
        if (!map.has(c.categoryCode)) map.set(c.categoryCode, c);
      }
      const uniq = Array.from(map.values()).sort((a, b) =>
        (a.categoryName || "").localeCompare(b.categoryName || "")
      );
      setCategoryList(uniq);
    } catch (err) {
      console.error("Failed to load categories", err);
      setCategoryList([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);
  return (
    <div>
      {/* Categories grid */}
      <section className="mt-4">
        <h3 className="mb-2 px-4 text-xl font-semibold text-gray-900">
          Categories
        </h3>

        {categoriesLoading ? (
          <div className="grid grid-cols-2 gap-4 px-4">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 px-4">
            {categoryList.map((cat) => (
              <button
                key={cat.categoryCode}
                onClick={() => navigate(`/discover/${cat.categoryCode}`)}
                className="flex flex-col items-start rounded-xl border bg-white p-4 shadow hover:bg-gray-50"
              >
                <p className="text-lg font-semibold text-gray-900">
                  {cat.categoryName}
                </p>
                <p className="text-xs text-gray-600">
                  Nearby merchants & deals
                </p>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
