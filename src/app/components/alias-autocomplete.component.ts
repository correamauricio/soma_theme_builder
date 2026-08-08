import { Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TokenService, FlatToken } from '../services/token.service';

@Component({
  selector: 'app-alias-autocomplete',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="relative w-full flex-1" #containerRef>
      <input
        #inputRef
        type="text"
        [ngModel]="value"
        (ngModelChange)="onInputChange($event)"
        (focus)="onFocus()"
        (keydown)="onKeyDown($event)"
        placeholder="Value or {alias}"
        class="w-full bg-transparent border border-transparent hover:border-gray-600 focus:border-blue-500 focus:bg-gray-900 rounded px-1.5 py-1 text-xs font-mono text-gray-300 focus:text-white outline-none transition-all min-w-0"
      />

      <!-- Custom Autocomplete Dropdown (Fixed positioning with highest z-index so it is never clipped) -->
      <div
        *ngIf="isOpen() && matchingTokens().length > 0"
        class="fixed max-h-56 bg-gray-900 border border-gray-700 rounded-md shadow-2xl overflow-y-auto z-99999 custom-scrollbar py-1"
        [style.top]="dropdownPosition().top"
        [style.left]="dropdownPosition().left"
        [style.width]="dropdownPosition().width"
      >
        <div class="px-2 py-1 text-[10px] uppercase tracking-wider text-gray-400 font-semibold border-b border-gray-800 flex justify-between items-center sticky top-0 bg-gray-900 z-10">
          <span>Alias Suggestions</span>
          <span class="text-blue-400 font-normal lowercase">{{ matchingTokens().length }} available</span>
        </div>

        <button
          *ngFor="let token of matchingTokens(); let i = index"
          type="button"
          (click)="selectToken(token)"
          (mouseenter)="selectedIndex.set(i)"
          class="w-full px-2.5 py-1.5 text-left text-xs flex items-center justify-between space-x-2 transition-colors cursor-pointer"
          [class.bg-blue-600]="i === selectedIndex()"
          [class.text-white]="i === selectedIndex()"
          [class.text-gray-300]="i !== selectedIndex()"
          [class.hover:bg-gray-800]="i !== selectedIndex()"
        >
          <div class="flex items-center space-x-2 truncate">
            <!-- Color preview swatch if type is color -->
            <span
              *ngIf="token.type === 'color'"
              class="w-3.5 h-3.5 rounded-full border border-gray-600 shrink-0 shadow-sm"
              [style.background-color]="token.resolvedValue"
            ></span>
            <div class="flex flex-col truncate">
              <span class="font-mono font-medium truncate">{{ token.path }}</span>
              <div class="flex items-center space-x-1">
                <span class="text-[10px] opacity-75 font-mono truncate font-light">{{ '{' + token.path + '}' }}</span>
                <span class="text-[9px] px-1 py-0.5 bg-gray-800 text-gray-400 rounded-sm">{{ token.sourceFile }}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center space-x-1 shrink-0">
            <span
              class="px-1 py-0.5 text-[9px] rounded font-mono uppercase font-semibold"
              [class.bg-blue-950]="i !== selectedIndex()"
              [class.text-blue-300]="i !== selectedIndex()"
              [class.bg-blue-800]="i === selectedIndex()"
              [class.text-white]="i === selectedIndex()"
            >
              {{ token.type }}
            </span>
          </div>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 5px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: #111827; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; border-radius: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4b5563; }
  `]
})
export class AliasAutocompleteComponent {
  tokenService = inject(TokenService);

  @Input() value: string = '';
  @Input() currentPath: string = '';
  @Output() valueChange = new EventEmitter<string>();

  @ViewChild('containerRef') containerRef?: ElementRef<HTMLElement>;
  @ViewChild('inputRef') inputRef?: ElementRef<HTMLInputElement>;

  isOpen = signal<boolean>(false);
  filterQuery = signal<string>('');
  selectedIndex = signal<number>(0);

  dropdownPosition = signal<{ top: string; left: string; width: string }>({
    top: '0px',
    left: '0px',
    width: '256px'
  });

  matchingTokens = computed(() => {
    const all = this.tokenService.allFlatTokens();
    const query = this.filterQuery().toLowerCase().trim();
    const current = this.currentPath;

    const available = all.filter(t => t.path !== current);

    if (!query) {
      return available.slice(0, 15);
    }

    const cleanQuery = query.replace(/^\{|\}$/g, '');

    return available.filter(t => {
      const matchPath = t.path.toLowerCase().includes(cleanQuery);
      const matchAlias = (`{${t.path.toLowerCase()}}`).includes(query);
      const matchValue = String(t.value).toLowerCase().includes(cleanQuery);
      return matchPath || matchAlias || matchValue;
    }).slice(0, 15);
  });

  updateDropdownPosition() {
    if (this.inputRef?.nativeElement) {
      const rect = this.inputRef.nativeElement.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = 224; // ~ max-h-56

      let top = rect.bottom + 4;
      if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
        top = rect.top - dropdownHeight - 4;
      }

      this.dropdownPosition.set({
        top: `${top}px`,
        left: `${rect.left}px`,
        width: `${Math.max(256, rect.width)}px`
      });
    }
  }

  onInputChange(val: string) {
    this.value = val;
    this.valueChange.emit(val);
    this.extractQuery(val);
    this.isOpen.set(true);
    this.selectedIndex.set(0);
    setTimeout(() => this.updateDropdownPosition(), 0);
  }

  onFocus() {
    this.extractQuery(this.value);
    this.isOpen.set(true);
    this.selectedIndex.set(0);
    setTimeout(() => this.updateDropdownPosition(), 0);
  }

  private extractQuery(val: string) {
    if (val.includes('{')) {
      const match = val.match(/\{([^}]*)$/);
      if (match) {
        this.filterQuery.set(match[1]);
        return;
      }
    }
    this.filterQuery.set(val);
  }

  selectToken(token: FlatToken) {
    const aliasValue = `{${token.path}}`;
    this.value = aliasValue;
    this.valueChange.emit(aliasValue);
    this.isOpen.set(false);
  }

  onKeyDown(event: KeyboardEvent) {
    if (!this.isOpen() || this.matchingTokens().length === 0) {
      if (event.key === 'ArrowDown' || event.key === '{') {
        this.isOpen.set(true);
        setTimeout(() => this.updateDropdownPosition(), 0);
      }
      return;
    }

    const maxIndex = this.matchingTokens().length - 1;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedIndex.update(idx => (idx < maxIndex ? idx + 1 : 0));
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex.update(idx => (idx > 0 ? idx - 1 : maxIndex));
        break;

      case 'Enter':
        event.preventDefault();
        const selected = this.matchingTokens()[this.selectedIndex()];
        if (selected) {
          this.selectToken(selected);
        }
        break;

      case 'Escape':
        event.preventDefault();
        this.isOpen.set(false);
        break;

      case 'Tab':
        this.isOpen.set(false);
        break;
    }
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  @HostListener('document:scroll')
  onScrollOrResize() {
    if (this.isOpen()) {
      this.updateDropdownPosition();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.containerRef && !this.containerRef.nativeElement.contains(event.target as Node)) {
      this.isOpen.set(false);
    }
  }
}
