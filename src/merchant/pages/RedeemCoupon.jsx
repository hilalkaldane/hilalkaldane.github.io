import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { campaignApi } from "../../users/services/api";
import QrScanner from "react-qr-scanner"; // 🔹 swapped library

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function RedeemCoupon() {
  const query = useQuery();
  const merchantId = query.get("merchantId");

  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (!merchantId) return;
    campaignApi
      .listCampaigns(merchantId)
      .then(setCampaigns)
      .catch(() => {});
  }, [merchantId]);

  const handleRedeem = async (couponCode) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await campaignApi.redeemCoupon(merchantId, couponCode.trim());
      setResult({ success: true, ...res });
    } catch (e) {
      setResult({ success: false, message: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleIssue = async (campaignId) => {
    setLoading(true);
    try {
      const c = await campaignApi.issueCouponForCampaign(campaignId);
      alert(`Issued coupon: ${c.code}`);
    } catch (e) {
      alert("Issue failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async (scanResult) => {
    if (!scanResult || !scanResult.text) return;

    try {
      const parsed = JSON.parse(scanResult.text);
      console.log(parsed)
      if (parsed.merchantId != merchantId) {
        setResult({
          success: false,
          message: "Merchant mismatch – invalid QR code",
        });
        return;
      }
      await handleRedeem(parsed.couponCode);
      setScanning(false); // stop camera after success
    } catch (err) {
      setResult({ success: false, message: "Invalid QR format" });
    }
  };

  const handleError = (err) => {
    console.error("QR Scan error:", err);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-3">Validate & Redeem</h2>

      {/* Manual entry */}
      <div className="mb-3">
        <label className="block text-sm mb-1">Enter coupon code</label>
        <input
          className="w-full p-2 border rounded"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </div>

      <button
        onClick={() => handleRedeem(code)}
        className="w-full py-2 bg-black text-white rounded mb-3"
        disabled={loading}
      >
        {loading ? "Checking…" : "Validate & Redeem"}
      </button>

      {/* QR Scanner Toggle */}
      <button
        onClick={() => setScanning((s) => !s)}
        className="w-full py-2 bg-blue-600 text-white rounded mb-3"
      >
        {scanning ? "Stop Scanner" : "Scan QR Code"}
      </button>

      {scanning && (
        <div className="mb-3">
          <QrScanner
            delay={300}
            style={{ width: "100%", height: "50vh" }}
            onError={handleError}
            onScan={(data) => handleScan(data)}
            constraints={{ video: { facingMode: "environment" } }}
          />
        </div>
      )}

      {result && (
        <div
          className={`p-3 rounded border ${
            result.success
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <div className="font-semibold">
            {result.success ? "Redeemed" : "Error"}
          </div>
          <div className="text-sm">
            {result.success ? `Code: ${result.code}` : result.message}
          </div>
        </div>
      )}

      <hr className="my-4" />

      {/* Quick Issue Section */}
      <div>
        <h3 className="font-semibold mb-2">Quick Issue (simulate check-in)</h3>
        <div className="space-y-2">
          {campaigns.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between p-2 border rounded"
            >
              <div>
                <div className="font-medium">{c.title}</div>
                <div className="text-xs text-gray-500">{c.discount}</div>
              </div>
              <button
                onClick={() => handleIssue(c.id)}
                className="px-3 py-1 bg-blue-600 text-white rounded"
              >
                Issue
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
