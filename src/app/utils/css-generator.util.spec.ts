import { describe, it, expect, vi } from 'vitest';
import { generateCssVariables } from './css-generator.util';
import { FlatToken } from '../models/token.model';
import { strategyMap, primitiveStrategy } from './css-strategies';

describe('generateCssVariables', () => {
  it('should generate an empty :root block when tokens array is empty', () => {
    const css = generateCssVariables([]);
    expect(css).toBe(':root {\n}\n');
  });

  it('should convert dot-separated token paths to hyphenated CSS variable names', () => {
    const tokens: FlatToken[] = [
      {
        path: 'color.brand.primary',
        originalPath: ['color', 'brand', 'primary'],
        value: '#ff0000',
        resolvedValue: '#ff0000',
        type: 'color',
        sourceFile: 'tokens.json'
      }
    ];
    const css = generateCssVariables(tokens);
    expect(css).toContain('--color-brand-primary: #ff0000;');
  });

  it('should use specific strategy from strategyMap based on token type', () => {
    const spy = vi.spyOn(strategyMap['shadow'], 'generate');
    const tokens: FlatToken[] = [
      {
        path: 'effect.drop',
        originalPath: ['effect', 'drop'],
        value: { offsetX: '0px' },
        resolvedValue: { offsetX: '0px' },
        type: 'shadow',
        sourceFile: 'tokens.json'
      }
    ];
    
    generateCssVariables(tokens);
    expect(spy).toHaveBeenCalledWith(tokens[0], '--effect-drop');
    spy.mockRestore();
  });

  it('should fallback to primitiveStrategy when token type is unknown or unmapped', () => {
    const spy = vi.spyOn(primitiveStrategy, 'generate');
    const tokens: FlatToken[] = [
      {
        path: 'unknown.custom.property',
        originalPath: ['unknown', 'custom', 'property'],
        value: 'custom_value',
        resolvedValue: 'custom_value',
        type: 'some_unknown_type',
        sourceFile: 'tokens.json'
      }
    ];
    
    generateCssVariables(tokens);
    expect(spy).toHaveBeenCalledWith(tokens[0], '--unknown-custom-property');
    spy.mockRestore();
  });
});
