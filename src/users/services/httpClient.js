// services/httpClient.js
import { getOrCreateDeviceId } from "./device";

const API_BASE_URL = "http://192.168.1.104:8080";

async function request(path, options = {}) {
  const deviceId = getOrCreateDeviceId();

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Device-Id": deviceId,
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let errorBody;
    try {
      errorBody = await res.json();
    } catch {
      errorBody = null;
    }

    const message =
      errorBody?.message ||
      errorBody?.error ||
      `HTTP ${res.status} ${res.statusText}`;

    throw new Error(message);
  }

  // Support ApiResponse<T> and raw responses
  if (res.status === 204) return null;

  const body = await res.json();
  return body?.data ?? body;
}

export async function httpGet(path) {
  return request(path, { method: "GET" });
}

export async function httpPost(path, payload) {
  return request(path, {
    method: "POST",
    body: payload != null ? JSON.stringify(payload) : undefined,
  });
}
