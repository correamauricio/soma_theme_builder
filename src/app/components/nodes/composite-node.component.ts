import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlatToken } from '../../models/token.model';
import { AliasAutocompleteComponent } from '../alias-autocomplete.component';

@Component({
  selector: 'app-composite-node',
  standalone: true,
  imports: [CommonModule, AliasAutocompleteComponent],
  template: `
    <div class="flex flex-col w-full text-xs">
      <!-- Header / Accordion trigger -->
      <div class="flex items-center justify-between cursor-pointer py-1" (click)="toggle()">
        <span class="text-gray-400 italic">
          {{ isArray ? 'Array [' + getKeys().length + ']' : 'Object {' + getKeys().length + ' keys}' }}
        </span>
        <svg class="w-4 h-4 text-gray-500 transform transition-transform" [class.rotate-180]="isOpen" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>

      <!-- Accordion body -->
      <div *ngIf="isOpen" class="pl-2 border-l border-gray-700 mt-1 space-y-2">
        <!-- Primitive Fallback for Aliased Objects -->
        <div *ngIf="isStringAlias" class="mt-2">
           <app-alias-autocomplete
              class="w-full"
              [value]="token.value"
              [currentPath]="token.path"
              (valueChange)="onRootValueChange($event)"
            ></app-alias-autocomplete>
        </div>

        <ng-container *ngIf="!isStringAlias">
          <div *ngFor="let key of getKeys()" class="flex flex-col mb-1">
            <span class="text-[10px] text-gray-500 mb-0.5">{{ key }}</span>
            <app-alias-autocomplete
              class="w-full"
              [value]="getSubValueString(key)"
              [currentPath]="token.path + '.' + key"
              (valueChange)="onSubValueChange(key, $event)"
            ></app-alias-autocomplete>
          </div>
        </ng-container>
      </div>
    </div>
  `
})
export class CompositeNodeComponent {
  @Input({ required: true }) token!: FlatToken;
  @Input({ required: true }) nodeData!: any;
  @Input({ required: true }) nodeKey!: string;
  @Output() updateToken = new EventEmitter<{ path: string[], value: any }>();

  isOpen = false;

  get isArray() {
    return Array.isArray(this.token.value);
  }

  get isStringAlias() {
    return typeof this.token.value === 'string';
  }

  toggle() {
    this.isOpen = !this.isOpen;
  }

  getKeys(): string[] {
    if (this.isStringAlias) return [];
    if (this.token.value && typeof this.token.value === 'object') {
      return Object.keys(this.token.value);
    }
    return [];
  }

  getSubValueString(key: string): string {
    return String(this.token.value[key]);
  }

  onSubValueChange(key: string, val: string) {
    let finalVal: any = val;
    if (!isNaN(Number(val)) && val.trim() !== '') {
      finalVal = Number(val);
    }

    const newValue = this.isArray ? [...this.token.value] : { ...this.token.value };
    (newValue as any)[key] = finalVal;

    this.updateToken.emit({ path: this.token.originalPath, value: newValue });
  }

  onRootValueChange(val: string) {
    this.updateToken.emit({ path: this.token.originalPath, value: val });
  }
}
