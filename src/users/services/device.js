export function getOrCreateDeviceId() {
  let deviceId = localStorage.getItem("deviceId");
  if (!deviceId) {
    deviceId = self.crypto?.randomUUID
      ? self.crypto.randomUUID()
      : Math.random().toString(36).slice(2);
    localStorage.setItem("deviceId", deviceId);
  }
  return deviceId;
}
