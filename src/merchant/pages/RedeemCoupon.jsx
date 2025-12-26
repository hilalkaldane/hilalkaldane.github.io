import React, { useState } from "react";
import QrScanner from "react-qr-scanner";
import { merchantProtectedApi } from "../services/merchantProtectedApi";
import { merchantLocalStorage } from "../services/merchantDevice";

export default function RedeemCoupon() {
  const merchantNameId = merchantLocalStorage.getItem("merchantNameId");

  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [billAmount, setBillAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleScan = async (scanResult) => {
    if (!scanResult?.text) return;

    try {
      const parsed = JSON.parse(scanResult.text);

      if (String(parsed.merchantNameId) !== String(merchantNameId)) {
        setResult({
          success: false,
          message: "This QR does not belong to your store",
        });
        return;
      }

      setScanning(false);

      setScannedData({
        couponCode: parsed.couponCode,
        campaignId: parsed.campaignId,
        campaignTitle: parsed.campaignTitle || "Campaign",
      });

      setBillAmount("");
      setModalOpen(true);
    } catch {
      setResult({ success: false, message: "Invalid QR code" });
    }
  };

  const handleRedeemConfirm = async () => {
    if (!scannedData) return;

    const bill = Number.parseFloat(billAmount) || 0;

    setSubmitting(true);
    setResult(null);

    try {
      const res = await merchantProtectedApi.redeemCoupon({
        campaignId: scannedData.campaignId,
        couponCode: scannedData.couponCode,
        billAmount: bill,
        extras: { source: "qr", merchantNameId },
      });

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
    <div className="mx-auto max-w-md space-y-4 p-4 ">

      {/* Header */}
      <div className="rounded-lg border bg-white p-4">
        <h2 className="text-lg font-semibold">Redeem Coupon</h2>
        <p className="mt-1 text-sm text-gray-600">
          Scan customer QR to verify and redeem
        </p>
      </div>

      {/* Scanner Card */}
      <div className="rounded-lg border bg-white p-4 space-y-3">
        <button
          onClick={() => {
            setResult(null);
            setScanning(s => !s);
          }}
          className={`w-full rounded py-2 text-sm font-medium ${
            scanning
              ? "bg-gray-200 text-gray-800"
              : "bg-black text-white"
          }`}
        >
          {scanning ? "Stop Scanner" : "Start QR Scan"}
        </button>

        {scanning && (
          <div className="overflow-hidden rounded border">
            <QrScanner
              delay={300}
              style={{ width: "100%", height: "45vh" }}
              onError={console.error}
              onScan={handleScan}
              constraints={{ video: { facingMode: "environment" } }}
            />
          </div>
        )}
      </div>

      {/* Result */}
      {result && (
        <div
          className={`rounded-lg border p-3 ${
            result.success
              ? "border-green-300 bg-green-50"
              : "border-red-300 bg-red-50"
          }`}
        >
          <div className="font-medium">
            {result.success ? "Success" : "Error"}
          </div>
          <div className="text-sm">{result.message}</div>
        </div>
      )}

      {/* Redeem Modal */}
      {modalOpen && scannedData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl space-y-4">

            <div>
              <h3 className="text-lg font-semibold">
                Redeem Coupon
              </h3>
              <p className="text-sm text-gray-600">
                {scannedData.campaignTitle}
              </p>
            </div>

            <div className="rounded bg-gray-50 p-2 text-xs">
              Code:
              <span className="ml-1 font-mono">
                {scannedData.couponCode}
              </span>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Bill Amount (optional)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full rounded border p-2 text-sm focus:outline-none focus:ring"
                placeholder="e.g. 450"
                value={billAmount}
                onChange={(e) => setBillAmount(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setModalOpen(false);
                  setScannedData(null);
                  setBillAmount("");
                }}
                disabled={submitting}
                className="rounded border px-3 py-1 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleRedeemConfirm}
                disabled={submitting}
                className="rounded bg-black px-4 py-1 text-sm text-white disabled:opacity-60"
              >
                {submitting ? "Redeeming…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
