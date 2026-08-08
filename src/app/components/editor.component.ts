import { Component, computed, inject, signal, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TokenService } from '../services/token.service';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full bg-gray-900 border-r border-gray-800 text-gray-300 flex flex-col transition-all duration-300 overflow-hidden"
         [class.w-[26rem]]="tokenService.isJsonEditorOpen()"
         [class.w-0]="!tokenService.isJsonEditorOpen()"
         [class.border-r-0]="!tokenService.isJsonEditorOpen()">
         
      <!-- Header -->
      <div class="p-0 border-b border-gray-800 font-semibold bg-gray-900 z-10 sticky top-0 flex flex-col min-w-104">
        <div class="p-4 flex items-center justify-between border-b border-gray-800">
          <div class="flex items-center space-x-2 whitespace-nowrap">
            <svg class="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
            <span>Raw JSON</span>
          </div>
          <button class="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-800 transition-colors" (click)="tokenService.isJsonEditorOpen.set(false)" title="Hide JSON Editor">
             <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
      </div>
      
      <!-- Code Mode -->
      <div class="flex-1 flex flex-col p-0 overflow-hidden min-w-104">
        <div class="p-2 bg-gray-800 text-xs text-gray-400 font-mono border-b border-gray-700 flex justify-between items-center whitespace-nowrap">
          <span>design-tokens.json</span>
          <span class="text-red-400" *ngIf="jsonError()">Invalid JSON format</span>
          <span class="text-green-400" *ngIf="!jsonError() && isDirty()">Changes applied</span>
        </div>
        <textarea #jsonTextarea
          class="flex-1 w-full bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm p-4 focus:outline-none resize-none custom-scrollbar"
          [ngModel]="codeValue()"
          (ngModelChange)="onCodeChange($event)"
          spellcheck="false"
        ></textarea>
      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; border-radius: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4b5563; }
  `]
})
export class EditorComponent {
  tokenService = inject(TokenService);
  
  codeValue = signal<string>('');
  jsonError = signal<boolean>(false);
  isDirty = signal<boolean>(false);

  @ViewChild('jsonTextarea') jsonTextarea?: ElementRef<HTMLTextAreaElement>;

  constructor() {
    // Initial sync
    this.codeValue.set(JSON.stringify(this.tokenService.rawTokens(), null, 2));
    
    effect(() => {
      // Re-sync code when tokenService global state changes from elsewhere
      const currentRaw = this.tokenService.rawTokens();
      try {
         const currentParsed = JSON.parse(this.codeValue());
         if (JSON.stringify(currentParsed) !== JSON.stringify(currentRaw)) {
             this.codeValue.set(JSON.stringify(currentRaw, null, 2));
         }
      } catch (e) {
         if (this.codeValue() === '') {
             this.codeValue.set(JSON.stringify(currentRaw, null, 2));
         }
      }
    }, { allowSignalWrites: true });

    effect(() => {
      const token = this.selectedToken();
      const code = this.codeValue();
      const isOpen = this.tokenService.isJsonEditorOpen();
      
      if (isOpen && token && this.jsonTextarea?.nativeElement) {
         setTimeout(() => {
             const textarea = this.jsonTextarea!.nativeElement;
             const path = token.originalPath;
             
             let startIndex = 0;
             for (const key of path) {
                const match = code.indexOf(`"${key}":`, startIndex);
                if (match !== -1) {
                  startIndex = match;
                }
             }
             
             if (startIndex > 0) {
                 const textUpToToken = code.substring(0, startIndex);
                 const lines = textUpToToken.split('\n').length;
                 const lineHeight = 20; 
                 textarea.scrollTop = Math.max(0, (lines - 4) * lineHeight);
             }
         }, 10);
      }
    });
  }

  selectedToken = computed(() => {
    const path = this.tokenService.selectedTokenPath();
    if (!path) return null;
    const pathStr = path.join('.');
    return this.tokenService.flatTokens().find(t => t.path === pathStr) || null;
  });

  onCodeChange(val: string) {
    this.codeValue.set(val);
    try {
      const parsed = JSON.parse(val);
      this.jsonError.set(false);
      this.isDirty.set(true);
      this.tokenService.updateActiveFileContent(parsed);
      setTimeout(() => this.isDirty.set(false), 2000);
    } catch (err) {
      this.jsonError.set(true);
    }
  }
}
