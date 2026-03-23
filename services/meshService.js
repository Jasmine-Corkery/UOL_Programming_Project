// These functions simulate mesh communication features
// In a real implementation these would use Bluetooth
// ,however due to limitaation of Expo it is being mocked here

// simulates sending an emergency alert to another device
export const startMeshBroadcast = async alertData => {
  console.log('Mesh broadcast (mock):', alertData);
};

// simulates scanning for incoming alerts to nearby devices
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
