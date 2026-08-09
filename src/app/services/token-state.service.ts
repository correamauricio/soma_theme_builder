import { Injectable, signal } from '@angular/core';
import { TokenFile } from '../models/token.model';

@Injectable({
  providedIn: 'root'
})
export class TokenStateService {
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
  
  private _selectedVariants = signal<Record<string, string>>({});
  selectedVariants = this._selectedVariants.asReadonly();
  
  private _disabledFileNames = signal<Set<string>>(new Set());
  disabledFileNames = this._disabledFileNames.asReadonly();

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

  setDuplicateTokensInfo(duplicates: string[]) {
    this._duplicateTokensInfo.set(duplicates);
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
