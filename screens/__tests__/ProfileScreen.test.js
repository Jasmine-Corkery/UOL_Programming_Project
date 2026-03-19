import React, { useContext } from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import ProfileScreen from '../profileScreen';
import { AppContext } from '../../context/AppContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('ProfileScreen', () => {
  const mockNavigation = {
    replace: jest.fn(),
  };

  const renderScreen = (contextOverrides = {}) =>
    render(
      <AppContext.Provider
        value={{
          darkMode: false,
          largeIcons: false,
          ...contextOverrides,
        }}
      >
        <ProfileScreen navigation={mockNavigation} />
      </AppContext.Provider>,
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders empty state if no user', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null);

    const { getByText } = renderScreen();

    await waitFor(() => {
      expect(getByText('No achievements yet')).toBeTruthy();
    });
  });

  test('loads and displays user stats', async () => {
    const mockUser = 'john';

    const mockData = {
      john: {
        stats: {
          points: 150,
          level: 1,
          badges: [],
          loginStreak: 3,
          sheltersAdded: 0,
          lastLoginDate: new Date().toDateString(),
          checklistCompleted: false,
        },
      },
    };

    AsyncStorage.getItem
      .mockResolvedValueOnce(mockUser)
      .mockResolvedValueOnce(JSON.stringify(mockData));

    const { getByText } = renderScreen();

    await waitFor(() => {
      expect(getByText('Hello, john 👋')).toBeTruthy();
      expect(getByText(/Level/)).toBeTruthy();
      expect(getByText(/150 XP/)).toBeTruthy();
    });
  });

  test('calculates level correctly', async () => {
    const mockUser = 'john';

    const mockData = {
      john: {
        stats: {
          points: 250,
          level: 1,
          badges: [],
          loginStreak: 1,
          sheltersAdded: 0,
          lastLoginDate: new Date().toDateString(),
          checklistCompleted: false,
        },
      },
    };

    AsyncStorage.getItem
      .mockResolvedValueOnce(mockUser)
      .mockResolvedValueOnce(JSON.stringify(mockData));

    const { getByText } = renderScreen();

    await waitFor(() => {
      expect(getByText(/Level 3/)).toBeTruthy();
    });
  });

  test('unlocks checklist achievement', async () => {
    const mockUser = 'john';

    const mockData = {
      john: {
        stats: {
          points: 50,
          level: 1,
          badges: [],
          loginStreak: 1,
          sheltersAdded: 0,
          lastLoginDate: new Date().toDateString(),
          checklistCompleted: true,
        },
      },
    };

    AsyncStorage.getItem
      .mockResolvedValueOnce(mockUser)
      .mockResolvedValueOnce(JSON.stringify(mockData));

    const { getByText } = renderScreen();

    await waitFor(() => {
      expect(getByText('🏅 Checklist Master')).toBeTruthy();
    });
  });

  test('resets streak if login gap exists', async () => {
    const mockUser = 'john';

    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 5);

    const mockData = {
      john: {
        stats: {
          points: 50,
          level: 1,
          badges: [],
          loginStreak: 4,
          sheltersAdded: 0,
          lastLoginDate: oldDate.toDateString(),
          checklistCompleted: false,
        },
      },
    };

    AsyncStorage.getItem
      .mockResolvedValueOnce(mockUser)
      .mockResolvedValueOnce(JSON.stringify(mockData));

    const { getByText } = renderScreen();

    await waitFor(() => {
      expect(getByText(/1 Day Streak/)).toBeTruthy();
    });
  });

  test('logs out and navigates to Login', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null);

    const { getByText } = renderScreen();

    const logoutButton = await waitFor(() => getByText('Logout'));

    fireEvent.press(logoutButton);

    await waitFor(() => {
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('currentUser');
      expect(mockNavigation.replace).toHaveBeenCalledWith('Login');
    });
  });
});
