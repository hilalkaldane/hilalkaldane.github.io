import React, { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { merchantProtectedApi, redirectToMerchantLogin } from "../services/merchantApi";

export default function Dashboard() {
  const merchantId = localStorage.getItem("merchantIdPk");
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (!merchantId)
    {
      redirectToMerchantLogin()
    }
    setLoading(true);
    try {
      const res = await merchantProtectedApi.getMonthlyDashboardByDay(10);
      // expect res to be an array of { day, views, issuances, redemptions }
      setChartData(res || []);
    } catch (err) {
      console.error(err);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [merchantId]);

  if (loading) return <div className="p-4">Loading chart…</div>;
  if (!chartData || chartData.length === 0)
    return <div className="p-4">No data</div>;

  const totalIssued = chartData.reduce((sum, d) => sum + d.issuances, 0);
  const totalRedeemed = chartData.reduce((sum, d) => sum + d.redemptions, 0);

  const dates = chartData.map((d) => {
    const date = new Date(d.day);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
  });
  const issuedData = chartData.map((d) => d.issuances);
  const redeemedData = chartData.map((d) => d.redemptions);

  const series = [
    { name: "Issued", data: issuedData },
    { name: "Redeemed", data: redeemedData },
  ];

  const options = {
    chart: { type: "line", height: 300 },
    xaxis: { categories: dates },
    colors: ["#A78BFA", "#60A5FA"],
    dataLabels: { enabled: false },
    stroke: { curve: "smooth" },
    grid: { borderColor: "#eee" },
    tooltip: { shared: true },
  };

  return (
    <div>
      <div className="p-4 border rounded-lg w-full max-w-md">
        <div className="text-gray-500 text-sm mb-2">Totals (Last 10 Days)</div>
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-center flex-1">
            <span className="text-sm font-medium text-gray-600">Issued</span>
            <span className="text-2xl font-bold text-purple-600">
              {totalIssued}
            </span>
          </div>
          <div className="flex flex-col items-center flex-1">
            <span className="text-sm font-medium text-gray-600">Redeemed</span>
            <span className="text-2xl font-bold text-blue-600">
              {totalRedeemed}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 bg-white border rounded mx-auto min-h-md">
        <h3 className="text-lg font-semibold mb-3">
          Issued vs Redeemed (Past 30 Days)
        </h3>
        <Chart options={options} series={series} type="line" height={300} />
      </div>
    </div>
  );
}
