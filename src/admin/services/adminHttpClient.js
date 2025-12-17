// src/services/http.js
// Minimal fetch wrappers: publicFetch (no auth) and adminFetch (adds Authorization if present)

import { adminLocalStorage, getOrCreateDeviceId } from "./adminDevice.js";
import { redirectToAdminLogin } from "./adminProtectedApi.js";

const API_BASE = "http://192.168.1.104:8080";



async function handleResponse(res) {
  console.log("handle res "+res)
  // 🔐 Handle auth failures globally
  if (res.status === 401 || res.status === 403) {
    console.log(res)
    redirectToAdminLogin();
    throw new Error(res.message);
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

  // ✅ your backend wraps data inside { data }
  return body?.data;
}

export async function httpPost(path, payload) {
  return request(path, {
    method: "POST",
    body: payload != null ? JSON.stringify(payload) : undefined,
  });
}

export async function adminFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const adminDeviceId = getOrCreateDeviceId();
  const token = adminLocalStorage.getItem("adminAccessToken");
  console.log("admin Token "+token)
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
  console.log("fetch respponse "+res)

  return handleResponse(res);
}
