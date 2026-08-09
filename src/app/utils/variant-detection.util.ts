import { FlatToken, TokenFile, VariantGroup } from '../models/token.model';

export function detectVariantGroups(
  fileMap: Map<string, { paths: Set<string>; tokens: FlatToken[] }>,
  selectedVariants: Record<string, string>
): VariantGroup[] {
  const fileNames = Array.from(fileMap.keys());
  if (fileNames.length <= 1) return [];

  const parent: Record<string, string> = {};
  fileNames.forEach(f => parent[f] = f);

  const find = (i: string): string => {
    if (parent[i] === i) return i;
    return parent[i] = find(parent[i]);
  };

  const union = (i: string, j: string) => {
    const rootI = find(i);
    const rootJ = find(j);
    if (rootI !== rootJ) parent[rootI] = rootJ;
  };

  for (let i = 0; i < fileNames.length; i++) {
    for (let j = i + 1; j < fileNames.length; j++) {
      const f1 = fileNames[i];
      const f2 = fileNames[j];
      const paths1 = fileMap.get(f1)?.paths || new Set();
      const paths2 = fileMap.get(f2)?.paths || new Set();

      let hasOverlap = false;
      for (const p of paths1) {
        if (paths2.has(p)) {
          hasOverlap = true;
          break;
        }
      }

      if (hasOverlap) {
        union(f1, f2);
      }
    }
  }

  const clusters: Record<string, string[]> = {};
  fileNames.forEach(f => {
    const root = find(f);
    if (!clusters[root]) clusters[root] = [];
    clusters[root].push(f);
  });

  const groups: VariantGroup[] = [];
  let index = 1;

  for (const root of Object.keys(clusters)) {
    const members = clusters[root];
    if (members.length > 1) {
      const groupId = `group-${index++}`;
      const selected = selectedVariants[groupId] || members[0];
      groups.push({
        id: groupId,
        name: `Variante ${index - 1}`,
        files: members,
        activeFile: selected
      });
    }
  }

  return groups;
}

export function computeActiveFiles(
  allFiles: TokenFile[],
  groups: VariantGroup[],
  disabledFileNames: Set<string>
): TokenFile[] {
  const variantFileNames = new Set<string>();
  const selectedVariantFiles = new Set<string>();

  for (const group of groups) {
    group.files.forEach(f => variantFileNames.add(f));
    if (group.activeFile) {
      selectedVariantFiles.add(group.activeFile);
    }
  }

  return allFiles.filter(f => {
    if (disabledFileNames.has(f.name)) return false;
    if (variantFileNames.has(f.name)) {
      return selectedVariantFiles.has(f.name);
    }
    return true;
  });
}
