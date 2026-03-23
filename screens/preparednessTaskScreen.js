// imports
import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from '../services/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Prepareedness task screen component
export default function PreparednessTaskScreen() {
  const insets = useSafeAreaInsets();
  const { largeIcons } = useContext(AppContext);

  const [darkMode, setDarkMode] = useState(false);
  const [items, setItems] = useState([
    'water bottles',
    'non-perishable food',
    'first aid kit',
    'flashlight with extra batteries',
    'battery-powered or hand-crank radio',
    'whistle',
  ]);
  const [checkedItems, setCheckedItems] = useState({});
  const [newItem, setNewItem] = useState('');
  // Load dark mode settings on component mount
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
  // Determine scaling and colours based on settings
  const colors = darkMode ? darkColors : lightColors;
  const scale = largeIcons ? 1.3 : 1;
  const completedCount = Object.values(checkedItems).filter(Boolean).length;
  const progress =
    items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;
  const allCompleted = items.length > 0 && completedCount === items.length;
  // Save preparedness score whenever progress changes
  useEffect(() => {
    const saveScore = async () => {
      try {
        await AsyncStorage.setItem(
          'currentPreparednessScore',
          JSON.stringify(progress),
        );
      } catch (e) {
        console.error('Failed to save preparedness score', e);
      }
    };
    saveScore();
  }, [progress]);
  // styles based on accessibilty settings and theme
  const dynamicStyles = {
    input: {
      backgroundColor: colors.inputBackground,
      color: colors.text,
      fontSize: 14 * scale,
      paddingVertical: 10 * scale,
    },
    addButton: {
      backgroundColor: colors.accent,
      paddingHorizontal: 16 * scale,
      paddingVertical: 12 * scale,
    },
    addButtonText: {
      fontSize: 20 * scale,
      fontWeight: 'bold',
      color: '#fff',
    },
    title: {
      color: colors.text,
      fontSize: 22 * scale,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    progress: {
      color: colors.subtitle,
      fontSize: 14 * scale,
      marginBottom: 12,
    },
    checkbox: {
      width: 24 * scale,
      height: 24 * scale,
      borderColor: colors.subtitle,
    },
    checkmark: {
      fontSize: 16 * scale,
      color: colors.accent,
      fontWeight: 'bold',
    },
    item: {
      color: colors.text,
      fontSize: 16 * scale,
    },
    badgeText: {
      color: colors.text,
      fontSize: 16 * scale,
      fontWeight: 'bold',
    },
  };
  // UI
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 16,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.addRow}>
        <TextInput
          style={[styles.input, dynamicStyles.input]}
          placeholder="Add custom item..."
          placeholderTextColor={colors.subtitle}
          value={newItem}
          onChangeText={setNewItem}
        />
        <TouchableOpacity
          style={[styles.addButton, dynamicStyles.addButton]}
          onPress={() => {
            if (!newItem.trim()) return;
            setItems([...items, newItem.trim()]);
            setCheckedItems({ ...checkedItems, [newItem.trim()]: false });
            setNewItem('');
          }}
        >
          <Text style={dynamicStyles.addButtonText}>＋</Text>
        </TouchableOpacity>
      </View>

      <Text style={dynamicStyles.title}>Safety Kit Checklist</Text>
      <Text style={dynamicStyles.progress}>Progress: {progress}%</Text>

      {items.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.row, { backgroundColor: colors.card }]}
          onPress={() =>
            setCheckedItems({ ...checkedItems, [item]: !checkedItems[item] })
          }
        >
          <View style={[styles.checkbox, dynamicStyles.checkbox]}>
            {checkedItems[item] && (
              <Text style={dynamicStyles.checkmark}>✓</Text>
            )}
          </View>
          <Text style={dynamicStyles.item}>{item}</Text>
        </TouchableOpacity>
      ))}

      {allCompleted && (
        <View style={[styles.badgeBox, { backgroundColor: colors.accent }]}>
          <Text style={dynamicStyles.badgeText}>Safety kit complete! 🏅</Text>
        </View>
      )}
    </ScrollView>
  );
}
// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  addRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  addButton: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  checkbox: {
    borderRadius: 4,
    borderWidth: 2,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeBox: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
});
