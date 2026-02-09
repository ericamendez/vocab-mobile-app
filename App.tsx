import React, {useEffect, useState} from 'react';
import {StatusBar, useColorScheme} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AppNavigator} from './src/navigation';
import {getSettings, initializeScheduler} from './src/store';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await getSettings();
      setIsOnboardingComplete(settings.isOnboardingComplete);
      
      // Initialize scheduler if auto-update was enabled
      await initializeScheduler();
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppNavigator isOnboardingComplete={isOnboardingComplete} />
    </SafeAreaProvider>
  );
}

export default App;
