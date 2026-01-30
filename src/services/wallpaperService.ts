import {Platform} from 'react-native';

export type WallpaperTarget = 'lock_screen' | 'home_screen' | 'both';

export interface WallpaperResult {
  success: boolean;
  error?: string;
}

export async function setWallpaper(
  imageUri: string,
  target: WallpaperTarget = 'lock_screen',
): Promise<WallpaperResult> {
  if (Platform.OS === 'ios') {
    // iOS does not support programmatic lock screen changes
    return {
      success: false,
      error: 'iOS does not support programmatic wallpaper changes',
    };
  }

  // TODO: Implement native Android module for wallpaper setting
  // This will use WallpaperManager via a React Native native module
  console.log('Setting wallpaper:', {imageUri, target});

  // Placeholder for Android implementation
  return {
    success: true,
  };
}

export function isWallpaperSupported(): boolean {
  return Platform.OS === 'android';
}

export function getWallpaperCapabilities(): {
  lockScreen: boolean;
  homeScreen: boolean;
} {
  if (Platform.OS === 'android') {
    return {
      lockScreen: true,
      homeScreen: true,
    };
  }
  return {
    lockScreen: false,
    homeScreen: false,
  };
}
