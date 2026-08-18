import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FlatToken } from '../../models/token.model';
import { AliasAutocompleteComponent } from '../alias-autocomplete.component';

@Component({
  selector: 'app-color-node',
  standalone: true,
  imports: [CommonModule, FormsModule, AliasAutocompleteComponent],
  template: `
    <div class="flex items-center space-x-2 w-full">
      <app-alias-autocomplete
        class="flex-1"
        [value]="getValueString()"
        [currentPath]="token.path"
        (valueChange)="onValueChange($event)"
      ></app-alias-autocomplete>
      
      <div class="relative w-5 h-5 rounded-full overflow-hidden border border-gray-600 shadow-sm shrink-0" title="Click color picker to set HEX color (unlinks alias)">
         <input type="color" 
                [ngModel]="getColorPickerHex()"
                (ngModelChange)="onColorPickerChange($event)"
                class="absolute -top-2 -left-2 w-10 h-10 cursor-pointer">
      </div>
    </div>
  `
})
export class ColorNodeComponent {
  @Input({ required: true }) token!: FlatToken;
  @Input({ required: true }) nodeData!: any;
  @Input({ required: true }) nodeKey!: string;
  @Output() updateToken = new EventEmitter<{ path: string[], value: any }>();

  getValueString(): string {
    return String(this.token.value);
  }

  onValueChange(val: string) {
    this.updateToken.emit({ path: this.token.originalPath, value: val });
  }

  isHex(val: string): boolean {
    return !!val && typeof val === 'string' && val.startsWith('#') && (val.length === 4 || val.length === 7 || val.length === 9);
  }

  formatToHex(val: string): string {
    if (!val || typeof val !== 'string') return '#000000';
    if (val.startsWith('#')) {
      if (val.length === 4) {
        return '#' + val[1] + val[1] + val[2] + val[2] + val[3] + val[3];
      }
      if (val.length === 7 || val.length === 9) return val.substring(0, 7); // Color picker only supports 6-digit hex
    }
    return '#000000';
  }

  getColorPickerHex(): string {
    if (this.isHex(this.token.value)) {
      return this.formatToHex(this.token.value);
    }
    if (this.isHex(this.token.resolvedValue)) {
      return this.formatToHex(this.token.resolvedValue);
    }
    return '#000000';
  }

  onColorPickerChange(hexValue: string) {
    const formattedHex = this.formatToHex(hexValue);
    this.onValueChange(formattedHex);
  }
}
