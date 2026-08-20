import { describe, it, expect } from 'vitest';
import { createAliasResolver, resolveAllFlatTokens, resolveFileFlatTokens } from './alias-resolver.util';
import { FlatToken } from '../models/token.model';

describe('alias-resolver.util', () => {
  describe('createAliasResolver', () => {
    it('should return primitive values unchanged', () => {
      const resolver = createAliasResolver(new Map());

      expect(resolver(123)).toBe(123);
      expect(resolver(true)).toBe(true);
      expect(resolver(false)).toBe(false);
      expect(resolver(null)).toBeNull();
      expect(resolver(undefined)).toBeUndefined();
      expect(resolver('plain text')).toBe('plain text');
      
      const symbol = Symbol('test');
      expect(resolver(symbol)).toBe(symbol);
      const fn = () => {};
      expect(resolver(fn)).toBe(fn);
    });

    it('should resolve a direct alias', () => {
      const tokenMap = new Map([
        ['color.blue.500', { value: '#3b82f6' }],
        ['color.primary', { value: '{color.blue.500}' }]
      ]);

      const resolver = createAliasResolver(tokenMap);
      expect(resolver('{color.primary}')).toBe('#3b82f6');
    });

    it('should resolve nested multi-level aliases', () => {
      const tokenMap = new Map([
        ['color.base', { value: '#123456' }],
        ['color.semantic', { value: '{color.base}' }],
        ['color.component', { value: '{color.semantic}' }]
      ]);

      const resolver = createAliasResolver(tokenMap);
      expect(resolver('{color.component}')).toBe('#123456');
    });

    it('should resolve sub-property references on object tokens', () => {
      const tokenMap = new Map([
        [
          'typography.heading.1',
          {
            value: {
              fontSize: '32px',
              lineHeight: '1.2',
              fontWeight: 700
            }
          }
        ],
        ['font.main-title.size', { value: '{typography.heading.1.fontSize}' }],
        ['font.main-title.weight', { value: '{typography.heading.1.fontWeight}' }]
      ]);

      const resolver = createAliasResolver(tokenMap);
      expect(resolver('{font.main-title.size}')).toBe('32px');
      expect(resolver('{font.main-title.weight}')).toBe(700);
    });

    it('should resolve deep sub-property references', () => {
      const tokenMap = new Map([
        [
          'theme.card',
          {
            value: {
              header: {
                title: {
                  fontSize: '18px'
                }
              }
            }
          }
        ]
      ]);

      const resolver = createAliasResolver(tokenMap);
      expect(resolver('{theme.card.header.title.fontSize}')).toBe('18px');
    });

    it('should return original token alias if sub-property lookup fails midway', () => {
      const tokenMap = new Map([
        [
          'theme.card',
          {
            value: {
              header: {
                title: 'Simple string, not an object'
              }
            }
          }
        ]
      ]);

      const resolver = createAliasResolver(tokenMap);
      // It fails to find `fontSize` because `title` is not an object
      expect(resolver('{theme.card.header.title.fontSize}')).toBe('{theme.card.header.title.fontSize}');
    });

    it('should safely handle circular references without infinite loops', () => {
      const tokenMap = new Map([
        ['token.a', { value: '{token.b}' }],
        ['token.b', { value: '{token.a}' }]
      ]);

      const resolver = createAliasResolver(tokenMap);
      // Returns fallback string rather than crashing or looping
      expect(resolver('{token.a}')).toBe('{token.a}');
    });

    it('should resolve aliases within arrays', () => {
      const tokenMap = new Map([
        ['shadow.color', { value: 'rgba(0,0,0,0.1)' }],
        ['shadow.offset', { value: '4px' }]
      ]);

      const resolver = createAliasResolver(tokenMap);
      const input = ['{shadow.offset}', '{shadow.offset}', '{shadow.color}'];
      expect(resolver(input)).toEqual(['4px', '4px', 'rgba(0,0,0,0.1)']);
    });

    it('should resolve aliases within nested objects', () => {
      const tokenMap = new Map([
        ['color.border', { value: '#e2e8f0' }],
        ['spacing.sm', { value: '8px' }]
      ]);

      const resolver = createAliasResolver(tokenMap);
      const input = {
        padding: '{spacing.sm}',
        border: {
          color: '{color.border}',
          width: '1px'
        }
      };

      expect(resolver(input)).toEqual({
        padding: '8px',
        border: {
          color: '#e2e8f0',
          width: '1px'
        }
      });
    });

    it('should interpolate inline aliases within strings', () => {
      const tokenMap = new Map([
        ['color.border', { value: '#e5e7eb' }],
        ['spacing.unit', { value: '4px' }]
      ]);

      const resolver = createAliasResolver(tokenMap);
      expect(resolver('1px solid {color.border}')).toBe('1px solid #e5e7eb');
      expect(resolver('calc({spacing.unit} * 2)')).toBe('calc(4px * 2)');
    });

    it('should warn and keep placeholder when trying to inline a complex object into a string', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const tokenMap = new Map([
        ['shadow.elevation', { value: { offsetX: '0px', offsetY: '2px' } }]
      ]);

      const resolver = createAliasResolver(tokenMap);
      const result = resolver('box-shadow: {shadow.elevation};');
      
      expect(result).toBe('box-shadow: {shadow.elevation};');
      expect(consoleWarnSpy).toHaveBeenCalledWith('Cannot inline complex object token "shadow.elevation" into string: "box-shadow: {shadow.elevation};"');
      
      consoleWarnSpy.mockRestore();
    });

    it('should keep original placeholder if token is not found', () => {
      const tokenMap = new Map<string, { value: any }>();
      const resolver = createAliasResolver(tokenMap);

      expect(resolver('{unknown.token}')).toBe('{unknown.token}');
      expect(resolver('border: 1px solid {unknown.color}')).toBe('border: 1px solid {unknown.color}');
    });
  });

  describe('resolveAllFlatTokens', () => {
    it('should merge tokens from active files and resolve all aliases', () => {
      const primitivesFile: FlatToken[] = [
        {
          path: 'color.blue',
          originalPath: ['color', 'blue'],
          value: '#0000ff',
          resolvedValue: '#0000ff',
          type: 'color',
          sourceFile: 'primitives.json'
        }
      ];

      const semanticsFile: FlatToken[] = [
        {
          path: 'color.primary',
          originalPath: ['color', 'primary'],
          value: '{color.blue}',
          resolvedValue: '{color.blue}',
          type: 'color',
          sourceFile: 'semantics.json'
        }
      ];

      const fileMap = new Map([
        ['primitives.json', { paths: new Set(['color.blue']), tokens: primitivesFile }],
        ['semantics.json', { paths: new Set(['color.primary']), tokens: semanticsFile }]
      ]);

      const duplicates: string[] = [];
      const result = resolveAllFlatTokens(
        [{ name: 'primitives.json' }, { name: 'semantics.json' }],
        fileMap,
        (dups) => duplicates.push(...dups)
      );

      expect(result.length).toBe(2);
      const primaryToken = result.find(t => t.path === 'color.primary');
      expect(primaryToken?.resolvedValue).toBe('#0000ff');
      expect(duplicates.length).toBe(0);
    });

    it('should detect and warn when duplicate token paths are overwritten', () => {
      const fileA: FlatToken[] = [
        {
          path: 'color.brand',
          originalPath: ['color', 'brand'],
          value: '#111',
          resolvedValue: '#111',
          type: 'color',
          sourceFile: 'fileA.json'
        }
      ];

      const fileB: FlatToken[] = [
        {
          path: 'color.brand',
          originalPath: ['color', 'brand'],
          value: '#222',
          resolvedValue: '#222',
          type: 'color',
          sourceFile: 'fileB.json'
        }
      ];

      const fileMap = new Map([
        ['fileA.json', { paths: new Set(['color.brand']), tokens: fileA }],
        ['fileB.json', { paths: new Set(['color.brand']), tokens: fileB }]
      ]);

      const duplicates: string[] = [];
      const result = resolveAllFlatTokens(
        [{ name: 'fileA.json' }, { name: 'fileB.json' }],
        fileMap,
        (dups) => duplicates.push(...dups)
      );

      expect(duplicates.length).toBe(1);
      expect(duplicates[0]).toBe('Token "color.brand" defined in "fileA.json" was overwritten by "fileB.json"');
      expect(result.find(t => t.path === 'color.brand')?.resolvedValue).toBe('#222');
    });
  });

  describe('resolveFileFlatTokens', () => {
    it('should resolve target file tokens using context tokens', () => {
      const contextTokens: FlatToken[] = [
        {
          path: 'spacing.base',
          originalPath: ['spacing', 'base'],
          value: '8px',
          resolvedValue: '8px',
          type: 'dimension',
          sourceFile: 'base.json'
        }
      ];

      const fileTokens: FlatToken[] = [
        {
          path: 'component.padding',
          originalPath: ['component', 'padding'],
          value: '{spacing.base}',
          resolvedValue: '{spacing.base}',
          type: 'dimension',
          sourceFile: 'component.json'
        }
      ];

      const result = resolveFileFlatTokens(fileTokens, contextTokens);
      expect(result.length).toBe(1);
      expect(result[0].resolvedValue).toBe('8px');
      expect(result[0].path).toBe('component.padding');
    });
  });
});
