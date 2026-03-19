import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ResourceHubScreen from '../resourceHubScreen';
import { AppContext } from '../../context/AppContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
}));

describe('ResourceHubScreen', () => {
  const renderWithContext = (darkMode = false, largeIcons = false) => {
    return render(
      <AppContext.Provider value={{ darkMode, largeIcons }}>
        <ResourceHubScreen />
      </AppContext.Provider>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.getItem.mockResolvedValue(null);
    jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  });

  test('renders header text', () => {
    const { getByText } = renderWithContext();

    expect(getByText('Resource Hub')).toBeTruthy();
    expect(
      getByText('Essential emergency information at your fingertips'),
    ).toBeTruthy();
  });

  test('renders emergency contacts', () => {
    const { getByText } = renderWithContext();

    expect(getByText('Local Emergency Services')).toBeTruthy();
    expect(getByText('119')).toBeTruthy();
    expect(getByText('Poison Control')).toBeTruthy();
    expect(getByText('1-800-222-1222')).toBeTruthy();
  });

  test('opens 119 when pressed', () => {
    const { getByText } = renderWithContext();

    fireEvent.press(getByText('119'));

    expect(Linking.openURL).toHaveBeenCalledWith('tel:119');
  });

  test('opens FEMA link when pressed', () => {
    const { getByText } = renderWithContext();

    fireEvent.press(getByText('FEMA'));

    expect(Linking.openURL).toHaveBeenCalledWith('https://www.fema.gov');
  });

  test('renders correctly in dark mode', () => {
    const { getByText } = renderWithContext(true, false);

    expect(getByText('Resource Hub')).toBeTruthy();
  });

  test('renders correctly with largeIcons enabled', () => {
    const { getByText } = renderWithContext(false, true);

    expect(getByText('Resource Hub')).toBeTruthy();
  });
});
