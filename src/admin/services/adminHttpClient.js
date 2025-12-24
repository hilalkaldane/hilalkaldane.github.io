// src/services/http.js
// Minimal fetch wrappers: publicFetch (no auth) and adminFetch (adds Authorization if present)

import { adminLocalStorage, getOrCreateDeviceId } from "./adminDevice.js";
import { redirectToAdminLogin } from "./adminProtectedApi.js";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("REACT_APP_API_BASE_URL is not defined");
}



async function handleResponse(res) {
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  const body = isJson
    ? await res.json().catch(() => null)
    : await res.text().catch(() => null);

  if (res.status === 401 || res.status === 403) {
    redirectToAdminLogin();
    throw new Error(body?.message || "Unauthorized");
  }

  if (!res.ok) {
    const err = new Error(body?.message || res.statusText || "Request failed");
    err.status = res.status;
    throw err;
  }

  // 🔙 RESTORE OLD CONTRACT
  return body?.data;
}

export async function httpPost(path, payload) {
  return request(path, {
    method: "POST",
    body: payload != null ? JSON.stringify(payload) : undefined,
  });
}

export async function adminFetch(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const adminDeviceId = getOrCreateDeviceId();
  const token = adminLocalStorage.getItem("adminAccessToken");
  const headers = {
    "Content-Type": "application/json",
    "X-Device-Id": adminDeviceId,
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    credentials: "same-origin",
    headers,
    ...options,
    body:
      options.body && typeof options.body !== "string"
        ? JSON.stringify(options.body)
        : options.body,
  });

  return handleResponse(res);
}

export async function adminFetchRaw(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const token = adminLocalStorage.getItem("adminAccessToken");

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(options.headers || {}),
    },
    ...options,
    body:
      options.body && typeof options.body !== "string"
        ? JSON.stringify(options.body)
        : options.body,
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const err = new Error(body?.message || "Request failed");
    err.status = res.status;
    err.body = body;
    throw err;
  }

  return body; // full envelope
}
