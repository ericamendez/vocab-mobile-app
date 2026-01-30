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
  selectedImageUri: string | null;
  updateFrequency: 'hourly' | 'daily';
  textColor: string;
  fontSize: number;
}
