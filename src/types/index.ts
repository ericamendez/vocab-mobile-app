export type RootStackParamList = {
  Onboarding: undefined;
  ImagePicker: undefined;
  Preview: {imageUri: string};
  Settings: undefined;
};

export interface VocabWord {
  word: string;
  definition: string;
  partOfSpeech?: string;
  example?: string;
}

export interface Settings {
  isOnboardingComplete: boolean;
  selectedImageUris: string[];
  updateFrequency: 'on_screen_wake' | 'hourly' | 'daily';
  autoUpdateEnabled: boolean;
  textColor: string;
  fontSize: number;
}
