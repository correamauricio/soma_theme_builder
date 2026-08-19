import { describe, it, expect } from 'vitest';
import { inferTokenType } from './token-type-inference.util';

describe('inferTokenType', () => {
  it('should infer modern CSS color formats (oklch, color-space, lab) as "color"', () => {
    expect(inferTokenType('oklch(60% 0.15 250)')).toBe('color');
    expect(inferTokenType('color(display-p3 1 0 0)')).toBe('color');
    expect(inferTokenType('lab(50% 40 59)')).toBe('color');
  });

  it('should infer standard color formats (hex, rgb, rgba, hsl) as "color"', () => {
    expect(inferTokenType('#ff0000')).toBe('color');
    expect(inferTokenType('rgb(255, 0, 0)')).toBe('color');
    expect(inferTokenType('rgba(255, 0, 0, 0.5)')).toBe('color');
    expect(inferTokenType('hsl(120, 100%, 50%)')).toBe('color');
  });

  it('should infer dimension and duration units correctly', () => {
    expect(inferTokenType('16px')).toBe('dimension');
    expect(inferTokenType('1.5rem')).toBe('dimension');
    expect(inferTokenType('300ms')).toBe('duration');
  });
});