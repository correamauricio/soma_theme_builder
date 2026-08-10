import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TokenService } from '../services/token.service';
import { TokenNodeComponent } from './token-node.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, TokenNodeComponent],
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
        <app-token-node
          [node]="tokenService.groupedTokens()"
          [selectedPath]="tokenService.selectedTokenPath()"
          (selectToken)="onSelectToken($event)"
          (updateToken)="onUpdateToken($event)">
        </app-token-node>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  tokenService = inject(TokenService);

  onFileSelect(fileName: string) {
    this.tokenService.setActiveFileName(fileName);
  }

  onSelectToken(event: { path: string[] }) {
    this.tokenService.setSelectedTokenPath(event.path);
  }

  onUpdateToken(event: { path: string[], value: string }) {
    this.tokenService.updateTokenValue(event.path, event.value);
  }
}
