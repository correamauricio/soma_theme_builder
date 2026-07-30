import { Injectable, signal, computed } from '@angular/core';

export interface DesignToken {
  $value?: string | number;
  value?: string | number;
  $type?: string;
  type?: string;
  [key: string]: any;
}

export interface FlatToken {
  path: string;
  originalPath: string[]; // e.g. ['color', 'primary', '500']
  value: string;
  resolvedValue: string;
  type: string;
}

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  rawTokens = signal<any>({});
  selectedTokenPath = signal<string[] | null>(null);
  isJsonEditorOpen = signal<boolean>(true);
  
  // Computed flat token list for easy rendering and CSS variable generation
  flatTokens = computed(() => {
    const raw = this.rawTokens();
    if (!raw) return [];
    
    const flatMap = new Map<string, FlatToken>();
    
    const extractTokens = (obj: any, path: string[]) => {
      if (!obj || typeof obj !== 'object') return;
      
      // Is it a token? (W3C standard says it has $value or value)
      if (obj.$value !== undefined || obj.value !== undefined) {
        const value = String(obj.$value !== undefined ? obj.$value : obj.value);
        const type = String(obj.$type !== undefined ? obj.$type : (obj.type || 'unknown'));
        
        const pathStr = path.join('.');
        flatMap.set(pathStr, {
          path: pathStr,
          originalPath: path,
          value,
          resolvedValue: value, // will resolve later
          type
        });
      } else {
        // It's a group, iterate keys
        for (const key of Object.keys(obj)) {
          if (!key.startsWith('$') && !key.startsWith('@')) {
             extractTokens(obj[key], [...path, key]);
          }
        }
      }
    };
    
    extractTokens(raw, []);
    
    // Resolve aliases
    const resolveAlias = (val: string, visited: Set<string>): string => {
      // First check for direct full match e.g. "{color.primary}"
      const aliasMatch = val.match(/^\{([^}]+)\}$/);
      if (aliasMatch) {
        const aliasPath = aliasMatch[1];
        if (visited.has(aliasPath)) {
          console.warn(`Circular dependency detected: ${aliasPath}`);
          return val;
        }
        
        const referencedToken = flatMap.get(aliasPath);
        if (referencedToken) {
           visited.add(aliasPath);
           return resolveAlias(referencedToken.value, visited);
        }
      }
      
      // Then check for composite values e.g. "1px solid {color.border}"
      return val.replace(/\{([^}]+)\}/g, (match, path) => {
         if (visited.has(path)) {
           console.warn(`Circular dependency detected: ${path}`);
           return match;
         }
         const referencedToken = flatMap.get(path);
         if (referencedToken) {
           visited.add(path);
           return resolveAlias(referencedToken.value, visited);
         }
         return match; // unresolved
      });
    };
    
    const resolvedTokens = Array.from(flatMap.values()).map(t => {
       return {
         ...t,
         resolvedValue: resolveAlias(t.value, new Set<string>())
       };
    });
    
    return resolvedTokens;
  });

  // Generate CSS Variables string
  cssVariables = computed(() => {
     let css = ':root {\n';
     for (const t of this.flatTokens()) {
        // Replace dots and spaces with hyphens to create valid CSS custom properties
        const cssVarName = `--${t.path.replace(/\./g, '-')}`;
        css += `  ${cssVarName}: ${t.resolvedValue};\n`;
     }
     css += '}\n';
     return css;
  });

  // Group tokens for tree view
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
    this.rawTokens.set({
      color: {
        primary: {
          500: { $value: "#3b82f6", $type: "color" },
          600: { $value: "#2563eb", $type: "color" }
        },
        brand: {
          main: { $value: "{color.primary.500}", $type: "color" }
        },
        background: {
          DEFAULT: { $value: "#ffffff", $type: "color" },
          muted: { $value: "#f3f4f6", $type: "color" }
        },
        text: {
          main: { $value: "#111827", $type: "color" },
          muted: { $value: "#6b7280", $type: "color" },
          onPrimary: { $value: "#ffffff", $type: "color" }
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
    });
  }
  
  updateTokenValue(path: string[], newValue: string) {
    const current = JSON.parse(JSON.stringify(this.rawTokens()));
    let obj = current;
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
    
    this.rawTokens.set(current);
  }

  mergeTokens(newTokens: any) {
    const current = JSON.parse(JSON.stringify(this.rawTokens()));
    
    const deepMerge = (target: any, source: any) => {
       for (const key of Object.keys(source)) {
          if (source[key] instanceof Object && key in target) {
             Object.assign(source[key], deepMerge(target[key], source[key]));
          } else {
             target[key] = source[key];
          }
       }
       return target;
    };
    
    const merged = deepMerge(current, newTokens);
    this.rawTokens.set(merged);
  }
}
