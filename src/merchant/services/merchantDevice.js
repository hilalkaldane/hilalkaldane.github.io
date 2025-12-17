export function getOrCreateDeviceId() {
  let deviceId = merchantLocalStorage.getItem("merchantDeviceId");
  if (!deviceId) {
    deviceId = self.crypto?.randomUUID
      ? self.crypto.randomUUID()
      : Math.random().toString(36).slice(2);
    merchantLocalStorage.setItem("merchantDeviceId", deviceId);
  }
  return deviceId;
}

const MERCHANT_LOCAL_STORAGE = "merchantLocalStorage/";

export const merchantLocalStorage =
{
  getItem(key)  
  {
    return localStorage.getItem(`${MERCHANT_LOCAL_STORAGE}${key}`)
  },
  removeItem(key)
  {
    localStorage.removeItem(`${MERCHANT_LOCAL_STORAGE}${key}`)
  },
  setItem(key, value)
  {
    localStorage.setItem(`${MERCHANT_LOCAL_STORAGE}${key}`,value)
  }
}
