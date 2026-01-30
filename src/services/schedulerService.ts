import {Platform} from 'react-native';

export type UpdateInterval = 'hourly' | 'daily';

export interface SchedulerConfig {
  interval: UpdateInterval;
  enabled: boolean;
}

let schedulerEnabled = false;
let currentInterval: UpdateInterval = 'hourly';

export async function startScheduler(
  interval: UpdateInterval = 'hourly',
): Promise<boolean> {
  if (Platform.OS !== 'android') {
    console.log('Scheduler not supported on iOS');
    return false;
  }

  // TODO: Implement Android WorkManager via native module
  // This will schedule periodic wallpaper updates
  console.log('Starting scheduler with interval:', interval);

  schedulerEnabled = true;
  currentInterval = interval;

  return true;
}

export async function stopScheduler(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }

  // TODO: Cancel WorkManager tasks via native module
  console.log('Stopping scheduler');

  schedulerEnabled = false;

  return true;
}

export async function updateSchedulerInterval(
  interval: UpdateInterval,
): Promise<boolean> {
  if (!schedulerEnabled) {
    return false;
  }

  // Restart with new interval
  await stopScheduler();
  return startScheduler(interval);
}

export function getSchedulerStatus(): SchedulerConfig {
  return {
    interval: currentInterval,
    enabled: schedulerEnabled,
  };
}

export function isSchedulerSupported(): boolean {
  return Platform.OS === 'android';
}
