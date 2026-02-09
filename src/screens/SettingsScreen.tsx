import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
} from 'react-native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../types';
import {
  getSettings,
  setAutoUpdate,
} from '../store/settings';
import {
  triggerWallpaperUpdate,
  isSchedulerSupported,
} from '../services/schedulerService';
import type {UpdateInterval} from '../services/schedulerService';

type SettingsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Settings'>;
};

export function SettingsScreen({navigation}: SettingsScreenProps) {
  const [autoUpdate, setAutoUpdateState] = useState(false);
  const [updateFrequency, setUpdateFrequency] = useState<UpdateInterval>('hourly');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await getSettings();
      setAutoUpdateState(settings.autoUpdateEnabled);
      setUpdateFrequency(settings.updateFrequency);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoUpdateChange = useCallback(async (enabled: boolean) => {
    setIsSaving(true);
    setAutoUpdateState(enabled);
    try {
      await setAutoUpdate(enabled, updateFrequency);
    } catch (error) {
      console.error('Error updating auto-update setting:', error);
      setAutoUpdateState(!enabled); // Revert on error
      Alert.alert('Error', 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  }, [updateFrequency]);

  const handleFrequencyChange = useCallback(async (frequency: UpdateInterval) => {
    setIsSaving(true);
    const previousFrequency = updateFrequency;
    setUpdateFrequency(frequency);
    try {
      if (autoUpdate) {
        await setAutoUpdate(true, frequency);
      } else {
        // Just save the preference without starting scheduler
        await setAutoUpdate(false, frequency);
        // Re-enable since we want it on
        setAutoUpdateState(true);
        await setAutoUpdate(true, frequency);
      }
    } catch (error) {
      console.error('Error updating frequency:', error);
      setUpdateFrequency(previousFrequency);
      Alert.alert('Error', 'Failed to update frequency');
    } finally {
      setIsSaving(false);
    }
  }, [autoUpdate, updateFrequency]);

  const handleTestNow = useCallback(async () => {
    setIsSaving(true);
    try {
      const success = await triggerWallpaperUpdate();
      if (success) {
        Alert.alert('Success', 'Wallpaper update triggered! Check your lock screen.');
      } else {
        Alert.alert('Error', 'Failed to trigger wallpaper update');
      }
    } catch (error) {
      console.error('Error triggering update:', error);
      Alert.alert('Error', 'Failed to trigger wallpaper update');
    } finally {
      setIsSaving(false);
    }
  }, []);

  const handleBack = () => {
    navigation.goBack();
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const schedulerSupported = isSchedulerSupported();

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
              onValueChange={handleAutoUpdateChange}
              trackColor={{false: '#3a3a5e', true: '#4a90d9'}}
              thumbColor="#ffffff"
              testID="auto-update-switch"
              disabled={isSaving || !schedulerSupported}
            />
          </View>

          {!schedulerSupported && (
            <Text style={styles.warningText}>
              Auto-update is only available on Android
            </Text>
          )}

          <Text style={styles.frequencyLabel}>Update Frequency</Text>
          <View style={styles.frequencyContainer}>
            <TouchableOpacity
              style={[
                styles.frequencyOption,
                updateFrequency === 'on_screen_wake' && styles.frequencyOptionActive,
              ]}
              onPress={() => handleFrequencyChange('on_screen_wake')}
              testID="screen-wake-option"
              disabled={isSaving}>
              <Text
                style={[
                  styles.frequencyText,
                  updateFrequency === 'on_screen_wake' && styles.frequencyTextActive,
                ]}>
                On Wake
              </Text>
              <Text style={styles.frequencySubtext}>Testing</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.frequencyOption,
                updateFrequency === 'hourly' && styles.frequencyOptionActive,
              ]}
              onPress={() => handleFrequencyChange('hourly')}
              testID="hourly-option"
              disabled={isSaving}>
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
              onPress={() => handleFrequencyChange('daily')}
              testID="daily-option"
              disabled={isSaving}>
              <Text
                style={[
                  styles.frequencyText,
                  updateFrequency === 'daily' && styles.frequencyTextActive,
                ]}>
                Daily
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.testButton, isSaving && styles.testButtonDisabled]}
            onPress={handleTestNow}
            testID="test-now-button"
            disabled={isSaving || !schedulerSupported}>
            <Text style={styles.testButtonText}>
              {isSaving ? 'Please wait...' : 'Test Now'}
            </Text>
          </TouchableOpacity>
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
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
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
    gap: 8,
  },
  frequencyOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#2a2a4e',
    borderRadius: 8,
    alignItems: 'center',
  },
  frequencyOptionActive: {
    backgroundColor: '#4a90d9',
  },
  frequencyText: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  frequencyTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  frequencySubtext: {
    fontSize: 10,
    color: '#7a7a9a',
    marginTop: 2,
  },
  testButton: {
    backgroundColor: '#4a90d9',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  testButtonDisabled: {
    backgroundColor: '#3a3a5e',
  },
  testButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  warningText: {
    fontSize: 12,
    color: '#ff6b6b',
    marginTop: 4,
  },
});
