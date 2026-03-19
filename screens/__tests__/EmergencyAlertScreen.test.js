import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import EmergencyAlertScreen from '../../screens/emergencyAlertScreen';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Linking, Alert } from 'react-native';
import DropDetectionService from '../../services/dropDetection';
import { AppContext } from '../../context/AppContext';

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(),
  watchPositionAsync: jest.fn(() => Promise.resolve({ remove: jest.fn() })),
  Accuracy: {
    High: 1,
  },
}));

jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  AndroidNotificationPriority: { HIGH: 'high' },
}));

jest.mock('../../services/dropDetection', () => ({
  start: jest.fn(),
  stop: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('../../services/disasterService', () => ({
  fetchAllDisasters: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../services/femaService', () => ({
  fetchFemaSafeLocations: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../services/riskEngine', () => ({
  calculateRiskScore: jest.fn(() => ({ score: 70, category: 'High' })),
}));

jest.mock('../../services/meshService', () => ({
  broadcastSafeStatus: jest.fn(),
  startMeshListener: jest.fn(),
}));

jest.mock('../../services/alertOptimizationEngine', () => ({
  optimizeAlert: jest.fn(() => []),
}));

const renderWithContext = () => {
  return render(
    <AppContext.Provider value={{ largeIcons: false }}>
      <EmergencyAlertScreen navigation={{ replace: jest.fn() }} />
    </AppContext.Provider>,
  );
};

describe('EmergencyAlertScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    Location.requestForegroundPermissionsAsync.mockResolvedValue({
      status: 'granted',
    });

    Location.getCurrentPositionAsync.mockResolvedValue({
      coords: { latitude: 51.5074, longitude: -0.1278 },
    });

    Location.reverseGeocodeAsync.mockResolvedValue([
      { city: 'London', region: 'UK' },
    ]);

    Location.watchPositionAsync.mockResolvedValue({
      remove: jest.fn(),
    });

    Notifications.requestPermissionsAsync.mockResolvedValue({
      status: 'granted',
    });

    Notifications.scheduleNotificationAsync.mockResolvedValue('mock-id');

    Linking.canOpenURL = jest.fn().mockResolvedValue(true);
    Linking.openURL = jest.fn();
    Alert.alert = jest.fn();
  });

  test('renders header correctly', () => {
    const { getByText } = renderWithContext();
    expect(getByText('Emergency Alerts')).toBeTruthy();
  });

  test('requests permissions on mount', async () => {
    renderWithContext();

    await waitFor(() => {
      expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    });
  });

  test('toggles monitoring switch', async () => {
    const { getByRole } = renderWithContext();

    await waitFor(() => {
      expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    });

    fireEvent(getByRole('switch'), 'valueChange', true);

    await waitFor(() => {
      expect(getByRole('switch').props.value).toBe(true);
    });
  });

  test('simulate emergency button triggers notification', async () => {
    const { getByText } = renderWithContext();

    fireEvent.press(getByText('🧪 Simulate Emergency Alert'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Simulation Active',
        expect.any(String),
      );
    });

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
  });

  test('dismiss alert removes it from screen', async () => {
    const { getByText, queryByText } = renderWithContext();

    const simulateBtn = getByText('🧪 Simulate Emergency Alert');
    fireEvent.press(simulateBtn);

    await waitFor(() => {
      expect(getByText('⚠️ Active Alerts')).toBeTruthy();
    });

    const dismiss = getByText('✕');
    fireEvent.press(dismiss);

    await waitFor(() => {
      expect(queryByText('⚠️ Active Alerts')).toBeNull();
    });
  });

  test('drop detection overlay appears', async () => {
    DropDetectionService.start.mockImplementation(callback => {
      callback();
    });

    const { getByText } = renderWithContext();

    await waitFor(() => {
      expect(getByText('⚠️ Sudden Drop Detected')).toBeTruthy();
    });
  });

  test('calls emergency number when help pressed', async () => {
    DropDetectionService.start.mockImplementation(callback => {
      callback();
    });

    const { getByText } = renderWithContext();

    await waitFor(() => {
      const helpButton = getByText('I Need Help');
      fireEvent.press(helpButton);
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalled();
    });
  });
});
