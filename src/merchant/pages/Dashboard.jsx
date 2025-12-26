import React, { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import {
  merchantProtectedApi,
  redirectToMerchantLogin,
} from "../services/merchantProtectedApi";
import { merchantLocalStorage } from "../services/merchantDevice";
import { formatDate } from "../../shared/utilities";

/* ---------- Build chart series + totals ---------- */
const buildSeries = (data = []) => {
  const withFuture = normalizeWithFutureDays(data, 2);

  const issued = withFuture.map((d) => d.i);
  const redeemed = withFuture.map((d) => d.r);

  return {
    dates: withFuture.map((d) => formatDate(d.d)),
    issued,
    redeemed,
    totalIssued: issued.reduce((a, b) => a + b, 0),
    totalRedeemed: redeemed.reduce((a, b) => a + b, 0),
  };
};

const normalizeWithFutureDays = (data = [], futureDays = 2) => {
  if (!data.length) return [];

  const map = new Map();
  data.forEach((d) => {
    map.set(d.d, { i: d.i, r: d.r });
  });

  const start = new Date(data[0].d);
  const lastReal = new Date(data[data.length - 1].d);

  const end = new Date(lastReal);
  end.setDate(end.getDate() + futureDays);

  const result = [];
  const cur = new Date(start);

  while (cur <= end) {
    const key = cur.toISOString().slice(0, 10);

    if (map.has(key)) {
      const v = map.get(key);
      result.push({
        d: key,
        i: v.i,
        r: v.r,
      });
    } else {
      // 🔴 future → NULL, not 0
      result.push({
        d: key,
        i: null,
        r: null,
      });
    }

    cur.setDate(cur.getDate() + 1);
  }

  return result;
};

export default function Dashboard() {
  const merchantId = merchantLocalStorage.getItem("merchantIdPk");

  const [days, setDays] = useState(30);
  const [consolidated, setConsolidated] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [campaignStats, setCampaignStats] = useState({});
  const [loading, setLoading] = useState(true);

  /* ---------- Load dashboard data ---------- */
  useEffect(() => {
    if (!merchantId) {
      redirectToMerchantLogin();
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        // 1️⃣ Consolidated (active + inactive)
        const consolidatedRes =
          await merchantProtectedApi.getMerchantConsolidatedStats(days);

        // 2️⃣ Coupon campaigns only
        const allCampaigns = await merchantProtectedApi.listCampaigns();

        const couponCampaigns =
          allCampaigns?.filter((c) => c.campaignType === "COUPON") || [];

        // 3️⃣ Per-campaign stats
        const statsMap = {};
        for (const c of couponCampaigns) {
          const stats = await merchantProtectedApi.getCampaignStats(c.id, days);
          statsMap[c.id] = stats || [];
        }

        setConsolidated(consolidatedRes || []);
        setCampaigns(couponCampaigns);
        setCampaignStats(statsMap);
      } catch (e) {
        console.error(e);
        setConsolidated([]);
        setCampaigns([]);
        setCampaignStats({});
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [merchantId, days]);

  if (loading) {
    return <div className="p-4">Loading dashboard…</div>;
  }

  /* ---------- Chart options ---------- */
  const chartOptions = (dates) => {
    const isDark =
      document.documentElement.classList.contains("dark") ||
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    const issuedColor = isDark ? "#e5e7eb" : "#000000"; // readable in dark
    const redeemedColor = "#ff8c00"; // primary

    return {
      chart: {
        type: "line",
        height: 260,
        zoom: { enabled: false },
        pan: { enabled: false },
        toolbar: { show: false },
        selection: { enabled: false },
        foreColor: isDark ? "#e5e7eb" : "#374151", // text
      },

      colors: [issuedColor, redeemedColor],

      xaxis: {
        categories: dates,
        tickAmount: days === 30 ? 6 : dates.length,
        labels: {
          style: {
            colors: isDark ? "#9ca3af" : "#6b7280",
          },
        },
        axisBorder: {
          color: isDark ? "#374151" : "#e5e7eb",
        },
        axisTicks: {
          color: isDark ? "#374151" : "#e5e7eb",
        },
      },

      yaxis: {
        min: 0,
        forceNiceScale: true,
        labels: {
          style: {
            colors: isDark ? "#9ca3af" : "#6b7280",
          },
        },
      },

      dataLabels: { enabled: false },

      stroke: {
        curve: "smooth",
        width: 2,
      },

      grid: {
        borderColor: isDark ? "#374151" : "#e5e7eb",
      },

      tooltip: {
        theme: isDark ? "dark" : "light",
        shared: true,
      },

      legend: {
        labels: {
          colors: isDark ? "#e5e7eb" : "#374151",
        },
      },
    };
  };

  const consolidatedSeries = buildSeries(consolidated);

  return (
    <div className="space-y-5 pt-5 bg-white dark:bg-black">
      {/* ---------- Days Toggle ---------- */}
      <div className="flex gap-2">
        {[7, 30].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-3 py-1 text-sm rounded border ${
              days === d
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            Last {d} Days
          </button>
        ))}
      </div>

      {/* ================= CONSOLIDATED ================= */}
      <section
        className="
  bg-white dark:bg-gray-800
  border border-gray-200 dark:border-gray-700
  rounded p-4 space-y-4
"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Consolidated Performance (Last {days} Days)
        </h3>

        {/* Top counters */}
        <div className="flex gap-4">
          <div className="flex-1 border rounded p-3 text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Issued
            </div>
            <div className="text-2xl font-bold dark:text-white">
              {consolidatedSeries.totalIssued}
            </div>
          </div>
          <div className="flex-1 border rounded p-3 text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Redeemed
            </div>
            <div className="text-2xl font-bold dark:text-primary">
              {consolidatedSeries.totalRedeemed}
            </div>
          </div>
        </div>

        {consolidated.length === 0 ? (
          <div className="text-sm text-gray-500">No data</div>
        ) : (
          <Chart
            options={chartOptions(consolidatedSeries.dates)}
            series={[
              { name: "Issued", data: consolidatedSeries.issued },
              { name: "Redeemed", data: consolidatedSeries.redeemed },
            ]}
            type="line"
            height={260}
          />
        )}
      </section>

      {/* ================= PER CAMPAIGN ================= */}
      {campaigns.map((c) => {
        const stats = campaignStats[c.id] || [];
        const s = buildSeries(stats);

        return (
          <section key={c.id} className="bg-white dark:bg-gray-800
  border border-gray-200 dark:border-gray-700
  rounded p-4 space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{c.title}</h4>

            {stats.length === 0 ? (
              <div className="text-sm text-gray-500">No data yet</div>
            ) : (
              <Chart
                options={chartOptions(s.dates)}
                series={[
                  { name: "Issued", data: s.issued },
                  { name: "Redeemed", data: s.redeemed },
                ]}
                type="line"
                height={240}
              />
            )}
          </section>
        );
      })}
    </div>
  );
}
