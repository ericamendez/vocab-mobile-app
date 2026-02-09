import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import type {VocabWord} from '../types';

export interface VocabOverlayProps {
  word: VocabWord;
  textColor?: string;
  fontSize?: number;
  backgroundColor?: string;
  testID?: string;
}

export function VocabOverlay({
  word,
  textColor = '#ffffff',
  fontSize = 28,
  backgroundColor = 'rgba(0, 0, 0, 0.7)',
  testID,
}: VocabOverlayProps) {
  const dynamicStyles = {
    word: {
      color: textColor,
      fontSize: fontSize,
    },
    definition: {
      color: textColor,
      opacity: 0.85,
    },
    partOfSpeech: {
      color: textColor,
      opacity: 0.7,
    },
  };

  return (
    <View
      style={[styles.container, {backgroundColor}]}
      testID={testID}>
      <Text style={[styles.word, dynamicStyles.word]}>{word.word}</Text>
      {word.partOfSpeech && (
        <Text style={[styles.partOfSpeech, dynamicStyles.partOfSpeech]}>
          {word.partOfSpeech}
        </Text>
      )}
      <Text style={[styles.definition, dynamicStyles.definition]}>
        {word.definition}
      </Text>
      {word.example && (
        <Text style={[styles.example, dynamicStyles.definition]}>
          "{word.example}"
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
  },
  word: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  partOfSpeech: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  definition: {
    fontSize: 16,
    lineHeight: 22,
  },
  example: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 20,
  },
});
