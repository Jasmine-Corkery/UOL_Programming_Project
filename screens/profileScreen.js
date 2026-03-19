import React, { useContext, useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from '../services/theme';
import { AppContext } from '../context/AppContext';

export default function ProfileScreen({ navigation }) {
  const { darkMode, largeIcons } = useContext(AppContext);
  const scale = largeIcons ? 1.3 : 1;
  const colors = darkMode ? darkColors : lightColors;

  const [username, setUsername] = useState('');
  const [stats, setStats] = useState({
    points: 0,
    level: 1,
    badges: [],
    loginStreak: 0,
    sheltersAdded: 0,
    lastLoginDate: '',
    checklistCompleted: false,
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const currentUser = await AsyncStorage.getItem('currentUser');
        if (!currentUser) return;

        setUsername(currentUser);

        const storedUsers =
          JSON.parse(await AsyncStorage.getItem('users')) || {};
        const userData = storedUsers[currentUser];

        if (userData?.stats) {
          const loadedStats = { ...userData.stats };

          const points = loadedStats.points || 0;
          loadedStats.level = Math.floor(points / 100) + 1;

          const today = new Date().toDateString();
          if (loadedStats.lastLoginDate !== today) {
            const lastLogin = new Date(loadedStats.lastLoginDate);
            const now = new Date();
            const diffDays = Math.floor(
              (now - lastLogin) / (1000 * 60 * 60 * 24),
            );

            if (diffDays > 1 || Number.isNaN(diffDays)) {
              loadedStats.loginStreak = 1;
            }
          }

          setStats(loadedStats);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    loadProfile();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('currentUser');
    navigation.replace('Login');
  };

  const achievements = [];
  if (stats.checklistCompleted) {
    achievements.push('🏅 Checklist Master');
  }

  const dynamicStyles = {
    container: {
      flex: 1,
      padding: 16,
    },
    title: {
      fontWeight: 'bold',
      color: colors.text,
      fontSize: 28 * scale,
      marginBottom: 8,
    },
    streakText: {
      marginBottom: 4,
      fontSize: 16 * scale,
      color: colors.text,
    },
    stats: {
      color: colors.subtitle,
      fontSize: 14 * scale,
      marginBottom: 12,
    },
    noBadge: {
      fontStyle: 'italic',
      color: colors.subtitle,
      fontSize: 14 * scale,
      marginBottom: 12,
    },
    badgeText: {
      fontWeight: '600',
      color: colors.text,
      fontSize: 16 * scale,
      marginBottom: 8,
    },
    logout: {
      color: colors.accent,
      fontSize: 16 * scale,
      fontWeight: '600',
      marginTop: 16,
    },
  };

  return (
    <ScrollView
      style={[dynamicStyles.container, { backgroundColor: colors.background }]}
    >
      <Text style={dynamicStyles.title}>
        {username ? `Hello, ${username} 👋` : 'Hello 👋'}
      </Text>

      <Text style={dynamicStyles.streakText}>
        🔥 {stats.loginStreak} Day Streak
      </Text>

      <Text style={dynamicStyles.stats}>
        Level {stats.level} • {stats.points} XP
      </Text>

      {achievements.length > 0 ? (
        achievements.map(achievement => (
          <Text key={achievement} style={dynamicStyles.badgeText}>
            {achievement}
          </Text>
        ))
      ) : (
        <Text style={dynamicStyles.noBadge}>No achievements yet</Text>
      )}

      <TouchableOpacity onPress={handleLogout}>
        <Text style={dynamicStyles.logout}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
