import React, { useEffect, useState } from "react";
import { metadataApi, feedApi } from "../services/api";
import { useNavigate } from "react-router-dom";
import ReactGA from "react-ga4";
import { getOrCreateDeviceId } from "../services/device";
import { CacheKeys, CacheTTL } from "../../shared/cacheKeys";
import FeedCampaignCard from "../components/FeedCampaignCard";

/* ================== CONSTANTS ================== */
const PAGE_SIZE = 20;
const TIP_SESSION_KEY = "feed_tip_shown_v1";
const filtersEnabled = false;
                    const showPaymentInfo = true;


const FEED_TIPS = [
  {
    icon: "🔒",
    title: "No login needed",
    subtitle: "Your device acts as your identity for now.",
  },
  {
    icon: "🎁",
    title: "Earn loyalty points",
    subtitle: "You earn points on every successful redemption.",
  },
  {
    icon: "🔥",
    title: "Trending Deals",
    subtitle: "Only best of the deals are shown here.",
  },
  {
     icon: "🔥",
    title: "Exclusive Deals",
    subtitle: "Some deals are exlusively available on FaydaPoint only",
  }
];

/* ================== INFO CARD ================== */
function FeedInfoCard({ title, subtitle }) {
  return (
    <div className="w-full bg-slate-50 dark:bg-white/5">
      <div className="mx-auto max-w-4xl px-6 py-3">
        <p className="text-xs font-medium text-text-main-light dark:text-white">
          {title}
        </p>
        {subtitle && (
          <p className="mt-0.5 text-xs text-text-subtle">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
/* ================== SKELETON ================== */
function SkeletonCard() {
  return (
    <div className="mb-4 flex flex-col rounded-lg border border-gray-100 bg-white p-4 shadow-sm animate-pulse">
      <div className="mb-2 h-6 w-3/4 rounded bg-gray-300" />
      <div className="mb-1 h-4 w-1/2 rounded bg-gray-200" />
      <div className="h-3 w-1/3 rounded bg-gray-200" />
    </div>
  );
}

/* ================== CATEGORY NORMALIZER ================== */
const getCampaignCategoryCode = (campaign) => {
  if (!campaign) return null;
  if (typeof campaign.category === "string" && campaign.category.trim())
    return campaign.category.trim();
  if (campaign.category?.categoryCode)
    return String(campaign.category.categoryCode).trim();
  if (campaign.categoryCode) return String(campaign.categoryCode).trim();
  return null;
};

/* ========================================================= */

export default function Feed() {
  const [categoryList, setCategoryList] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [feedCampaigns, setFeedCampaigns] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);

  const [selectedCategoryCodes, setSelectedCategoryCodes] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [showSessionTip, setShowSessionTip] = useState(false);

  const navigate = useNavigate();

  /* ================== CACHE HELPERS ================== */
  const readCache = () => {
    try {
      const raw = localStorage.getItem(CacheKeys.FEED);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const writeCache = (cache) => {
    try {
      localStorage.setItem(CacheKeys.FEED, JSON.stringify(cache));
    } catch {}
  };

  const isCacheExpired = (cache) => {
    if (!cache) return true;

    // Empty feed is terminal until TTL
    if (cache.isEmpty) {
      return Date.now() - cache.storedAt > CacheTTL.HALF;
    }

    if (cache.nextWindow) {
      const nextTs = Date.parse(cache.nextWindow);
      if (!Number.isNaN(nextTs)) return Date.now() > nextTs;
    }

    return Date.now() - cache.storedAt > CacheTTL.HALF;
  };

  /* ================== MERGE ================== */
  const mergeAppendOnly = (items) => {
    if (!Array.isArray(items) || !items.length) return;
    setFeedCampaigns((prev) => {
      const seen = new Set(prev.map((p) => String(p.campaignId)));
      const fresh = items.filter(
        (i) => i?.campaignId && !seen.has(String(i.campaignId))
      );
      return fresh.length ? [...prev, ...fresh] : prev;
    });
  };

  const persistPageToCache = (pageNumber, items) => {
    if (!Array.isArray(items)) return;
    const cache = readCache() || { pages: {} };
    const existing = cache.pages[pageNumber] || [];
    const ids = new Set(existing.map((p) => String(p.campaignId)));
    cache.pages[pageNumber] = [
      ...existing,
      ...items.filter((i) => !ids.has(String(i.campaignId))),
    ];
    writeCache(cache);
  };

  const setCacheAsInitial = (paged) => {
    const items = paged?.items ?? [];
    writeCache({
      version: paged?.version ?? null,
      nextWindow: paged?.nextWindow ?? null,
      storedAt: Date.now(),
      isEmpty: items.length === 0,
      pages: { 0: items },
    });
  };

  const fetchPageFromServer = async (pageNum) => {
    const resp = await feedApi.getFeed({ page: pageNum, size: PAGE_SIZE });
    return {
      items: Array.isArray(resp?.items) ? resp.items : [],
      raw: resp,
    };
  };

  /* ================== LOAD CATEGORIES ================== */
  const loadCategories = async () => {
    setCategoriesLoading(true);
    try {
      const res = await metadataApi.listCategoriesAndSubcategories();
      const map = new Map();
      res?.categoryList?.forEach((c) => {
        map.set(String(c.categoryCode), {
          categoryCode: String(c.categoryCode),
          categoryName: c.categoryName,
        });
      });
      setCategoryList(
        Array.from(map.values()).sort((a, b) =>
          a.categoryName.localeCompare(b.categoryName)
        )
      );
    } catch {
      setCategoryList([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  /* ================== INITIAL LOAD ================== */
  const loadInitial = async () => {
    setFeedLoading(true);
    try {
      const cache = readCache();
      await loadCategories();

      if (!cache || isCacheExpired(cache)) {
        const p0 = await fetchPageFromServer(0);
        setCacheAsInitial(p0.raw);
        setFeedCampaigns(p0.items);
      } else {
        setFeedCampaigns(Object.values(cache.pages || {}).flat());
      }
    } finally {
      setFeedLoading(false);
    }
  };

  /* ================== PAGINATION ================== */
  const loadNextPage = async () => {
    if (pageLoading || !hasMore) return;
    setPageLoading(true);
    try {
      const nextPage = currentPage + 1;
      const { items } = await fetchPageFromServer(nextPage);
      if (items.length) {
        mergeAppendOnly(items);
        persistPageToCache(nextPage, items);
      }
      setCurrentPage(nextPage);
      setHasMore(items.length === PAGE_SIZE);
    } finally {
      setPageLoading(false);
    }
  };

  /* ================== EFFECT ================== */
  useEffect(() => {
    ReactGA.set({ device_id: getOrCreateDeviceId() });
    loadInitial();

    const alreadyShown = sessionStorage.getItem(TIP_SESSION_KEY) === "1";

    if (!alreadyShown) {
      setShowSessionTip(true);
      sessionStorage.setItem(TIP_SESSION_KEY, "1");
    }
  }, []);

  /* ================== FILTERING ================== */
  const isAllSelected = selectedCategoryCodes.length === 0;

  const filtered = isAllSelected
    ? feedCampaigns
    : feedCampaigns.filter((c) => {
        const code = getCampaignCategoryCode(c);
        return code && selectedCategoryCodes.includes(code);
      });

  const toggleCategory = (code) =>
    setSelectedCategoryCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );

  /* ================== RENDER ================== */
  return (
    <div className="no-scrollbar mx-auto max-w-4xl">
                  {showPaymentInfo && (
                    <FeedInfoCard
                      icon=""
                      title="No payment on app"
                      subtitle="Get deal → Get QR/code → Show at shop & pay there"
                    />
                  )}
      <div className="px-6 pt-4">
        <h1 className="text-2xl text-black dark:text-white font-bold">
          Nearby Deals
        </h1>
      </div>

      {/* Category Pills */}
      {filtersEnabled && (
        <div className="flex overflow-x-auto no-scrollbar gap-3 px-6 pt-2">
          <button
            onClick={() => setSelectedCategoryCodes([])}
            className={`flex-shrink-0 px-4 py-1.5 border border-border-light text-sm font-semibold rounded-full shadow-sm ${
              isAllSelected
                ? "bg-black dark:bg-white text-white dark:text-black"
                : "bg-white dark:bg-black text-black dark:text-white"
            }`}
          >
            All
          </button>

          {categoryList.map((category) => {
            const sel = selectedCategoryCodes.includes(category.categoryCode);
            return (
              <button
                key={category.categoryCode}
                onClick={() => toggleCategory(category.categoryCode)}
                className={`flex-shrink-0 px-4 py-1.5 border border-border-light text-sm font-semibold rounded-full shadow-sm ${
                  sel
                    ? "bg-black dark:bg-white text-white dark:text-black"
                    : "bg-white dark:bg-black text-black dark:text-white"
                }`}
              >
                {category.categoryName}
              </button>
            );
          })}
        </div>
      )}

      {/* Feed */}
      <section className="mt-2">
        {feedLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : filtered.length === 0 ? (
          <p className="px-6 pt-4 text-gray-600">No trending deals.</p>
        ) : (
          <>
            {filtered.map((c, idx) => {
              const showTip =
                showSessionTip && idx === Math.min(5, filtered.length - 1);

              const tip =
                FEED_TIPS[Math.floor(Date.now() / 86400000) % FEED_TIPS.length];

              return (
                <React.Fragment key={String(c.campaignId)}>

                  {showTip && (
                    <FeedInfoCard
                      icon={tip.icon}
                      title={tip.title}
                      subtitle={tip.subtitle}
                    />
                  )}

                  <div className="px-6 py-2">
                    <FeedCampaignCard
                      campaign={c}
                      onClick={() => navigate(`/merchant/${c.merchantNameId}`)}
                    />
                  </div>
                </React.Fragment>
              );
            })}

            <div className="mt-4 flex justify-center px-4 pb-8">
              <button
                onClick={loadNextPage}
                disabled={pageLoading || !hasMore}
                className="rounded-full bg-[#131118] px-6 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {pageLoading
                  ? "Loading..."
                  : hasMore
                  ? "Load more deals"
                  : "More Deals coming soon ⏰ "}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
