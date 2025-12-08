export function getOrCreateDeviceId() {
  let deviceId = localStorage.getItem("merchantDeviceId");
  if (!deviceId) {
    deviceId = self.crypto?.randomUUID
      ? self.crypto.randomUUID()
      : Math.random().toString(36).slice(2);
    localStorage.setItem("merchantDeviceId", deviceId);
  }
  return deviceId;
}
