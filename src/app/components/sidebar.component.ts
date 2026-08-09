import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TokenService } from '../services/token.service';
import { FlatToken } from '../models/token.model';
import { AliasAutocompleteComponent } from './alias-autocomplete.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, AliasAutocompleteComponent],
  template: `
    <aside class="w-80 h-full bg-gray-900 border-r border-gray-800 flex flex-col text-gray-300">
      <div class="p-4 border-b border-gray-800 font-semibold flex items-center justify-between bg-gray-900 z-10 sticky top-0">
        <div class="flex items-center space-x-2">
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
          <span>Design Tokens</span>
        </div>
        
        <button 
          (click)="tokenService.toggleJsonEditor()"
          [title]="tokenService.isJsonEditorOpen() ? 'Hide Raw JSON Editor' : 'Show Raw JSON Editor'"
          class="flex items-center space-x-1.5 px-2 py-1 rounded text-xs font-mono transition-all duration-200 border cursor-pointer"
          [class.bg-blue-600]="tokenService.isJsonEditorOpen()"
          [class.text-white]="tokenService.isJsonEditorOpen()"
          [class.border-blue-500]="tokenService.isJsonEditorOpen()"
          [class.shadow-md]="tokenService.isJsonEditorOpen()"
          [class.bg-gray-800]="!tokenService.isJsonEditorOpen()"
          [class.text-gray-400]="!tokenService.isJsonEditorOpen()"
          [class.border-gray-700]="!tokenService.isJsonEditorOpen()"
          [class.hover:text-gray-200]="!tokenService.isJsonEditorOpen()"
          [class.hover:border-gray-600]="!tokenService.isJsonEditorOpen()">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
          </svg>
          <span>JSON</span>
        </button>
      </div>
      <div class="px-4 py-2 border-b border-gray-800 bg-gray-900 z-10 sticky top-16.25 flex items-center space-x-2">
         <span class="text-xs text-gray-500 font-medium">File:</span>
         <select class="flex-1 bg-gray-800 text-sm text-gray-300 border border-gray-700 rounded p-1 outline-none focus:border-blue-500"
                 [ngModel]="tokenService.activeFileName()"
                 (ngModelChange)="onFileSelect($event)">
            <option *ngFor="let file of tokenService.files()" [value]="file.name">{{ file.name }}</option>
         </select>
      </div>
      <div class="flex-1 overflow-y-auto custom-scrollbar p-2">
        <ng-container *ngTemplateOutlet="treeNode; context: { $implicit: tokenService.groupedTokens() }"></ng-container>
      </div>
    </aside>

    <ng-template #treeNode let-node>
      <div class="pl-3 border-l border-gray-800 ml-2 mt-1">
        <ng-container *ngFor="let key of getKeys(node)">
          
          <!-- Token Leaf -->
          <div *ngIf="isToken(node, key)" 
               class="group flex flex-col py-2 px-2 mt-1 hover:bg-gray-800 rounded-md text-sm transition-all border border-transparent"
               [class.!bg-gray-800]="isSelected(node, key)"
               [class.!border-gray-700]="isSelected(node, key)"
               (click)="selectToken(node, key)">
            <div class="flex items-center justify-between mb-1">
              <span class="font-medium font-mono text-gray-200" [class.text-blue-400]="isSelected(node, key)">{{ key }}</span>
              <span *ngIf="isAlias(node[key]._token.value)" class="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 font-mono border border-blue-800 flex items-center space-x-1" title="Linked to {{ node[key]._token.value }}">
                <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101"></path></svg>
                <span>alias</span>
              </span>
            </div>
            
            <div class="flex items-center space-x-2">
              <app-alias-autocomplete
                [value]="node[key]._token.value"
                [currentPath]="node[key]._token.path"
                (valueChange)="updateToken(node, key, $event)"
              ></app-alias-autocomplete>
              
              <div *ngIf="node[key]._token.type === 'color'" class="relative w-5 h-5 rounded-full overflow-hidden border border-gray-600 shadow-sm shrink-0" title="Click color picker to set HEX color (unlinks alias)">
                 <input type="color" 
                        [ngModel]="getColorPickerHex(node[key]._token)"
                        (ngModelChange)="onColorPickerChange(node, key, $event)"
                        class="absolute -top-2 -left-2 w-10 h-10 cursor-pointer">
              </div>
            </div>
          </div>
          
          <!-- Token Group -->
          <div *ngIf="!isToken(node, key)" class="mt-2">
            <div class="py-1 px-2 font-bold text-gray-500 text-[10px] uppercase tracking-widest flex items-center space-x-1">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
              <span>{{ key }}</span>
            </div>
            <ng-container *ngTemplateOutlet="treeNode; context: { $implicit: node[key] }"></ng-container>
          </div>
          
        </ng-container>
      </div>
    </ng-template>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; border-radius: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4b5563; }
  `]
})
export class SidebarComponent {
  tokenService = inject(TokenService);

  onFileSelect(fileName: string) {
    this.tokenService.setActiveFileName(fileName);
  }

  getKeys(node: any) {
    return Object.keys(node || {}).filter(k => k !== '_token');
  }
  
  isToken(node: any, key: string) {
    return !!node[key]?._token;
  }
  
  isSelected(node: any, key: string) {
    const selected = this.tokenService.selectedTokenPath();
    if (!selected) return false;
    return node[key]._token.originalPath.join('.') === selected.join('.');
  }
  
  selectToken(node: any, key: string) {
    this.tokenService.setSelectedTokenPath(node[key]._token.originalPath);
  }

  updateToken(node: any, key: string, val: string) {
    const path = node[key]._token.originalPath;
    this.tokenService.updateTokenValue(path, val);
  }

  isAlias(val: string): boolean {
    return !!val && /^\{[^}]+\}$/.test(val.trim());
  }

  isHex(val: string): boolean {
    return !!val && val.startsWith('#') && (val.length === 4 || val.length === 7);
  }

  formatToHex(val: string): string {
    if (!val) return '#000000';
    if (val.startsWith('#')) {
      if (val.length === 4) {
        return '#' + val[1] + val[1] + val[2] + val[2] + val[3] + val[3];
      }
      if (val.length === 7) return val;
    }
    return '#000000';
  }

  getColorPickerHex(token: FlatToken): string {
    if (this.isHex(token.value)) {
      return this.formatToHex(token.value);
    }
    if (this.isHex(token.resolvedValue)) {
      return this.formatToHex(token.resolvedValue);
    }
    return '#000000';
  }

  onColorPickerChange(node: any, key: string, hexValue: string) {
    const formattedHex = this.formatToHex(hexValue);
    this.updateToken(node, key, formattedHex);
  }
}
