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
  saveSettings,
} from '../store/settings';
import {
  triggerWallpaperUpdate,
  isSchedulerSupported,
  setSchedulerImages,
  setSchedulerVocab,
  setTextAppearance,
} from '../services/schedulerService';
import {getRandomWords} from '../services/vocabService';
import type {UpdateInterval} from '../services/schedulerService';

type SettingsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Settings'>;
};

// Color options with display names
const COLOR_OPTIONS = [
  {value: '#FFFFFF', label: 'White'},
  {value: '#FFD700', label: 'Gold'},
  {value: '#00FFFF', label: 'Cyan'},
  {value: '#FF69B4', label: 'Pink'},
  {value: '#90EE90', label: 'Light Green'},
  {value: '#FFA500', label: 'Orange'},
];

// Font size options (multiplier for base size)
const FONT_SIZE_OPTIONS = [
  {value: 0.7, label: 'Small'},
  {value: 1.0, label: 'Medium'},
  {value: 1.3, label: 'Large'},
];

export function SettingsScreen({navigation}: SettingsScreenProps) {
  const [autoUpdate, setAutoUpdateState] = useState(false);
  const [updateFrequency, setUpdateFrequency] = useState<UpdateInterval>('hourly');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [fontSize, setFontSize] = useState(1.0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await getSettings();
      setAutoUpdateState(settings.autoUpdateEnabled);
      setUpdateFrequency(settings.updateFrequency);
      setTextColor(settings.textColor || '#FFFFFF');
      setFontSize(settings.fontSize || 1.0);
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

  const handleColorChange = useCallback(async (color: string) => {
    setTextColor(color);
    setShowColorPicker(false);
    try {
      await saveSettings({textColor: color});
      await setTextAppearance(color, fontSize);
    } catch (error) {
      console.error('Error saving color:', error);
    }
  }, [fontSize]);

  const handleFontSizeChange = useCallback(async (size: number) => {
    setFontSize(size);
    setShowSizePicker(false);
    try {
      await saveSettings({fontSize: size});
      await setTextAppearance(textColor, size);
    } catch (error) {
      console.error('Error saving font size:', error);
    }
  }, [textColor]);

  const handleTestNow = useCallback(async () => {
    setIsSaving(true);
    try {
      // First, ensure images and vocab are synced to native
      const settings = await getSettings();
      
      if (!settings.selectedImageUris || settings.selectedImageUris.length === 0) {
        Alert.alert('No Images', 'Please add some photos first before testing.');
        return;
      }

      // Sync images to native scheduler
      await setSchedulerImages(settings.selectedImageUris);
      
      // Sync vocab words to native scheduler
      const words = await getRandomWords(50);
      await setSchedulerVocab(words);

      // Sync text appearance
      await setTextAppearance(textColor, fontSize);
      
      // Now trigger the update
      const success = await triggerWallpaperUpdate();
      if (success) {
        Alert.alert('Success', 'Wallpaper update triggered! Check your lock screen in a few seconds.');
      } else {
        Alert.alert('Error', 'Failed to trigger wallpaper update');
      }
    } catch (error) {
      console.error('Error triggering update:', error);
      Alert.alert('Error', `Failed to trigger wallpaper update: ${error}`);
    } finally {
      setIsSaving(false);
    }
  }, [textColor, fontSize]);

  const handleBack = () => {
    navigation.goBack();
  };

  const getColorLabel = (value: string) => {
    return COLOR_OPTIONS.find(c => c.value === value)?.label || 'White';
  };

  const getFontSizeLabel = (value: number) => {
    return FONT_SIZE_OPTIONS.find(s => s.value === value)?.label || 'Medium';
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
          
          <TouchableOpacity 
            style={styles.settingRow} 
            testID="text-color-option"
            onPress={() => setShowColorPicker(!showColorPicker)}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Text Color</Text>
              <View style={styles.colorPreview}>
                <View style={[styles.colorDot, {backgroundColor: textColor}]} />
                <Text style={styles.settingDescription}>{getColorLabel(textColor)}</Text>
              </View>
            </View>
            <Text style={styles.chevron}>{showColorPicker ? '▼' : '›'}</Text>
          </TouchableOpacity>

          {showColorPicker && (
            <View style={styles.optionGrid}>
              {COLOR_OPTIONS.map(color => (
                <TouchableOpacity
                  key={color.value}
                  style={[
                    styles.colorOption,
                    textColor === color.value && styles.colorOptionActive,
                  ]}
                  onPress={() => handleColorChange(color.value)}>
                  <View style={[styles.colorSwatch, {backgroundColor: color.value}]} />
                  <Text style={[
                    styles.colorLabel,
                    textColor === color.value && styles.colorLabelActive,
                  ]}>
                    {color.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity 
            style={styles.settingRow} 
            testID="font-size-option"
            onPress={() => setShowSizePicker(!showSizePicker)}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Font Size</Text>
              <Text style={styles.settingDescription}>{getFontSizeLabel(fontSize)}</Text>
            </View>
            <Text style={styles.chevron}>{showSizePicker ? '▼' : '›'}</Text>
          </TouchableOpacity>

          {showSizePicker && (
            <View style={styles.sizeContainer}>
              {FONT_SIZE_OPTIONS.map(size => (
                <TouchableOpacity
                  key={size.value}
                  style={[
                    styles.sizeOption,
                    fontSize === size.value && styles.sizeOptionActive,
                  ]}
                  onPress={() => handleFontSizeChange(size.value)}>
                  <Text style={[
                    styles.sizeLabel,
                    fontSize === size.value && styles.sizeLabelActive,
                    {fontSize: 14 * size.value},
                  ]}>
                    {size.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
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
    fontSize: 20,
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
  colorPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    marginTop: 8,
  },
  colorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a4e',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 8,
  },
  colorOptionActive: {
    backgroundColor: '#4a90d9',
  },
  colorSwatch: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#444',
  },
  colorLabel: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  colorLabelActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  sizeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    marginTop: 8,
  },
  sizeOption: {
    flex: 1,
    backgroundColor: '#2a2a4e',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  sizeOptionActive: {
    backgroundColor: '#4a90d9',
  },
  sizeLabel: {
    color: '#a0a0a0',
  },
  sizeLabelActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
