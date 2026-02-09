import {Platform, NativeModules} from 'react-native';

const {WallpaperModule} = NativeModules;

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
    return {
      success: false,
      error: 'iOS does not support programmatic wallpaper changes',
    };
  }

  if (!WallpaperModule) {
    return {
      success: false,
      error: 'WallpaperModule not available',
    };
  }

  try {
    await WallpaperModule.setWallpaper(imageUri, target);
    return {success: true};
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to set wallpaper',
    };
  }
}

export function isWallpaperSupported(): boolean {
  return Platform.OS === 'android' && !!WallpaperModule;
}

export async function getMinimumWallpaperSize(): Promise<{
  width: number;
  height: number;
} | null> {
  if (Platform.OS !== 'android' || !WallpaperModule) {
    return null;
  }

  try {
    return await WallpaperModule.getMinimumSize();
  } catch {
    return null;
  }
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
