import AsyncStorage from '@react-native-async-storage/async-storage';
import type {VocabWord} from '../types';

const VOCAB_CACHE_KEY = '@vocab_cache';
const CACHE_TIMESTAMP_KEY = '@vocab_cache_timestamp';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface VocabCache {
  words: VocabWord[];
  lastFetched: number;
}

export async function getCachedWords(): Promise<VocabWord[]> {
  try {
    const cached = await AsyncStorage.getItem(VOCAB_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
    return [];
  } catch (error) {
    console.error('Error reading vocab cache:', error);
    return [];
  }
}

export async function setCachedWords(words: VocabWord[]): Promise<void> {
  try {
    await AsyncStorage.setItem(VOCAB_CACHE_KEY, JSON.stringify(words));
    await AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error('Error saving vocab cache:', error);
    throw error;
  }
}

export async function getCacheTimestamp(): Promise<number | null> {
  try {
    const timestamp = await AsyncStorage.getItem(CACHE_TIMESTAMP_KEY);
    return timestamp ? parseInt(timestamp, 10) : null;
  } catch (error) {
    console.error('Error reading cache timestamp:', error);
    return null;
  }
}

export async function isCacheValid(): Promise<boolean> {
  const timestamp = await getCacheTimestamp();
  if (!timestamp) {
    return false;
  }
  const age = Date.now() - timestamp;
  return age < CACHE_TTL_MS;
}

export async function clearVocabCache(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([VOCAB_CACHE_KEY, CACHE_TIMESTAMP_KEY]);
  } catch (error) {
    console.error('Error clearing vocab cache:', error);
    throw error;
  }
}

export async function addWordToCache(word: VocabWord): Promise<void> {
  try {
    const existing = await getCachedWords();
    const wordExists = existing.some(
      w => w.word.toLowerCase() === word.word.toLowerCase(),
    );
    if (!wordExists) {
      const updated = [...existing, word];
      await AsyncStorage.setItem(VOCAB_CACHE_KEY, JSON.stringify(updated));
    }
  } catch (error) {
    console.error('Error adding word to cache:', error);
    throw error;
  }
}

export async function getRandomCachedWord(): Promise<VocabWord | null> {
  const words = await getCachedWords();
  if (words.length === 0) {
    return null;
  }
  const index = Math.floor(Math.random() * words.length);
  return words[index];
}
