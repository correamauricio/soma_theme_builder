import { FlatToken } from '../models/token.model';
import { ExtractedFileTokens } from './token-extractor.util';

/**
 * Interface representing any object holding a token value for lookup.
 */
export interface TokenValueHolder {
  value: any;
}

/**
 * Creates a function to recursively resolve token alias references (e.g. "{color.primary}").
 *
 * Supported features:
 * - Direct aliases: "{color.brand.primary}" -> "#3b82f6"
 * - Nested/composite property aliases: "{typography.h1.fontSize}" -> "2rem"
 * - String interpolations: "1px solid {color.border}" -> "1px solid #e5e7eb"
 * - Complex values: nested objects and arrays with aliases
 * - Circular reference protection: returns the original reference string if a loop is detected
 *
 * @param tokenMap Map of token paths to their definitions.
 * @returns A resolver function that resolves aliases in any token value.
 */
export function createAliasResolver(tokenMap: Map<string, TokenValueHolder>) {
  /**
   * Resolves aliases within any given value recursively.
   */
  return function resolveValue(value: unknown, visitedTokens: Set<string> = new Set()): any {
    if (value == null) {
      return value;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map(item => resolveValue(item, new Set(visitedTokens)));
    }

    if (typeof value === 'object') {
      const resolvedObject: Record<string, any> = {};
      for (const [key, propValue] of Object.entries(value)) {
        resolvedObject[key] = resolveValue(propValue, new Set(visitedTokens));
      }
      return resolvedObject;
    }

    if (typeof value === 'string') {
      return resolveStringValue(value, tokenMap, visitedTokens, resolveValue);
    }

    return value;
  };
}

/**
 * Resolves alias expressions within a string (both exact "{path}" and inline "prefix {path} suffix").
 */
function resolveStringValue(
  text: string,
  tokenMap: Map<string, TokenValueHolder>,
  visitedTokens: Set<string>,
  resolveValue: (value: unknown, visited: Set<string>) => any
): any {
  // 1. Exact alias match: "{token.path}" -> returns the raw resolved value (retaining type)
  const exactAliasMatch = text.match(/^\{([^}]+)\}$/);
  if (exactAliasMatch) {
    const aliasPath = exactAliasMatch[1];
    return resolveSingleAlias(aliasPath, tokenMap, visitedTokens, resolveValue, text);
  }

  // 2. Inline / interpolated string: "1px solid {token.path}"
  const hasPlaceholders = text.includes('{') && text.includes('}');
  if (!hasPlaceholders) {
    return text;
  }

  return text.replace(/\{([^}]+)\}/g, (fullMatch, aliasPath) => {
    const resolved = resolveSingleAlias(aliasPath, tokenMap, visitedTokens, resolveValue, fullMatch);
    if (typeof resolved === 'object' && resolved !== null) {
      console.warn(`Cannot inline complex object token "${aliasPath}" into string: "${text}"`);
      return fullMatch;
    }
    return String(resolved);
  });
}

/**
 * Resolves a single alias path against the token map with circular reference guard.
 */
function resolveSingleAlias(
  aliasPath: string,
  tokenMap: Map<string, TokenValueHolder>,
  visitedTokens: Set<string>,
  resolveValue: (value: unknown, visited: Set<string>) => any,
  fallback: any
): any {
  // Prevent infinite loops on circular references
  if (visitedTokens.has(aliasPath)) {
    return fallback;
  }

  const lookup = lookupTokenValue(aliasPath, tokenMap);
  if (!lookup.found) {
    return fallback;
  }

  const nextVisited = new Set(visitedTokens).add(aliasPath);
  return resolveValue(lookup.value, nextVisited);
}

/**
 * Looks up a token path in the map. Supports direct path matches as well as
 * sub-property access into object tokens (e.g. "typography.h1.fontSize").
 */
function lookupTokenValue(
  path: string,
  tokenMap: Map<string, TokenValueHolder>
): { found: true; value: any } | { found: false } {
  // Direct match
  const directToken = tokenMap.get(path);
  if (directToken) {
    return { found: true, value: directToken.value };
  }

  // Sub-property match (e.g. "typography.h1.fontSize" -> token "typography.h1" -> value.fontSize)
  const pathParts = path.split('.');
  for (let i = pathParts.length - 1; i > 0; i--) {
    const parentPath = pathParts.slice(0, i).join('.');
    const parentToken = tokenMap.get(parentPath);

    if (parentToken && typeof parentToken.value === 'object' && parentToken.value !== null) {
      const nestedProperties = pathParts.slice(i);
      let nestedValue = parentToken.value;
      let matched = true;

      for (const prop of nestedProperties) {
        if (nestedValue && typeof nestedValue === 'object' && prop in nestedValue) {
          nestedValue = nestedValue[prop];
        } else {
          matched = false;
          break;
        }
      }

      if (matched) {
        return { found: true, value: nestedValue };
      }
    }
  }

  return { found: false };
}

/**
 * Resolves all token aliases across active files and tracks overwritten duplicates.
 *
 * @param activeFileList List of active files in loading order.
 * @param fileMap Map of extracted tokens grouped by file name.
 * @param onDuplicatesFound Callback invoked with warning messages when token paths collide.
 * @returns An array of all flat tokens with resolved values.
 */
export function resolveAllFlatTokens(
  activeFileList: { name: string }[],
  fileMap: Map<string, ExtractedFileTokens>,
  onDuplicatesFound: (duplicates: string[]) => void
): FlatToken[] {
  const mergedTokens = new Map<string, FlatToken>();
  const duplicateWarnings: string[] = [];

  for (const file of activeFileList) {
    const fileData = fileMap.get(file.name);
    if (!fileData) continue;

    for (const token of fileData.tokens) {
      const existingToken = mergedTokens.get(token.path);
      if (existingToken) {
        duplicateWarnings.push(
          `Token "${token.path}" defined in "${existingToken.sourceFile}" was overwritten by "${file.name}"`
        );
      }

      mergedTokens.set(token.path, {
        ...token,
        sourceFile: file.name
      });
    }
  }

  const resolveAlias = createAliasResolver(mergedTokens);

  const resolvedTokens = Array.from(mergedTokens.values()).map(token => ({
    ...token,
    resolvedValue: resolveAlias(token.value)
  }));

  onDuplicatesFound(duplicateWarnings);

  return resolvedTokens;
}

/**
 * Resolves token aliases for a specific file, using all active tokens as resolution context.
 *
 * @param fileTokens Tokens from the target file.
 * @param contextTokens Available context tokens from active files.
 * @returns Tokens from the target file with resolved values.
 */
export function resolveFileFlatTokens(
  fileTokens: FlatToken[],
  contextTokens: FlatToken[]
): FlatToken[] {
  const lookupMap = new Map<string, FlatToken>();

  for (const token of contextTokens) {
    lookupMap.set(token.path, token);
  }
  for (const token of fileTokens) {
    lookupMap.set(token.path, token);
  }

  const resolveAlias = createAliasResolver(lookupMap);

  return fileTokens.map(token => ({
    ...token,
    resolvedValue: resolveAlias(token.value)
  }));
}
