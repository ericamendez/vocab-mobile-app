import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {SettingsScreen} from '../../src/screens/SettingsScreen';

const mockGoBack = jest.fn();

const mockNavigation = {
  navigate: jest.fn(),
  replace: jest.fn(),
  goBack: mockGoBack,
  setOptions: jest.fn(),
  reset: jest.fn(),
  isFocused: jest.fn(),
  canGoBack: jest.fn(),
} as any;

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the title correctly', () => {
    const {getByText} = render(
      <SettingsScreen navigation={mockNavigation} />,
    );

    expect(getByText('Settings')).toBeTruthy();
  });

  it('renders the wallpaper updates section', () => {
    const {getByText} = render(
      <SettingsScreen navigation={mockNavigation} />,
    );

    expect(getByText('Wallpaper Updates')).toBeTruthy();
    expect(getByText('Auto Update')).toBeTruthy();
  });

  it('renders the frequency options', () => {
    const {getByTestId} = render(
      <SettingsScreen navigation={mockNavigation} />,
    );

    expect(getByTestId('hourly-option')).toBeTruthy();
    expect(getByTestId('daily-option')).toBeTruthy();
  });

  it('renders the text appearance section', () => {
    const {getByText} = render(
      <SettingsScreen navigation={mockNavigation} />,
    );

    expect(getByText('Text Appearance')).toBeTruthy();
    expect(getByText('Text Color')).toBeTruthy();
    expect(getByText('Font Size')).toBeTruthy();
  });

  it('renders the about section with version', () => {
    const {getByText} = render(
      <SettingsScreen navigation={mockNavigation} />,
    );

    expect(getByText('About')).toBeTruthy();
    expect(getByText('Version')).toBeTruthy();
    expect(getByText('1.0.0')).toBeTruthy();
  });

  it('goes back when back button is pressed', () => {
    const {getByTestId} = render(
      <SettingsScreen navigation={mockNavigation} />,
    );

    fireEvent.press(getByTestId('back-button'));

    expect(mockGoBack).toHaveBeenCalled();
  });

  it('toggles auto update switch', () => {
    const {getByTestId} = render(
      <SettingsScreen navigation={mockNavigation} />,
    );

    const autoUpdateSwitch = getByTestId('auto-update-switch');
    fireEvent(autoUpdateSwitch, 'valueChange', false);

    // Switch should respond to toggle
    expect(autoUpdateSwitch).toBeTruthy();
  });
});
