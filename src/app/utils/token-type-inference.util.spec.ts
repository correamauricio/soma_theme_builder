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

  it('should infer null or undefined as "unknown"', () => {
    expect(inferTokenType(null)).toBe('unknown');
    expect(inferTokenType(undefined)).toBe('unknown');
  });

  it('should infer unmapped string formats as "unknown"', () => {
    expect(inferTokenType('just a string')).toBe('unknown');
    expect(inferTokenType('123abcde')).toBe('unknown');
  });

  it('should infer numeric primitive values as "number"', () => {
    expect(inferTokenType(42)).toBe('number');
    expect(inferTokenType(3.14)).toBe('number');
  });

  it('should infer object shapes for typography, shadow, border, and transition correctly', () => {
    // typography
    expect(inferTokenType({ fontFamily: 'Arial' })).toBe('typography');
    expect(inferTokenType({ fontSize: '16px' })).toBe('typography');
    
    // shadow
    expect(inferTokenType({ offsetX: '1px', offsetY: '2px' })).toBe('shadow');
    
    // border
    expect(inferTokenType({ width: '1px', style: 'solid', color: '#000' })).toBe('border');
    
    // transition
    expect(inferTokenType({ duration: '200ms', timingFunction: 'ease' })).toBe('transition');
  });

  it('should infer unrecognized object shapes as "unknown"', () => {
    expect(inferTokenType({ someKey: 'value', anotherKey: 123 })).toBe('unknown');
    expect(inferTokenType({})).toBe('unknown');
  });

  it('should infer array shapes for shadows and cubicBezier correctly', () => {
    // shadow array
    expect(inferTokenType([{ offsetX: '1px', offsetY: '2px' }])).toBe('shadow');
    
    // cubicBezier array
    expect(inferTokenType([0.25, 0.1, 0.25, 1.0])).toBe('cubicBezier');
  });

  it('should infer unrecognized array shapes as "unknown"', () => {
    expect(inferTokenType([])).toBe('unknown');
    expect(inferTokenType([1, 2, 3])).toBe('unknown'); // length != 4
    expect(inferTokenType(['a', 'b', 'c', 'd'])).toBe('unknown'); // not numbers
    expect(inferTokenType([{ someKey: 'value' }])).toBe('unknown'); // not shadow
  });
});