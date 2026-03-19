import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from '../services/theme';

export default function PreparednessTaskScreen() {
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

  const colors = darkMode ? darkColors : lightColors;
  const scale = largeIcons ? 1.3 : 1;

  const completedCount = Object.values(checkedItems).filter(Boolean).length;
  const progress = Math.round((completedCount / items.length) * 100);
  const allCompleted = completedCount === items.length;
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
    addButtonText: { fontSize: 20 * scale, fontWeight: 'bold', color: '#fff' },
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
    item: { color: colors.text, fontSize: 16 * scale },
    badgeText: { color: colors.text, fontSize: 16 * scale, fontWeight: 'bold' },
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Input Row */}
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

      {/* Title & Progress */}
      <Text style={dynamicStyles.title}>Safety Kit Checklist</Text>
      <Text style={dynamicStyles.progress}>Progress: {progress}%</Text>

      {/* Checklist Items */}
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

      {/* Completion Badge */}
      {allCompleted && (
        <View style={[styles.badgeBox, { backgroundColor: colors.accent }]}>
          <Text style={dynamicStyles.badgeText}>Safety kit complete! 🏅</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  addRow: { flexDirection: 'row', marginBottom: 16, alignItems: 'center' },
  input: { flex: 1, borderRadius: 8, paddingHorizontal: 12, marginRight: 8 },
  addButton: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontWeight: 'bold', marginBottom: 8 },
  progress: { marginBottom: 12 },
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
  checkmark: { fontWeight: 'bold' },
  item: { flex: 1 },
  badgeBox: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  badgeText: { fontWeight: 'bold' },
});
