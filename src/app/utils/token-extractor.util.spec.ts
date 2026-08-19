import { describe, it, expect } from 'vitest';
import { extractFileTokenPaths } from './token-extractor.util';

describe('extractFileTokenPaths', () => {
  it('should extract tokens that use custom or proprietary value keys (e.g. "val")', () => {
    const file = {
      name: 'proprietary.json',
      content: {
        color: {
          blue: {
            val: '#0000ff'
          }
        }
      }
    };

    const result = extractFileTokenPaths([file]);
    const fileTokens = result.get('proprietary.json');

    // Expected behavior: parser should detect non-standard token structures and extract them
    expect(fileTokens?.tokens.length).toBeGreaterThan(0);
  });

  it('should extract design tokens when the root of the JSON file is an array', () => {
    const file = {
      name: 'array-root.json',
      content: [
        {
          path: 'color.blue',
          $value: '#0000ff',
          $type: 'color'
        }
      ]
    };

    const result = extractFileTokenPaths([file]);
    const fileTokens = result.get('array-root.json');

    // Expected behavior: parser should iterate root-level arrays and extract valid tokens
    expect(fileTokens?.tokens.length).toBeGreaterThan(0);
    expect(fileTokens?.tokens[0].path).toBe('color.blue');
  });
});