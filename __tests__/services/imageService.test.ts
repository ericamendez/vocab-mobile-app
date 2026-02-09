import {
  pickImage,
  pickAndPersistImage,
  getPersistedImageUri,
} from '../../src/services/imageService';
import {launchImageLibrary} from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('react-native-image-picker');

const mockLaunchImageLibrary = launchImageLibrary as jest.MockedFunction<
  typeof launchImageLibrary
>;

describe('imageService', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  describe('pickImage', () => {
    it('returns success with uri when image is selected', async () => {
      const mockUri = 'file:///path/to/selected/image.jpg';
      mockLaunchImageLibrary.mockImplementation((options, callback) => {
        callback({
          assets: [{uri: mockUri, width: 1080, height: 1920}],
        });
      });

      const result = await pickImage();

      expect(result.success).toBe(true);
      expect(result.uri).toBe(mockUri);
      expect(result.error).toBeUndefined();
    });

    it('returns failure when user cancels', async () => {
      mockLaunchImageLibrary.mockImplementation((options, callback) => {
        callback({didCancel: true});
      });

      const result = await pickImage();

      expect(result.success).toBe(false);
      expect(result.uri).toBeNull();
      expect(result.error).toBe('User cancelled image picker');
    });

    it('returns failure when there is an error', async () => {
      mockLaunchImageLibrary.mockImplementation((options, callback) => {
        callback({
          errorCode: 'permission',
          errorMessage: 'Permission denied',
        });
      });

      const result = await pickImage();

      expect(result.success).toBe(false);
      expect(result.uri).toBeNull();
      expect(result.error).toBe('Permission denied');
    });

    it('returns failure with error code when no error message', async () => {
      mockLaunchImageLibrary.mockImplementation((options, callback) => {
        callback({errorCode: 'camera_unavailable'});
      });

      const result = await pickImage();

      expect(result.success).toBe(false);
      expect(result.uri).toBeNull();
      expect(result.error).toBe('Error: camera_unavailable');
    });

    it('returns failure when no assets are returned', async () => {
      mockLaunchImageLibrary.mockImplementation((options, callback) => {
        callback({assets: []});
      });

      const result = await pickImage();

      expect(result.success).toBe(false);
      expect(result.uri).toBeNull();
      expect(result.error).toBe('No image selected');
    });

    it('returns failure when asset has no uri', async () => {
      mockLaunchImageLibrary.mockImplementation((options, callback) => {
        callback({assets: [{width: 100, height: 100}]});
      });

      const result = await pickImage();

      expect(result.success).toBe(false);
      expect(result.uri).toBeNull();
      expect(result.error).toBe('No image selected');
    });
  });

  describe('pickAndPersistImage', () => {
    it('persists the image uri when selection is successful', async () => {
      const mockUri = 'file:///path/to/selected/image.jpg';
      mockLaunchImageLibrary.mockImplementation((options, callback) => {
        callback({
          assets: [{uri: mockUri}],
        });
      });

      const result = await pickAndPersistImage();

      expect(result.success).toBe(true);
      expect(result.uri).toBe(mockUri);

      const persistedUri = await getPersistedImageUri();
      expect(persistedUri).toBe(mockUri);
    });

    it('does not persist when user cancels', async () => {
      mockLaunchImageLibrary.mockImplementation((options, callback) => {
        callback({didCancel: true});
      });

      await pickAndPersistImage();

      const persistedUri = await getPersistedImageUri();
      expect(persistedUri).toBeNull();
    });

    it('does not persist when there is an error', async () => {
      mockLaunchImageLibrary.mockImplementation((options, callback) => {
        callback({errorCode: 'permission', errorMessage: 'Permission denied'});
      });

      await pickAndPersistImage();

      const persistedUri = await getPersistedImageUri();
      expect(persistedUri).toBeNull();
    });
  });

  describe('getPersistedImageUri', () => {
    it('returns null when no image has been selected', async () => {
      const uri = await getPersistedImageUri();
      expect(uri).toBeNull();
    });

    it('returns the persisted uri', async () => {
      const mockUri = 'file:///path/to/image.jpg';
      await AsyncStorage.setItem(
        '@vocab_wallpaper_settings',
        JSON.stringify({selectedImageUri: mockUri}),
      );

      const uri = await getPersistedImageUri();
      expect(uri).toBe(mockUri);
    });
  });
});
