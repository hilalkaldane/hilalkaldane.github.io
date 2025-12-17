export function getOrCreateDeviceId() {
  let deviceId = adminLocalStorage.getItem("adminDeviceId");
  if (!deviceId) {
    deviceId = self.crypto?.randomUUID
      ? self.crypto.randomUUID()
      : Math.random().toString(36).slice(2);
    adminLocalStorage.setItem("adminDeviceId", deviceId);
  }
  return deviceId;
}

const ADMIN_LOCAL_STORAGE = "adminLocalStorage/";

export const adminLocalStorage =
{
  getItem(key)  
  {
    return localStorage.getItem(`${ADMIN_LOCAL_STORAGE}${key}`)
  },
  removeItem(key)
  {
    localStorage.removeItem(`${ADMIN_LOCAL_STORAGE}${key}`)
  },
  setItem(key, value)
  {
    localStorage.setItem(`${ADMIN_LOCAL_STORAGE}${key}`,value)
  }
}