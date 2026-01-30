import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import type {RootStackParamList, VocabWord} from '../types';
import {setSelectedImage, getSettings} from '../store/settings';
import {getWordOfTheHour} from '../services/vocabService';
import {VocabOverlay} from '../components';

type PreviewScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Preview'>;
  route: RouteProp<RootStackParamList, 'Preview'>;
};

export function PreviewScreen({navigation, route}: PreviewScreenProps) {
  const {imageUri} = route.params;
  const [isSaving, setIsSaving] = useState(false);
  const [vocabWord, setVocabWord] = useState<VocabWord | null>(null);
  const [isLoadingWord, setIsLoadingWord] = useState(true);
  const [textColor, setTextColor] = useState('#ffffff');
  const [fontSize, setFontSize] = useState(28);

  const loadVocabWord = useCallback(async () => {
    setIsLoadingWord(true);
    try {
      const word = await getWordOfTheHour();
      setVocabWord(word);
    } catch (error) {
      console.error('Error loading vocab word:', error);
      // Fallback word if loading fails
      setVocabWord({
        word: 'Ephemeral',
        definition: 'lasting for a very short time; transitory',
        partOfSpeech: 'adjective',
      });
    } finally {
      setIsLoadingWord(false);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const settings = await getSettings();
      setTextColor(settings.textColor);
      setFontSize(settings.fontSize);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }, []);

  useEffect(() => {
    loadVocabWord();
    loadSettings();
  }, [loadVocabWord, loadSettings]);

  const handleSetWallpaper = async () => {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      await setSelectedImage(imageUri);
      Alert.alert(
        'Success',
        'Your wallpaper image has been saved! The app will use this image for generating vocabulary wallpapers.',
        [{text: 'OK'}],
      );
    } catch {
      Alert.alert('Error', 'Failed to save wallpaper image. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChooseAnother = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleChooseAnother}
          testID="back-button"
          style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Preview</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.previewContainer}>
        {imageUri === 'placeholder' ? (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>Image Preview</Text>
          </View>
        ) : (
          <Image
            source={{uri: imageUri}}
            style={styles.previewImage}
            resizeMode="cover"
          />
        )}
        {isLoadingWord ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color="#ffffff" />
            <Text style={styles.loadingText}>Loading word...</Text>
          </View>
        ) : vocabWord ? (
          <VocabOverlay
            word={vocabWord}
            textColor={textColor}
            fontSize={fontSize}
            testID="vocab-overlay"
          />
        ) : null}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleChooseAnother}
          testID="choose-another-button">
          <Text style={styles.secondaryButtonText}>Choose Another</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleSetWallpaper}
          testID="set-wallpaper-button">
          <Text style={styles.primaryButtonText}>
            {isSaving ? 'Saving...' : 'Set Wallpaper'}
          </Text>
        </TouchableOpacity>
      </View>
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
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
    color: '#ffffff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  placeholder: {
    width: 40,
  },
  previewContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#2a2a4e',
  },
  placeholderImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3a3a5e',
  },
  placeholderText: {
    color: '#a0a0a0',
    fontSize: 18,
  },
  previewImage: {
    flex: 1,
    width: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#2a2a4e',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#4a90d9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
