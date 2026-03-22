import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

import HomeDashboard from './screens/homeDashboard';
import InteractiveMap from './screens/interactiveMap';
import EmergencyAlertScreen from './screens/emergencyAlertScreen';
import PreparednessTaskScreen from './screens/preparednessTaskScreen';
import ResourceHubScreen from './screens/resourceHubScreen';
import SettingsScreen from './screens/settingsScreen';
import LoginScreen from './screens/loginScreen';
import ProfileScreen from './screens/profileScreen';

import { AppContext } from './context/AppContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeDashboard} />
      <Tab.Screen
        name="Map"
        component={InteractiveMap}
        options={{ title: 'Interactive Map' }}
      />
      <Tab.Screen name="Alerts" component={EmergencyAlertScreen} />
      <Tab.Screen
        name="Preparedness"
        component={PreparednessTaskScreen}
        options={{ title: 'Preparedness' }}
      />
      <Tab.Screen name="Resources" component={ResourceHubScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [offlineOnly, setOfflineOnly] = useState(false);
  const [largeIcons, setLargeIcons] = useState(false);
  const [colorBlindMode, setColorBlindMode] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const setupApp = async () => {
      try {
        await Notifications.requestPermissionsAsync();

        const savedOfflineOnly = await AsyncStorage.getItem('offlineOnly');
        if (savedOfflineOnly !== null) {
          setOfflineOnly(JSON.parse(savedOfflineOnly));
        }

        const savedDarkMode = await AsyncStorage.getItem('darkMode');
        if (savedDarkMode !== null) {
          setDarkMode(JSON.parse(savedDarkMode));
        }

        const savedLargeIcons = await AsyncStorage.getItem('largeIcons');
        if (savedLargeIcons !== null) {
          setLargeIcons(JSON.parse(savedLargeIcons));
        }

        const savedColorBlindMode =
          await AsyncStorage.getItem('colorBlindMode');
        if (savedColorBlindMode !== null) {
          setColorBlindMode(JSON.parse(savedColorBlindMode));
        }
      } catch (error) {
        console.error('App setup error:', error);
      }
    };

    setupApp();
  }, []);

  const toggleOffline = async () => {
    try {
      const newValue = !offlineOnly;
      setOfflineOnly(newValue);
      await AsyncStorage.setItem('offlineOnly', JSON.stringify(newValue));
    } catch (error) {
      console.error('Failed to save offlineOnly:', error);
    }
  };

  return (
    <AppContext.Provider
      value={{
        offlineOnly,
        toggleOffline,
        largeIcons,
        setLargeIcons,
        colorBlindMode,
        setColorBlindMode,
        darkMode,
        setDarkMode,
      }}
    >
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ title: 'Profile' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="auto" />
    </AppContext.Provider>
  );
}
