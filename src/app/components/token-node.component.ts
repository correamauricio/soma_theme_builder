import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FlatToken } from '../models/token.model';
import { AliasAutocompleteComponent } from './alias-autocomplete.component';

@Component({
  selector: 'app-token-node',
  standalone: true,
  imports: [CommonModule, FormsModule, AliasAutocompleteComponent],
  template: `
    <div class="pl-3 border-l border-gray-800 ml-2 mt-1">
      <ng-container *ngFor="let key of getKeys(node)">
        
        <!-- Token Leaf -->
        <div *ngIf="isToken(node, key)" 
             class="group flex flex-col py-2 px-2 mt-1 hover:bg-gray-800 rounded-md text-sm transition-all border border-transparent"
             [class.!bg-gray-800]="isSelected(node, key)"
             [class.!border-gray-700]="isSelected(node, key)"
             (click)="onSelectToken(node, key)">
          <div class="flex items-center justify-between mb-1">
            <span class="font-medium font-mono text-gray-200" [class.text-blue-400]="isSelected(node, key)">{{ key }}</span>
            <span *ngIf="isAlias(node[key]._token.value)" class="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 font-mono border border-blue-800 flex items-center space-x-1" [title]="'Linked to ' + node[key]._token.value">
              <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101"></path></svg>
              <span>alias</span>
            </span>
          </div>
          
          <div class="flex items-center space-x-2">
            <app-alias-autocomplete
              [value]="node[key]._token.value"
              [currentPath]="node[key]._token.path"
              (valueChange)="onUpdateToken(node, key, $event)"
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
          <app-token-node
            [node]="node[key]"
            [selectedPath]="selectedPath"
            (selectToken)="selectToken.emit($event)"
            (updateToken)="updateToken.emit($event)">
          </app-token-node>
        </div>
        
      </ng-container>
    </div>
  `
})
export class TokenNodeComponent {
  @Input() node: any;
  @Input() selectedPath: string[] | null = null;
  
  @Output() selectToken = new EventEmitter<{ path: string[] }>();
  @Output() updateToken = new EventEmitter<{ path: string[], value: string }>();

  getKeys(node: any) {
    return Object.keys(node || {}).filter(k => k !== '_token');
  }
  
  isToken(node: any, key: string) {
    return !!node[key]?._token;
  }
  
  isSelected(node: any, key: string) {
    if (!this.selectedPath) return false;
    return node[key]._token.originalPath.join('.') === this.selectedPath.join('.');
  }
  
  onSelectToken(node: any, key: string) {
    this.selectToken.emit({ path: node[key]._token.originalPath });
  }

  onUpdateToken(node: any, key: string, val: string) {
    const path = node[key]._token.originalPath;
    this.updateToken.emit({ path, value: val });
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
    this.onUpdateToken(node, key, formattedHex);
  }
}
