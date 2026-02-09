import {
  getSettings,
  saveSettings,
  completeOnboarding,
  setSelectedImage,
  clearSettings,
} from '../../src/store/settings';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('settings store', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  describe('getSettings', () => {
    it('returns default settings when no settings are stored', async () => {
      const settings = await getSettings();

      expect(settings.isOnboardingComplete).toBe(false);
      expect(settings.selectedImageUri).toBeNull();
      expect(settings.updateFrequency).toBe('hourly');
      expect(settings.textColor).toBe('#ffffff');
      expect(settings.fontSize).toBe(1.0);
    });

    it('returns stored settings merged with defaults', async () => {
      await AsyncStorage.setItem(
        '@vocab_wallpaper_settings',
        JSON.stringify({isOnboardingComplete: true}),
      );

      const settings = await getSettings();

      expect(settings.isOnboardingComplete).toBe(true);
      expect(settings.updateFrequency).toBe('hourly');
    });
  });

  describe('saveSettings', () => {
    it('saves partial settings', async () => {
      await saveSettings({isOnboardingComplete: true});

      const settings = await getSettings();

      expect(settings.isOnboardingComplete).toBe(true);
      expect(settings.updateFrequency).toBe('hourly');
    });

    it('updates existing settings', async () => {
      await saveSettings({updateFrequency: 'daily'});
      await saveSettings({textColor: '#000000'});

      const settings = await getSettings();

      expect(settings.updateFrequency).toBe('daily');
      expect(settings.textColor).toBe('#000000');
    });
  });

  describe('completeOnboarding', () => {
    it('sets isOnboardingComplete to true', async () => {
      await completeOnboarding();

      const settings = await getSettings();

      expect(settings.isOnboardingComplete).toBe(true);
    });
  });

  describe('setSelectedImage', () => {
    it('sets the selected image URI', async () => {
      await setSelectedImage('file:///path/to/image.jpg');

      const settings = await getSettings();

      expect(settings.selectedImageUri).toBe('file:///path/to/image.jpg');
    });
  });

  describe('clearSettings', () => {
    it('clears all settings', async () => {
      await saveSettings({isOnboardingComplete: true, textColor: '#000000'});
      await clearSettings();

      const settings = await getSettings();

      expect(settings.isOnboardingComplete).toBe(false);
      expect(settings.textColor).toBe('#ffffff');
    });
  });
});
