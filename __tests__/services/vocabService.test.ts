import {
  getRandomFallbackWord,
  getFallbackWords,
  getWordOfTheHour,
} from '../../src/services/vocabService';

describe('vocabService', () => {
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

  describe('getWordOfTheHour', () => {
    it('returns a word object', async () => {
      const word = await getWordOfTheHour();

      expect(word).toHaveProperty('word');
      expect(word).toHaveProperty('definition');
    });
  });
});
