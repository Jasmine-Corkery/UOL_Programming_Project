import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import InteractiveMap from '../interactiveMap';
import { AppContext } from '../../context/AppContext';
import { Alert } from 'react-native';

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' }),
  ),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({
      coords: { latitude: 28.5, longitude: -81.3 },
    }),
  ),
  reverseGeocodeAsync: jest.fn(() =>
    Promise.resolve([{ city: 'Orlando', region: 'FL' }]),
  ),
  Accuracy: { Balanced: 3 },
}));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' }),
  ),
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: props => <View {...props} />,
    Marker: props => <View {...props} />,
    PROVIDER_DEFAULT: 'default',
  };
});

jest.spyOn(Alert, 'alert');

describe('InteractiveMap', () => {
  const renderWithContext = (largeIcons = false) =>
    render(
      <AppContext.Provider value={{ darkMode: false, largeIcons }}>
        <InteractiveMap navigation={{ navigate: jest.fn() }} />
      </AppContext.Provider>,
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders Add Safe Zone button', () => {
    const { getByText } = renderWithContext();
    expect(getByText('➕ Add Safe Zone')).toBeTruthy();
  });

  test('opens modal when Add Safe Zone pressed', () => {
    const { getByText } = renderWithContext();

    fireEvent.press(getByText('➕ Add Safe Zone'));

    expect(getByText('Add Safe Location')).toBeTruthy();
  });

  test('shows alert if adding empty safe zone', async () => {
    const { getByText } = renderWithContext();

    fireEvent.press(getByText('➕ Add Safe Zone'));
    fireEvent.press(getByText('Add'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Invalid Name',
        'Please enter a valid name for your safe location.',
      );
    });
  });

  test('adds new safe zone successfully', async () => {
    const { getByText, getByPlaceholderText } = renderWithContext();

    fireEvent.press(getByText('➕ Add Safe Zone'));

    fireEvent.changeText(
      getByPlaceholderText('Enter location name'),
      'My Safe Spot',
    );

    fireEvent.press(getByText('Add'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Safe Zone Added',
        expect.stringContaining('My Safe Spot'),
      );
    });
  });

  test('largeIcons increases modal title size', () => {
    const { getByText } = renderWithContext(true);

    fireEvent.press(getByText('➕ Add Safe Zone'));

    const title = getByText('Add Safe Location');

    expect(title.props.style.fontSize).toBe(24);
  });
});
