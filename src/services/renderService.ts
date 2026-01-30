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

const DEFAULT_OPTIONS: RenderOptions = {
  textColor: '#ffffff',
  fontSize: 24,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
};

export async function renderWordOnImage(
  imageUri: string,
  word: VocabWord,
  options: Partial<RenderOptions> = {},
): Promise<RenderedWallpaper> {
  const mergedOptions = {...DEFAULT_OPTIONS, ...options};

  // TODO: Implement actual image rendering using react-native-skia or similar
  // This will overlay the word and definition onto the image
  console.log('Rendering word on image:', {
    imageUri,
    word,
    options: mergedOptions,
  });

  // For now, return a placeholder result
  return {
    uri: imageUri,
    width: 1080,
    height: 1920,
  };
}

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
