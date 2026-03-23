// imports
import React, { useContext, useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from '../services/theme';
import { AppContext } from '../context/AppContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Constants
const ALL_ACHIEVEMENTS = [
  {
    key: 'checklist_master',
    label: '🏅 Checklist Master',
    description: 'Complete your full safety kit checklist.',
  },
  {
    key: 'streak_3',
    label: '🔥 3-Day Streak',
    description: 'Log in for 3 days in a row.',
  },
  {
    key: 'streak_7',
    label: '⚡ 7-Day Streak',
    description: 'Log in for 7 days in a row.',
  },
  {
    key: 'first_shelter',
    label: '🛖 Shelter Planner',
    description: 'Add your first safe zone or shelter.',
  },
  {
    key: 'level_5',
    label: '⭐ Level 5 Survivor',
    description: 'Reach level 5.',
  },
];

// Profile Screen component
export default function ProfileScreen({ navigation }) {
  const { darkMode, largeIcons } = useContext(AppContext);
  const insets = useSafeAreaInsets();

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
  // Load profile data on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const currentUser = await AsyncStorage.getItem('currentUser');
        if (!currentUser) return;

        setUsername(currentUser);

        const rawUsers = await AsyncStorage.getItem('users');
        const storedUsers = rawUsers ? JSON.parse(rawUsers) : {};
        const userData = storedUsers[currentUser];

        if (userData?.stats) {
          const loadedStats = { ...userData.stats };

          const points = loadedStats.points || 0;
          loadedStats.level = Math.floor(points / 100) + 1;
          loadedStats.badges = Array.isArray(loadedStats.badges)
            ? loadedStats.badges
            : [];

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
  // Logout function
  const handleLogout = async () => {
    await AsyncStorage.removeItem('currentUser');
    navigation.replace('Login');
  };

  const handleGoHome = () => {
    navigation.navigate('Main', { screen: 'Home' });
  };
  // Calculate earned achievements
  const getEarnedAchievements = () => {
    const earned = [];

    if (stats.checklistCompleted) {
      earned.push('🏅 Checklist Master');
    }
    if ((stats.loginStreak || 0) >= 3) {
      earned.push('🔥 3-Day Streak');
    }
    if ((stats.loginStreak || 0) >= 7) {
      earned.push('⚡ 7-Day Streak');
    }
    if ((stats.sheltersAdded || 0) >= 1) {
      earned.push('🛖 Shelter Planner');
    }
    if ((stats.level || 1) >= 5) {
      earned.push('⭐ Level 5 Survivor');
    }

    if (Array.isArray(stats.badges)) {
      stats.badges.forEach(badge => {
        if (!earned.includes(badge)) {
          earned.push(badge);
        }
      });
    }

    return earned;
  };

  const earnedAchievements = getEarnedAchievements();
  // Demo function to add an achievement - for testing
  const addDemoAchievement = async () => {
    try {
      const currentUser = await AsyncStorage.getItem('currentUser');
      if (!currentUser) return;

      const rawUsers = await AsyncStorage.getItem('users');
      const storedUsers = rawUsers ? JSON.parse(rawUsers) : {};
      const userData = storedUsers[currentUser];

      if (!userData) return;

      const updatedStats = {
        ...userData.stats,
        badges: Array.isArray(userData.stats?.badges)
          ? [...userData.stats.badges]
          : [],
      };

      const demoBadge = '🏅 Demo Achievement';
      if (!updatedStats.badges.includes(demoBadge)) {
        updatedStats.badges.push(demoBadge);
      }

      updatedStats.points = Math.max(updatedStats.points || 0, 100);

      updatedStats.level = Math.floor(updatedStats.points / 100) + 1;

      userData.stats = updatedStats;
      storedUsers[currentUser] = userData;

      await AsyncStorage.setItem('users', JSON.stringify(storedUsers));

      setStats(updatedStats);
    } catch (error) {
      console.error('Error adding demo achievement:', error);
    }
  };
  // Styles
  const styles = {
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
    sectionTitle: {
      color: colors.text,
      fontSize: 20 * scale,
      fontWeight: 'bold',
      marginTop: 20,
      marginBottom: 10,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
    },
    achievementTitle: {
      color: colors.text,
      fontSize: 16 * scale,
      fontWeight: '600',
      marginBottom: 4,
    },
    achievementDescription: {
      color: colors.subtitle,
      fontSize: 13 * scale,
    },
    emptyText: {
      fontStyle: 'italic',
      color: colors.subtitle,
      fontSize: 14 * scale,
      marginBottom: 12,
    },
    primaryButton: {
      marginTop: 20,
      padding: 12,
      borderRadius: 10,
      backgroundColor: colors.accent,
      alignItems: 'center',
    },
    primaryButtonText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 16 * scale,
    },
    secondaryButton: {
      marginTop: 12,
      padding: 12,
      borderRadius: 10,
      backgroundColor: colors.card,
      alignItems: 'center',
    },
    secondaryButtonText: {
      color: colors.text,
      fontWeight: '600',
      fontSize: 15 * scale,
    },
    logout: {
      color: colors.accent,
      fontSize: 16 * scale,
      fontWeight: '600',
      marginTop: 16,
      textAlign: 'center',
    },
  };
  // UI
  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: insets.top + 20,
        paddingBottom: insets.bottom + 30,
        paddingHorizontal: 16,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>
        {username ? `Hello, ${username} 👋` : 'Hello 👋'}
      </Text>

      <Text style={styles.streakText}>🔥 {stats.loginStreak} Day Streak</Text>

      <Text style={styles.stats}>
        Level {stats.level} • {stats.points} XP
      </Text>

      <Text style={styles.sectionTitle}>Earned Achievements</Text>

      {earnedAchievements.length > 0 ? (
        earnedAchievements.map(achievement => (
          <View key={achievement} style={styles.card}>
            <Text style={styles.achievementTitle}>{achievement}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No achievements yet</Text>
      )}

      <Text style={styles.sectionTitle}>Possible Achievements</Text>

      {ALL_ACHIEVEMENTS.map(achievement => (
        <View key={achievement.key} style={styles.card}>
          <Text style={styles.achievementTitle}>{achievement.label}</Text>
          <Text style={styles.achievementDescription}>
            {achievement.description}
          </Text>
        </View>
      ))}

      <TouchableOpacity style={styles.primaryButton} onPress={handleGoHome}>
        <Text style={styles.primaryButtonText}>Go to Home</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={addDemoAchievement}
      >
        <Text style={styles.secondaryButtonText}>Add Demo Achievement</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleLogout}>
        <Text style={styles.logout}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
