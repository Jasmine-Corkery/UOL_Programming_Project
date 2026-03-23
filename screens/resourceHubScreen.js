// imports
import React, { useEffect, useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from '../services/theme';

// Resource Hub Screen component
export default function ResourceHubScreen() {
  const { largeIcons } = useContext(AppContext);
  const [darkMode, setDarkMode] = useState(false);
  const colors = darkMode ? darkColors : lightColors;
  const scale = largeIcons ? 1.3 : 1;
  // Load dark mode setting on component mount
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

  const openLink = url => {
    Linking.openURL(url).catch(err => {
      console.error('Failed to open URL', err);
    });
  };
  // dynamic styles
  const dynamicStyles = {
    headerPadding: {
      padding: 24 * scale,
      paddingTop: 32 * scale,
      paddingBottom: 28 * scale,
      backgroundColor: colors.accent,
    },
    title: {
      fontSize: 28 * scale,
      fontWeight: 'bold',
      marginBottom: 6,
      color: colors.text,
    },
    subtitle: { fontSize: 14 * scale, color: colors.helper },
    iconContainer: {
      width: 32 * scale,
      height: 32 * scale,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
      backgroundColor: colors.inputBackground,
    },
    sectionTitle: {
      fontSize: 20 * scale,
      fontWeight: '700',
      color: colors.text,
    },
    contactLabel: {
      fontSize: 14 * scale,
      marginBottom: 4,
      color: colors.subtitle,
    },
    contactNumber: {
      fontSize: 18 * scale,
      fontWeight: '600',
      color: colors.accent,
    },
    linkTitle: {
      fontSize: 16 * scale,
      fontWeight: '600',
      marginBottom: 4,
      color: colors.text,
    },
    linkDescription: {
      fontSize: 13 * scale,
      marginBottom: 8,
      color: colors.subtitle,
    },
    linkUrl: { fontSize: 12 * scale, fontWeight: '500', color: colors.accent },
  };
  // UI
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={dynamicStyles.headerPadding}>
        <Text style={dynamicStyles.title}>Resource Hub</Text>
        <Text style={dynamicStyles.subtitle}>
          Essential emergency information at your fingertips
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={dynamicStyles.iconContainer}>
            <Text style={styles.icon}>📞</Text>
          </View>
          <Text style={dynamicStyles.sectionTitle}>Emergency Contacts</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.contactItem}>
            <Text style={dynamicStyles.contactLabel}>
              Local Emergency Services
            </Text>
            <TouchableOpacity onPress={() => Linking.openURL('tel:999')}>
              <Text style={dynamicStyles.contactNumber}>999</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.helper }]} />

          <View style={styles.contactItem}>
            <Text style={dynamicStyles.contactLabel}>NHS</Text>
            <TouchableOpacity onPress={() => Linking.openURL('tel:111')}>
              <Text style={dynamicStyles.contactNumber}>111</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.helper }]} />

          <View style={styles.contactItem}>
            <Text style={dynamicStyles.contactLabel}>Red Cross</Text>
            <TouchableOpacity
              onPress={() => Linking.openURL('tel:0344 871 1111')}
            >
              <Text style={dynamicStyles.contactNumber}>0344 871 1111</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={dynamicStyles.iconContainer}>
            <Text style={styles.icon}>🔗</Text>
          </View>
          <Text style={dynamicStyles.sectionTitle}>Useful Links</Text>
        </View>

        <TouchableOpacity
          style={[styles.linkCard, { backgroundColor: colors.card }]}
          onPress={() => openLink('https://www.fema.gov')}
        >
          <Text style={dynamicStyles.linkTitle}>FEMA</Text>
          <Text style={dynamicStyles.linkDescription}>
            Federal Emergency Management Agency
          </Text>
          <Text style={dynamicStyles.linkUrl}>www.fema.gov →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.linkCard, { backgroundColor: colors.card }]}
          onPress={() => openLink('https://www.gov.uk')}
        >
          <Text style={dynamicStyles.linkTitle}>UK Government</Text>
          <Text style={dynamicStyles.linkDescription}>
            Official emergency guidance and alerts
          </Text>
          <Text style={dynamicStyles.linkUrl}>gov.uk →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.linkCard, { backgroundColor: colors.card }]}
          onPress={() =>
            openLink(
              'https://www.redcross.org/get-help/how-to-prepare-for-emergencies.html',
            )
          }
        >
          <Text style={dynamicStyles.linkTitle}>American Red Cross</Text>
          <Text style={dynamicStyles.linkDescription}>
            Emergency preparation resources
          </Text>
          <Text style={dynamicStyles.linkUrl}>redcross.org/prepare →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer} />
    </ScrollView>
  );
}
// styles
const styles = StyleSheet.create({
  container: { flex: 1 },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  contactItem: { paddingVertical: 12 },
  divider: { height: 1 },
  linkCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  icon: { fontSize: 18 },
  footer: { height: 24 },
});
