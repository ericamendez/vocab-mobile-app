import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {Alert} from 'react-native';
import {ImagePickerScreen} from '../../src/screens/ImagePickerScreen';
import * as imageService from '../../src/services/imageService';

jest.mock('../../src/services/imageService');

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

const mockImageService = imageService as jest.Mocked<typeof imageService>;

describe('ImagePickerScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
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

  it('navigates to Preview with image uri when image is selected successfully', async () => {
    const mockUri = 'file:///path/to/image.jpg';
    mockImageService.pickAndPersistImage.mockResolvedValue({
      success: true,
      uri: mockUri,
    });

    const {getByTestId} = render(
      <ImagePickerScreen navigation={mockNavigation} />,
    );

    fireEvent.press(getByTestId('image-picker-button'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('Preview', {imageUri: mockUri});
    });
  });

  it('does not navigate when user cancels image selection', async () => {
    mockImageService.pickAndPersistImage.mockResolvedValue({
      success: false,
      uri: null,
      error: 'User cancelled image picker',
    });

    const {getByTestId} = render(
      <ImagePickerScreen navigation={mockNavigation} />,
    );

    fireEvent.press(getByTestId('image-picker-button'));

    await waitFor(() => {
      expect(mockImageService.pickAndPersistImage).toHaveBeenCalled();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('shows error alert when image selection fails', async () => {
    mockImageService.pickAndPersistImage.mockResolvedValue({
      success: false,
      uri: null,
      error: 'Permission denied',
    });

    const {getByTestId} = render(
      <ImagePickerScreen navigation={mockNavigation} />,
    );

    fireEvent.press(getByTestId('image-picker-button'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Permission denied');
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows error alert when pickAndPersistImage throws', async () => {
    mockImageService.pickAndPersistImage.mockRejectedValue(
      new Error('Unexpected error'),
    );

    const {getByTestId} = render(
      <ImagePickerScreen navigation={mockNavigation} />,
    );

    fireEvent.press(getByTestId('image-picker-button'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Failed to pick image. Please try again.',
      );
    });
  });

  it('shows loading text while picking image', async () => {
    let resolvePromise: (value: any) => void;
    const pendingPromise = new Promise(resolve => {
      resolvePromise = resolve;
    });

    mockImageService.pickAndPersistImage.mockReturnValue(
      pendingPromise as Promise<imageService.ImagePickerResult>,
    );

    const {getByTestId, getByText} = render(
      <ImagePickerScreen navigation={mockNavigation} />,
    );

    fireEvent.press(getByTestId('image-picker-button'));

    await waitFor(() => {
      expect(getByText('Opening gallery...')).toBeTruthy();
    });

    resolvePromise!({success: false, uri: null, error: 'User cancelled image picker'});

    await waitFor(() => {
      expect(getByText('Tap to select a photo')).toBeTruthy();
    });
  });
});
