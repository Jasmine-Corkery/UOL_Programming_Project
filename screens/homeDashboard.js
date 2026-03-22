import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from '../services/theme';
import { calculateCommunityResilience } from '../services/communityResilienceEngine';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const fallbackAlerts = [
  {
    id: 'demo-1',
    type: 'Hurricane',
    severity: 'High',
    location: 'Florida Coast',
    time: '2 hours ago',
    title: 'Hurricane Warning - Florida Coast',
  },
  {
    id: 'demo-2',
    type: 'Flood',
    severity: 'Medium',
    location: 'Texas Region',
    time: '5 hours ago',
    title: 'River Flood Warning',
  },
  {
    id: 'demo-3',
    type: 'Wildfire',
    severity: 'Low',
    location: 'California',
    time: '1 day ago',
    title: 'Forest Fire Contained',
  },
];

function formatRelativeTime(dateString) {
  if (!dateString) return 'Unknown time';

  const now = new Date();
  const then = new Date(dateString);
  const diffMs = now - then;

  if (Number.isNaN(then.getTime())) return 'Unknown time';

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (minutes < 60) return `${Math.max(minutes, 1)} min ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function inferAlertType(title, category) {
  const text = `${title || ''} ${category || ''}`.toLowerCase();

  if (
    text.includes('hurricane') ||
    text.includes('cyclone') ||
    text.includes('typhoon')
  ) {
    return 'Hurricane';
  }
  if (text.includes('flood')) return 'Flood';
  if (text.includes('wildfire') || text.includes('fire')) return 'Wildfire';
  if (text.includes('storm')) return 'Storm';
  if (text.includes('earthquake')) return 'Earthquake';
  if (text.includes('volcano')) return 'Volcano';

  return category || 'Disaster';
}

function inferSeverity(type) {
  switch (type) {
    case 'Hurricane':
    case 'Wildfire':
    case 'Earthquake':
      return 'High';
    case 'Flood':
    case 'Storm':
      return 'Medium';
    default:
      return 'Low';
  }
}
async function getReadableLocation(title, coords) {
  if (title) {
    const parts = title.split('-');
    if (parts.length > 1 && parts[1].trim()) {
      return parts[1].trim();
    }
  }

  if (
    !coords ||
    typeof coords[0] !== 'number' ||
    typeof coords[1] !== 'number'
  ) {
    return 'Affected area';
  }

  try {
    const results = await Location.reverseGeocodeAsync({
      latitude: coords[1],
      longitude: coords[0],
    });

    const place = results?.[0];
    if (!place) {
      return `Near ${coords[1].toFixed(1)}, ${coords[0].toFixed(1)}`;
    }

    return (
      place.city ||
      place.district ||
      place.subregion ||
      place.region ||
      place.country ||
      `Near ${coords[1].toFixed(1)}, ${coords[0].toFixed(1)}`
    );
  } catch (error) {
    console.warn('Reverse geocoding failed:', error);
    return `Near ${coords[1].toFixed(1)}, ${coords[0].toFixed(1)}`;
  }
}

export default function HomeDashboard({ navigation }) {
  const { largeIcons, darkMode, colorBlindMode } = useContext(AppContext);
  const insets = useSafeAreaInsets();
  const [cri, setCri] = useState(0);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [topAlert, setTopAlert] = useState(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch(
          'https://eonet.gsfc.nasa.gov/api/v3/events?status=open',
        );

        if (!res.ok) {
          setActiveAlerts(fallbackAlerts);
          setTopAlert(fallbackAlerts[0]);
          return;
        }

        const data = await res.json();

        if (!data?.events || data.events.length === 0) {
          setActiveAlerts(fallbackAlerts);
          setTopAlert(fallbackAlerts[0]);
          return;
        }
        const mappedAlerts = await Promise.all(
          data.events.slice(0, 5).map(async (event, index) => {
            const geo = event.geometry?.[0];
            const coords = Array.isArray(geo?.coordinates)
              ? geo.coordinates
              : null;

            const category = event.categories?.[0]?.title || 'Disaster';
            const type = inferAlertType(event.title, category);
            const severity = inferSeverity(type);
            const location = await getReadableLocation(event.title, coords);

            return {
              id: event.id || `event-${index}`,
              type,
              severity,
              location,
              time: formatRelativeTime(geo?.date),
              title: event.title || `${type} Alert`,
            };
          }),
        );
        setActiveAlerts(mappedAlerts);
        setTopAlert(mappedAlerts[0] || fallbackAlerts[0]);
      } catch (error) {
        console.error('FETCH FAILED:', error);
        setActiveAlerts(fallbackAlerts);
        setTopAlert(fallbackAlerts[0]);
      }
    };

    const loadData = async () => {
      try {
        const criResult = calculateCommunityResilience({
          preparednessScore: 0,
          responseRate: 70,
          safeZoneScore: 80,
          emergencyAccessScore: 75,
          connectivityScore: 50,
          hazardType: 'General',
          severityLevel: 0,
          daysSincePreparednessUpdate: 0,
          infrastructureStability: 100,
        });

        setCri(Number.isFinite(criResult?.cri) ? criResult.cri : 0);

        await fetchAlerts();
      } catch (error) {
        console.error('LOAD DATA FAILED:', error);
        setActiveAlerts(fallbackAlerts);
        setTopAlert(fallbackAlerts[0]);
      }
    };

    loadData();
  }, []);

  const colors = darkMode ? darkColors : lightColors;
  const scale = largeIcons ? 1.3 : 1;

  const getSeverityColor = severity => {
    if (colorBlindMode) {
      // Accessible palette (no red/green reliance)
      switch (severity) {
        case 'High':
          return '#7A1C1C'; // dark maroon
        case 'Medium':
          return '#B26A00'; // dark amber
        case 'Low':
          return '#1F4E79'; // dark blue
        default:
          return '#5A5A5A';
      }
    } else {
      // Normal colors
      switch (severity) {
        case 'High':
          return '#e53935'; // red
        case 'Medium':
          return '#f4b400'; // yellow
        case 'Low':
          return '#34a853'; // green
        default:
          return '#9e9e9e';
      }
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.contentContainer,
        {
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 24,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.banner, { backgroundColor: colors.card }]}>
        <Text
          style={[
            styles.bannerIcon,
            { fontSize: 36 * scale, color: colors.text },
          ]}
        >
          🚨
        </Text>

        <View style={[styles.criCard, { backgroundColor: colors.background }]}>
          <Text style={[styles.criTitle, { color: colors.text }]}>
            Community Resilience Index
          </Text>
          <Text style={[styles.criScore, { color: '#2563eb' }]}>{cri}/100</Text>
          <Text style={[styles.criLabel, { color: colors.subtitle || '#666' }]}>
            {cri >= 75
              ? 'Low Risk'
              : cri >= 50
                ? 'Moderate Risk'
                : cri >= 30
                  ? 'High Risk'
                  : 'Critical Risk'}
          </Text>
        </View>

        <Text style={[styles.bannerTitle, { color: colors.text }]}>
          Active Disaster Alert
        </Text>

        <Text style={[styles.bannerText, { color: colors.text }]}>
          {topAlert ? topAlert.title : 'Loading...'}
        </Text>

        <Text
          style={[styles.bannerSubtext, { color: colors.subtitle || '#666' }]}
        >
          Evacuation recommended in affected areas
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Quick Actions
        </Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.quickButton, { backgroundColor: colors.card }]}
          >
            <Text style={[styles.quickButtonIcon, { fontSize: 28 * scale }]}>
              🏠
            </Text>
            <Text style={[styles.quickButtonText, { color: colors.text }]}>
              Nearest Shelter
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickButton, { backgroundColor: colors.card }]}
            onPress={() => navigation?.navigate?.('Alerts')}
          >
            <Text style={[styles.quickButtonIcon, { fontSize: 28 * scale }]}>
              📣
            </Text>
            <Text style={[styles.quickButtonText, { color: colors.text }]}>
              View Alerts
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.quickButton, { backgroundColor: colors.card }]}
          >
            <Text style={[styles.quickButtonIcon, { fontSize: 28 * scale }]}>
              📍
            </Text>
            <Text style={[styles.quickButtonText, { color: colors.text }]}>
              Local Hotlines
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickButton, { backgroundColor: colors.card }]}
            onPress={() => navigation?.navigate?.('Map')}
          >
            <Text style={[styles.quickButtonIcon, { fontSize: 28 * scale }]}>
              🗺️
            </Text>
            <Text style={[styles.quickButtonText, { color: colors.text }]}>
              View Map
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Active Alerts
        </Text>

        {activeAlerts.slice(0, 3).map((alert, index) => (
          <TouchableOpacity
            key={alert?.id || `fallback-${index}`}
            style={[
              styles.alertCard,
              {
                backgroundColor: colors.card,
                borderLeftColor: getSeverityColor(alert?.severity),
              },
            ]}
            onPress={() => navigation?.navigate?.('Alerts')}
          >
            <View style={styles.alertHeader}>
              <Text style={[styles.alertType, { color: colors.text }]}>
                {alert?.type || 'Unknown'}
              </Text>

              <View
                style={[
                  styles.severityBadge,
                  { backgroundColor: getSeverityColor(alert?.severity) },
                ]}
              >
                <Text style={styles.severityText}>
                  {alert?.severity || 'Unknown'}
                </Text>
              </View>
            </View>

            <Text
              style={[
                styles.alertLocation,
                { color: colors.subtitle || '#666' },
              ]}
            >
              📍 {alert?.location || 'Affected area'}
            </Text>

            <Text
              style={[
                styles.alertLocation,
                { color: colors.subtitle || '#666' },
              ]}
            >
              ⏰ {alert?.time || 'Unknown time'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  banner: {
    padding: 20,
    alignItems: 'center',
    borderRadius: 14,
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  bannerIcon: {
    marginBottom: 10,
  },
  criCard: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    marginVertical: 10,
    minWidth: 150,
  },
  criTitle: {
    fontWeight: '600',
    fontSize: 12,
  },
  criScore: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 2,
  },
  criLabel: {
    fontSize: 12,
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 6,
    textAlign: 'center',
  },
  bannerText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 4,
  },
  bannerSubtext: {
    fontSize: 13,
    textAlign: 'center',
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  quickButton: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  quickButtonIcon: {
    marginBottom: 8,
  },
  quickButtonText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  alertCard: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertType: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  severityText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  alertLocation: {
    fontSize: 13,
    marginBottom: 4,
  },
});
