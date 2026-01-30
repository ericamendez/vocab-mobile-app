import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../types';

type ImagePickerScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ImagePicker'>;
};

export function ImagePickerScreen({navigation}: ImagePickerScreenProps) {
  const handleSelectImage = () => {
    // TODO: Implement actual image picker
    // For now, navigate to Preview with a placeholder
    navigation.navigate('Preview', {imageUri: 'placeholder'});
  };

  const handleOpenSettings = () => {
    navigation.navigate('Settings');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your Photo</Text>
        <TouchableOpacity
          onPress={handleOpenSettings}
          testID="settings-button"
          style={styles.settingsButton}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.pickerArea}
          onPress={handleSelectImage}
          testID="image-picker-button">
          <Text style={styles.pickerIcon}>📷</Text>
          <Text style={styles.pickerText}>Tap to select a photo</Text>
          <Text style={styles.pickerSubtext}>
            Choose a photo to use as your wallpaper background
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
    justifyContent: 'center',
    padding: 24,
  },
  pickerArea: {
    backgroundColor: '#2a2a4e',
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4a90d9',
    borderStyle: 'dashed',
  },
  pickerIcon: {
    fontSize: 64,
    marginBottom: 16,
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
});
