import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import PreparednessTaskScreen from '../preparednessTaskScreen';
import { AppContext } from '../../context/AppContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
}));

describe('PreparednessTaskScreen', () => {
  const renderScreen = (contextOverrides = {}) => {
    return render(
      <AppContext.Provider
        value={{
          darkMode: false,
          largeIcons: false,
          ...contextOverrides,
        }}
      >
        <PreparednessTaskScreen />
      </AppContext.Provider>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.getItem.mockResolvedValue(null);
  });

  test('renders default checklist items', () => {
    const { getByText } = renderScreen();

    expect(getByText('water bottles')).toBeTruthy();
    expect(getByText('non-perishable food')).toBeTruthy();
    expect(getByText('first aid kit')).toBeTruthy();
  });

  test('initial progress is 0%', () => {
    const { getByText } = renderScreen();
    expect(getByText('Progress: 0%')).toBeTruthy();
  });

  test('adds a new custom item', () => {
    const { getByPlaceholderText, getByText } = renderScreen();

    const input = getByPlaceholderText('Add custom item...');
    const addButton = getByText('＋');

    fireEvent.changeText(input, 'extra batteries');
    fireEvent.press(addButton);

    expect(getByText('extra batteries')).toBeTruthy();
  });

  test('does not add empty item', () => {
    const { getByText, queryAllByText } = renderScreen();

    const addButton = getByText('＋');

    fireEvent.press(addButton);

    expect(
      queryAllByText(/water bottles|non-perishable food/).length,
    ).toBeGreaterThan(0);
  });

  test('checking item updates progress', () => {
    const { getByText } = renderScreen();

    fireEvent.press(getByText('water bottles'));

    expect(getByText('Progress: 17%')).toBeTruthy();
  });

  test('shows completion badge when all items checked', () => {
    const { getByText } = renderScreen();

    const items = [
      'water bottles',
      'non-perishable food',
      'first aid kit',
      'flashlight with extra batteries',
      'battery-powered or hand-crank radio',
      'whistle',
    ];

    items.forEach(item => {
      fireEvent.press(getByText(item));
    });

    expect(getByText('Safety kit complete! 🏅')).toBeTruthy();
  });

  test('renders correctly in dark mode', () => {
    const { getByText } = renderScreen({ darkMode: true });

    expect(getByText('Safety Kit Checklist')).toBeTruthy();
  });

  test('renders with large icons setting', () => {
    const { getByText } = renderScreen({ largeIcons: true });

    expect(getByText('Safety Kit Checklist')).toBeTruthy();
  });
});
