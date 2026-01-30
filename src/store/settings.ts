import AsyncStorage from '@react-native-async-storage/async-storage';
import type {Settings} from '../types';

const SETTINGS_KEY = '@vocab_wallpaper_settings';

const DEFAULT_SETTINGS: Settings = {
  isOnboardingComplete: false,
  selectedImageUri: null,
  updateFrequency: 'hourly',
  textColor: '#ffffff',
  fontSize: 24,
};

export async function getSettings(): Promise<Settings> {
  try {
    const stored = await AsyncStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return {...DEFAULT_SETTINGS, ...JSON.parse(stored)};
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error reading settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Partial<Settings>): Promise<void> {
  try {
    const current = await getSettings();
    const updated = {...current, ...settings};
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error;
  }
}

export async function completeOnboarding(): Promise<void> {
  await saveSettings({isOnboardingComplete: true});
}

export async function setSelectedImage(imageUri: string): Promise<void> {
  await saveSettings({selectedImageUri: imageUri});
}

export async function clearSettings(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SETTINGS_KEY);
  } catch (error) {
    console.error('Error clearing settings:', error);
    throw error;
  }
}
