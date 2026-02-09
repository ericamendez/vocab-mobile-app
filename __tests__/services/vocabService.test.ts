import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getRandomFallbackWord,
  getFallbackWords,
  getWordOfTheHour,
  fetchWord,
  fetchRandomWord,
  refreshVocabCache,
  initializeVocabCache,
} from '../../src/services/vocabService';
import {getCachedWords, setCachedWords} from '../../src/store/vocabCache';
import type {VocabWord} from '../../src/types';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('vocabService', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('getRandomFallbackWord', () => {
    it('returns a word object with required properties', () => {
      const word = getRandomFallbackWord();

      expect(word).toHaveProperty('word');
      expect(word).toHaveProperty('definition');
      expect(typeof word.word).toBe('string');
      expect(typeof word.definition).toBe('string');
    });

    it('returns a word from the fallback list', () => {
      const fallbackWords = getFallbackWords();
      const word = getRandomFallbackWord();

      const wordExists = fallbackWords.some(fw => fw.word === word.word);
      expect(wordExists).toBe(true);
    });
  });

  describe('getFallbackWords', () => {
    it('returns an array of words', () => {
      const words = getFallbackWords();

      expect(Array.isArray(words)).toBe(true);
      expect(words.length).toBeGreaterThan(0);
    });

    it('each word has required properties', () => {
      const words = getFallbackWords();

      words.forEach(word => {
        expect(word).toHaveProperty('word');
        expect(word).toHaveProperty('definition');
      });
    });
  });

  describe('fetchWord', () => {
    it('returns a VocabWord when API call succeeds', async () => {
      const mockApiResponse = [
        {
          word: 'test',
          meanings: [
            {
              partOfSpeech: 'noun',
              definitions: [
                {
                  definition: 'a procedure to assess quality',
                  example: 'Run a test',
                },
              ],
            },
          ],
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const result = await fetchWord('test');

      expect(result).not.toBeNull();
      expect(result!.word).toBe('test');
      expect(result!.definition).toBe('a procedure to assess quality');
      expect(result!.partOfSpeech).toBe('noun');
      expect(result!.example).toBe('Run a test');
    });

    it('returns null when API returns non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      const result = await fetchWord('invalidword');
      expect(result).toBeNull();
    });

    it('returns null when fetch throws an error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchWord('test');
      expect(result).toBeNull();
    });
  });

  describe('fetchRandomWord', () => {
    it('fetches a random word and gets its definition', async () => {
      // First call to random word API
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(['eloquent']),
      });

      // Second call to dictionary API
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              word: 'eloquent',
              meanings: [
                {
                  partOfSpeech: 'adjective',
                  definitions: [{definition: 'fluent in speaking'}],
                },
              ],
            },
          ]),
      });

      const result = await fetchRandomWord();

      expect(result).not.toBeNull();
      expect(result!.word).toBe('eloquent');
    });

    it('returns null when random word API fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      const result = await fetchRandomWord();
      expect(result).toBeNull();
    });
  });

  describe('getWordOfTheHour', () => {
    it('returns a word object', async () => {
      const word = await getWordOfTheHour();

      expect(word).toHaveProperty('word');
      expect(word).toHaveProperty('definition');
    });

    it('returns cached word when cache is valid', async () => {
      const cachedWord: VocabWord = {
        word: 'CachedWord',
        definition: 'A word from cache',
      };
      await setCachedWords([cachedWord]);

      const word = await getWordOfTheHour();
      expect(word.word).toBe('CachedWord');
    });

    it('fetches fresh word when cache is invalid', async () => {
      // Set expired cache timestamp
      await AsyncStorage.setItem(
        '@vocab_cache_timestamp',
        (Date.now() - 25 * 60 * 60 * 1000).toString(),
      );

      // Mock fetch calls
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(['fresh']),
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              word: 'fresh',
              meanings: [{partOfSpeech: 'adjective', definitions: [{definition: 'newly made'}]}],
            },
          ]),
      });

      const word = await getWordOfTheHour();

      expect(word).toHaveProperty('word');
      expect(word).toHaveProperty('definition');
    });

    it('falls back to hardcoded words when all else fails', async () => {
      // Set expired cache with no words
      await AsyncStorage.setItem(
        '@vocab_cache_timestamp',
        (Date.now() - 25 * 60 * 60 * 1000).toString(),
      );

      // All fetch calls fail
      mockFetch.mockRejectedValue(new Error('Network error'));

      const word = await getWordOfTheHour();

      expect(word).toHaveProperty('word');
      expect(word).toHaveProperty('definition');
      const fallbackWords = getFallbackWords();
      expect(fallbackWords.some(fw => fw.word === word.word)).toBe(true);
    });
  });

  describe('refreshVocabCache', () => {
    it('populates cache with fallback words', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
      });

      const result = await refreshVocabCache();

      expect(result).toBe(true);
      const cachedWords = await getCachedWords();
      expect(cachedWords.length).toBeGreaterThan(0);
    });
  });

  describe('initializeVocabCache', () => {
    it('does not refresh cache when cache is valid', async () => {
      await setCachedWords([{word: 'Test', definition: 'A test word'}]);

      mockFetch.mockClear();
      await initializeVocabCache();

      // No fetch calls should be made if cache is valid
      const cachedWords = await getCachedWords();
      expect(cachedWords[0].word).toBe('Test');
    });

    it('refreshes cache when cache is invalid', async () => {
      // Set expired timestamp
      await AsyncStorage.setItem(
        '@vocab_cache_timestamp',
        (Date.now() - 25 * 60 * 60 * 1000).toString(),
      );

      mockFetch.mockResolvedValue({ok: false});

      await initializeVocabCache();

      const cachedWords = await getCachedWords();
      expect(cachedWords.length).toBeGreaterThan(0);
    });
  });
});
