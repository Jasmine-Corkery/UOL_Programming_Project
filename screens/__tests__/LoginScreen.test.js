import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../loginScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.spyOn(Alert, 'alert');

describe('LoginScreen', () => {
  const mockReplace = jest.fn();

  const renderScreen = () =>
    render(<LoginScreen navigation={{ replace: mockReplace }} />);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows error if login fields are empty', async () => {
    const { getByTestId } = renderScreen();

    fireEvent.press(getByTestId('login-button'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Error',
      'Please enter both username and password.',
    );
  });

  test('logs in successfully with correct credentials', async () => {
    AsyncStorage.getItem.mockResolvedValue(
      JSON.stringify({
        john: { password: '1234' },
      }),
    );

    const { getByPlaceholderText, getByTestId } = renderScreen();

    fireEvent.changeText(getByPlaceholderText('Username'), 'john');
    fireEvent.changeText(getByPlaceholderText('Password'), '1234');

    fireEvent.press(getByTestId('login-button'));

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('currentUser', 'john');
      expect(mockReplace).toHaveBeenCalledWith('Main');
    });
  });

  test('shows alert for invalid login', async () => {
    AsyncStorage.getItem.mockResolvedValue(
      JSON.stringify({
        john: { password: '1234' },
      }),
    );

    const { getByPlaceholderText, getByTestId } = renderScreen();

    fireEvent.changeText(getByPlaceholderText('Username'), 'john');
    fireEvent.changeText(getByPlaceholderText('Password'), 'wrongpass');

    fireEvent.press(getByTestId('login-button'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Login Failed',
        'Invalid username or password.',
      );
    });
  });

  test('shows error if register fields empty', async () => {
    const { getByTestId } = renderScreen();

    fireEvent.press(getByTestId('register-button'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Error',
      'Please enter both username and password.',
    );
  });

  test('prevents duplicate username', async () => {
    AsyncStorage.getItem.mockResolvedValue(
      JSON.stringify({
        john: { password: '1234' },
      }),
    );

    const { getByPlaceholderText, getByTestId } = renderScreen();

    fireEvent.changeText(getByPlaceholderText('Username'), 'john');
    fireEvent.changeText(getByPlaceholderText('Password'), 'newpass');

    fireEvent.press(getByTestId('register-button'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Username already exists.',
      );
    });
  });

  test('registers new user successfully', async () => {
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify({}));

    const { getByPlaceholderText, getByTestId } = renderScreen();

    fireEvent.changeText(getByPlaceholderText('Username'), 'newuser');
    fireEvent.changeText(getByPlaceholderText('Password'), 'mypassword');

    fireEvent.press(getByTestId('register-button'));

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'users',
        expect.any(String),
      );
      expect(Alert.alert).toHaveBeenCalledWith(
        'Success',
        'Account created! Please login.',
      );
    });
  });
});
