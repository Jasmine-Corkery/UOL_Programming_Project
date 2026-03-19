import AsyncStorage from "@react-native-async-storage/async-storage";

export const storeOfflineAlert = async (alert) => {
  const existing = await AsyncStorage.getItem("offlineAlerts");
  const alerts = existing ? JSON.parse(existing) : [];

  alerts.push(alert);

  await AsyncStorage.setItem("offlineAlerts", JSON.stringify(alerts));
};

export const getOfflineAlerts = async () => {
  const data = await AsyncStorage.getItem("offlineAlerts");
  return data ? JSON.parse(data) : [];
};

export const broadcastSafeStatus = async (userId) => {
  const safeMessage = {
    type: "SAFE_STATUS",
    userId,
    timestamp: Date.now(),
  };

  await startMeshBroadcast(safeMessage);
};
