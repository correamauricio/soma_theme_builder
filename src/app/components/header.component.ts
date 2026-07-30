import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TokenService } from '../services/token.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="bg-gray-900 text-white p-4 flex justify-between items-center shadow-md">
      <div class="flex items-center space-x-3">
        <div class="w-8 h-8 rounded bg-blue-500 flex items-center justify-center font-bold text-white">S</div>
        <h1 class="text-xl font-bold tracking-wider">Soma Theme Builder</h1>
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
          this.tokenService.mergeTokens(json);
        } catch (err) {
          console.error('Failed to parse JSON', err);
          alert('Invalid JSON file.');
        }
      };
      reader.readAsText(file);
    }
  }

  onExport() {
    const tokens = this.tokenService.rawTokens();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tokens, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "design-tokens.json");
    dlAnchorElem.click();
    dlAnchorElem.remove();
  }
}
