import { FlatToken, TokenFile } from '../models/token.model';
import { inferTokenType } from './token-type-inference.util';

export interface ExtractedFileTokens {
  paths: Set<string>;
  tokens: FlatToken[];
}

/**
 * Extrai caminhos e tokens planos de múltiplos arquivos de design tokens.
 */
export function extractFileTokenPaths(files: TokenFile[]): Map<string, ExtractedFileTokens> {
  const fileTokenMap = new Map<string, ExtractedFileTokens>();

  for (const file of files) {
    fileTokenMap.set(file.name, extractTokensFromFile(file));
  }

  return fileTokenMap;
}

/**
 * Percorre recursivamente o conteúdo de um arquivo para extrair seus tokens.
 */
function extractTokensFromFile(file: TokenFile): ExtractedFileTokens {
  const paths = new Set<string>();
  const tokens: FlatToken[] = [];

  function traverse(node: unknown, currentPath: string[], inheritedType?: string): void {
    if (!node || typeof node !== 'object') {
      return;
    }

    const tokenNode = node as Record<string, any>;

    const explicitType = tokenNode['$type'] ?? tokenNode['type'];
    const currentGroupType = explicitType ?? inheritedType;
    const isToken = tokenNode['$value'] !== undefined || tokenNode['value'] !== undefined || tokenNode['val'] !== undefined;

    if (isToken) {
      const value = tokenNode['$value'] ?? tokenNode['value'] ?? tokenNode['val'];
      const tokenType = explicitType ?? inheritedType ?? inferTokenType(value);
      const tokenPath = typeof tokenNode['path'] === 'string' ? tokenNode['path'] : currentPath.join('.');

      paths.add(tokenPath);
      tokens.push({
        path: tokenPath,
        originalPath: currentPath,
        value,
        resolvedValue: value,
        type: tokenType,
        originalType: explicitType,
        description: tokenNode['$description'] ?? tokenNode['description'],
        extensions: tokenNode['$extensions'] ?? tokenNode['extensions'],
        sourceFile: file.name
      });
      return;
    }

    // É um grupo: percorre os nós filhos ignorando propriedades de metadados ($ ou @)
    for (const key of Object.keys(tokenNode)) {
      if (!isMetadataKey(key)) {
        traverse(tokenNode[key], [...currentPath, key], currentGroupType);
      }
    }
  }

  traverse(file.content, []);

  return { paths, tokens };
}

function isMetadataKey(key: string): boolean {
  return key.startsWith('$') || key.startsWith('@');
}

