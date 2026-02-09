import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  FlatList,
} from 'react-native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../types';
import {pickAndPersistImage} from '../services/imageService';
import {
  getSettings,
  addSelectedImage,
  removeSelectedImage,
} from '../store/settings';
import {setSchedulerImages} from '../services/schedulerService';

type ImagePickerScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ImagePicker'>;
};

export function ImagePickerScreen({navigation}: ImagePickerScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  useEffect(() => {
    loadImages();
  }, []);

  // Reload images when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadImages();
    });
    return unsubscribe;
  }, [navigation]);

  const loadImages = async () => {
    try {
      const settings = await getSettings();
      setSelectedImages(settings.selectedImageUris || []);
    } catch (error) {
      console.error('Error loading images:', error);
    }
  };

  const handleSelectImage = async () => {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await pickAndPersistImage();

      if (result.success && result.uri) {
        await addSelectedImage(result.uri);
        setSelectedImages(prev => [...prev, result.uri!]);
      } else if (result.error && result.error !== 'User cancelled image picker') {
        Alert.alert('Error', result.error);
      }
    } catch {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveImage = useCallback(async (uri: string) => {
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image from your rotation?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeSelectedImage(uri);
            setSelectedImages(prev => prev.filter(u => u !== uri));
          },
        },
      ],
    );
  }, []);

  const handlePreviewImage = useCallback((uri: string) => {
    navigation.navigate('Preview', {imageUri: uri});
  }, [navigation]);

  const handleOpenSettings = () => {
    navigation.navigate('Settings');
  };

  const renderImageItem = ({item}: {item: string}) => (
    <TouchableOpacity
      style={styles.imageItem}
      onPress={() => handlePreviewImage(item)}
      onLongPress={() => handleRemoveImage(item)}>
      <Image source={{uri: item}} style={styles.thumbnail} />
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveImage(item)}>
        <Text style={styles.removeButtonText}>×</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Wallpapers</Text>
        <TouchableOpacity
          onPress={handleOpenSettings}
          testID="settings-button"
          style={styles.settingsButton}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {selectedImages.length > 0 && (
          <View style={styles.imageSection}>
            <Text style={styles.sectionTitle}>
              {selectedImages.length} photo{selectedImages.length !== 1 ? 's' : ''} in rotation
            </Text>
            <Text style={styles.sectionSubtitle}>
              Tap to preview • Long press to remove
            </Text>
            <FlatList
              data={selectedImages}
              renderItem={renderImageItem}
              keyExtractor={(item, index) => `${item}-${index}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.imageList}
            />
          </View>
        )}

        <TouchableOpacity
          style={styles.pickerArea}
          onPress={handleSelectImage}
          testID="image-picker-button">
          <Text style={styles.pickerIcon}>📷</Text>
          <Text style={styles.pickerText}>
            {isLoading ? 'Opening gallery...' : 'Add a photo'}
          </Text>
          <Text style={styles.pickerSubtext}>
            {selectedImages.length === 0
              ? 'Choose photos to use as wallpaper backgrounds'
              : 'Add more photos to your rotation'}
          </Text>
        </TouchableOpacity>

        {selectedImages.length > 0 && (
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>How it works</Text>
            <Text style={styles.infoText}>
              Go to Settings to enable auto-update. Your lock screen will rotate through
              these photos, each with a new vocabulary word overlaid.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  settingsButton: {
    padding: 8,
  },
  settingsIcon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },
  imageSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#a0a0a0',
    marginBottom: 12,
  },
  imageList: {
    paddingVertical: 8,
  },
  imageItem: {
    marginRight: 12,
    position: 'relative',
  },
  thumbnail: {
    width: 100,
    height: 150,
    borderRadius: 8,
    backgroundColor: '#2a2a4e',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ff4757',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pickerArea: {
    backgroundColor: '#2a2a4e',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4a90d9',
    borderStyle: 'dashed',
  },
  pickerIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  pickerText: {
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 8,
  },
  pickerSubtext: {
    fontSize: 14,
    color: '#a0a0a0',
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#2a2a4e',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a90d9',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#a0a0a0',
    lineHeight: 20,
  },
});
