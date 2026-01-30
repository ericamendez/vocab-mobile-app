import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {PreviewScreen} from '../../src/screens/PreviewScreen';

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

describe('PreviewScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
});
