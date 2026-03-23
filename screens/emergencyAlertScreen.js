// imports
import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  Platform,
  Linking,
} from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import DropDetectionService from '../services/dropDetection';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from '../services/theme';
import { fetchAllDisasters } from '../services/disasterService';
import { fetchFemaSafeLocations } from '../services/femaService';
import { calculateRiskScore } from '../services/riskEngine';
import {
  broadcastSafeStatus,
  startMeshListener,
} from '../services/meshService';

const DEMO_LOCATION = {
  coords: {
    latitude: 51.5074,
    longitude: -0.1278,
    speed: 0,
  },
};

// fetch live earthquake data from USGS API
const fetchRealEarthquakes = async () => {
  try {
    const response = await fetch(
      'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson',
    );

    const data = await response.json();

    return data.features.map((quake, index) => ({
      id: quake.id || index,
      type: 'Earthquake',
      icon: '🌍',
      severity: quake.properties.mag >= 5 ? 'critical' : 'moderate',
      lat: quake.geometry.coordinates[1],
      lng: quake.geometry.coordinates[0],
      radius: 150,
      message: `Magnitude ${quake.properties.mag} earthquake detected.`,
      location: quake.properties.place,
    }));
  } catch (error) {
    console.error('Error fetching earthquakes:', error);
    return [];
  }
};
// notification config
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
// main screen component
export default function EmergencyAlertScreen({ navigation }) {
  // states
  const { largeIcons } = useContext(AppContext);
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState('Unknown Location');
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [watchingLocation, setWatchingLocation] = useState(false);
  const [dropDetected, setDropDetected] = useState(false);
  const [emergencyNumber, setEmergencyNumber] = useState('07983600155');
  const emergencyNumberRef = React.useRef(emergencyNumber);
  const [darkMode, setDarkMode] = useState(false);
  const colors = darkMode ? darkColors : lightColors;
  const [emergencyZones, setEmergencyZones] = useState([]);
  const [riskData, setRiskData] = useState(null);
  const [meshMessages, setMeshMessages] = useState([]);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [showDropModal, setShowDropModal] = useState(false);

  const clearCustomSafeZones = async () => {
    try {
      await AsyncStorage.removeItem('customSafeZones');
      setEmergencyZones(prev =>
        prev.filter(zone => zone.type !== 'User Safe Zone'),
      );
      Alert.alert('Cleared', 'All custom safe zones have been removed.');
    } catch (error) {
      console.error('Failed to clear custom safe zones:', error);
    }
  };

  // load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const dark = await AsyncStorage.getItem('darkMode');
        if (dark !== null) setDarkMode(JSON.parse(dark));
      } catch (e) {
        console.error('Failed to load dark mode setting', e);
      }
    };
    loadSettings();
  }, []);

  // mesh network - listen for nearby device messages
  useEffect(() => {
    startMeshListener(incomingMessage => {
      setMeshMessages(prev => [...prev, incomingMessage]);

      if (incomingMessage.type === 'SAFE_STATUS') {
        Alert.alert(
          'Nearby User Safe',
          `User ${incomingMessage.userId} has marked themselves safe.`,
        );
      }

      if (incomingMessage.type === 'HAZARD_ALERT') {
        Alert.alert('Mesh Alert Received', incomingMessage.message);
      }
    });

    return () => {};
  }, []);

  // drop detection - start fall detection
  useEffect(() => {
    DropDetectionService.start(() => {
      setDropDetected(true);
      setShowDropModal(true);
    });

    return () => {
      DropDetectionService.stop();
    };
  }, []);
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const number = await AsyncStorage.getItem('emergencyNumber');
        if (number) setEmergencyNumber(number);

        const alerts = await AsyncStorage.getItem('alertsEnabled');
        if (alerts) setAlertsEnabled(JSON.parse(alerts));

        const location = await AsyncStorage.getItem('locationEnabled');
        if (location) setLocationEnabled(JSON.parse(location));

        const dark = await AsyncStorage.getItem('darkMode');
        if (dark) setDarkMode(JSON.parse(dark));
      } catch (e) {
        console.error('Failed to load settings', e);
      }
    };

    loadSettings();
  }, []);
  // Auto emergency response - If no response after a fall call emergency contact
  useEffect(() => {
    let timer;

    if (showDropModal) {
      timer = setTimeout(() => {
        Alert.alert(
          'No Response Detected',
          'Emergency contact would be notified automatically.',
        );
        callEmergencyNumber(emergencyNumberRef.current);
        setShowDropModal(false);
        setDropDetected(false);
      }, 15000);
    }

    return () => clearTimeout(timer);
  }, [showDropModal]);

  // call function - opens phone dialler with number prefilled
  const callEmergencyNumber = number => {
    const phoneNumber = `tel:${number}`;
    Linking.canOpenURL(phoneNumber)
      .then(supported => {
        if (!supported) {
          Alert.alert('Error', 'Your device cannot make a phone call.');
        } else {
          return Linking.openURL(phoneNumber);
        }
      })
      .catch(err => console.error('Error opening dialer:', err));
  };
  // safe status - broadcasts "I'm safe" to nearby users
  const handleSafePress = async () => {
    await broadcastSafeStatus('user-123');
    Alert.alert('Status Sent', 'Your safe status has been broadcast locally.');
  };
  // Custom safe zones - adds user defined safe location
  const addCustomSafeLocation = async (name, lat, lng, radius = 1) => {
    const customZone = {
      id: `custom-${Date.now()}`,
      type: 'User Safe Zone',
      icon: '🛖',
      lat,
      lng,
      radius,
      message: `User-defined safe location: ${name}`,
      location: name,
      severity: 'safe',
    };

    const existing = await AsyncStorage.getItem('customSafeZones');
    const zones = existing ? JSON.parse(existing) : [];
    zones.push(customZone);
    await AsyncStorage.setItem('customSafeZones', JSON.stringify(zones));

    setEmergencyZones(prev => [...prev, customZone]);
  };

  useEffect(() => {
    requestPermissions();
  }, []);

  useEffect(() => {
    let locationSubscription;
    let disasterInterval;

    if (locationEnabled && notificationsEnabled && watchingLocation) {
      const loadDisasters = async () => {
        const zones = await fetchAllDisasters();
        const femaSafeZones = await fetchFemaSafeLocations();
        setEmergencyZones(zones);
      };

      loadDisasters();

      disasterInterval = setInterval(loadDisasters, 300000);

      locationSubscription = Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000,
          distanceInterval: 100,
        },
        async newLocation => {
          setLocation(newLocation);
          await updateLocationName(newLocation);
          checkProximityToEmergencies(newLocation);
        },
      );
    }

    return () => {
      if (locationSubscription) {
        locationSubscription.then(sub => sub.remove());
      }
      if (disasterInterval) {
        clearInterval(disasterInterval);
      }
    };
  }, [locationEnabled, notificationsEnabled, watchingLocation]);
  // Location name - Converts coordinates into a readable place name
  const updateLocationName = async currentLocation => {
    try {
      const { latitude, longitude } = currentLocation.coords;
      const [address] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (address) {
        const city = address.city || address.subregion || 'Unknown';
        const state = address.region || '';
        const newLocationName = `${city}${state ? ', ' + state : ''}`;
        setLocationName(newLocationName);
      }
    } catch (error) {
      console.error('Error getting location name:', error);
    }
  };
  // Permissions - Requests location and notification permissions
  const requestPermissions = async () => {
    try {
      const { status: locationStatus } =
        await Location.requestForegroundPermissionsAsync();
      setLocationEnabled(locationStatus === 'granted');

      const { status: notificationStatus } =
        await Notifications.requestPermissionsAsync();
      setNotificationsEnabled(notificationStatus === 'granted');

      if (locationStatus === 'granted') {
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
        await updateLocationName(currentLocation);
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };
  // Distance calculation - distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };
  // Proximity check - checks if the user is near danger zones
  const checkProximityToEmergencies = currentLocation => {
    const { latitude, longitude, speed } = currentLocation.coords;
    const newAlerts = [];

    emergencyZones.forEach(zone => {
      const distance = calculateDistance(
        latitude,
        longitude,
        zone.lat,
        zone.lng,
      );

      const now = new Date();

      const isUrban = locationName.includes('City') || locationName.length > 5;

      const risk = calculateRiskScore({
        hazardSeverity: zone.severity,
        distanceKm: distance,
        speed: speed || 0,
        isUrban,
        hourOfDay: now.getHours(),
      });

      setRiskData(risk);
      // Triggers an alert if risk is high
      if (risk.score >= 60) {
        if (!activeAlerts.find(a => a.id === zone.id)) {
          newAlerts.push({
            ...zone,
            steps: zone.message
              ? zone.message
                  .split('.')
                  .map(sentence => sentence.trim())
                  .filter(Boolean)
              : [],
          });

          sendNotification(zone, distance, locationName, risk);
        }
      }
    });

    if (newAlerts.length > 0) {
      setActiveAlerts([...activeAlerts, ...newAlerts]);
    }
  };
  // Notifications - sends a push notification
  const sendNotification = async (
    zone,
    distance,
    currentLocationName = locationName,
    risk = { score: 0, category: 'Unknown' },
  ) => {
    if (!zone) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `⚠️ ${zone.type} Alert!`,
        body: `${zone.message} You are ${distance.toFixed(
          1,
        )}km from the affected area. Your location: ${currentLocationName}`,
        data: {
          zoneId: zone.id,
          userLocation: currentLocationName,
          riskScore: risk.score,
          riskCategory: risk.category,
        },
        sound: true,
        priority: Notifications.AndroidNotificationPriority?.HIGH ?? 'high',
      },
      trigger: null,
    });
  };

  const toggleLocationTracking = async () => {
    if (!locationEnabled) {
      Alert.alert(
        'Location Required',
        'Please enable location permissions to receive emergency alerts.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Enable',
            onPress: async () => {
              await requestPermissions();
            },
          },
        ],
      );
      return;
    }

    if (!notificationsEnabled) {
      Alert.alert(
        'Notifications Required',
        'Please enable notifications to receive emergency alerts.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Enable',
            onPress: async () => {
              await requestPermissions();
            },
          },
        ],
      );
      return;
    }

    setWatchingLocation(!watchingLocation);
  };

  const simulateEmergencyNearby = async () => {
    const zoneToUse =
      emergencyZones.length > 0
        ? emergencyZones[Math.floor(Math.random() * emergencyZones.length)]
        : {
            id: 'test-zone',
            type: 'Earthquake',
            icon: '🌍',
            severity: 'moderate',
            lat: 51.5074,
            lng: -0.1278,
            radius: 150,
            message: 'Magnitude 4.5 earthquake detected.',
            location: locationName,
          };

    const simulatedDistance = 5;
    const risk = { score: 70, category: 'High' };

    await sendNotification(zoneToUse, simulatedDistance, locationName, risk);

    setActiveAlerts(prev =>
      prev.find(alert => alert.id === zoneToUse.id)
        ? prev
        : [...prev, zoneToUse],
    );

    Alert.alert(
      'Simulation Active',
      `You've received a ${zoneToUse.type} alert for ${locationName}!\n\nYour location: ${locationName}\nDistance: ${simulatedDistance.toFixed(
        1,
      )}km`,
    );
  };

  const clearAlert = alertId => {
    setActiveAlerts(activeAlerts.filter(alert => alert.id !== alertId));
  };

  const getSeverityColor = severity => {
    switch (severity) {
      case 'critical':
        return '#dc3545';
      case 'high':
        return '#ff6b6b';
      case 'moderate':
        return '#ffc107';
      default:
        return '#28a745';
    }
  };
  // UI
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: colors.card, borderBottomColor: colors.subtitle },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Emergency Alerts
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.subtitle }]}>
          Location-based disaster notifications
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.statusCard, { backgroundColor: colors.card }]}>
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <Text style={[styles.statusLabel, { color: colors.subtitle }]}>
                Location
              </Text>
              <Text
                style={[
                  styles.statusValue,
                  { color: locationEnabled ? colors.success : colors.danger },
                ]}
              >
                {locationEnabled ? '✓ Enabled' : '✗ Disabled'}
              </Text>
            </View>

            <View style={styles.statusItem}>
              <Text style={[styles.statusLabel, { color: colors.subtitle }]}>
                Notifications
              </Text>
              <Text
                style={[
                  styles.statusValue,
                  {
                    color: notificationsEnabled
                      ? colors.success
                      : colors.danger,
                  },
                ]}
              >
                {notificationsEnabled ? '✓ Enabled' : '✗ Disabled'}
              </Text>
            </View>
          </View>

          {location && (
            <View
              style={[styles.locationInfo, { borderTopColor: colors.subtitle }]}
            >
              <Text style={[styles.locationLabel, { color: colors.subtitle }]}>
                📍 Current Location:
              </Text>
              <Text style={[styles.locationNameText, { color: colors.accent }]}>
                {locationName}
              </Text>
              <Text
                style={[
                  styles.locationText,
                  {
                    color: colors.text,
                    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                  },
                ]}
              >
                {location.coords.latitude.toFixed(4)}°,{' '}
                {location.coords.longitude.toFixed(4)}°
              </Text>
            </View>
          )}
        </View>
        {riskData && (
          <View style={[styles.statusCard, { backgroundColor: colors.card }]}>
            <Text
              style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}
            >
              Personal Risk Assessment
            </Text>

            <Text
              style={{ fontSize: 28, fontWeight: 'bold', color: colors.accent }}
            >
              {riskData.score}
            </Text>

            <Text style={{ fontSize: 16, color: colors.text }}>
              Risk Level: {riskData.category}
            </Text>
          </View>
        )}

        <View style={[styles.monitoringCard, { backgroundColor: colors.card }]}>
          <View style={styles.monitoringHeader}>
            <View>
              <Text
                style={[
                  styles.monitoringTitle,
                  { color: colors.text, fontSize: largeIcons ? 22 : 18 },
                ]}
              >
                🚨 Real-time Monitoring
              </Text>
              <Text
                style={[styles.monitoringSubtitle, { color: colors.subtitle }]}
              >
                Track your location for nearby emergencies
              </Text>
            </View>
            <Switch
              value={watchingLocation}
              onValueChange={toggleLocationTracking}
              trackColor={{ false: '#888', true: colors.accent }}
              thumbColor={watchingLocation ? '#fff' : '#f4f3f4'}
            />
          </View>

          {watchingLocation && (
            <View
              style={[
                styles.monitoringActive,
                {
                  backgroundColor: darkMode ? '#3e3b2d' : '#fff3cd',
                  borderLeftColor: colors.warning,
                },
              ]}
            >
              <Text
                style={[
                  styles.monitoringActiveText,
                  { color: darkMode ? '#ffc107' : '#856404' },
                ]}
              >
                🔴 Actively monitoring your location: {locationName}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.simulateButton, { backgroundColor: colors.accent }]}
          onPress={simulateEmergencyNearby}
        >
          <Text style={styles.simulateButtonText}>
            🧪 Simulate Emergency Alert
          </Text>
        </TouchableOpacity>

        {activeAlerts.length > 0 && !dropDetected && (
          <View style={styles.alertsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              ⚠️ Active Alerts
            </Text>
            {activeAlerts.map((alert, index) => (
              <View
                key={`${alert.id}-${index}`}
                style={[
                  styles.alertCard,
                  {
                    borderLeftColor: getSeverityColor(alert.severity),
                    backgroundColor: colors.card,
                  },
                ]}
              >
                <View style={styles.alertHeader}>
                  <Text
                    style={[
                      styles.alertIcon,
                      { fontSize: largeIcons ? 44 : 32 },
                    ]}
                  >
                    {alert.icon}
                  </Text>
                  <View style={styles.alertInfo}>
                    <Text style={[styles.alertType, { color: colors.text }]}>
                      {alert.type}
                    </Text>
                    <Text
                      style={[styles.alertLocation, { color: colors.subtitle }]}
                    >
                      {alert.location}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => clearAlert(alert.id)}>
                    <Text
                      style={[styles.dismissButton, { color: colors.subtitle }]}
                    >
                      ✕
                    </Text>
                  </TouchableOpacity>
                </View>
                {alert.steps?.map((step, index) => (
                  <Text key={index} style={{ marginBottom: 8 }}>
                    {index + 1}. {step}
                  </Text>
                ))}
                <View
                  style={[
                    styles.severityBadge,
                    { backgroundColor: getSeverityColor(alert.severity) },
                  ]}
                >
                  <Text style={styles.severityText}>
                    {alert.severity.toUpperCase()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.zonesSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            📍 Monitored Emergency Zones
          </Text>
          {emergencyZones.map((zone, index) => (
            <View
              key={`${zone.id}-${index}`}
              style={[styles.zoneCard, { backgroundColor: colors.card }]}
            >
              <Text
                style={[styles.zoneIcon, { fontSize: largeIcons ? 44 : 32 }]}
              >
                {zone.icon}
              </Text>
              <View style={styles.zoneInfo}>
                <Text style={[styles.zoneType, { color: colors.text }]}>
                  {zone.type}
                </Text>
                <Text style={[styles.zoneLocation, { color: colors.subtitle }]}>
                  {zone.location}
                </Text>
                <Text style={[styles.zoneRadius, { color: colors.subtitle }]}>
                  Radius: {zone.radius}km
                </Text>
              </View>
              {location && (
                <View style={styles.zoneDistance}>
                  <Text style={[styles.distanceText, { color: colors.accent }]}>
                    {calculateDistance(
                      location.coords.latitude,
                      location.coords.longitude,
                      zone.lat,
                      zone.lng,
                    ).toFixed(1)}
                    km
                  </Text>
                  <Text
                    style={[styles.distanceLabel, { color: colors.subtitle }]}
                  >
                    away
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>

        <View
          style={[
            styles.helpCard,
            { backgroundColor: colors.card, borderLeftColor: colors.accent },
          ]}
        >
          <Text style={[styles.helpTitle, { color: colors.text }]}>
            ℹ️ How It Works
          </Text>
          <Text style={[styles.helpText, { color: colors.text }]}>
            • Enable location and notifications to receive real-time alerts
          </Text>
          <Text style={[styles.helpText, { color: colors.text }]}>
            • Your location is checked every 10 seconds or 100 meters
          </Text>
          <Text style={[styles.helpText, { color: colors.text }]}>
            • Notifications are sent when you enter an emergency zone
          </Text>
          <Text style={[styles.helpText, { color: colors.text }]}>
            • Use the simulation button to test the alert system
          </Text>
        </View>
      </ScrollView>

      {showDropModal && (
        <View style={styles.dropOverlay}>
          <View style={[styles.dropModal, { backgroundColor: colors.card }]}>
            <Text
              style={[
                styles.dropTitle,
                { color: colors.text, fontSize: largeIcons ? 24 : 18 },
              ]}
            >
              ⚠️ Sudden Drop Detected
            </Text>
            <Text style={[styles.dropMessage, { color: colors.text }]}>
              We detected a sudden drop during an active emergency. Are you
              safe?
            </Text>
            <TouchableOpacity
              style={[styles.dropButton, { backgroundColor: colors.success }]}
              onPress={() => {
                handleSafePress();
                setDropDetected(false);
                setShowDropModal(false);
              }}
            >
              <Text style={styles.dropButtonText}>
                I'm Safe / Mark Myself Safe
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dropButton, { backgroundColor: colors.danger }]}
              onPress={() => {
                Alert.alert(
                  'Emergency Assistance',
                  `Calling ${emergencyNumber} now...`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Call',
                      onPress: () => callEmergencyNumber(emergencyNumber),
                    },
                  ],
                );
                setDropDetected(false);
                setShowDropModal(false);
              }}
            >
              <Text style={styles.dropButtonText}>I Need Help</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  statusItem: {
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  locationInfo: {
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  locationLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  locationNameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  locationText: {
    fontSize: 14,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  monitoringCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
  },
  monitoringHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monitoringTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  monitoringSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  monitoringActive: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#fff3cd',
    borderRadius: 5,
    borderLeftWidth: 3,
    borderLeftColor: '#ffc107',
  },
  monitoringActiveText: {
    fontSize: 13,
    color: '#856404',
    fontWeight: 'bold',
  },
  simulateButton: {
    backgroundColor: '#6f42c1',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  simulateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  alertsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  alertIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  alertInfo: {
    flex: 1,
  },
  alertType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  alertLocation: {
    fontSize: 13,
    color: '#666',
  },
  dismissButton: {
    fontSize: 24,
    color: '#999',
    paddingHorizontal: 10,
  },
  alertMessage: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
    lineHeight: 20,
  },
  severityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  severityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  zonesSection: {
    marginBottom: 20,
  },
  zoneCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  zoneIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  zoneInfo: {
    flex: 1,
  },
  zoneType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  zoneLocation: {
    fontSize: 13,
    color: '#666',
  },
  zoneRadius: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  zoneDistance: {
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  distanceLabel: {
    fontSize: 11,
    color: '#999',
  },
  helpCard: {
    backgroundColor: '#e7f3ff',
    borderRadius: 10,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    marginBottom: 20,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  helpText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    marginBottom: 5,
  },
  dropOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  dropModal: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 12,
    width: '85%',
    alignItems: 'center',
  },

  dropTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },

  dropMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },

  dropButton: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },

  dropButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
