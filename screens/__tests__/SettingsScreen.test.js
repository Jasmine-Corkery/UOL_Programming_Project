import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SettingsScreen from '../settingsScreen';
import { AppContext } from '../../context/AppContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

describe('SettingsScreen', () => {
  const mockToggleOffline = jest.fn();
  const mockSetLargeIcons = jest.fn();
  const mockSetColorBlindMode = jest.fn();
  const mockNavigate = jest.fn();

  const renderWithContext = () =>
    render(
      <AppContext.Provider
        value={{
          offlineOnly: false,
          toggleOffline: mockToggleOffline,
          largeIcons: false,
          setLargeIcons: mockSetLargeIcons,
          colorBlindMode: false,
          setColorBlindMode: mockSetColorBlindMode,
        }}
      >
        <SettingsScreen navigation={{ navigate: mockNavigate }} />
      </AppContext.Provider>,
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders main sections', () => {
    const { getByText } = renderWithContext();

    expect(getByText('⚙️ Settings')).toBeTruthy();
    expect(getByText('Notifications')).toBeTruthy();
    expect(getByText('Location')).toBeTruthy();
    expect(getByText('Appearance')).toBeTruthy();
    expect(getByText('Accessibility')).toBeTruthy();
    expect(getByText('Offline Mode')).toBeTruthy();
    expect(getByText('Emergency Contact')).toBeTruthy();
  });

  test('navigates to profile when button pressed', () => {
    const { getByText } = renderWithContext();

    fireEvent.press(getByText('👤 View Profile'));

    expect(mockNavigate).toHaveBeenCalledWith('Profile');
  });

  test('toggles Emergency Alerts switch and saves to storage', async () => {
    const { getAllByRole } = renderWithContext();

    const switches = getAllByRole('switch');
    fireEvent(switches[0], 'valueChange', false);

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'alertsEnabled',
        JSON.stringify(false),
      );
    });
  });

  test('toggles Location switch and saves to storage', async () => {
    const { getAllByRole } = renderWithContext();

    const switches = getAllByRole('switch');
    fireEvent(switches[1], 'valueChange', false);

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'locationEnabled',
        JSON.stringify(false),
      );
    });
  });

  test('toggles Dark Mode and saves to storage', async () => {
    const { getAllByRole } = renderWithContext();

    const switches = getAllByRole('switch');
    fireEvent(switches[2], 'valueChange', true);

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'darkMode',
        JSON.stringify(true),
      );
    });
  });

  test('toggles High Contrast Mode', async () => {
    const { getAllByRole } = renderWithContext();

    const switches = getAllByRole('switch');
    fireEvent(switches[3], 'valueChange', true);

    await waitFor(() => {
      expect(mockSetColorBlindMode).toHaveBeenCalledWith(true);
    });
  });

  test('toggles Large Icons', async () => {
    const { getAllByRole } = renderWithContext();

    const switches = getAllByRole('switch');
    fireEvent(switches[4], 'valueChange', true);

    await waitFor(() => {
      expect(mockSetLargeIcons).toHaveBeenCalledWith(true);
    });
  });

  test('toggles Offline Mode', () => {
    const { getAllByRole } = renderWithContext();

    const switches = getAllByRole('switch');
    fireEvent(switches[5], 'valueChange', true);

    expect(mockToggleOffline).toHaveBeenCalled();
  });

  test('saves emergency contact input', async () => {
    const { getByPlaceholderText } = renderWithContext();

    const input = getByPlaceholderText('Enter phone number');
    fireEvent.changeText(input, '123456789');

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'emergencyNumber',
        '123456789',
      );
    });
  });
});
