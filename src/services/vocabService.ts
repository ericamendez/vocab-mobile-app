import type {VocabWord} from '../types';

const VOCAB_API_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en';

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
  // TODO: Implement fetching from remote API with caching
  // For now, return a random fallback word
  return getRandomFallbackWord();
}

export function getFallbackWords(): VocabWord[] {
  return [...FALLBACK_WORDS];
}
