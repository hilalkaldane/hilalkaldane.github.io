// src/services/http.js
// Minimal fetch wrappers: publicFetch (no auth) and merchantFetch (adds Authorization if present)

import { getOrCreateDeviceId } from "./merchantDevice";

const API_BASE = "http://localhost:8080";

async function handleResponse(res) {
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);
  if (!res.ok) {
    const err = new Error(body?.message || res.statusText || "Request failed");
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body.data;
}

export async function merchantFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const merchantDeviceId = getOrCreateDeviceId()
  console.log(merchantDeviceId)
  const token = localStorage.getItem("accessToken");
  const headers = {
    "Content-Type": "application/json",
    "X-Device-Id": merchantDeviceId,
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, {
    credentials: "same-origin",
    headers,
    ...options,
    body: options.body ? JSON.stringify(options.body) : options.body,
  });
  return handleResponse(res);
}
