import {Platform, NativeModules} from 'react-native';
import type {VocabWord} from '../types';

const {SchedulerModule} = NativeModules;

export type UpdateInterval = 'on_screen_wake' | 'hourly' | 'daily';

export interface SchedulerConfig {
  interval: UpdateInterval;
  enabled: boolean;
}

export interface SchedulerStatus {
  isScheduled: boolean;
  state: string;
  screenWakeEnabled: boolean;
}

// Convert interval to minutes for WorkManager
function getIntervalMinutes(interval: UpdateInterval): number {
  switch (interval) {
    case 'on_screen_wake':
      return 15; // Minimum interval for WorkManager, screen wake handled separately
    case 'hourly':
      return 60;
    case 'daily':
      return 1440; // 24 * 60
    default:
      return 60;
  }
}

export async function startScheduler(
  interval: UpdateInterval = 'hourly',
): Promise<boolean> {
  if (Platform.OS !== 'android' || !SchedulerModule) {
    console.log('Scheduler not supported');
    return false;
  }

  try {
    const minutes = getIntervalMinutes(interval);
    await SchedulerModule.startScheduler(minutes);
    return true;
  } catch (error) {
    console.error('Failed to start scheduler:', error);
    return false;
  }
}

export async function stopScheduler(): Promise<boolean> {
  if (Platform.OS !== 'android' || !SchedulerModule) {
    return false;
  }

  try {
    await SchedulerModule.stopScheduler();
    return true;
  } catch (error) {
    console.error('Failed to stop scheduler:', error);
    return false;
  }
}

export async function triggerWallpaperUpdate(): Promise<boolean> {
  if (Platform.OS !== 'android' || !SchedulerModule) {
    return false;
  }

  try {
    await SchedulerModule.triggerNow();
    return true;
  } catch (error) {
    console.error('Failed to trigger wallpaper update:', error);
    return false;
  }
}

export async function setSchedulerImages(imageUris: string[]): Promise<boolean> {
  if (Platform.OS !== 'android' || !SchedulerModule) {
    return false;
  }

  try {
    await SchedulerModule.setImageUris(imageUris);
    return true;
  } catch (error) {
    console.error('Failed to set scheduler images:', error);
    return false;
  }
}

export async function setSchedulerVocab(words: VocabWord[]): Promise<boolean> {
  if (Platform.OS !== 'android' || !SchedulerModule) {
    return false;
  }

  try {
    await SchedulerModule.setVocabWords(words);
    return true;
  } catch (error) {
    console.error('Failed to set scheduler vocab:', error);
    return false;
  }
}

export async function getSchedulerStatus(): Promise<SchedulerStatus | null> {
  if (Platform.OS !== 'android' || !SchedulerModule) {
    return null;
  }

  try {
    return await SchedulerModule.getStatus();
  } catch (error) {
    console.error('Failed to get scheduler status:', error);
    return null;
  }
}

export function isSchedulerSupported(): boolean {
  return Platform.OS === 'android' && !!SchedulerModule;
}

export async function enableScreenWakeMode(): Promise<boolean> {
  if (Platform.OS !== 'android' || !SchedulerModule) {
    return false;
  }

  try {
    await SchedulerModule.enableScreenWakeMode();
    return true;
  } catch (error) {
    console.error('Failed to enable screen wake mode:', error);
    return false;
  }
}

export async function disableScreenWakeMode(): Promise<boolean> {
  if (Platform.OS !== 'android' || !SchedulerModule) {
    return false;
  }

  try {
    await SchedulerModule.disableScreenWakeMode();
    return true;
  } catch (error) {
    console.error('Failed to disable screen wake mode:', error);
    return false;
  }
}

export async function setTextAppearance(
  color: string,
  sizeMultiplier: number,
): Promise<boolean> {
  if (Platform.OS !== 'android' || !SchedulerModule) {
    return false;
  }

  try {
    await SchedulerModule.setTextAppearance(color, sizeMultiplier);
    return true;
  } catch (error) {
    console.error('Failed to set text appearance:', error);
    return false;
  }
}
