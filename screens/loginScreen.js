import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter both username and password.');
      return;
    }
    try {
      const storedUsers = JSON.parse(await AsyncStorage.getItem('users')) || {};
      if (
        storedUsers[username] &&
        storedUsers[username].password === password
      ) {
        await AsyncStorage.setItem('currentUser', username);
        navigation.replace('Main');
      } else {
        Alert.alert('Login Failed', 'Invalid username or password.');
      }
    } catch (e) {
      console.error('Login error', e);
    }
  };

  const handleRegister = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter both username and password.');
      return;
    }

    try {
      const storedUsers = JSON.parse(await AsyncStorage.getItem('users')) || {};

      if (storedUsers[username]) {
        Alert.alert('Error', 'Username already exists.');
        return;
      }

      storedUsers[username] = {
        password,
        stats: { points: 0, level: 1, badges: [] },
      };
      await AsyncStorage.setItem('users', JSON.stringify(storedUsers));
      Alert.alert('Success', 'Account created! Please login.');
    } catch (e) {
      console.error('Registration error', e);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        testID="login-button"
        style={styles.button}
        onPress={handleLogin}
      >
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity
        testID="register-button"
        style={styles.registerButton}
        onPress={handleRegister}
      >
        <Text style={styles.registerButtonText}>Register</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f5f7fa',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  buttonText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
  registerButton: { marginTop: 12, padding: 12 },
  registerButtonText: {
    textAlign: 'center',
    color: '#2563eb',
    fontWeight: '600',
  },
});
