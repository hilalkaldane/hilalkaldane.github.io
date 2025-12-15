// src/client/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveAdminAuth } from "../auth/adminAuth";
import { adminAuthApi } from "../services/adminProtectedApi";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [adminUserNameId, setUsername] = useState("");
  const [adminUserPassword, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const tokenResponse = await adminAuthApi.login({
        usernameId: adminUserNameId,
        password: adminUserPassword,
      });
      console.log(tokenResponse)
      saveAdminAuth(tokenResponse);
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      console.log(err)
      setError(err?.body?.message || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-md bg-white p-6 shadow"
      >
        {/* ADMIN WARNING */}
        <div className="mb-4 rounded bg-red-600 py-2 text-center">
          <span className="text-lg font-bold tracking-wide text-white">
            ADMIN ONLY
          </span>
        </div>

        <h1 className="mb-4 text-xl font-semibold">Admin Login</h1>

        <div className="mb-3">
          <label className="mb-1 block text-sm">Username</label>
          <input
            className="w-full rounded border px-3 py-2 text-sm"
            value={adminUserNameId}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm">Password</label>
          <input
            className="w-full rounded border px-3 py-2 text-sm"
            type="password"
            value={adminUserPassword}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        {error && (
          <div className="mb-3 text-sm text-red-600">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
