// src/services/http.js
// Minimal fetch wrappers: publicFetch (no auth) and merchantFetch (adds Authorization if present)

import { clearMerchantAuth } from "../auth/merchantAuth";
import { redirectToMerchantLogin } from "./merchantProtectedApi.js";
import { getOrCreateDeviceId, merchantLocalStorage } from "./merchantDevice";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("REACT_APP_API_BASE_URL is not defined");
}

/**
 * 🔁 Refresh access token ONCE
 * Returns new accessToken or null
 */
async function refreshMerchantToken() {
  const refreshToken = merchantLocalStorage.getItem("refreshToken");
  if (!refreshToken) return null;

  try {
    const merchantDeviceId = getOrCreateDeviceId();

    const headers = {
      "Content-Type": "application/json",
      "X-Device-Id": merchantDeviceId,
    };

    const res = await fetch(`${API_BASE_URL}/api/merchant-auth/refresh`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      clearMerchantAuth();
      return null;
    }

    const json = await res.json();
    const data = json?.data;

    if (!data?.accessToken) return null;

    merchantLocalStorage.setItem("accessToken", data.accessToken);
    if (data.refreshToken) {
      merchantLocalStorage.setItem("refreshToken", data.refreshToken);
    }

    return data.accessToken;
  } catch {
    return null;
  }
}

/**
 * Central response handler
 */
async function handleResponse(res, retryFn, alreadyRetried) {
  if (res.status === 401) {
    // 🔁 Attempt refresh only once
    console.log("Unauthorized");

    if (!alreadyRetried) {
      console.log("retrying");
      const newToken = await refreshMerchantToken();
      if (newToken) {
        return retryFn(true);
      }
    }

    // ❌ Refresh failed or already retried
    clearMerchantAuth();

    // defer redirect so fetch can finish cleanly
    setTimeout(() => {
      redirectToMerchantLogin();
    }, 0);

    throw new Error("Unauthorized");
  }

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  const body = isJson
    ? await res.json().catch(() => null)
    : await res.text().catch(() => null);

  if (!res.ok) {
    const err = new Error(body?.message || res.statusText || "Request failed");
    err.status = res.status;
    err.body = body;
    throw err;
  }

  // ✅ Backend wraps payload in { data }
  return body?.data;
}

/**
 * Merchant authenticated fetch
 */
export async function merchantFetch(
  path,
  options = {},
  alreadyRetried = false
) {
  const url = `${API_BASE_URL}${path}`;
  const merchantDeviceId = getOrCreateDeviceId();
  const token = merchantLocalStorage.getItem("accessToken");

  const headers = {
    "Content-Type": "application/json",
    "X-Device-Id": merchantDeviceId,
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  console.log("calling backend")
  const res = await fetch(url, {
    credentials: "same-origin",
    headers,
    ...options,
    body:
      options.body && typeof options.body !== "string"
        ? JSON.stringify(options.body)
        : options.body,
  });

  return handleResponse(
    res,
    (retried) => merchantFetch(path, options, retried),
    alreadyRetried
  );
}
