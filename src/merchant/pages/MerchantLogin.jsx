// src/client/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveMerchantAuth } from "../auth/merchantAuth";
import { merchantAuthApi } from "../services/merchantProtectedApi";

export default function MerchantLogin() {
  const navigate = useNavigate();
  const [merchantUserNameId, setUsername] = useState("");
  const [merchantUserPassword, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const tokenResponse = await merchantAuthApi.login({ usernameId: merchantUserNameId, password: merchantUserPassword });
      // tokenResponse expected: { accessToken, refreshToken, merchantUserIdPk }
      console.log(tokenResponse)
      saveMerchantAuth(tokenResponse);
      navigate("/client/dashboard", { replace: true });
    } catch (err) {
      setError(err?.body?.message || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-md bg-white p-6 shadow">
        <h1 className="mb-4 text-xl font-semibold">Merchant Login</h1>

        <div className="mb-3">
          <label className="mb-1 block text-sm">Username</label>
          <input className="w-full rounded border px-3 py-2 text-sm" value={merchantUserNameId} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm">Password</label>
          <input className="w-full rounded border px-3 py-2 text-sm" type="password" value={merchantUserPassword} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </div>

        {error && <div className="mb-3 text-sm text-red-600">{error}</div>}

        <button type="submit" disabled={loading} className="w-full rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
