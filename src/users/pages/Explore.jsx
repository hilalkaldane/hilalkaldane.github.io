import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { metadataApi } from "../services/api";
import abayaImg from "../../assets/abaya.png";


function SkeletonCard() {
  return (
    <div className="mb-4 flex flex-col rounded-lg border border-gray-100 bg-white p-4 shadow-sm animate-pulse">
      <div className="mb-2 h-6 w-3/4 rounded bg-gray-300" />
      <div className="mb-1 h-4 w-1/2 rounded bg-gray-200" />
      <div className="h-3 w-1/3 rounded bg-gray-200" />
    </div>
  );
}

export default function Explore() {
  const navigate = useNavigate();

  const [categoryList, setCategoryList] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

/*   useEffect(() => {
    const loadCategories = async () => {
      setCategoriesLoading(true);
      try {
        const res = await metadataApi.listCategoriesAndSubcategories();
        const cats =
          res?.categoryList?.filter(Boolean).map((c) => ({
            categoryCode: String(c.categoryCode).trim(),
            categoryName: c.categoryName,
          })) || [];
        setCategoryList(cats);
      } catch (err) {
        console.error("Failed to load categories", err);
        setCategoryList([]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadCategories();
  }, []); */

  return (
    <div>

      <header className="flex items-center justify-between px-6 py-4 pb-2 z-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">
            Explore Categories
          </h1>
          <p className="text-sm font-medium text-slate-400 mt-0.5">
            Discover curated deals nearby
          </p>
        </div>
        {false &&(<button className="flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-white/10 text-slate-700 dark:text-white shadow-sm hover:bg-slate-50 dark:hover:bg-white/20 transition-all border border-slate-100 dark:border-white/5 active:scale-95">
          <span className="material-symbols-outlined text-[22px] text-slate-600 dark:text-slate-300">
            search
          </span>
        </button>)}
      </header>

      {/* Main */}
      <main className="flex-1 overflow-y-auto no-scrollbar px-5 pt-4 space-y-5">

        {/* CARD 1 */}
        <div className="group relative overflow-hidden rounded-3xl shadow-soft dark:shadow-none bg-white dark:bg-slate-800 transition-all active:scale-[0.99] border border-slate-100/60 dark:border-white/5" onClick={() => navigate(`/discover/food`)}>
          <div className="relative h-[210px]">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBuBe4Mr_RT9gilgL4uik5lEbLbUof_o8ji-IA-TETeKj2noYFnTFJ61-UYgUM8_1MieK_K76yLXMchXuw5KRzAEpiYBKfXEpz8Lq4FEIaPM_s8mfeoDydjJ87v8Ec49XrqQ-kxJz_49rj_7rbGiQVxpCCXV0JSoSdOZKd-2QvCgTiWXesjiPkrU0kzaD51ORo-ORwc4VqnRcXsVLyDde7fqVi73SuXJdo8m9DhszKtuq80eeonAVA-1M9ZCLamYK7gApwhyRblNQ')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

            <div className="absolute top-4 right-4">
              <div className="flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 shadow-sm backdrop-blur-md border border-slate-100/50">
                <span className="material-symbols-outlined text-[16px] text-accent-orange font-bold">
                  local_fire_department
                </span>
                <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                  Trending
                </span>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 w-full p-5 pb-4">
              <h2 className="text-[17px] font-bold text-white mb-0.5 leading-tight drop-shadow-sm">
                Food & Dining
              </h2>
              <p className="text-[14px] text-slate-200 font-medium opacity-95">
                Fine dining, cafes & fast food
              </p>
            </div>
          </div>
{false && (
          <div className="flex items-center justify-between bg-white dark:bg-slate-800 px-5 py-3.5 border-t border-slate-50 dark:border-white/5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-500/20 text-accent-orange">
                <span className="material-symbols-outlined text-[16px]">
                  percent
                </span>
              </span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 tracking-wide">
                Up to 60% OFF
              </span>
            </div>

           <div className="flex items-center text-slate-400 dark:text-slate-500 group-hover:text-accent-orange transition-colors duration-300">
              <span className="text-[14px] font-medium">50+ offers</span>
              <span className="material-symbols-outlined text-[16px] ml-1">
                arrow_forward
              </span>
            </div>
          </div>)}
        </div>

        {/* GRID */}
        <div className="grid grid-cols-2 gap-4">

          {/* Fashion */}
          <div className="group relative overflow-hidden rounded-3xl shadow-soft aspect-[4/5] active:scale-[0.98] transition-transform border border-white/40 dark:border-white/5" onClick={() => navigate(`/discover/fashion`)}>
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC_VWYoKXlKCRrFQDxC5SohrD-tiXIq_YrX5TdKlAPEJaXELQsY5Pemz1rafJk2KDLLzmZBBVWhm8g-JgAcC3dFGFJgF1UEEEh2Z3hECYl5ryjQnbkkzV3JTf1CfDHj1Lw2GELXWqL3ew8McQjIrZbMfHqDmAd2XZZdSfGUqVem5KZcKiKUnloAX_UsnVYSPgF4JJnX-0_m2fReCOjn0e6qPpk0hWttC1jnnzFpNZBmrw7QRSiXNVqlzGk1Tpb_v44MVm0GM5sKTg')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
            <div className="relative h-full flex flex-col justify-end p-4">
              <span className="material-symbols-outlined text-white text-[20px] mb-3 bg-white/20 w-9 h-9 flex items-center justify-center rounded-full backdrop-blur-md border border-white/10 shadow-sm">
                checkroom
              </span>
              <h2 className="text-[17px] font-bold text-white leading-tight">
                Fashion &<br />Lifestyle
              </h2>
              <p className="text-[14px] text-slate-200 mt-1 font-medium">
                New Arrivals
              </p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-3xl shadow-soft aspect-[4/5] active:scale-[0.98] transition-transform border border-white/40 dark:border-white/5" onClick={() => navigate(`/discover/modesty-wear`)}>
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
              style={{
                backgroundImage:
                  `url(${abayaImg})`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
            <div className="relative h-full flex flex-col justify-end p-4">
              <span className="material-symbols-outlined text-white text-[20px] mb-3 bg-white/20 w-9 h-9 flex items-center justify-center rounded-full backdrop-blur-md border border-white/10 shadow-sm">
                spa
              </span>
              <h2 className="text-[17px] font-bold text-white leading-tight">
                Modesty Wear
              </h2>
              <p className="text-[14px] text-slate-200 mt-1 font-medium">
                Eid Special
              </p>
            </div>
          </div>
        </div>

        <div className="h-4" />
      </main>
    </div>
  );
}
