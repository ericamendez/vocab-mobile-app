import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image} from 'react-native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import type {RootStackParamList} from '../types';

type PreviewScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Preview'>;
  route: RouteProp<RootStackParamList, 'Preview'>;
};

export function PreviewScreen({navigation, route}: PreviewScreenProps) {
  const {imageUri} = route.params;

  const handleSetWallpaper = () => {
    // TODO: Implement wallpaper setting via native module
    console.log('Setting wallpaper with image:', imageUri);
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
        <View style={styles.wordOverlay}>
          <Text style={styles.word}>Ephemeral</Text>
          <Text style={styles.definition}>
            lasting for a very short time; transitory
          </Text>
        </View>
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
          <Text style={styles.primaryButtonText}>Set Wallpaper</Text>
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
  wordOverlay: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 16,
    borderRadius: 12,
  },
  word: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  definition: {
    fontSize: 16,
    color: '#e0e0e0',
    lineHeight: 22,
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
