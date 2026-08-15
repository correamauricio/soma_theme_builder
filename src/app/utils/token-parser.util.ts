import { FlatToken, TokenFile } from '../models/token.model';

export function extractFileTokenPaths(files: TokenFile[]): Map<string, { paths: Set<string>; tokens: FlatToken[] }> {
  const map = new Map<string, { paths: Set<string>; tokens: FlatToken[] }>();

  for (const file of files) {
    const paths = new Set<string>();
    const tokens: FlatToken[] = [];

    const extract = (obj: any, path: string[]) => {
      if (!obj || typeof obj !== 'object') return;
      if (obj.$value !== undefined || obj.value !== undefined) {
        const value = String(obj.$value !== undefined ? obj.$value : obj.value);
        const type = String(obj.$type !== undefined ? obj.$type : (obj.type || 'unknown'));
        const pathStr = path.join('.');
        paths.add(pathStr);
        tokens.push({
          path: pathStr,
          originalPath: path,
          value,
          resolvedValue: value,
          type,
          sourceFile: file.name
        });
      } else {
        for (const key of Object.keys(obj)) {
          if (!key.startsWith('$') && !key.startsWith('@')) {
            extract(obj[key], [...path, key]);
          }
        }
      }
    };

    extract(file.content, []);
    map.set(file.name, { paths, tokens });
  }

  return map;
}

export function createAliasResolver(tokenMap: Map<string, { value: string }>) {
  const resolveAlias = (val: string, visited: Set<string>): string => {
    const aliasMatch = val.match(/^\{([^}]+)\}$/);
    if (aliasMatch) {
      const aliasPath = aliasMatch[1];
      if (visited.has(aliasPath)) {
        return val;
      }
      
      const referencedToken = tokenMap.get(aliasPath);
      if (referencedToken) {
         visited.add(aliasPath);
         return resolveAlias(referencedToken.value, visited);
      }
    }
    
    return val.replace(/\{([^}]+)\}/g, (match, path) => {
       if (visited.has(path)) {
         return match;
       }
       const referencedToken = tokenMap.get(path);
       if (referencedToken) {
         visited.add(path);
         return resolveAlias(referencedToken.value, visited);
       }
       return match;
    });
  };

  return resolveAlias;
}

export function resolveAllFlatTokens(
  activeFileList: TokenFile[], 
  fileMap: Map<string, { paths: Set<string>; tokens: FlatToken[] }>,
  onDuplicatesFound: (duplicates: string[]) => void
): FlatToken[] {
  const flatMap = new Map<string, FlatToken>();
  const duplicates: string[] = [];

  for (const file of activeFileList) {
    const fileData = fileMap.get(file.name);
    if (!fileData) continue;

    for (const t of fileData.tokens) {
      if (flatMap.has(t.path)) {
        const existing = flatMap.get(t.path)!;
        duplicates.push(`Token "${t.path}" definido em "${existing.sourceFile}" foi sobrescrito por "${file.name}"`);
      }
      flatMap.set(t.path, {
        ...t,
        sourceFile: file.name
      });
    }
  }

  const resolveAlias = createAliasResolver(flatMap);

  const resolvedTokens = Array.from(flatMap.values()).map(t => {
     return {
       ...t,
       resolvedValue: resolveAlias(t.value, new Set<string>())
     };
  });

  onDuplicatesFound(duplicates);

  return resolvedTokens;
}

export function resolveFileFlatTokens(
  fileTokens: FlatToken[],
  contextTokens: FlatToken[]
): FlatToken[] {
  const lookupMap = new Map<string, FlatToken>();
  for (const t of contextTokens) {
    lookupMap.set(t.path, t);
  }
  for (const t of fileTokens) {
    lookupMap.set(t.path, t);
  }

  const resolveAlias = createAliasResolver(lookupMap);

  return fileTokens.map(t => ({
    ...t,
    resolvedValue: resolveAlias(t.value, new Set<string>())
  }));
}

export function buildGroupedTokens(flatTokens: FlatToken[]): any {
  const tree: any = {};
  for (const t of flatTokens) {
    let currentLevel = tree;
    for (let i = 0; i < t.originalPath.length; i++) {
      const part = t.originalPath[i];
      if (i === t.originalPath.length - 1) {
        currentLevel[part] = { _token: t };
      } else {
        currentLevel[part] = currentLevel[part] || {};
        currentLevel = currentLevel[part];
      }
    }
  }
  return tree;
}
