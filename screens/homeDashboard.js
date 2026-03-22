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

export default function HomeDashboard({ navigation }) {
  const { largeIcons } = useContext(AppContext);
  const [darkMode, setDarkMode] = useState(false);
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

        const mappedAlerts = data.events.slice(0, 5).map((event, index) => {
          const geo = event.geometry?.[0];
          const coords = Array.isArray(geo?.coordinates)
            ? geo.coordinates
            : null;

          const safeLocation =
            coords &&
            typeof coords[0] === 'number' &&
            typeof coords[1] === 'number'
              ? `${coords[1].toFixed(2)}, ${coords[0].toFixed(2)}`
              : 'Unknown location';

          return {
            id: event.id || `event-${index}`,
            type: event.categories?.[0]?.title || 'Disaster',
            severity: 'High',
            location: safeLocation,
            time: geo?.date
              ? new Date(geo.date).toLocaleString()
              : 'Unknown time',
            title: event.title || 'Untitled Event',
          };
        });

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
        const dark = await AsyncStorage.getItem('darkMode');
        if (dark !== null) {
          setDarkMode(JSON.parse(dark));
        }

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
    switch (severity) {
      case 'High':
        return '#e53935';
      case 'Medium':
        return '#f4b400';
      case 'Low':
        return '#34a853';
      default:
        return '#9e9e9e';
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
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
              📍 {alert?.location || 'Unknown location'}
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
    marginTop: 12,
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
