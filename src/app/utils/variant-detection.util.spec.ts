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
  });
});
