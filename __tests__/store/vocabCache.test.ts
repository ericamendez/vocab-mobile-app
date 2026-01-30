import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getCachedWords,
  setCachedWords,
  getCacheTimestamp,
  isCacheValid,
  clearVocabCache,
  addWordToCache,
  getRandomCachedWord,
} from '../../src/store/vocabCache';
import type {VocabWord} from '../../src/types';

describe('vocabCache', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  const mockWord: VocabWord = {
    word: 'Ephemeral',
    definition: 'lasting for a very short time',
    partOfSpeech: 'adjective',
    example: 'The ephemeral beauty of cherry blossoms.',
  };

  const mockWords: VocabWord[] = [
    mockWord,
    {
      word: 'Serendipity',
      definition: 'the occurrence of events by chance in a happy way',
      partOfSpeech: 'noun',
    },
  ];

  describe('getCachedWords', () => {
    it('returns empty array when no cache exists', async () => {
      const words = await getCachedWords();
      expect(words).toEqual([]);
    });

    it('returns cached words when cache exists', async () => {
      await AsyncStorage.setItem('@vocab_cache', JSON.stringify(mockWords));
      const words = await getCachedWords();
      expect(words).toEqual(mockWords);
    });
  });

  describe('setCachedWords', () => {
    it('saves words to cache', async () => {
      await setCachedWords(mockWords);
      const stored = await AsyncStorage.getItem('@vocab_cache');
      expect(JSON.parse(stored!)).toEqual(mockWords);
    });

    it('sets cache timestamp', async () => {
      const before = Date.now();
      await setCachedWords(mockWords);
      const after = Date.now();

      const timestamp = await AsyncStorage.getItem('@vocab_cache_timestamp');
      const storedTime = parseInt(timestamp!, 10);
      expect(storedTime).toBeGreaterThanOrEqual(before);
      expect(storedTime).toBeLessThanOrEqual(after);
    });
  });

  describe('getCacheTimestamp', () => {
    it('returns null when no timestamp exists', async () => {
      const timestamp = await getCacheTimestamp();
      expect(timestamp).toBeNull();
    });

    it('returns timestamp when it exists', async () => {
      const now = Date.now();
      await AsyncStorage.setItem('@vocab_cache_timestamp', now.toString());
      const timestamp = await getCacheTimestamp();
      expect(timestamp).toBe(now);
    });
  });

  describe('isCacheValid', () => {
    it('returns false when no cache timestamp exists', async () => {
      const valid = await isCacheValid();
      expect(valid).toBe(false);
    });

    it('returns true when cache is fresh (within 24 hours)', async () => {
      const now = Date.now();
      await AsyncStorage.setItem('@vocab_cache_timestamp', now.toString());
      const valid = await isCacheValid();
      expect(valid).toBe(true);
    });

    it('returns false when cache is expired (older than 24 hours)', async () => {
      const expiredTime = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago
      await AsyncStorage.setItem(
        '@vocab_cache_timestamp',
        expiredTime.toString(),
      );
      const valid = await isCacheValid();
      expect(valid).toBe(false);
    });
  });

  describe('clearVocabCache', () => {
    it('removes cache and timestamp', async () => {
      await setCachedWords(mockWords);
      await clearVocabCache();

      const words = await AsyncStorage.getItem('@vocab_cache');
      const timestamp = await AsyncStorage.getItem('@vocab_cache_timestamp');

      expect(words).toBeNull();
      expect(timestamp).toBeNull();
    });
  });

  describe('addWordToCache', () => {
    it('adds a new word to empty cache', async () => {
      await addWordToCache(mockWord);
      const words = await getCachedWords();
      expect(words).toContainEqual(mockWord);
    });

    it('adds a new word to existing cache', async () => {
      await setCachedWords([mockWords[0]]);
      await addWordToCache(mockWords[1]);
      const words = await getCachedWords();
      expect(words).toHaveLength(2);
    });

    it('does not add duplicate words (case insensitive)', async () => {
      await setCachedWords([mockWord]);
      const duplicateWord: VocabWord = {
        ...mockWord,
        word: 'ephemeral', // lowercase
      };
      await addWordToCache(duplicateWord);
      const words = await getCachedWords();
      expect(words).toHaveLength(1);
    });
  });

  describe('getRandomCachedWord', () => {
    it('returns null when cache is empty', async () => {
      const word = await getRandomCachedWord();
      expect(word).toBeNull();
    });

    it('returns a word from the cache', async () => {
      await setCachedWords(mockWords);
      const word = await getRandomCachedWord();
      expect(word).not.toBeNull();
      expect(mockWords.some(w => w.word === word!.word)).toBe(true);
    });
  });
});
