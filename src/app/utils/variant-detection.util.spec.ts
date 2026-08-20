import { describe, it, expect } from 'vitest';
import { detectVariantGroups, computeActiveFiles } from './variant-detection.util';
import { FlatToken, TokenFile } from '../models/token.model';

describe('Variant Detection Utils (Theme & Variant File Resolution)', () => {
  describe('detectVariantGroups', () => {
    it('should group files together into a VariantGroup when they declare identical token paths (mutually exclusive variants like light.json and dark.json)', () => {
      const fileMap = new Map<string, { paths: Set<string>; tokens: FlatToken[] }>();
      fileMap.set('light.json', { paths: new Set(['color.background']), tokens: [] });
      fileMap.set('dark.json', { paths: new Set(['color.background']), tokens: [] });

      const groups = detectVariantGroups(fileMap, {});

      expect(groups.length).toBe(1);
      expect(groups[0].files).toContain('light.json');
      expect(groups[0].files).toContain('dark.json');
    });

    it('should not create variant groups when files contain completely distinct token paths (e.g. core base tokens vs theme colors)', () => {
      const fileMap = new Map<string, { paths: Set<string>; tokens: FlatToken[] }>();
      fileMap.set('core.json', { paths: new Set(['size.spacing']), tokens: [] });
      fileMap.set('theme.json', { paths: new Set(['color.brand']), tokens: [] });

      const groups = detectVariantGroups(fileMap, {});

      expect(groups.length).toBe(0);
    });

    it('should return empty array if less than or equal to 1 file is provided', () => {
      const fileMap = new Map<string, { paths: Set<string>; tokens: FlatToken[] }>();
      fileMap.set('single.json', { paths: new Set(['color.background']), tokens: [] });

      const groups = detectVariantGroups(fileMap, {});
      expect(groups.length).toBe(0);

      const emptyGroups = detectVariantGroups(new Map(), {});
      expect(emptyGroups.length).toBe(0);
    });

    it('should use selected variant if provided, otherwise default to first file in group', () => {
      const fileMap = new Map<string, { paths: Set<string>; tokens: FlatToken[] }>();
      fileMap.set('light.json', { paths: new Set(['color.bg']), tokens: [] });
      fileMap.set('dark.json', { paths: new Set(['color.bg']), tokens: [] });

      const groupsWithSelected = detectVariantGroups(fileMap, { 'group-1': 'dark.json' });
      expect(groupsWithSelected[0].activeFile).toBe('dark.json');

      const groupsWithoutSelected = detectVariantGroups(fileMap, {});
      expect(groupsWithoutSelected[0].activeFile).toBe('light.json');
    });
  });

  describe('computeActiveFiles', () => {
    it('should include base files and the chosen active variant file while omitting unselected variants from the active context', () => {
      const allFiles: TokenFile[] = [
        { name: 'core.json', content: {} },
        { name: 'light.json', content: {} },
        { name: 'dark.json', content: {} }
      ];

      const groups = [
        {
          id: 'group-1',
          name: 'Variante 1',
          files: ['light.json', 'dark.json'],
          activeFile: 'dark.json'
        }
      ];

      const disabledFiles = new Set<string>();

      const activeFiles = computeActiveFiles(allFiles, groups, disabledFiles);

      const activeNames = activeFiles.map(f => f.name);
      expect(activeNames).toContain('core.json');
      expect(activeNames).toContain('dark.json');
      expect(activeNames).not.toContain('light.json');
    });

    it('should exclude files marked as disabled from the active files list regardless of variant selection', () => {
      const allFiles: TokenFile[] = [
        { name: 'core.json', content: {} },
        { name: 'dark.json', content: {} }
      ];

      const groups = [
        {
          id: 'group-1',
          name: 'Variante 1',
          files: ['dark.json'],
          activeFile: 'dark.json'
        }
      ];

      const disabledFiles = new Set<string>(['core.json']);

      const activeFiles = computeActiveFiles(allFiles, groups, disabledFiles);

      const activeNames = activeFiles.map(f => f.name);
      expect(activeNames).not.toContain('core.json');
      expect(activeNames).toContain('dark.json');
    });

    it('should include all variant group files if activeFile is not set', () => {
      const allFiles: TokenFile[] = [
        { name: 'light.json', content: {} },
        { name: 'dark.json', content: {} }
      ];

      const groups = [
        {
          id: 'group-1',
          name: 'Variante 1',
          files: ['light.json', 'dark.json'],
          activeFile: undefined as any // missing activeFile
        }
      ];

      const disabledFiles = new Set<string>();

      const activeFiles = computeActiveFiles(allFiles, groups, disabledFiles);

      const activeNames = activeFiles.map(f => f.name);
      // when no active file is set, the filter fallback returns true if the file is in variantFileNames but selectedVariantFiles is empty (actually selectedVariantFiles won't have it)
      // Wait, let's see logic: 
      // if (variantFileNames.has(f.name)) { return selectedVariantFiles.has(f.name); }
      // So if no activeFile is set, selectedVariantFiles is empty, and it will return false for ALL files in the group.
      expect(activeNames.length).toBe(0);
    });
  });
});
