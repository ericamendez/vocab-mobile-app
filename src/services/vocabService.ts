import type {VocabWord} from '../types';
import {
  getCachedWords,
  setCachedWords,
  isCacheValid,
  addWordToCache,
  getRandomCachedWord,
} from '../store/vocabCache';
import fallbackData from '../../assets/vocab_fallback.json';

const VOCAB_API_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en';
const RANDOM_WORD_API_URL = 'https://random-word-api.herokuapp.com/word';

// Fallback words for offline use
const FALLBACK_WORDS: VocabWord[] = [
  {
    word: 'Ephemeral',
    definition: 'lasting for a very short time; transitory',
    partOfSpeech: 'adjective',
    example: 'The ephemeral beauty of cherry blossoms.',
  },
  {
    word: 'Serendipity',
    definition:
      'the occurrence of events by chance in a happy or beneficial way',
    partOfSpeech: 'noun',
    example: 'Finding that book was pure serendipity.',
  },
  {
    word: 'Ubiquitous',
    definition: 'present, appearing, or found everywhere',
    partOfSpeech: 'adjective',
    example: 'Smartphones have become ubiquitous in modern life.',
  },
  {
    word: 'Eloquent',
    definition: 'fluent or persuasive in speaking or writing',
    partOfSpeech: 'adjective',
    example: 'Her eloquent speech moved the audience to tears.',
  },
  {
    word: 'Resilient',
    definition: 'able to recover quickly from difficulties; tough',
    partOfSpeech: 'adjective',
    example: 'The community proved resilient in the face of adversity.',
  },
];

export async function fetchWord(word: string): Promise<VocabWord | null> {
  try {
    const response = await fetch(`${VOCAB_API_URL}/${word}`);
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    if (data && data.length > 0) {
      const entry = data[0];
      const meaning = entry.meanings?.[0];
      return {
        word: entry.word,
        definition: meaning?.definitions?.[0]?.definition || 'No definition available',
        partOfSpeech: meaning?.partOfSpeech,
        example: meaning?.definitions?.[0]?.example,
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching word:', error);
    return null;
  }
}

export function getRandomFallbackWord(): VocabWord {
  const index = Math.floor(Math.random() * FALLBACK_WORDS.length);
  return FALLBACK_WORDS[index];
}

export async function getWordOfTheHour(): Promise<VocabWord> {
  // Try to get a word from cache first if cache is valid
  const cacheValid = await isCacheValid();
  if (cacheValid) {
    const cachedWord = await getRandomCachedWord();
    if (cachedWord) {
      return cachedWord;
    }
  }

  // Try to fetch a fresh word from the remote API
  const freshWord = await fetchRandomWord();
  if (freshWord) {
    await addWordToCache(freshWord);
    return freshWord;
  }

  // Fall back to cached words even if cache is expired
  const cachedWord = await getRandomCachedWord();
  if (cachedWord) {
    return cachedWord;
  }

  // Final fallback: use hardcoded words
  return getRandomFallbackWord();
}

export async function fetchRandomWord(): Promise<VocabWord | null> {
  try {
    const response = await fetch(RANDOM_WORD_API_URL);
    if (!response.ok) {
      return null;
    }
    const words = await response.json();
    if (words && words.length > 0) {
      const word = words[0];
      return fetchWord(word);
    }
    return null;
  } catch (error) {
    console.error('Error fetching random word:', error);
    return null;
  }
}

export async function refreshVocabCache(): Promise<boolean> {
  try {
    // Load fallback words into cache as a baseline
    const fallbackWords: VocabWord[] = fallbackData.words;
    await setCachedWords(fallbackWords);

    // Try to fetch additional words from the API
    const wordsToFetch = ['eloquent', 'resilient', 'serendipity', 'ephemeral', 'ubiquitous'];
    const fetchPromises = wordsToFetch.map(word => fetchWord(word));
    const results = await Promise.all(fetchPromises);

    const validWords = results.filter((w): w is VocabWord => w !== null);
    if (validWords.length > 0) {
      // Merge with existing cache, avoiding duplicates
      const existingCache = await getCachedWords();
      const mergedWords = [...existingCache];
      for (const word of validWords) {
        const exists = mergedWords.some(
          w => w.word.toLowerCase() === word.word.toLowerCase(),
        );
        if (!exists) {
          mergedWords.push(word);
        }
      }
      await setCachedWords(mergedWords);
    }
    return true;
  } catch (error) {
    console.error('Error refreshing vocab cache:', error);
    return false;
  }
}

export async function initializeVocabCache(): Promise<void> {
  const cacheValid = await isCacheValid();
  if (!cacheValid) {
    await refreshVocabCache();
  }
}

export function getFallbackWords(): VocabWord[] {
  return [...FALLBACK_WORDS];
}

export async function getRandomWords(count: number): Promise<VocabWord[]> {
  // First try to get words from cache
  const cachedWords = await getCachedWords();
  
  if (cachedWords.length >= count) {
    // Shuffle and return requested count
    const shuffled = [...cachedWords].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  // Combine cached words with fallback words
  const fallbackWords: VocabWord[] = fallbackData.words || FALLBACK_WORDS;
  const allWords = [...cachedWords];
  
  // Add fallback words that aren't already in cache
  for (const word of fallbackWords) {
    const exists = allWords.some(
      w => w.word.toLowerCase() === word.word.toLowerCase(),
    );
    if (!exists) {
      allWords.push(word);
    }
  }

  // Shuffle and return
  const shuffled = allWords.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
