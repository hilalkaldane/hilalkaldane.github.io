export function getOrCreateDeviceId() {
  let deviceId = localStorage.getItem("adminDeviceId");
  if (!deviceId) {
    deviceId = self.crypto?.randomUUID
      ? self.crypto.randomUUID()
      : Math.random().toString(36).slice(2);
    localStorage.setItem("adminDeviceId", deviceId);
  }
  return deviceId;
}
