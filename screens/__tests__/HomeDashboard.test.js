import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import HomeDashboard from '../homeDashboard';
import { AppContext } from '../../context/AppContext';

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: false,
    json: async () => [],
  }),
);

jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  AndroidNotificationPriority: { HIGH: 'high' },
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');

  const MockMapView = props => <View {...props} />;
  const MockMarker = props => <View {...props} />;

  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMarker,
    PROVIDER_DEFAULT: 'default',
  };
});

describe('HomeDashboard', () => {
  const mockNavigate = jest.fn();

  const renderWithContext = (largeIcons = false) => {
    return render(
      <AppContext.Provider value={{ darkMode: false, largeIcons }}>
        <HomeDashboard navigation={{ navigate: mockNavigate }} />
      </AppContext.Provider>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        json: async () => [],
      }),
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
  test('renders disaster banner', async () => {
    const { findByText } = renderWithContext();

    expect(await findByText('Active Disaster Alert')).toBeTruthy();
    expect(await findByText('Hurricane - Category 4 Hurricane')).toBeTruthy();
  });

  test('renders quick action buttons', () => {
    const { getByText } = renderWithContext();

    expect(getByText('Nearest Shelter')).toBeTruthy();
    expect(getByText('View Alerts')).toBeTruthy();
    expect(getByText('Local Hotlines')).toBeTruthy();
    expect(getByText('View Map')).toBeTruthy();
  });

  test('navigates to Alerts screen when View Alerts pressed', () => {
    const { getByText } = renderWithContext();

    fireEvent.press(getByText('View Alerts'));

    expect(mockNavigate).toHaveBeenCalledWith('Alerts');
  });

  test('navigates to Map screen when View Map pressed', () => {
    const { getByText } = renderWithContext();

    fireEvent.press(getByText('View Map'));

    expect(mockNavigate).toHaveBeenCalledWith('Map');
  });

  test('renders active alerts list', async () => {
    const { findByText } = renderWithContext();

    expect(await findByText('Hurricane')).toBeTruthy();
    expect(await findByText('Flood')).toBeTruthy();
    expect(await findByText('Wildfire')).toBeTruthy();
  });

  test('pressing alert card navigates to Alerts', async () => {
    const { findByText } = renderWithContext();

    fireEvent.press(await findByText('Hurricane'));

    expect(mockNavigate).toHaveBeenCalledWith('Alerts');
  });

  test('largeIcons increases icon size', async () => {
    const { findByText } = renderWithContext(true);

    const icon = await findByText('🚨');

    expect(icon.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ fontSize: 52 })]),
    );
  });
});
