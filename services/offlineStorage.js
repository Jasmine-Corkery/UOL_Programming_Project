// imports
import AsyncStorage from '@react-native-async-storage/async-storage';
import { startMeshBroadcast } from './meshService';

// store offline alert
export const storeOfflineAlert = async alert => {
  const existing = await AsyncStorage.getItem('offlineAlerts');
  const alerts = existing ? JSON.parse(existing) : [];

  alerts.push(alert);

  await AsyncStorage.setItem('offlineAlerts', JSON.stringify(alerts));
};

// retrieve offline alerts
export const getOfflineAlerts = async () => {
  // gets stored alert data
  const data = await AsyncStorage.getItem('offlineAlerts');
  return data ? JSON.parse(data) : [];
};

// broardcast safe status
export const broadcastSafeStatus = async userId => {
  const safeMessage = {
    type: 'SAFE_STATUS',
    userId,
    timestamp: Date.now(),
  };

  await startMeshBroadcast(safeMessage);
};
