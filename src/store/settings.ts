import AsyncStorage from '@react-native-async-storage/async-storage';
import type {Settings} from '../types';
import {
  startScheduler,
  stopScheduler,
  enableScreenWakeMode,
  disableScreenWakeMode,
  setSchedulerImages,
  setSchedulerVocab,
  type UpdateInterval,
} from '../services/schedulerService';
import {getRandomWords} from '../services/vocabService';

const SETTINGS_KEY = '@vocab_wallpaper_settings';

const DEFAULT_SETTINGS: Settings = {
  isOnboardingComplete: false,
  selectedImageUris: [],
  updateFrequency: 'hourly',
  autoUpdateEnabled: false,
  textColor: '#ffffff',
  fontSize: 1.0,
};

export async function getSettings(): Promise<Settings> {
  try {
    const stored = await AsyncStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Migration: convert old selectedImageUri to selectedImageUris
      if (parsed.selectedImageUri && !parsed.selectedImageUris) {
        parsed.selectedImageUris = [parsed.selectedImageUri];
        delete parsed.selectedImageUri;
      }
      // Migration: convert old absolute fontSize (24) to multiplier format (1.0)
      // Multipliers should be between 0.5 and 2.0, old values were ~24
      if (parsed.fontSize && parsed.fontSize > 2) {
        parsed.fontSize = 1.0;
      }
      return {...DEFAULT_SETTINGS, ...parsed};
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

export async function setSelectedImages(imageUris: string[]): Promise<void> {
  await saveSettings({selectedImageUris: imageUris});
  // Also update the native scheduler
  await setSchedulerImages(imageUris);
}

export async function addSelectedImage(imageUri: string): Promise<void> {
  const settings = await getSettings();
  const newUris = [...settings.selectedImageUris, imageUri];
  await setSelectedImages(newUris);
}

export async function removeSelectedImage(imageUri: string): Promise<void> {
  const settings = await getSettings();
  const newUris = settings.selectedImageUris.filter(uri => uri !== imageUri);
  await setSelectedImages(newUris);
}

export async function setAutoUpdate(
  enabled: boolean,
  frequency: UpdateInterval,
): Promise<void> {
  await saveSettings({
    autoUpdateEnabled: enabled,
    updateFrequency: frequency,
  });

  if (enabled) {
    // Load vocab words into scheduler
    const words = await getRandomWords(50);
    await setSchedulerVocab(words);

    // Start the appropriate scheduler
    if (frequency === 'on_screen_wake') {
      await stopScheduler(); // Stop periodic scheduler if running
      await enableScreenWakeMode();
    } else {
      await disableScreenWakeMode(); // Disable screen wake if it was on
      await startScheduler(frequency);
    }
  } else {
    await stopScheduler();
    await disableScreenWakeMode();
  }
}

export async function clearSettings(): Promise<void> {
  try {
    await stopScheduler();
    await disableScreenWakeMode();
    await AsyncStorage.removeItem(SETTINGS_KEY);
  } catch (error) {
    console.error('Error clearing settings:', error);
    throw error;
  }
}

// Initialize scheduler on app start if auto-update was enabled
export async function initializeScheduler(): Promise<void> {
  try {
    const settings = await getSettings();
    
    if (settings.autoUpdateEnabled && settings.selectedImageUris.length > 0) {
      // Re-sync images and vocab to native
      await setSchedulerImages(settings.selectedImageUris);
      const words = await getRandomWords(50);
      await setSchedulerVocab(words);

      // Restart scheduler with saved settings
      if (settings.updateFrequency === 'on_screen_wake') {
        await enableScreenWakeMode();
      } else {
        await startScheduler(settings.updateFrequency);
      }
    }
  } catch (error) {
    console.error('Error initializing scheduler:', error);
  }
}
