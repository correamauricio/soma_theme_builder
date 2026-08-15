import { describe, it, expect } from 'vitest';
import { extractFileTokenPaths, resolveAllFlatTokens, resolveFileFlatTokens, buildGroupedTokens } from './token-parser.util';
import { detectVariantGroups, computeActiveFiles } from './variant-detection.util';

describe('Token Parser & Variant Resolution', () => {
  const primitives = {
    color: {
      blue: {
        500: { $value: '#3b82f6', $type: 'color' },
        600: { $value: '#2563eb', $type: 'color' }
      }
    }
  };

  const semanticsLight = {
    color: {
      primary: {
        main: { $value: '{color.blue.500}', $type: 'color' }
      },
      background: {
        DEFAULT: { $value: '#ffffff', $type: 'color' }
      }
    }
  };

  const semanticsDark = {
    color: {
      primary: {
        main: { $value: '{color.blue.600}', $type: 'color' }
      },
      background: {
        DEFAULT: { $value: '#111827', $type: 'color' }
      }
    }
  };

  const files = [
    { name: 'primitives.json', content: primitives },
    { name: 'semantics.json', content: semanticsLight },
    { name: 'semantics-dark.json', content: semanticsDark }
  ];

  it('should detect variant groups between semantics.json and semantics-dark.json', () => {
    const fileTokenPaths = extractFileTokenPaths(files);
    const groups = detectVariantGroups(fileTokenPaths, {});
    expect(groups.length).toBe(1);
    expect(groups[0].files).toContain('semantics.json');
    expect(groups[0].files).toContain('semantics-dark.json');
  });

  it('should keep token listing when viewing inactive variant file', () => {
    const fileTokenPaths = extractFileTokenPaths(files);
    const groups = detectVariantGroups(fileTokenPaths, { 'group-1': 'semantics-dark.json' });
    
    // semantics-dark.json is the active variant
    const activeFiles = computeActiveFiles(files, groups, new Set());
    expect(activeFiles.map(f => f.name)).toEqual(['primitives.json', 'semantics-dark.json']);

    // allFlatTokens resolves active theme tokens
    const allFlatTokens = resolveAllFlatTokens(activeFiles, fileTokenPaths, () => {});

    // Active theme resolves primary to #2563eb
    const primaryActive = allFlatTokens.find(t => t.path === 'color.primary.main');
    expect(primaryActive?.resolvedValue).toBe('#2563eb');
    expect(primaryActive?.sourceFile).toBe('semantics-dark.json');

    // BUT user is viewing semantics.json (the non-active variant)
    const viewedFileTokens = fileTokenPaths.get('semantics.json')!.tokens;
    const resolvedViewedTokens = resolveFileFlatTokens(viewedFileTokens, allFlatTokens);

    // Tokens of semantics.json should still be present and resolved!
    expect(resolvedViewedTokens.length).toBe(2);
    const viewedPrimary = resolvedViewedTokens.find(t => t.path === 'color.primary.main');
    expect(viewedPrimary).toBeDefined();
    expect(viewedPrimary?.value).toBe('{color.blue.500}');
    expect(viewedPrimary?.resolvedValue).toBe('#3b82f6');
    expect(viewedPrimary?.sourceFile).toBe('semantics.json');

    const grouped = buildGroupedTokens(resolvedViewedTokens);
    expect(grouped.color.primary.main._token).toBeDefined();
    expect(grouped.color.background.DEFAULT._token).toBeDefined();
  });
});
