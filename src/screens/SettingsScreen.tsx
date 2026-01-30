import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
} from 'react-native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../types';

type SettingsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Settings'>;
};

export function SettingsScreen({navigation}: SettingsScreenProps) {
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [updateFrequency, setUpdateFrequency] = useState<'hourly' | 'daily'>(
    'hourly',
  );

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          testID="back-button"
          style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wallpaper Updates</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Auto Update</Text>
              <Text style={styles.settingDescription}>
                Automatically update wallpaper with new words
              </Text>
            </View>
            <Switch
              value={autoUpdate}
              onValueChange={setAutoUpdate}
              trackColor={{false: '#3a3a5e', true: '#4a90d9'}}
              thumbColor="#ffffff"
              testID="auto-update-switch"
            />
          </View>

          <Text style={styles.frequencyLabel}>Update Frequency</Text>
          <View style={styles.frequencyContainer}>
            <TouchableOpacity
              style={[
                styles.frequencyOption,
                updateFrequency === 'hourly' && styles.frequencyOptionActive,
              ]}
              onPress={() => setUpdateFrequency('hourly')}
              testID="hourly-option">
              <Text
                style={[
                  styles.frequencyText,
                  updateFrequency === 'hourly' && styles.frequencyTextActive,
                ]}>
                Hourly
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.frequencyOption,
                updateFrequency === 'daily' && styles.frequencyOptionActive,
              ]}
              onPress={() => setUpdateFrequency('daily')}
              testID="daily-option">
              <Text
                style={[
                  styles.frequencyText,
                  updateFrequency === 'daily' && styles.frequencyTextActive,
                ]}>
                Daily
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Text Appearance</Text>
          <TouchableOpacity style={styles.settingRow} testID="text-color-option">
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Text Color</Text>
              <Text style={styles.settingDescription}>White</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingRow} testID="font-size-option">
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Font Size</Text>
              <Text style={styles.settingDescription}>Medium</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Version</Text>
            <Text style={styles.settingValue}>1.0.0</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
    color: '#ffffff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a0a0a0',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  settingValue: {
    fontSize: 16,
    color: '#a0a0a0',
  },
  chevron: {
    fontSize: 24,
    color: '#a0a0a0',
  },
  frequencyLabel: {
    fontSize: 16,
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 12,
  },
  frequencyContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  frequencyOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#2a2a4e',
    borderRadius: 8,
    alignItems: 'center',
  },
  frequencyOptionActive: {
    backgroundColor: '#4a90d9',
  },
  frequencyText: {
    fontSize: 16,
    color: '#a0a0a0',
  },
  frequencyTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
