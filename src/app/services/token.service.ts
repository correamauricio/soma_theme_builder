import { Injectable, signal, computed } from '@angular/core';
import { DesignToken, FlatToken, TokenFile, VariantGroup } from '../models/token.model';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private _files = signal<TokenFile[]>([]);
  files = this._files.asReadonly();
  
  private _activeFileName = signal<string>('semantics.json');
  activeFileName = this._activeFileName.asReadonly();
  
  private _selectedTokenPath = signal<string[] | null>(null);
  selectedTokenPath = this._selectedTokenPath.asReadonly();
  
  private _isJsonEditorOpen = signal<boolean>(true);
  isJsonEditorOpen = this._isJsonEditorOpen.asReadonly();
  
  private _duplicateTokensInfo = signal<string[]>([]);
  duplicateTokensInfo = this._duplicateTokensInfo.asReadonly();
  
  // Mapa de grupoId -> nomeDoArquivoAtivo
  private _selectedVariants = signal<Record<string, string>>({});
  selectedVariants = this._selectedVariants.asReadonly();
  
  // Arquivos desativados manualmente
  private _disabledFileNames = signal<Set<string>>(new Set());
  disabledFileNames = this._disabledFileNames.asReadonly();
  
  rawTokens = computed(() => {
    const activeName = this.activeFileName();
    const file = this.files().find(f => f.name === activeName);
    return file ? file.content : {};
  });

  // Extrai os caminhos de tokens de cada arquivo individualmente
  private fileTokenPaths = computed(() => {
    const allFiles = this.files();
    const map = new Map<string, { paths: Set<string>; tokens: FlatToken[] }>();

    for (const file of allFiles) {
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
  });

  // Identifica automaticamente grupos de variantes (arquivos que disputam os mesmos tokens)
  variantGroups = computed(() => {
    const fileMap = this.fileTokenPaths();
    const fileNames = Array.from(fileMap.keys());
    if (fileNames.length <= 1) return [];

    // Grafo de adjacência de colisões
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

    // Une arquivos que compartilham pelo menos 1 token
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

    // Agrupa por componente raiz
    const clusters: Record<string, string[]> = {};
    fileNames.forEach(f => {
      const root = find(f);
      if (!clusters[root]) clusters[root] = [];
      clusters[root].push(f);
    });

    const groups: VariantGroup[] = [];
    const selections = this.selectedVariants();
    let index = 1;

    for (const root of Object.keys(clusters)) {
      const members = clusters[root];
      if (members.length > 1) {
        const groupId = `group-${index++}`;
        const selected = selections[groupId] || members[0];
        groups.push({
          id: groupId,
          name: `Variante ${index - 1}`,
          files: members,
          activeFile: selected
        });
      }
    }

    return groups;
  });

  // Computa a lista final de arquivos ativos (Base + Ativos dos Grupos de Variantes)
  activeFiles = computed(() => {
    const allFiles = this.files();
    const groups = this.variantGroups();
    const disabled = this.disabledFileNames();
    
    // Arquivos que pertencem a algum grupo de variantes
    const variantFileNames = new Set<string>();
    const selectedVariantFiles = new Set<string>();

    for (const group of groups) {
      group.files.forEach(f => variantFileNames.add(f));
      if (group.activeFile) {
        selectedVariantFiles.add(group.activeFile);
      }
    }

    return allFiles.filter(f => {
      if (disabled.has(f.name)) return false;
      // Se é um arquivo de variante, só inclui se for o ativo do grupo
      if (variantFileNames.has(f.name)) {
        return selectedVariantFiles.has(f.name);
      }
      // Se não é variante, é arquivo base (sempre ativo se não desativado)
      return true;
    });
  });

  allFlatTokens = computed(() => {
    const activeFileList = this.activeFiles();
    const fileMap = this.fileTokenPaths();
    const flatMap = new Map<string, FlatToken>();
    const duplicates: string[] = [];

    for (const file of activeFileList) {
      const fileData = fileMap.get(file.name);
      if (!fileData) continue;

      for (const t of fileData.tokens) {
        // Se já existe, sobrepõe (comportamento de camada/overlay de tema)
        flatMap.set(t.path, {
          ...t,
          sourceFile: file.name
        });
      }
    }

    const resolveAlias = (val: string, visited: Set<string>): string => {
      const aliasMatch = val.match(/^\{([^}]+)\}$/);
      if (aliasMatch) {
        const aliasPath = aliasMatch[1];
        if (visited.has(aliasPath)) {
          return val;
        }
        
        const referencedToken = flatMap.get(aliasPath);
        if (referencedToken) {
           visited.add(aliasPath);
           return resolveAlias(referencedToken.value, visited);
        }
      }
      
      return val.replace(/\{([^}]+)\}/g, (match, path) => {
         if (visited.has(path)) {
           return match;
         }
         const referencedToken = flatMap.get(path);
         if (referencedToken) {
           visited.add(path);
           return resolveAlias(referencedToken.value, visited);
         }
         return match;
      });
    };

    const resolvedTokens = Array.from(flatMap.values()).map(t => {
       return {
         ...t,
         resolvedValue: resolveAlias(t.value, new Set<string>())
       };
    });

    setTimeout(() => {
       this._duplicateTokensInfo.set(duplicates);
    }, 0);

    return resolvedTokens;
  });

  flatTokens = computed(() => {
     const activeName = this.activeFileName();
     return this.allFlatTokens().filter(t => t.sourceFile === activeName);
  });

  cssVariables = computed(() => {
     let css = ':root {\n';
     for (const t of this.allFlatTokens()) {
        const cssVarName = `--${t.path.replace(/\./g, '-')}`;
        css += `  ${cssVarName}: ${t.resolvedValue};\n`;
     }
     css += '}\n';
     return css;
  });

  groupedTokens = computed(() => {
     const flat = this.flatTokens();
     const tree: any = {};
     
     for (const t of flat) {
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
  });

  constructor() {
    this.loadPreset();
  }

  loadPreset() {
    const primitives = {
      color: {
        blue: {
          500: { $value: "#3b82f6", $type: "color" },
          600: { $value: "#2563eb", $type: "color" }
        },
        white: { $value: "#ffffff", $type: "color" },
        gray: {
          100: { $value: "#f3f4f6", $type: "color" },
          500: { $value: "#6b7280", $type: "color" },
          900: { $value: "#111827", $type: "color" }
        }
      },
      spacing: {
        sm: { $value: "0.5rem", $type: "dimension" },
        md: { $value: "1rem", $type: "dimension" },
        lg: { $value: "1.5rem", $type: "dimension" },
        xl: { $value: "2rem", $type: "dimension" }
      },
      radii: {
        md: { $value: "0.375rem", $type: "dimension" },
        full: { $value: "9999px", $type: "dimension" }
      },
      typography: {
        fontFamily: {
          sans: { $value: "Inter, sans-serif", $type: "fontFamily" }
        }
      }
    };

    const semantics = {
      color: {
        primary: {
          main: { $value: "{color.blue.500}", $type: "color" },
          dark: { $value: "{color.blue.600}", $type: "color" }
        },
        background: {
          DEFAULT: { $value: "{color.white}", $type: "color" },
          muted: { $value: "{color.gray.100}", $type: "color" }
        },
        text: {
          main: { $value: "{color.gray.900}", $type: "color" },
          muted: { $value: "{color.gray.500}", $type: "color" },
          onPrimary: { $value: "{color.white}", $type: "color" }
        }
      }
    };

    const semanticsDark = {
      color: {
        background: {
          DEFAULT: { $value: "{color.gray.900}", $type: "color" },
          muted: { $value: "{color.gray.900}", $type: "color" }
        },
        text: {
          main: { $value: "{color.white}", $type: "color" },
          muted: { $value: "{color.gray.400}", $type: "color" },
          onPrimary: { $value: "{color.white}", $type: "color" }
        }
      }
    };
    
    this._files.set([
      { name: 'primitives.json', content: primitives },
      { name: 'semantics.json', content: semantics },
      { name: 'semantics-dark.json', content: semanticsDark }
    ]);
    this._activeFileName.set('semantics.json');
  }

  selectVariant(groupId: string, fileName: string) {
    this._selectedVariants.update(prev => ({
      ...prev,
      [groupId]: fileName
    }));
  }

  toggleFileDisabled(fileName: string) {
    this._disabledFileNames.update(prev => {
      const next = new Set(prev);
      if (next.has(fileName)) {
        next.delete(fileName);
      } else {
        next.add(fileName);
      }
      return next;
    });
  }
  
  updateTokenValue(path: string[], newValue: string) {
    const activeName = this.activeFileName();
    const currentFiles = this.files();
    const fileIndex = currentFiles.findIndex(f => f.name === activeName);
    
    if (fileIndex === -1) return;
    
    const fileContent = JSON.parse(JSON.stringify(currentFiles[fileIndex].content));
    let obj = fileContent;
    for (let i = 0; i < path.length - 1; i++) {
       if (!obj[path[i]]) obj[path[i]] = {};
       obj = obj[path[i]];
    }
    const lastKey = path[path.length - 1];
    if (obj[lastKey] && (obj[lastKey].$value !== undefined || obj[lastKey].value !== undefined)) {
       if (obj[lastKey].$value !== undefined) {
         obj[lastKey].$value = newValue;
       } else {
         obj[lastKey].value = newValue;
       }
    } else {
       obj[lastKey] = { $value: newValue };
    }
    
    const newFiles = [...currentFiles];
    newFiles[fileIndex] = { ...newFiles[fileIndex], content: fileContent };
    this._files.set(newFiles);
  }

  updateActiveFileContent(newContent: any) {
    const activeName = this.activeFileName();
    const currentFiles = this.files();
    const fileIndex = currentFiles.findIndex(f => f.name === activeName);
    if (fileIndex === -1) return;
    
    const newFiles = [...currentFiles];
    newFiles[fileIndex] = { ...newFiles[fileIndex], content: newContent };
    this._files.set(newFiles);
  }

  addFile(name: string, newTokens: any) {
    const currentFiles = this.files();
    
    const existingIndex = currentFiles.findIndex(f => f.name === name);
    if (existingIndex >= 0) {
       const newFiles = [...currentFiles];
       newFiles[existingIndex] = { name, content: newTokens };
       this._files.set(newFiles);
    } else {
       this._files.set([...currentFiles, { name, content: newTokens }]);
    }
    
    this._activeFileName.set(name);
  }

  // State Mutation Methods for External Use
  toggleJsonEditor() {
    this._isJsonEditorOpen.update(v => !v);
  }

  setJsonEditorOpen(isOpen: boolean) {
    this._isJsonEditorOpen.set(isOpen);
  }

  setActiveFileName(name: string) {
    this._activeFileName.set(name);
  }

  setSelectedTokenPath(path: string[] | null) {
    this._selectedTokenPath.set(path);
  }
}

