import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {
  OnboardingScreen,
  ImagePickerScreen,
  PreviewScreen,
  SettingsScreen,
} from '../screens';
import type {RootStackParamList} from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

interface AppNavigatorProps {
  isOnboardingComplete?: boolean;
}

export function AppNavigator({isOnboardingComplete = false}: AppNavigatorProps) {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isOnboardingComplete ? 'ImagePicker' : 'Onboarding'}
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="ImagePicker" component={ImagePickerScreen} />
        <Stack.Screen name="Preview" component={PreviewScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
