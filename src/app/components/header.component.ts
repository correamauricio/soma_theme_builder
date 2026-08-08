import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TokenService } from '../services/token.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col w-full">
      <header class="bg-gray-900 text-white p-4 flex justify-between items-center shadow-md z-20">
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 rounded bg-blue-500 flex items-center justify-center font-bold text-white">D</div>
          <h1 class="text-xl font-bold tracking-wider">DTCG Forge</h1>
        </div>
        
        <div class="flex space-x-3">
          <label class="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded cursor-pointer transition-colors text-sm font-medium">
            Import Tokens
            <input type="file" multiple accept=".json" class="hidden" (change)="onImport($event)">
          </label>
          
          <button (click)="onExport()" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded transition-colors text-sm font-medium">
            Export JSON
          </button>
        </div>
      </header>

      <!-- Barra de Variantes Detectadas -->
      <div *ngIf="tokenService.variantGroups().length > 0" class="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center space-x-4 z-10 text-xs overflow-x-auto shadow-inner">
         <div class="flex items-center space-x-1.5 text-gray-400 font-semibold uppercase tracking-wider shrink-0">
           <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
           <span>Variantes Detectadas:</span>
         </div>
       
         <div *ngFor="let group of tokenService.variantGroups()" class="flex items-center space-x-1 bg-gray-900 border border-gray-700 rounded-lg p-1">
           <button *ngFor="let fileName of group.files"
                   (click)="tokenService.selectVariant(group.id, fileName)"
                   class="px-2.5 py-1 rounded text-xs font-medium transition-all duration-150 cursor-pointer"
                   [class.bg-blue-600]="group.activeFile === fileName"
                   [class.text-white]="group.activeFile === fileName"
                   [class.shadow]="group.activeFile === fileName"
                   [class.text-gray-400]="group.activeFile !== fileName"
                   [class.hover:text-gray-200]="group.activeFile !== fileName">
             {{ fileName }}
           </button>
         </div>
      </div>

      <div *ngIf="tokenService.duplicateTokensInfo().length > 0" class="bg-red-900 text-white px-4 py-2 text-sm z-10 flex flex-col space-y-1">
         <div class="font-bold flex items-center space-x-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            <span>Atenção: Conflito de Tokens</span>
         </div>
         <ul class="list-disc pl-5">
           <li *ngFor="let msg of tokenService.duplicateTokensInfo()">{{ msg }}</li>
         </ul>
      </div>
    </div>
  `
})
export class HeaderComponent {
  tokenService = inject(TokenService);

  onImport(event: any) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const json = JSON.parse(e.target.result);
          this.tokenService.addFile(file.name, json);
        } catch (err) {
          console.error('Failed to parse JSON', err);
          alert('Invalid JSON file.');
        }
      };
      reader.readAsText(file);
    }
  }

  onExport() {
    const duplicates = this.tokenService.duplicateTokensInfo();
    if (duplicates.length > 0) {
      alert("Aviso: Existem tokens duplicados em seus arquivos. Verifique o alerta no topo da tela antes de exportar.");
    }

    const files = this.tokenService.files();
    if (files.length === 0) return;

    for (const file of files) {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(file.content, null, 2));
      const dlAnchorElem = document.createElement('a');
      dlAnchorElem.setAttribute("href", dataStr);
      dlAnchorElem.setAttribute("download", file.name || "design-tokens.json");
      dlAnchorElem.click();
      dlAnchorElem.remove();
    }
  }
}
