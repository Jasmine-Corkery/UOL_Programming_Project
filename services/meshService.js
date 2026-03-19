export const startMeshBroadcast = async alertData => {
  console.log('Mesh broadcast (mock):', alertData);
};

export const scanForMeshAlerts = async onReceive => {
  console.log('Mesh scan (mock) — BLE not available in Expo Go');
};

export const broadcastSafeStatus = async userId => {
  console.log('Safe status broadcast (mock):', userId);
};

export const startMeshListener = onMessageReceived => {
  console.log('Mesh listener (mock) — BLE not available in Expo Go');
};

export function getConnectivityScore() {
  return 50;
}
