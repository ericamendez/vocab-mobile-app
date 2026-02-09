import type {VocabWord} from '../types';

export interface RenderOptions {
  textColor: string;
  fontSize: number;
  backgroundColor?: string;
}

export interface RenderedWallpaper {
  uri: string;
  width: number;
  height: number;
}

export const DEFAULT_RENDER_OPTIONS: RenderOptions = {
  textColor: '#ffffff',
  fontSize: 24,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
};

/**
 * Note: Actual wallpaper rendering with text overlay is done natively
 * in VocabWallpaperWorker.kt for performance and background execution.
 * 
 * This service provides utilities for the preview screen and configuration.
 */

export function calculateTextPosition(
  imageHeight: number,
  _imageWidth: number,
): {x: number; y: number} {
  // Position text in the lower third of the image
  return {
    x: 20,
    y: imageHeight * 0.7,
  };
}

export function formatVocabForDisplay(word: VocabWord): {
  title: string;
  subtitle: string;
  body: string;
} {
  return {
    title: word.word,
    subtitle: word.partOfSpeech ? `(${word.partOfSpeech})` : '',
    body: word.definition,
  };
}

/**
 * Generate overlay style for preview component
 */
export function getOverlayStyle(options: Partial<RenderOptions> = {}) {
  const merged = {...DEFAULT_RENDER_OPTIONS, ...options};
  return {
    backgroundColor: merged.backgroundColor,
    textColor: merged.textColor,
    fontSize: merged.fontSize,
  };
}
