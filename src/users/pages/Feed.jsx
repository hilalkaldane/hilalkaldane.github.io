import React, { useEffect, useState } from "react";
import { categoryApi, feedApi, merchantApi } from "../services/api";
import { useNavigate } from "react-router-dom";

function SkeletonCard() {
  return (
    <div className="mb-4 flex flex-col rounded-lg border border-gray-100 bg-white p-4 shadow-sm animate-pulse">
      <div className="mb-2 h-6 w-3/4 rounded bg-gray-300" />
      <div className="mb-1 h-4 w-1/2 rounded bg-gray-200" />
      <div className="h-3 w-1/3 rounded bg-gray-200" />
    </div>
  );
}

export default function Feed() {
  const [categoryList, setCategoryList] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [feedCampaigns, setFeedCampaigns] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);

  // merchantNameId -> merchant data
  const [merchantByNameIdMap, setMerchantByNameIdMap] = useState({});

  // [] = All categories; otherwise multiselect list of categoryCodes
  const [selectedCategoryCodes, setSelectedCategoryCodes] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeedData = async () => {
      setCategoriesLoading(true);
      setFeedLoading(true);

      try {
        // Fetch category metadata + feed in parallel
        const [categoryMetadataList, feedItems] = await Promise.all([
          categoryApi.listCategories(),
          feedApi.getFeed(),
        ]);

        const categoryList = Array.isArray(categoryMetadataList)
          ? categoryMetadataList
              .map((item) => item.category)
              .sort((a, b) =>
                a.categoryName.localeCompare(b.categoryName)
              )
          : [];

        const feedCampaigns = Array.isArray(feedItems) ? feedItems : [];

        setCategoryList(categoryList);
        setFeedCampaigns(feedCampaigns);

        // Extract unique merchantNameIds from feed
        const merchantNameIds = [
          ...new Set(
            feedCampaigns
              .map((campaign) => campaign.merchantNameId)
              .filter(Boolean)
          ),
        ];

        // Fetch merchants
        const merchantResponses = await Promise.all(
          merchantNameIds.map(async (merchantNameId) => {
            try {
              return await merchantApi.getMerchantLocal(merchantNameId);
            } catch (error) {
              console.error(
                "Failed to fetch merchant",
                merchantNameId,
                error
              );
              return null;
            }
          })
        );

        const merchantByNameIdMap = {};

        merchantResponses.forEach((merchant) => {
          if (!merchant || !merchant.merchantNameId) return;

          const merchantCategory = categoryList.find(
            (category) =>
              category.categoryCode === merchant.category
          );

          merchantByNameIdMap[merchant.merchantNameId] = {
            ...merchant,
            categoryLabel: merchantCategory
              ? merchantCategory.categoryName
              : null,
          };
        });

        setMerchantByNameIdMap(merchantByNameIdMap);
      } catch (error) {
        console.error("Error loading home page data", error);
      } finally {
        setCategoriesLoading(false);
        setFeedLoading(false);
      }
    };

    fetchFeedData();
  }, []);

  const isAllSelected = selectedCategoryCodes.length === 0;

  const handleSelectAll = () => {
    setSelectedCategoryCodes([]); // reset to "All"
  };

  const handleToggleCategory = (categoryCode) => {
    setSelectedCategoryCodes((prev) => {
      if (prev.includes(categoryCode)) {
        // remove if already selected
        const next = prev.filter((code) => code !== categoryCode);
        return next;
      }
      // add new selection
      return [...prev, categoryCode];
    });
  };

  // Filter campaigns by selected categories (via merchant.category)
  const filteredCampaigns = isAllSelected
    ? feedCampaigns
    : feedCampaigns.filter((campaign) => {
        const merchant = merchantByNameIdMap[campaign.merchantNameId];
        if (!merchant) return false;
        return selectedCategoryCodes.includes(merchant.category);
      });

  return (
    <div className="no-scrollbar mx-auto max-w-4xl pb-16">
      {/* Category pills (filter) */}
      <div className="flex flex-wrap gap-2 px-3 pt-3">
        {/* "All" pill */}
        <button
          type="button"
          onClick={handleSelectAll}
          className={[
            "flex h-8 items-center rounded-xl px-4 text-sm font-medium border",
            isAllSelected
              ? "bg-[#131118] text-white border-[#131118]"
              : "bg-[#f2f0f4] text-[#131118] border-transparent",
          ].join(" ")}
        >
          All
        </button>

        {/* Category pills */}
        {categoryList.map((category) => {
          const isSelected = selectedCategoryCodes.includes(
            category.categoryCode
          );

          return (
            <button
              key={category.id || category.categoryCode}
              type="button"
              onClick={() => handleToggleCategory(category.categoryCode)}
              className={[
                "flex h-8 items-center rounded-xl px-4 text-sm font-medium border",
                isSelected
                  ? "bg-[#131118] text-white border-[#131118]"
                  : "bg-[#f2f0f4] text-[#131118] border-transparent",
              ].join(" ")}
            >
              {category.categoryName}
            </button>
          );
        })}
      </div>

      {/* Trending deals (filtered) */}
      <section className="mt-2">
        <h3 className="px-4 text-xl font-semibold text-gray-900">
          Trending Deals
        </h3>

        {feedLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : filteredCampaigns.length === 0 ? (
          <p className="px-4 pt-2 text-gray-600">
            {isAllSelected
              ? "No trending deals at the moment."
              : "No trending deals in these categories."}
          </p>
        ) : (
          filteredCampaigns.map((campaign) => {
            const merchant =
              merchantByNameIdMap[campaign.merchantNameId];

            return (
              <div key={campaign.id} className="p-4 pb-2 pt-2">
                <div className="flex items-stretch justify-between gap-4 rounded-xl bg-white p-4 shadow-[0_0_4px_rgba(0,0,0,0.1)]">
                  <div className="flex flex-[2_2_0px] flex-col gap-1">
                    <p className="text-sm font-normal leading-normal text-[#6e6388]">
                      {campaign.title}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/merchant/${campaign.merchantNameId}`)
                      }
                      aria-label={`View campaign by merchant ${
                        merchant?.name || "unknown"
                      }`}
                      className="text-left text-base font-bold leading-tight text-[#131118] focus:outline-none"
                    >
                      {merchant?.name || "Loading merchant..."}
                    </button>

                    <p className="text-sm font-normal leading-normal text-[#6e6388]">
                      {merchant?.categoryLabel || "Merchant"}
                    </p>
                  </div>

                  <div
                    className="aspect-video w-full flex-1 rounded-xl bg-cover bg-center bg-no-repeat"
                    style={{
                      backgroundImage: merchant?.profile
                        ? `url("${merchant.profile}?w=122&h=70&fit=crop&q=80&auto=format")`
                        : "none",
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Categories grid */}
      <section className="mt-4">
        <h3 className="mb-2 px-4 text-xl font-semibold text-gray-900">
          Categories
        </h3>

        {categoriesLoading ? (
          <div className="grid grid-cols-2 gap-4 px-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 px-4">
            {categoryList.map((category) => (
              <button
                key={category.id || category.categoryCode}
                onClick={() => navigate(`/discover/${category.id}`)}
                className="flex flex-col items-start rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                type="button"
              >
                <div className="mt-1 text-lg font-semibold text-gray-900">
                  {category.categoryName}
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  Nearby merchants & deals
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
