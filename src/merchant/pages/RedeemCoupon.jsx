// src/pages/RedeemCoupon.jsx (or similar)

import React, { useState } from "react";
import QrScanner from "react-qr-scanner";
import { merchantProtectedApi } from "../services/merchantProtectedApi";
import { merchantLocalStorage } from "../services/merchantDevice";

export default function RedeemCoupon() {
  const merchantNameId = merchantLocalStorage.getItem("merchantNameId");

  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [scannedData, setScannedData] = useState(null); // { couponCode, campaignId, campaignTitle }
  const [billAmount, setBillAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleScan = async (scanResult) => {
    if (!scanResult || !scanResult.text) return;

    try {
      const parsed = JSON.parse(scanResult.text);
      console.log(parsed);

      if (String(parsed.merchantNameId) !== String(merchantNameId)) {
        setResult({
          success: false,
          message: "Merchant mismatch – invalid QR code",
        });
        return;
      }

      // Stop scanner while confirming
      setScanning(false);

      setScannedData({
        couponCode: parsed.couponCode,
        campaignId: parsed.campaignId,
        campaignTitle: parsed.campaignTitle || "Campaign",
      });
      setBillAmount("");
      setModalOpen(true);
    } catch (err) {
      console.error("QR parse error:", err);
      setResult({ success: false, message: "Invalid QR format" });
    }
  };

  const handleError = (err) => {
    console.error("QR Scan error:", err);
  };

  const handleRedeemConfirm = async () => {
    if (!scannedData) return;

    const parsedBill = parseFloat(billAmount);
    const bill = Number.isFinite(parsedBill) ? parsedBill : 0;

    const payload = {
      campaignId: scannedData.campaignId,          // UUID string from QR
      couponCode: scannedData.couponCode,
      billAmount: bill,
      extras: {
        source: "qr",
        merchantNameId,
      },
    };

    setSubmitting(true);
    setResult(null);

    try {
      const res = await merchantProtectedApi.redeemCoupon(payload);
      // res is RedemptionSuccessfulResponse from backend (via ApiResponse.data)
      setResult({
        success: true,
        message: res?.message || "Coupon redeemed successfully",
      });
      setModalOpen(false);
      setScannedData(null);
      setBillAmount("");
    } catch (e) {
      setResult({ success: false, message: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="mb-3 text-xl font-semibold">Redeem via QR</h2>

      {/* QR Scanner Toggle */}
      <button
        onClick={() => setScanning((s) => !s)}
        className="mb-3 w-full rounded bg-blue-600 py-2 text-white"
      >
        {scanning ? "Stop Scanner" : "Scan QR Code"}
      </button>

      {scanning && (
        <div className="mb-3">
          <QrScanner
            delay={300}
            style={{ width: "100%", height: "50vh" }}
            onError={handleError}
            onScan={handleScan}
            constraints={{ video: { facingMode: "environment" } }}
          />
        </div>
      )}

      {result && (
        <div
          className={`rounded border p-3 ${
            result.success
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
          }`}
        >
          <div className="font-semibold">
            {result.success ? "Redeemed" : "Error"}
          </div>
          <div className="text-sm">{result.message}</div>
        </div>
      )}

      {/* Modal: confirm redemption */}
      {modalOpen && scannedData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-lg bg-white p-4 shadow-lg">
            <h3 className="mb-2 text-lg font-semibold">
              Redeem {scannedData.campaignTitle}
            </h3>
            <div className="mb-1 text-xs text-gray-600">
              Coupon code: <span className="font-mono">{scannedData.couponCode}</span>
            </div>

            <div className="mt-3 mb-3">
              <label className="mb-1 block text-sm">Bill amount</label>
              <input
                type="number"
                className="w-full rounded border p-2 text-sm"
                value={billAmount}
                onChange={(e) => setBillAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded border px-3 py-1 text-sm"
                onClick={() => {
                  setModalOpen(false);
                  setScannedData(null);
                  setBillAmount("");
                }}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded bg-black px-3 py-1 text-sm text-white disabled:opacity-60"
                onClick={handleRedeemConfirm}
                disabled={submitting}
              >
                {submitting ? "Redeeming…" : "Redeem"}
              </button>
            </div>
          </div>
        </div>
      )}

      <hr className="my-4" />
    </div>
  );
}
