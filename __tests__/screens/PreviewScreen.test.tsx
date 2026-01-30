import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {Alert} from 'react-native';
import {PreviewScreen} from '../../src/screens/PreviewScreen';
import * as settingsStore from '../../src/store/settings';

jest.mock('../../src/store/settings');

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

const mockNavigation = {
  navigate: mockNavigate,
  replace: jest.fn(),
  goBack: mockGoBack,
  setOptions: jest.fn(),
  reset: jest.fn(),
  isFocused: jest.fn(),
  canGoBack: jest.fn(),
} as any;

const mockRoute = {
  params: {
    imageUri: 'test-image-uri',
  },
} as any;

const mockSettingsStore = settingsStore as jest.Mocked<typeof settingsStore>;

describe('PreviewScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockSettingsStore.setSelectedImage.mockResolvedValue(undefined);
  });

  it('renders the title correctly', () => {
    const {getByText} = render(
      <PreviewScreen navigation={mockNavigation} route={mockRoute} />,
    );

    expect(getByText('Preview')).toBeTruthy();
  });

  it('renders the word overlay', () => {
    const {getByText} = render(
      <PreviewScreen navigation={mockNavigation} route={mockRoute} />,
    );

    expect(getByText('Ephemeral')).toBeTruthy();
    expect(
      getByText('lasting for a very short time; transitory'),
    ).toBeTruthy();
  });

  it('renders the action buttons', () => {
    const {getByTestId} = render(
      <PreviewScreen navigation={mockNavigation} route={mockRoute} />,
    );

    expect(getByTestId('choose-another-button')).toBeTruthy();
    expect(getByTestId('set-wallpaper-button')).toBeTruthy();
  });

  it('goes back when choose another is pressed', () => {
    const {getByTestId} = render(
      <PreviewScreen navigation={mockNavigation} route={mockRoute} />,
    );

    fireEvent.press(getByTestId('choose-another-button'));

    expect(mockGoBack).toHaveBeenCalled();
  });

  it('goes back when back button is pressed', () => {
    const {getByTestId} = render(
      <PreviewScreen navigation={mockNavigation} route={mockRoute} />,
    );

    fireEvent.press(getByTestId('back-button'));

    expect(mockGoBack).toHaveBeenCalled();
  });

  it('saves image and shows success alert when set wallpaper is pressed', async () => {
    const {getByTestId} = render(
      <PreviewScreen navigation={mockNavigation} route={mockRoute} />,
    );

    fireEvent.press(getByTestId('set-wallpaper-button'));

    await waitFor(() => {
      expect(mockSettingsStore.setSelectedImage).toHaveBeenCalledWith(
        'test-image-uri',
      );
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Success',
        'Your wallpaper image has been saved! The app will use this image for generating vocabulary wallpapers.',
        [{text: 'OK'}],
      );
    });
  });

  it('shows error alert when saving fails', async () => {
    mockSettingsStore.setSelectedImage.mockRejectedValue(
      new Error('Storage error'),
    );

    const {getByTestId} = render(
      <PreviewScreen navigation={mockNavigation} route={mockRoute} />,
    );

    fireEvent.press(getByTestId('set-wallpaper-button'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Failed to save wallpaper image. Please try again.',
      );
    });
  });

  it('shows saving text while saving', async () => {
    let resolvePromise: () => void;
    const pendingPromise = new Promise<void>(resolve => {
      resolvePromise = resolve;
    });

    mockSettingsStore.setSelectedImage.mockReturnValue(pendingPromise);

    const {getByTestId, getByText} = render(
      <PreviewScreen navigation={mockNavigation} route={mockRoute} />,
    );

    fireEvent.press(getByTestId('set-wallpaper-button'));

    await waitFor(() => {
      expect(getByText('Saving...')).toBeTruthy();
    });

    resolvePromise!();

    await waitFor(() => {
      expect(getByText('Set Wallpaper')).toBeTruthy();
    });
  });

  it('displays placeholder for placeholder imageUri', () => {
    const placeholderRoute = {
      params: {
        imageUri: 'placeholder',
      },
    } as any;

    const {getByText} = render(
      <PreviewScreen navigation={mockNavigation} route={placeholderRoute} />,
    );

    expect(getByText('Image Preview')).toBeTruthy();
  });
});
