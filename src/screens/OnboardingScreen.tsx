import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../types';
import {completeOnboarding} from '../store';

type OnboardingScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;
};

export function OnboardingScreen({navigation}: OnboardingScreenProps) {
  const handleGetStarted = async () => {
    await completeOnboarding();
    navigation.replace('ImagePicker');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Vocab Wallpaper</Text>
        <Text style={styles.subtitle}>
          Learn new words every time you check your phone
        </Text>
        <Text style={styles.description}>
          Choose a photo from your library, and we'll overlay vocabulary words
          on your lock screen wallpaper. A new word appears every hour!
        </Text>
      </View>
      <TouchableOpacity
        style={styles.button}
        onPress={handleGetStarted}
        testID="get-started-button">
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 24,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#e0e0e0',
    textAlign: 'center',
    marginBottom: 24,
  },
  description: {
    fontSize: 14,
    color: '#a0a0a0',
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#4a90d9',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});
