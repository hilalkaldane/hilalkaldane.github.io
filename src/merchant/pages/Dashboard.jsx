import React, { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import {
  merchantProtectedApi,
  redirectToMerchantLogin
} from "../services/merchantProtectedApi";
import { merchantLocalStorage } from "../services/merchantDevice";

/* ---------- Date helper (DD-MM-YYYY) ---------- */
const formatDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

/* ---------- Build chart series + totals ---------- */
const buildSeries = (data = []) => {
  const issued = data.map(d => d.i);
  const redeemed = data.map(d => d.r);

  return {
    dates: data.map(d => formatDate(d.d)),
    issued,
    redeemed,
    totalIssued: issued.reduce((a, b) => a + b, 0),
    totalRedeemed: redeemed.reduce((a, b) => a + b, 0)
  };
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
        const allCampaigns =
          await merchantProtectedApi.listCampaigns();

        const couponCampaigns =
          allCampaigns?.filter(c => c.campaignType === "COUPON") || [];

        // 3️⃣ Per-campaign stats
        const statsMap = {};
        for (const c of couponCampaigns) {
          const stats =
            await merchantProtectedApi.getCampaignStats(c.id, days);
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
  const chartOptions = (dates) => ({
    chart: { type: "line", height: 260 },
    xaxis: {
      categories: dates,
      tickAmount: days === 30 ? 6 : dates.length
    },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth" },
    grid: { borderColor: "#eee" },
    tooltip: { shared: true }
  });

  const consolidatedSeries = buildSeries(consolidated);

  return (
    <div className="space-y-10">

      {/* ---------- Days Toggle ---------- */}
      <div className="flex gap-2">
        {[7, 30].map(d => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-3 py-1 text-sm rounded border ${
              days === d
                ? "bg-black text-white"
                : "bg-white text-gray-700"
            }`}
          >
            Last {d} Days
          </button>
        ))}
      </div>

      {/* ================= CONSOLIDATED ================= */}
      <section className="bg-white border rounded p-4 space-y-4">
        <h3 className="text-lg font-semibold">
          Consolidated Performance (Last {days} Days)
        </h3>

        {/* Top counters */}
        <div className="flex gap-4">
          <div className="flex-1 border rounded p-3 text-center">
            <div className="text-xs text-gray-500">Issued</div>
            <div className="text-2xl font-bold">
              {consolidatedSeries.totalIssued}
            </div>
          </div>
          <div className="flex-1 border rounded p-3 text-center">
            <div className="text-xs text-gray-500">Redeemed</div>
            <div className="text-2xl font-bold">
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
              { name: "Redeemed", data: consolidatedSeries.redeemed }
            ]}
            type="line"
            height={260}
          />
        )}
      </section>

      {/* ================= PER CAMPAIGN ================= */}
      {campaigns.map(c => {
        const stats = campaignStats[c.id] || [];
        const s = buildSeries(stats);

        return (
          <section
            key={c.id}
            className="bg-white border rounded p-4 space-y-4"
          >
            <h4 className="text-md font-semibold">
              {c.title}
            </h4>

            {stats.length === 0 ? (
              <div className="text-sm text-gray-500">
                No data yet
              </div>
            ) : (
              <Chart
                options={chartOptions(s.dates)}
                series={[
                  { name: "Issued", data: s.issued },
                  { name: "Redeemed", data: s.redeemed }
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
