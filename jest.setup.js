// Mock react-native-screens
jest.mock('react-native-screens', () => {
  return {
    enableScreens: jest.fn(),
    screensEnabled: jest.fn(() => true),
    Screen: ({children}) => children,
    ScreenContainer: ({children}) => children,
    ScreenStack: ({children}) => children,
    ScreenStackHeaderConfig: () => null,
    NativeScreen: ({children}) => children,
    NativeScreenContainer: ({children}) => children,
  };
});

// Mock safe area context
jest.mock('react-native-safe-area-context', () => {
  const insets = {top: 0, right: 0, bottom: 0, left: 0};
  const frame = {x: 0, y: 0, width: 390, height: 844};
  return {
    SafeAreaProvider: ({children}) => children,
    SafeAreaView: ({children}) => children,
    useSafeAreaInsets: () => insets,
    useSafeAreaFrame: () => frame,
    initialWindowMetrics: {insets, frame},
  };
});
