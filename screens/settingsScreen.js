import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TextInput,
  Platform,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppContext } from '../context/AppContext';

export default function SettingsScreen({ navigation }) {
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [emergencyNumber, setEmergencyNumber] = useState('');
  const {
    offlineOnly,
    toggleOffline,
    largeIcons,
    setLargeIcons,
    colorBlindMode,
    setColorBlindMode,
  } = useContext(AppContext);

  const lightColors = {
    background: '#f5f5f5',
    card: '#fff',
    text: '#000',
    subtitle: '#666',
    accent: '#007AFF',
    helper: '#666',
    inputBackground: '#fff',
    inputText: '#000',
  };

  const darkColors = {
    background: '#121212',
    card: '#1e1e1e',
    text: '#fff',
    subtitle: '#ccc',
    accent: '#1E90FF',
    helper: '#aaa',
    inputBackground: '#2a2a2a',
    inputText: '#fff',
  };
  const colorBlindColours = {
    background: '#ffffff',
    card: '#ffffff',
    text: '#000000',
    subtitle: '#000000',
    accent: '#0000FF',
    helper: '#000000',
    inputBackground: '#ffffff',
    inputText: '#000000',
  };

  const colors = colorBlindMode
    ? colorBlindColours
    : darkMode
      ? darkColors
      : lightColors;

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const alerts = await AsyncStorage.getItem('alertsEnabled');
        if (alerts !== null) setAlertsEnabled(JSON.parse(alerts));

        const location = await AsyncStorage.getItem('locationEnabled');
        if (location !== null) setLocationEnabled(JSON.parse(location));

        const dark = await AsyncStorage.getItem('darkMode');
        if (dark !== null) setDarkMode(JSON.parse(dark));

        const number = await AsyncStorage.getItem('emergencyNumber');
        if (number !== null) setEmergencyNumber(number);

        const cbMode = await AsyncStorage.getItem('colorBlindMode');
        if (cbMode !== null) setColorBlindMode(JSON.parse(cbMode));

        const iconSize = await AsyncStorage.getItem('largeIcons');
        if (iconSize !== null) setLargeIcons(JSON.parse(iconSize));
      } catch (e) {
        console.error('Failed to load settings', e);
      }
    };
    loadSettings();
  }, []);

  const saveBooleanSetting = async (key, value) => {
    setStateByKey(key, value);
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Failed to save ${key}`, e);
    }
  };

  const saveStringSetting = async (key, value) => {
    setStateByKey(key, value);
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.error(`Failed to save ${key}`, e);
    }
  };

  const setStateByKey = (key, value) => {
    switch (key) {
      case 'alertsEnabled':
        setAlertsEnabled(value);
        break;
      case 'locationEnabled':
        setLocationEnabled(value);
        break;
      case 'darkMode':
        setDarkMode(value);
        break;
      case 'emergencyNumber':
        setEmergencyNumber(value);
        break;
      case 'colorBlindMode':
        setColorBlindMode(value);
        break;
      case 'largeIcons':
        setLargeIcons(value);
        break;
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.accent }]}>
        <Text
          style={[
            styles.headerTitle,
            {
              color: colors.text,
              fontSize: largeIcons ? 28 : 22,
            },
          ]}
        >
          ⚙️ Settings
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.text }]}>
          Customize your emergency alerts and map preferences
        </Text>
      </View>

      {/* Profile Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Account
        </Text>
        <TouchableOpacity
          style={[styles.profileButton, { backgroundColor: colors.accent }]}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.profileButtonText}>👤 View Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Notifications */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Notifications
        </Text>
        <View style={styles.row}>
          <Text style={[styles.rowText, { color: colors.text }]}>
            Emergency Alerts
          </Text>
          <Switch
            value={alertsEnabled}
            onValueChange={value => saveBooleanSetting('alertsEnabled', value)}
            trackColor={{ true: colors.accent, false: '#888' }}
          />
        </View>
        <Text style={[styles.helperText, { color: colors.helper }]}>
          Receive alerts when emergencies are detected near you.
        </Text>
      </View>

      {/* Location */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Location
        </Text>
        <View style={styles.row}>
          <Text style={[styles.rowText, { color: colors.text }]}>
            Location Tracking
          </Text>
          <Switch
            value={locationEnabled}
            onValueChange={value =>
              saveBooleanSetting('locationEnabled', value)
            }
            trackColor={{ true: colors.accent, false: '#888' }}
          />
        </View>
        <Text style={[styles.helperText, { color: colors.helper }]}>
          Required to show your position and nearby shelters.
        </Text>
      </View>

      {/* Appearance */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Appearance
        </Text>
        <View style={styles.row}>
          <Text style={[styles.rowText, { color: colors.text }]}>
            Dark Mode
          </Text>
          <Switch
            value={darkMode}
            onValueChange={value => saveBooleanSetting('darkMode', value)}
            trackColor={{ true: colors.accent, false: '#888' }}
          />
        </View>
        <Text style={[styles.helperText, { color: colors.helper }]}>
          UI preview only (no system override).
        </Text>
      </View>
      {/* Accessibility */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Accessibility
        </Text>

        {/* Color Blind Mode */}
        <View style={styles.row}>
          <Text style={[styles.rowText, { color: colors.text }]}>
            High Contrast Mode
          </Text>
          <Switch
            value={colorBlindMode}
            onValueChange={value => saveBooleanSetting('colorBlindMode', value)}
            trackColor={{ true: colors.accent, false: '#888' }}
          />
        </View>

        <Text style={[styles.helperText, { color: colors.helper }]}>
          Improves visibility for color vision deficiencies.
        </Text>

        {/* Large Icons */}
        <View style={[styles.row, { marginTop: 15 }]}>
          <Text style={[styles.rowText, { color: colors.text }]}>
            Larger Icons
          </Text>
          <Switch
            value={largeIcons}
            onValueChange={value => saveBooleanSetting('largeIcons', value)}
            trackColor={{ true: colors.accent, false: '#888' }}
          />
        </View>

        <Text style={[styles.helperText, { color: colors.helper }]}>
          Increases emoji and icon size across the app.
        </Text>
      </View>

      {/* Offline Mode */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Offline Mode
        </Text>
        <View style={styles.row}>
          <Text style={[styles.rowText, { color: colors.text }]}>
            Enable Offline-Only Mode
          </Text>
          <Switch
            value={offlineOnly}
            onValueChange={toggleOffline}
            trackColor={{ true: colors.accent, false: '#888' }}
          />
        </View>
        <Text style={[styles.helperText, { color: colors.helper }]}>
          Disable live data and use only cached/local info.
        </Text>
      </View>

      {/* Emergency Contact */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Emergency Contact
        </Text>
        <Text style={[styles.helperText, { color: colors.helper }]}>
          Number to call automatically if you don't respond to a drop alert.
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.inputBackground,
              color: colors.inputText,
              borderColor: colors.subtitle,
            },
          ]}
          value={emergencyNumber}
          onChangeText={text =>
            saveStringSetting('emergencyNumber', text.replace(/[^0-9+]/g, ''))
          }
          keyboardType="phone-pad"
          placeholder="Enter phone number"
          placeholderTextColor={colors.subtitle}
        />
      </View>

      {/* Map Info */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Map Provider
        </Text>
        <View
          style={[
            styles.infoBox,
            { backgroundColor: darkMode ? '#333' : '#eef3ff' },
          ]}
        >
          <Text style={[styles.infoText, { color: colors.text }]}>
            {Platform.OS === 'ios' && '🍎 Apple Maps (Free)'}
            {Platform.OS === 'android' && '🗺️ Google Maps (Default)'}
            {Platform.OS === 'web' && '🌍 OpenStreetMap (Open Source)'}
          </Text>
        </View>
      </View>

      {/* About */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
        <Text style={[styles.aboutText, { color: colors.text }]}>
          Emergency Alert App
        </Text>
        <Text style={[styles.aboutSubtext, { color: colors.subtitle }]}>
          Version 1.0 • Student Project
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20 },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 13, marginTop: 5 },
  section: { margin: 15, padding: 15, borderRadius: 10 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowText: { fontSize: 15 },
  helperText: { fontSize: 12, marginTop: 8 },
  infoBox: { padding: 12, borderRadius: 8 },
  infoText: { fontSize: 14, fontWeight: '500' },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, marginTop: 10 },
  aboutText: { fontSize: 15, fontWeight: 'bold' },
  aboutSubtext: { fontSize: 12, marginTop: 4 },
  profileButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  profileButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
