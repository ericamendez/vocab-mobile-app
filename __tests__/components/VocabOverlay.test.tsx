import React from 'react';
import {render} from '@testing-library/react-native';
import {VocabOverlay} from '../../src/components/VocabOverlay';
import type {VocabWord} from '../../src/types';

describe('VocabOverlay', () => {
  const mockWord: VocabWord = {
    word: 'Ephemeral',
    definition: 'lasting for a very short time; transitory',
    partOfSpeech: 'adjective',
    example: 'The ephemeral beauty of cherry blossoms.',
  };

  it('renders the word correctly', () => {
    const {getByText} = render(<VocabOverlay word={mockWord} />);
    expect(getByText('Ephemeral')).toBeTruthy();
  });

  it('renders the definition correctly', () => {
    const {getByText} = render(<VocabOverlay word={mockWord} />);
    expect(getByText('lasting for a very short time; transitory')).toBeTruthy();
  });

  it('renders the part of speech when provided', () => {
    const {getByText} = render(<VocabOverlay word={mockWord} />);
    expect(getByText('adjective')).toBeTruthy();
  });

  it('renders the example when provided', () => {
    const {getByText} = render(<VocabOverlay word={mockWord} />);
    expect(getByText('"The ephemeral beauty of cherry blossoms."')).toBeTruthy();
  });

  it('does not render part of speech when not provided', () => {
    const wordWithoutPartOfSpeech: VocabWord = {
      word: 'Test',
      definition: 'A test word',
    };
    const {queryByText} = render(
      <VocabOverlay word={wordWithoutPartOfSpeech} />,
    );
    expect(queryByText('adjective')).toBeNull();
    expect(queryByText('noun')).toBeNull();
  });

  it('does not render example when not provided', () => {
    const wordWithoutExample: VocabWord = {
      word: 'Test',
      definition: 'A test word',
      partOfSpeech: 'noun',
    };
    const {queryByText} = render(<VocabOverlay word={wordWithoutExample} />);
    // Should not have quotes around any text (which indicates example)
    expect(queryByText(/".*"/)).toBeNull();
  });

  it('applies custom textColor', () => {
    const {getByText} = render(
      <VocabOverlay word={mockWord} textColor="#ff0000" />,
    );
    const wordElement = getByText('Ephemeral');
    expect(wordElement.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({color: '#ff0000'})]),
    );
  });

  it('applies custom fontSize', () => {
    const {getByText} = render(
      <VocabOverlay word={mockWord} fontSize={32} />,
    );
    const wordElement = getByText('Ephemeral');
    expect(wordElement.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({fontSize: 32})]),
    );
  });

  it('applies custom backgroundColor', () => {
    const {getByTestId} = render(
      <VocabOverlay
        word={mockWord}
        backgroundColor="rgba(255, 0, 0, 0.5)"
        testID="overlay"
      />,
    );
    const container = getByTestId('overlay');
    expect(container.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({backgroundColor: 'rgba(255, 0, 0, 0.5)'}),
      ]),
    );
  });

  it('uses default values when no custom props provided', () => {
    const {getByText, getByTestId} = render(
      <VocabOverlay word={mockWord} testID="overlay" />,
    );
    const wordElement = getByText('Ephemeral');
    const container = getByTestId('overlay');

    // Check default text color (#ffffff)
    expect(wordElement.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({color: '#ffffff'})]),
    );

    // Check default font size (28)
    expect(wordElement.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({fontSize: 28})]),
    );

    // Check default background color
    expect(container.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({backgroundColor: 'rgba(0, 0, 0, 0.7)'}),
      ]),
    );
  });

  it('accepts testID prop', () => {
    const {getByTestId} = render(
      <VocabOverlay word={mockWord} testID="custom-overlay" />,
    );
    expect(getByTestId('custom-overlay')).toBeTruthy();
  });
});
