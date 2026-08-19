import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TokenService } from '../services/token.service';
import { FlatToken } from '../models/token.model';
import { OverlayModule } from '@angular/cdk/overlay';
import { PopoverComponent } from './ui/popover.component';

@Component({
  selector: 'app-alias-autocomplete',
  standalone: true,
  imports: [CommonModule, FormsModule, OverlayModule, PopoverComponent],
  template: `
    <div class="relative w-full flex-1" cdkOverlayOrigin #trigger="cdkOverlayOrigin">
      <input
        #inputRef
        type="text"
        [ngModel]="value"
        (ngModelChange)="onInputChange($event)"
        (focus)="onFocus()"
        (blur)="onBlur()"
        (keydown)="onKeyDown($event)"
        (click)="onInputClick($event)"
        placeholder="Value or {alias}"
        class="w-full bg-transparent border border-transparent hover:border-gray-600 focus:border-blue-500 focus:bg-gray-900 rounded px-1.5 py-1 text-xs font-mono text-gray-300 focus:text-white outline-none transition-all min-w-0"
      />

      <app-popover
        [triggerOrigin]="trigger"
        [isOpen]="isOpen() && matchingTokens().length > 0"
        width="100%"
        (closed)="onPopoverClosed($event)"
      >
        <div class="max-h-56 bg-gray-900 border border-gray-700 rounded-md shadow-2xl overflow-y-auto custom-scrollbar py-1">
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
      </app-popover>
    </div>
  `
})
export class AliasAutocompleteComponent {
  tokenService = inject(TokenService);

  @Input() value: string = '';
  @Input() currentPath: string = '';
  @Output() valueChange = new EventEmitter<string>();
  @Output() valueCommit = new EventEmitter<string>();

  @ViewChild('inputRef') inputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('containerRef') containerRef?: ElementRef<HTMLElement>;

  isOpen = signal<boolean>(false);
  filterQuery = signal<string>('');
  selectedIndex = signal<number>(0);

  matchingTokens = computed(() => {
    const all = this.tokenService.allFlatTokens();
    const query = this.filterQuery().toLowerCase().trim();
    const current = this.currentPath;

    const expandedTokens: any[] = [];
    for (const t of all) {
      if (t.path === current) continue;
      
      expandedTokens.push({
        path: t.path,
        type: t.type,
        resolvedValue: t.resolvedValue,
        sourceFile: t.sourceFile,
        isSubMember: false
      });

      if (t.value && typeof t.value === 'object' && !Array.isArray(t.value)) {
        const explore = (obj: any, prefix: string) => {
          for (const key of Object.keys(obj)) {
            const val = obj[key];
            const subPath = `${prefix}.${key}`;
            if (val && typeof val === 'object' && !Array.isArray(val)) {
              explore(val, subPath);
            } else {
              expandedTokens.push({
                path: subPath,
                type: 'sub-prop',
                resolvedValue: val,
                sourceFile: t.sourceFile,
                isSubMember: true
              });
            }
          }
        };
        explore(t.value, t.path);
      }
    }

    if (!query) {
      return expandedTokens.slice(0, 15);
    }

    const cleanQuery = query.replace(/^\{|\}$/g, '');

    const filtered = expandedTokens.filter(t => {
      const matchPath = t.path.toLowerCase().includes(cleanQuery);
      const matchAlias = (`{${t.path.toLowerCase()}}`).includes(query);
      const matchValue = String(t.resolvedValue).toLowerCase().includes(cleanQuery);
      return matchPath || matchAlias || matchValue;
    }).slice(0, 15);

    if (query) {
      filtered.unshift({
        path: query,
        type: 'custom',
        resolvedValue: query,
        sourceFile: 'custom',
        isSubMember: false
      });
    }

    return filtered;
  });

  onInputChange(val: string) {
    this.value = val;
    this.valueChange.emit(val);
    this.extractQuery(val);
    this.isOpen.set(true);
    this.selectedIndex.set(0);
  }

  onFocus() {
    this.extractQuery(this.value);
    this.isOpen.set(true);
    this.selectedIndex.set(0);
  }

  onBlur() {
    this.valueCommit.emit(this.value);
  }

  onInputClick(event: MouseEvent) {
    const input = event.target as HTMLInputElement;
    if (input) {
      input.select();
    }
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

  selectToken(token: any) {
    let finalValue = token.path;
    if (token.type !== 'custom') {
      finalValue = `{${token.path}}`;
    }
    this.value = finalValue;
    this.valueChange.emit(finalValue);
    this.valueCommit.emit(finalValue);
    this.isOpen.set(false);
  }

  onKeyDown(event: KeyboardEvent) {
    if (!this.isOpen() || this.matchingTokens().length === 0) {
      if (event.key === 'ArrowDown' || event.key === '{') {
        this.isOpen.set(true);
      } else if (event.key === 'Enter') {
        this.valueCommit.emit(this.value);
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
        } else {
          this.valueCommit.emit(this.value);
        }
        break;

      case 'Escape':
      case 'Tab':
        this.isOpen.set(false);
        break;
    }
  }

  onPopoverClosed(event?: MouseEvent) {
    if (event && this.containerRef && this.containerRef.nativeElement.contains(event.target as Node)) {
      return;
    }
    this.isOpen.set(false);
  }
}
