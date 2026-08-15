import { Injectable, computed, inject } from '@angular/core';
import { TokenStateService } from './token-state.service';
import { extractFileTokenPaths, resolveAllFlatTokens, resolveFileFlatTokens, buildGroupedTokens } from '../utils/token-parser.util';
import { detectVariantGroups, computeActiveFiles } from '../utils/variant-detection.util';
import { generateCssVariables } from '../utils/css-generator.util';
import { HistoryService } from './history.service';
import { StateChangeCommand } from '../commands/state-change.command';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private state = inject(TokenStateService);
  private history = inject(HistoryService);

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
     const fileTokens = this.fileTokenPaths().get(activeName)?.tokens || [];
     return resolveFileFlatTokens(fileTokens, this.allFlatTokens());
  });

  cssVariables = computed(() => {
     return generateCssVariables(this.allFlatTokens());
  });

  groupedTokens = computed(() => {
     return buildGroupedTokens(this.flatTokens());
  });

  // Facade Methods for Mutations (delegating to TokenStateService and HistoryService)
  selectVariant(groupId: string, fileName: string) {
    const command = new StateChangeCommand(this.state, () => {
      this.state.selectVariant(groupId, fileName);
    });
    this.history.execute(command);
  }

  toggleFileDisabled(fileName: string) {
    const command = new StateChangeCommand(this.state, () => {
      this.state.toggleFileDisabled(fileName);
    });
    this.history.execute(command);
  }

  updateTokenValue(path: string[], newValue: string) {
    const command = new StateChangeCommand(this.state, () => {
      this.state.updateTokenValue(path, newValue);
    });
    this.history.execute(command);
  }

  updateActiveFileContent(newContent: any) {
    const command = new StateChangeCommand(this.state, () => {
      this.state.updateActiveFileContent(newContent);
    });
    this.history.execute(command);
  }

  addFile(name: string, newTokens: any) {
    const command = new StateChangeCommand(this.state, () => {
      this.state.addFile(name, newTokens);
    });
    this.history.execute(command);
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
