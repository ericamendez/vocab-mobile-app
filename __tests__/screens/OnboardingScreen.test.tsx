import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {OnboardingScreen} from '../../src/screens/OnboardingScreen';
import {completeOnboarding} from '../../src/store';

jest.mock('../../src/store', () => ({
  completeOnboarding: jest.fn().mockResolvedValue(undefined),
}));

const mockNavigate = jest.fn();
const mockReplace = jest.fn();

const mockNavigation = {
  navigate: mockNavigate,
  replace: mockReplace,
  goBack: jest.fn(),
  setOptions: jest.fn(),
  reset: jest.fn(),
  isFocused: jest.fn(),
  canGoBack: jest.fn(),
} as any;

describe('OnboardingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the title correctly', () => {
    const {getByText} = render(
      <OnboardingScreen navigation={mockNavigation} />,
    );

    expect(getByText('Vocab Wallpaper')).toBeTruthy();
  });

  it('renders the subtitle correctly', () => {
    const {getByText} = render(
      <OnboardingScreen navigation={mockNavigation} />,
    );

    expect(
      getByText('Learn new words every time you check your phone'),
    ).toBeTruthy();
  });

  it('renders the get started button', () => {
    const {getByTestId} = render(
      <OnboardingScreen navigation={mockNavigation} />,
    );

    expect(getByTestId('get-started-button')).toBeTruthy();
  });

  it('completes onboarding and navigates to ImagePicker when get started is pressed', async () => {
    const {getByTestId} = render(
      <OnboardingScreen navigation={mockNavigation} />,
    );

    fireEvent.press(getByTestId('get-started-button'));

    await waitFor(() => {
      expect(completeOnboarding).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('ImagePicker');
    });
  });
});
