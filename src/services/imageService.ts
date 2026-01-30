import {
  launchImageLibrary,
  ImagePickerResponse,
  ImageLibraryOptions,
} from 'react-native-image-picker';
import {setSelectedImage, getSettings} from '../store/settings';

export interface ImagePickerResult {
  success: boolean;
  uri: string | null;
  error?: string;
}

const IMAGE_PICKER_OPTIONS: ImageLibraryOptions = {
  mediaType: 'photo',
  quality: 1,
  selectionLimit: 1,
};

export async function pickImage(): Promise<ImagePickerResult> {
  return new Promise(resolve => {
    launchImageLibrary(IMAGE_PICKER_OPTIONS, (response: ImagePickerResponse) => {
      if (response.didCancel) {
        resolve({
          success: false,
          uri: null,
          error: 'User cancelled image picker',
        });
        return;
      }

      if (response.errorCode) {
        resolve({
          success: false,
          uri: null,
          error: response.errorMessage || `Error: ${response.errorCode}`,
        });
        return;
      }

      const asset = response.assets?.[0];
      if (asset?.uri) {
        resolve({
          success: true,
          uri: asset.uri,
        });
      } else {
        resolve({
          success: false,
          uri: null,
          error: 'No image selected',
        });
      }
    });
  });
}

export async function pickAndPersistImage(): Promise<ImagePickerResult> {
  const result = await pickImage();

  if (result.success && result.uri) {
    await setSelectedImage(result.uri);
  }

  return result;
}

export async function getPersistedImageUri(): Promise<string | null> {
  const settings = await getSettings();
  return settings.selectedImageUri;
}
