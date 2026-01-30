import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {ImagePickerScreen} from '../../src/screens/ImagePickerScreen';

const mockNavigate = jest.fn();

const mockNavigation = {
  navigate: mockNavigate,
  replace: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
  reset: jest.fn(),
  isFocused: jest.fn(),
  canGoBack: jest.fn(),
} as any;

describe('ImagePickerScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the title correctly', () => {
    const {getByText} = render(
      <ImagePickerScreen navigation={mockNavigation} />,
    );

    expect(getByText('Choose Your Photo')).toBeTruthy();
  });

  it('renders the image picker button', () => {
    const {getByTestId} = render(
      <ImagePickerScreen navigation={mockNavigation} />,
    );

    expect(getByTestId('image-picker-button')).toBeTruthy();
  });

  it('renders the settings button', () => {
    const {getByTestId} = render(
      <ImagePickerScreen navigation={mockNavigation} />,
    );

    expect(getByTestId('settings-button')).toBeTruthy();
  });

  it('navigates to Settings when settings button is pressed', () => {
    const {getByTestId} = render(
      <ImagePickerScreen navigation={mockNavigation} />,
    );

    fireEvent.press(getByTestId('settings-button'));

    expect(mockNavigate).toHaveBeenCalledWith('Settings');
  });

  it('navigates to Preview when image picker is pressed', () => {
    const {getByTestId} = render(
      <ImagePickerScreen navigation={mockNavigation} />,
    );

    fireEvent.press(getByTestId('image-picker-button'));

    expect(mockNavigate).toHaveBeenCalledWith('Preview', {imageUri: 'placeholder'});
  });
});
