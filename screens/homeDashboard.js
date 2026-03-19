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
import { getConnectivityScore } from '../services/meshService';
import { calculateCommunityResilience } from '../services/communityResilienceEngine';

const fallbackAlerts = [
  {
    id: 'demo-1',
    type: 'Hurricane',
    severity: 'High',
    location: 'Florida Coast',
    time: '2 hours ago',
    title: 'Category 4 Hurricane',
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
  const [preparednessScore, setPreparednessScore] = useState(0);
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
          console.warn('API unavailable, using fallback alerts.');
          setActiveAlerts(fallbackAlerts);
          setTopAlert(fallbackAlerts[0]);
          return;
        }

        const data = await res.json();

        if (!data.events || data.events.length === 0) {
          console.warn('No live alerts found, using fallback.');
          setActiveAlerts(fallbackAlerts);
          setTopAlert(fallbackAlerts[0]);
          return;
        }

        const mappedAlerts = data.events.map((event, index) => {
          const geo = event.geometry?.[0];

          return {
            id: event.id || index,
            type: event.categories?.[0]?.title || 'Disaster',
            severity: 'High',
            location: geo?.coordinates
              ? `${geo.coordinates[1]?.toFixed(2)}, ${geo.coordinates[0]?.toFixed(2)}`
              : 'Unknown location',
            time: geo?.date
              ? new Date(geo.date).toLocaleString()
              : 'Unknown time',
            title: event.title || 'Untitled Event',
          };
        });

        setActiveAlerts(mappedAlerts);
        setTopAlert(mappedAlerts[0]);
      } catch (error) {
        console.error('Network error, using fallback alerts.', error);
        setActiveAlerts(fallbackAlerts);
        setTopAlert(fallbackAlerts[0]);
      }
    };

    const loadData = async () => {
      try {
        const dark = await AsyncStorage.getItem('darkMode');
        if (dark !== null) setDarkMode(JSON.parse(dark));

        const savedScore = await AsyncStorage.getItem(
          'currentPreparednessScore',
        );
        const parsedScore = savedScore ? JSON.parse(savedScore) : 0;
        setPreparednessScore(parsedScore);

        const criResult = calculateCommunityResilience({
          preparednessScore: parsedScore,
          responseRate: 70,
          safeZoneScore: 80,
          emergencyAccessScore: 75,
          connectivityScore: getConnectivityScore(),
        });

        setCri(Number.isFinite(criResult?.cri) ? criResult.cri : 0);

        await fetchAlerts();
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    loadData();
  }, []);

  const colors = darkMode ? darkColors : lightColors;
  const scale = largeIcons ? 1.3 : 1;

  const getSeverityColor = severity => {
    switch (severity) {
      case 'High':
        return '#dc3545';
      case 'Medium':
        return '#ffc107';
      case 'Low':
        return '#28a745';
      default:
        return '#6c757d';
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Disaster Banner */}
      {topAlert && (
        <View style={[styles.banner, { backgroundColor: colors.card }]}>
          <Text
            style={[
              styles.bannerIcon,
              { fontSize: 40 * scale, color: colors.text },
            ]}
          >
            🚨
          </Text>
          <View
            style={[styles.criCard, { backgroundColor: colors.background }]}
          >
            <Text style={[styles.criTitle, { color: colors.text }]}>
              Community Resilience Index
            </Text>
            <Text style={[styles.criScore, { color: colors.accent }]}>
              {cri}/100
            </Text>
            <Text style={[styles.criLabel, { color: colors.subtitle }]}>
              {cri > 75
                ? 'High Resilience'
                : cri > 50
                  ? 'Moderate Resilience'
                  : 'Low Resilience'}
            </Text>
          </View>
          <Text style={[styles.bannerTitle, { color: colors.text }]}>
            Active Disaster Alert
          </Text>
          <Text style={[styles.bannerText, { color: colors.text }]}>
            {topAlert.type} - {topAlert.title}
          </Text>
          <Text style={[styles.bannerSubtext, { color: colors.subtitle }]}>
            Evacuation recommended in affected areas
          </Text>
        </View>
      )}

      {/* Quick Action Buttons */}
      <View
        style={[styles.quickActions, { backgroundColor: colors.background }]}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Quick Actions
        </Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.quickButton, { backgroundColor: colors.card }]}
          >
            <Text
              style={[
                styles.quickButtonIcon,
                { fontSize: 36 * scale, color: colors.text },
              ]}
            >
              🏠
            </Text>
            <Text style={[styles.quickButtonText, { color: colors.text }]}>
              Nearest Shelter
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickButton, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('Alerts')}
          >
            <Text
              style={[
                styles.quickButtonIcon,
                { fontSize: 36 * scale, color: colors.text },
              ]}
            >
              📢
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
            <Text
              style={[
                styles.quickButtonIcon,
                { fontSize: 36 * scale, color: colors.text },
              ]}
            >
              📞
            </Text>
            <Text style={[styles.quickButtonText, { color: colors.text }]}>
              Local Hotlines
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickButton, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('Map')}
          >
            <Text
              style={[
                styles.quickButtonIcon,
                { fontSize: 36 * scale, color: colors.text },
              ]}
            >
              🗺️
            </Text>
            <Text style={[styles.quickButtonText, { color: colors.text }]}>
              View Map
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Active Alerts List */}
      <View style={[styles.alertsList, { backgroundColor: colors.background }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Active Alerts
        </Text>
        {activeAlerts.map(alert => (
          <TouchableOpacity
            key={alert.id}
            style={[
              styles.alertCard,
              {
                backgroundColor: colors.card,
                borderLeftColor: getSeverityColor(alert.severity),
              },
            ]}
            onPress={() => navigation.navigate('Alerts')}
          >
            <View style={styles.alertHeader}>
              <Text style={[styles.alertType, { color: colors.text }]}>
                {alert.type}
              </Text>
              <View
                style={[
                  styles.severityBadge,
                  { backgroundColor: getSeverityColor(alert.severity) },
                ]}
              >
                <Text style={styles.severityText}>{alert.severity}</Text>
              </View>
            </View>
            <Text
              style={[
                styles.alertLocation,
                { fontSize: 14 * scale, color: colors.subtitle },
              ]}
            >
              📍 {alert.location}
            </Text>
            <Text
              style={[
                styles.alertLocation,
                { fontSize: 14 * scale, color: colors.subtitle },
              ]}
            >
              ⏰ {alert.time}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  banner: {
    padding: 20,
    alignItems: 'center',
    borderRadius: 12,
    margin: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  bannerIcon: { marginBottom: 12 },
  bannerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  bannerText: { fontSize: 16, marginBottom: 2 },
  bannerSubtext: { fontSize: 14 },
  criCard: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginVertical: 10,
    elevation: 2,
  },
  criTitle: { fontWeight: '600' },
  criScore: { fontSize: 22, fontWeight: 'bold', marginVertical: 2 },
  criLabel: { fontSize: 14 },
  quickActions: {
    padding: 16,
    marginTop: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  quickButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  quickButtonIcon: { marginBottom: 6 },
  quickButtonText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  alertsList: { padding: 16, marginTop: 12 },
  alertCard: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  alertType: { fontSize: 16, fontWeight: 'bold' },
  severityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5 },
  severityText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  alertLocation: { marginBottom: 4 },
});
