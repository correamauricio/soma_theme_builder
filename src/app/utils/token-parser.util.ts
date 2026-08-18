import { FlatToken, GroupedTokenNode } from '../models/token.model';

export { extractFileTokenPaths, type ExtractedFileTokens } from './token-extractor.util';
export { resolveAllFlatTokens, resolveFileFlatTokens } from './alias-resolver.util';

export function buildGroupedTokens(flatTokens: FlatToken[]): GroupedTokenNode {
  const root: GroupedTokenNode = {};

  for (const token of flatTokens) {
    const path = token.originalPath;
    if (path.length === 0) continue;

    const groupNames = path.slice(0, -1);
    const tokenName = path[path.length - 1];

    let currentGroup = root;
    for (const group of groupNames) {
      if (!currentGroup[group]) {
        currentGroup[group] = {};
      }
      currentGroup = currentGroup[group];
    }

    currentGroup[tokenName] = { _token: token };
  }

  return root;
}
