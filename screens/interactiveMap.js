// imports
import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from '../services/theme';

// Notification setup
// Defines how the notifications behave when triggered
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Safe zone score - helper used to rate shelter availability
export function getSafeZoneScore(nearbySafeZones = []) {
  return nearbySafeZones.length > 3 ? 90 : 60;
}

// main screen component
export default function InteractiveMap({ navigation }) {
  //states
  const [userLocation, setUserLocation] = useState({
    lat: 51.5074,
    lng: -0.1278,
  });
  const [locationName, setLocationName] = useState('London, UK');
  const [locationLoading, setLocationLoading] = useState(true);
  const [disasters, setDisasters] = useState([]);
  const [customSafeZones, setCustomSafeZones] = useState([]);
  const { largeIcons } = useContext(AppContext);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newSafeName, setNewSafeName] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [selectedSafeZoneCoords, setSelectedSafeZoneCoords] = useState(null);

  const colors = darkMode ? darkColors : lightColors;
  // initial load
  // runs once when the screen opens
  useEffect(() => {
    loadSettings();
    getCurrentLocation();
    fetchDisasters();
    loadCustomSafeZones();
    setupNotifications();
  }, []);
  // load settings
  // .oads the dark mode preferences from local storage
  const loadSettings = async () => {
    try {
      const dark = await AsyncStorage.getItem('darkMode');
      if (dark !== null) setDarkMode(JSON.parse(dark));
    } catch (e) {
      console.error('Failed to load dark mode', e);
    }
  };
  // notifications - request/confirm notification permissions
  const setupNotifications = async () => {
    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted')
        console.log('Notifications permission not granted');
    } catch (err) {
      console.error('Notifications setup error:', err);
    }
  };
  // location - gets the users current device location and converts it into a readable name
  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required. Using default location.',
        );
        setLocationLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = location.coords;
      setUserLocation({ lat: latitude, lng: longitude });

      const [address] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      if (address) {
        const city = address.city || address.subregion || 'Unknown';
        const state = address.region || '';
        setLocationName(`${city}${state ? ', ' + state : ''}`);
      }
      setLocationLoading(false);
    } catch (err) {
      console.error('Location error:', err);
      setLocationLoading(false);
    }
  };
  // fetch disaster data - gets currently sctive disaster events from the NASA EONET API
  const fetchDisasters = async () => {
    try {
      const res = await fetch(
        'https://eonet.gsfc.nasa.gov/api/v3/events?status=open',
      );
      const data = await res.json();
      setDisasters(data.events);
    } catch (err) {
      console.error('Error fetching disasters:', err);
    }
  };
  // load saved safe zones - pull custom shelters from AsyncStorage
  const loadCustomSafeZones = async () => {
    try {
      const stored = await AsyncStorage.getItem('customSafeZones');
      if (stored) setCustomSafeZones(JSON.parse(stored));
    } catch (err) {
      console.error('Error loading custom safe zones:', err);
    }
  };
  // Map long press - if the user long presses the map save the tapped coordinates and
  // open the modal so a user can create a custom shelter
  const handleMapLongPress = event => {
    const { latitude, longitude } = event.nativeEvent.coordinate;

    setSelectedSafeZoneCoords({
      lat: latitude,
      lng: longitude,
    });

    setNewSafeName('');
    setAddModalVisible(true);
  };
  // add a safe zone - saves a custom safe zone at the selected map location or the users current location
  const addCustomSafeZone = async () => {
    if (!newSafeName.trim()) {
      Alert.alert(
        'Invalid Name',
        'Please enter a valid name for your safe location.',
      );
      return;
    }

    const lat = selectedSafeZoneCoords?.lat ?? userLocation.lat;
    const lng = selectedSafeZoneCoords?.lng ?? userLocation.lng;

    const zone = {
      id: `custom-${Date.now()}`,
      type: 'User Safe Zone',
      icon: '🛖',
      lat,
      lng,
      radius: 1,
      message: `User-defined safe location: ${newSafeName}`,
      location: newSafeName,
      severity: 'safe',
    };

    const updated = [...customSafeZones, zone];
    setCustomSafeZones(updated);
    await AsyncStorage.setItem('customSafeZones', JSON.stringify(updated));

    setAddModalVisible(false);
    setNewSafeName('');
    setSelectedSafeZoneCoords(null);

    Alert.alert(
      'Safe Zone Added',
      `${zone.location} added to your safe zones.`,
    );
  };
  // calculate distance using the Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };
  // Nearby safe zones - filters custom safe zones to show those within 10km
  const nearbySafeZones = customSafeZones.filter(zone => {
    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      zone.lat,
      zone.lng,
    );
    return distance <= 10;
  });
  //UI
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <MapView
        provider={PROVIDER_DEFAULT}
        style={StyleSheet.absoluteFillObject}
        showsUserLocation={true}
        followsUserLocation={true}
        onLongPress={handleMapLongPress}
        initialRegion={{
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {disasters?.map(event => {
          const geo = event.geometry?.[0];
          if (!geo || geo.type !== 'Point') return null;

          const [lng, lat] = geo.coordinates;
          return (
            <Marker
              key={event.id}
              coordinate={{ latitude: lat, longitude: lng }}
              title={event.title || 'Disaster Event'}
              description={event.description || ''}
              pinColor="red"
            />
          );
        })}

        {customSafeZones.map(zone => (
          <Marker
            key={zone.id}
            coordinate={{ latitude: zone.lat, longitude: zone.lng }}
            title={zone.location}
            description={zone.message}
            pinColor="green"
          />
        ))}
      </MapView>

      <View style={[styles.topPanel, { backgroundColor: colors.card }]}>
        <Text style={[styles.topPanelTitle, { color: colors.text }]}>
          Nearby Shelters
        </Text>

        <Text style={[styles.topPanelSubtitle, { color: colors.subtitle }]}>
          {locationLoading
            ? 'Finding your location...'
            : `Current location: ${locationName}`}
        </Text>

        <Text style={[styles.topPanelInfo, { color: colors.text }]}>
          {nearbySafeZones.length > 0
            ? `${nearbySafeZones.length} nearby safe zone${nearbySafeZones.length === 1 ? '' : 's'} found`
            : 'No nearby safe zones saved yet'}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.floatingButton, { backgroundColor: colors.accent }]}
        onPress={() => setAddModalVisible(true)}
      >
        <Text
          style={{
            color: '#fff',
            fontWeight: 'bold',
            fontSize: largeIcons ? 20 : 16,
          }}
        >
          ➕ Add Safe Zone
        </Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={addModalVisible}
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text
              style={{
                fontSize: largeIcons ? 24 : 18,
                fontWeight: 'bold',
                marginBottom: 10,
                color: colors.text,
              }}
            >
              Add Safe Location
            </Text>
            {selectedSafeZoneCoords && (
              <Text
                style={{
                  marginBottom: 10,
                  color: colors.subtitle,
                }}
              >
                Selected location: {selectedSafeZoneCoords.lat.toFixed(4)},{' '}
                {selectedSafeZoneCoords.lng.toFixed(4)}
              </Text>
            )}
            <TextInput
              placeholder="Enter location name"
              placeholderTextColor={colors.subtitle}
              value={newSafeName}
              onChangeText={setNewSafeName}
              style={[
                styles.input,
                { borderColor: colors.subtitle, color: colors.text },
              ]}
            />
            <View
              style={{
                flexDirection: 'row',
                marginTop: 15,
                justifyContent: 'flex-end',
              }}
            >
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.danger }]}
                onPress={() => setAddModalVisible(false)}
              >
                <Text style={{ color: '#fff' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: colors.success, marginLeft: 10 },
                ]}
                onPress={addCustomSafeZone}
              >
                <Text style={{ color: '#fff' }}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
// styles
const styles = StyleSheet.create({
  container: { flex: 1 },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    padding: 15,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    padding: 20,
    borderRadius: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  modalButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },
  topPanel: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  topPanelTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  topPanelSubtitle: {
    fontSize: 13,
    marginBottom: 6,
  },
  topPanelInfo: {
    fontSize: 14,
    fontWeight: '500',
  },
});
