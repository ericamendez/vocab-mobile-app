import React from 'react';
import {render} from '@testing-library/react-native';
import {NavigationContainer} from '@react-navigation/native';
import {OnboardingScreen} from '../src/screens/OnboardingScreen';

// Mock navigation for standalone screen test
const mockNavigation = {
  navigate: jest.fn(),
  replace: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
  reset: jest.fn(),
  isFocused: jest.fn(),
  canGoBack: jest.fn(),
} as any;

describe('App Integration', () => {
  it('OnboardingScreen renders correctly with navigation context', () => {
    const {getByText} = render(
      <NavigationContainer>
        <OnboardingScreen navigation={mockNavigation} />
      </NavigationContainer>,
    );

    expect(getByText('Vocab Wallpaper')).toBeTruthy();
  });

  it('OnboardingScreen shows get started button', () => {
    const {getByText} = render(
      <NavigationContainer>
        <OnboardingScreen navigation={mockNavigation} />
      </NavigationContainer>,
    );

    expect(getByText('Get Started')).toBeTruthy();
  });
});
