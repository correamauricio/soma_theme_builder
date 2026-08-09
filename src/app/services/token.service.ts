import { Injectable, computed, inject } from '@angular/core';
import { TokenStateService } from './token-state.service';
import { extractFileTokenPaths, resolveAllFlatTokens, buildGroupedTokens } from '../utils/token-parser.util';
import { detectVariantGroups, computeActiveFiles } from '../utils/variant-detection.util';
import { generateCssVariables } from '../utils/css-generator.util';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private state = inject(TokenStateService);

  // Expose state as read-only from the state service
  files = this.state.files;
  activeFileName = this.state.activeFileName;
  selectedTokenPath = this.state.selectedTokenPath;
  isJsonEditorOpen = this.state.isJsonEditorOpen;
  duplicateTokensInfo = this.state.duplicateTokensInfo;
  selectedVariants = this.state.selectedVariants;
  disabledFileNames = this.state.disabledFileNames;

  // Computed Values using Pure Functions (Utils)
  rawTokens = computed(() => {
    const activeName = this.activeFileName();
    const file = this.files().find(f => f.name === activeName);
    return file ? file.content : {};
  });

  private fileTokenPaths = computed(() => {
    return extractFileTokenPaths(this.files());
  });

  variantGroups = computed(() => {
    return detectVariantGroups(this.fileTokenPaths(), this.selectedVariants());
  });

  activeFiles = computed(() => {
    return computeActiveFiles(this.files(), this.variantGroups(), this.disabledFileNames());
  });

  allFlatTokens = computed(() => {
    return resolveAllFlatTokens(
      this.activeFiles(), 
      this.fileTokenPaths(),
      (duplicates: string[]) => {
         setTimeout(() => {
            this.state.setDuplicateTokensInfo(duplicates);
         }, 0);
      }
    );
  });

  flatTokens = computed(() => {
     const activeName = this.activeFileName();
     return this.allFlatTokens().filter(t => t.sourceFile === activeName);
  });

  cssVariables = computed(() => {
     return generateCssVariables(this.allFlatTokens());
  });

  groupedTokens = computed(() => {
     return buildGroupedTokens(this.flatTokens());
  });

  // Facade Methods for Mutations (delegating to TokenStateService)
  selectVariant(groupId: string, fileName: string) {
    this.state.selectVariant(groupId, fileName);
  }

  toggleFileDisabled(fileName: string) {
    this.state.toggleFileDisabled(fileName);
  }

  updateTokenValue(path: string[], newValue: string) {
    this.state.updateTokenValue(path, newValue);
  }

  updateActiveFileContent(newContent: any) {
    this.state.updateActiveFileContent(newContent);
  }

  addFile(name: string, newTokens: any) {
    this.state.addFile(name, newTokens);
  }

  toggleJsonEditor() {
    this.state.toggleJsonEditor();
  }

  setJsonEditorOpen(isOpen: boolean) {
    this.state.setJsonEditorOpen(isOpen);
  }

  setActiveFileName(name: string) {
    this.state.setActiveFileName(name);
  }

  setSelectedTokenPath(path: string[] | null) {
    this.state.setSelectedTokenPath(path);
  }
}
