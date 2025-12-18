import React, { useEffect, useState } from "react";
import { categoryApi, feedApi } from "../services/api";
import { useNavigate } from "react-router-dom";
import ReactGA from "react-ga4";
import { getOrCreateDeviceId } from "../services/device";

/* Constants */
const STORAGE_KEY = "feedCache_v1";
const CACHE_TTL_MS = 60 * 60 * 1000;
const PAGE_SIZE = 20;

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

/* Helpers to normalize category from different possible shapes */
const getCampaignCategoryCode = (campaign) => {
  if (!campaign) return null;
  if (
    typeof campaign.category === "string" &&
    campaign.category.trim() !== ""
  ) {
    return campaign.category.trim();
  }
  if (
    campaign.category &&
    typeof campaign.category === "object" &&
    campaign.category.categoryCode
  ) {
    return String(campaign.category.categoryCode).trim();
  }
  if (campaign.categoryCode && typeof campaign.categoryCode === "string") {
    return campaign.categoryCode.trim();
  }
  return null;
};

export default function Feed() {
  const [categoryList, setCategoryList] = useState([]); // [{ categoryCode, categoryName, id }]
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [feedCampaigns, setFeedCampaigns] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);

  const [selectedCategoryCodes, setSelectedCategoryCodes] = useState([]); // [] = All

  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const navigate = useNavigate();

  /* localStorage helpers */
  const readCache = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };
  const writeCache = (cache) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
    } catch {}
  };
  const isCacheExpired = (cache) => {
    if (!cache) return true;
    if (cache.nextWindow) {
      const nextTs = Date.parse(cache.nextWindow);
      if (!Number.isNaN(nextTs)) return Date.now() > nextTs;
    }
    if (cache.storedAt) return Date.now() - cache.storedAt > CACHE_TTL_MS;
    return true;
  };

  /* append-only merge */
  const mergeAppendOnly = (items) => {
    if (!Array.isArray(items) || items.length === 0) return;
    setFeedCampaigns((prev) => {
      const existing = new Set(prev.map((p) => String(p.campaignId)));
      const fresh = items.filter(
        (x) => x && x.campaignId && !existing.has(String(x.campaignId))
      );
      return fresh.length ? [...prev, ...fresh] : prev;
    });
  };

  const persistPageToCache = (pageNumber, items) => {
    if (!Array.isArray(items)) return;
    const cache = readCache() || {
      version: null,
      nextWindow: null,
      storedAt: null,
      pages: {},
    };
    const existingPage = Array.isArray(cache.pages?.[pageNumber])
      ? cache.pages[pageNumber]
      : [];
    const existingIds = new Set(existingPage.map((p) => String(p.campaignId)));
    const merged = [
      ...existingPage,
      ...items.filter((i) => !existingIds.has(String(i.campaignId))),
    ];
    cache.pages = { ...(cache.pages || {}), [pageNumber]: merged };
    // per spec: do not update storedAt/version here
    writeCache(cache);
  };

  const setCacheAsInitial = (paged) => {
    const items = Array.isArray(paged?.items)
      ? paged.items
      : Array.isArray(paged)
      ? paged
      : [];
    const version = paged?.version ?? null;
    const nextWindow = paged?.nextWindow ?? null;
    const now = Date.now();
    const cache = {
      version: version == null ? null : String(version),
      nextWindow: nextWindow ?? null,
      storedAt: now,
      pages: { 0: items },
    };
    writeCache(cache);
  };

  const fetchPageFromServer = async (pageNum) => {
    const resp = await feedApi.getFeed({ page: pageNum, size: PAGE_SIZE });
    const items = Array.isArray(resp?.items)
      ? resp.items
      : Array.isArray(resp)
      ? resp
      : [];
    const version = resp?.version ?? null;
    const nextWindow = resp?.nextWindow ?? null;
    return { items, version, nextWindow, raw: resp };
  };

  /* load categories: accept either array or { success,message,data } wrapper */
  const loadCategories = async () => {
    setCategoriesLoading(true);
    try {
      const res = await categoryApi.listCategories();
      const cats = res?.categoryList
        .filter(Boolean)
        .map((c) => ({
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

  /* initial load logic (page0, then page1) */
  const loadInitial = async () => {
    setFeedLoading(true);
    setCurrentPage(0);
    setHasMore(true);
    try {
      const cache = readCache();
      await loadCategories();

      if (!cache) {
        const p0 = await fetchPageFromServer(0);
        setCacheAsInitial(p0.raw);
        setFeedCampaigns(p0.items);

        const p1 = await fetchPageFromServer(1);
        if (p1.items?.length) {
          mergeAppendOnly(p1.items);
          persistPageToCache(1, p1.items);
        }
        setHasMore((p1.items?.length ?? 0) === PAGE_SIZE);
        setCurrentPage(p1.items?.length ? 1 : 0);
      } else {
        const expired = isCacheExpired(cache);
        if (!expired) {
          const pages = cache.pages || {};
          const pageNums = Object.keys(pages)
            .map(Number)
            .filter(Number.isFinite)
            .sort((a, b) => a - b);
          const concat = pageNums.reduce(
            (acc, pn) => [
              ...acc,
              ...(Array.isArray(pages[pn]) ? pages[pn] : []),
            ],
            []
          );
          setFeedCampaigns(concat);
          const highest = pageNums.length ? pageNums[pageNums.length - 1] : 0;
          setCurrentPage(highest);
          setHasMore((cache.pages?.[highest]?.length ?? 0) === PAGE_SIZE);
        } else {
          const p0 = await fetchPageFromServer(0);
          setCacheAsInitial(p0.raw);
          setFeedCampaigns(p0.items);

          const p1 = await fetchPageFromServer(1);
          if (p1.items?.length) {
            mergeAppendOnly(p1.items);
            persistPageToCache(1, p1.items);
          }
          setHasMore((p1.items?.length ?? 0) === PAGE_SIZE);
          setCurrentPage(p1.items?.length ? 1 : 0);
        }
      }
    } catch (err) {
      console.error("Initial load failed", err);
      setFeedCampaigns([]);
      setHasMore(false);
    } finally {
      setFeedLoading(false);
    }
  };

  /* load next page on demand */
  const loadNextPage = async () => {
    if (pageLoading || !hasMore) return;
    setPageLoading(true);
    try {
      const nextPage = currentPage + 1;
      const { items } = await fetchPageFromServer(nextPage);
      if (items?.length) {
        mergeAppendOnly(items);
        persistPageToCache(nextPage, items);
      }
      setCurrentPage(nextPage);
      setHasMore((items?.length ?? 0) === PAGE_SIZE);
    } catch (err) {
      console.error("Failed to load next page", err);
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    ReactGA.set({
      device_id: getOrCreateDeviceId(),
    });
    loadInitial();
  }, []);

  /* Category helpers */
  const isAllSelected = selectedCategoryCodes.length === 0;
  const toggleCategory = (code) =>
    setSelectedCategoryCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );

  /* Filtering: use normalized campaign category code (string). If campaign has no category -> exclude when filter active */
  const filtered = isAllSelected
    ? feedCampaigns
    : feedCampaigns.filter((c) => {
        const catCode = getCampaignCategoryCode(c);
        return catCode && selectedCategoryCodes.includes(catCode);
      });

  const formatValidUntil = (d) => {
    if (!d) return null;
    try {
      return new Date(d).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    } catch {
      return null;
    }
  };

  const handleMerchantClick = (merchantNameId) => {
    if (!merchantNameId) return;
    navigate(`/merchant/${merchantNameId}`);
  };

  return (
    <div className="no-scrollbar mx-auto max-w-4xl pb-16">
      {/* Category pills */}
      <div className="flex flex-wrap gap-2 px-3 pt-3">
        <button
          onClick={() => setSelectedCategoryCodes([])}
          className={`flex h-8 items-center rounded-xl px-4 text-sm font-medium border ${
            isAllSelected
              ? "bg-[#131118] text-white border-[#131118]"
              : "bg-[#f2f0f4] text-[#131118]"
          }`}
        >
          All
        </button>

        {categoryList.map((cat) => {
          const sel = selectedCategoryCodes.includes(cat.categoryCode);
          return (
            <button
              key={cat.categoryCode}
              onClick={() => toggleCategory(cat.categoryCode)}
              className={`flex h-8 items-center rounded-xl px-4 text-sm font-medium border ${
                sel
                  ? "bg-[#131118] text-white border-[#131118]"
                  : "bg-[#f2f0f4] text-[#131118]"
              }`}
            >
              {cat.categoryName}
            </button>
          );
        })}
      </div>

      {/* Feed */}
      <section className="mt-2">
        <h3 className="px-4 text-xl font-semibold text-gray-900">
          Trending Deals
        </h3>

        {feedLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : filtered.length === 0 ? (
          <p className="px-4 pt-2 text-gray-600">No trending deals.</p>
        ) : (
          <>
            {filtered.map((c) => {
              const name = c.merchantName || "Merchant";
              const img = c.merchantProfile || null;
              return (
                <div key={String(c.campaignId)} className="p-4 pb-2 pt-2">
                  <div className="flex items-stretch justify-between gap-4 rounded-xl bg-white p-4 shadow">
                    <div className="flex flex-[2_2_0px] flex-col gap-1">
                      <p className="text-sm font-normal text-[#6e6388]">
                        {c.title}
                      </p>

                      <button
                        onClick={() => handleMerchantClick(c.merchantNameId)}
                        className="text-left text-base font-bold text-[#131118]"
                      >
                        {name}
                      </button>

                      {c.description && (
                        <p className="text-sm text-gray-600">{c.description}</p>
                      )}
                      {c.validUntil && (
                        <p className="text-xs text-gray-500">
                          Valid until: {formatValidUntil(c.validUntil)}
                        </p>
                      )}
                    </div>

                    <div
                      className="aspect-video w-full flex-1 rounded-xl bg-cover bg-center bg-no-repeat"
                      style={{
                        backgroundImage: img
                          ? `url("${img + "?w=200&h=200&fit=crop"}")`
                          : "none",
                      }}
                    />
                  </div>
                </div>
              );
            })}

            <div className="mt-4 flex justify-center px-4 pb-8">
              <button
                onClick={loadNextPage}
                disabled={pageLoading || !hasMore}
                className="rounded-full bg-[#131118] px-6 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
              >
                {pageLoading
                  ? "Loading..."
                  : hasMore
                  ? "Load more deals"
                  : "No more deals"}
              </button>
            </div>
          </>
        )}
      </section>

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
                onClick={() => navigate(`/discover/${cat.id}`)}
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
