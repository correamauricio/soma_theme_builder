import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlatToken } from '../../models/token.model';
import { AliasAutocompleteComponent } from '../alias-autocomplete.component';

@Component({
  selector: 'app-primitive-node',
  standalone: true,
  imports: [CommonModule, AliasAutocompleteComponent],
  template: `
    <div class="flex items-center space-x-2 w-full">
      <app-alias-autocomplete
        class="flex-1"
        [value]="getValueString()"
        [currentPath]="token.path"
        (valueChange)="onValueChange($event)"
      ></app-alias-autocomplete>
    </div>
  `
})
export class PrimitiveNodeComponent {
  @Input({ required: true }) token!: FlatToken;
  @Input({ required: true }) nodeData!: any;
  @Input({ required: true }) nodeKey!: string;
  @Output() updateToken = new EventEmitter<{ path: string[], value: any }>();

  getValueString(): string {
    return String(this.token.value);
  }

  onValueChange(val: string) {
    // Attempt to keep numbers as numbers if it wasn't an alias
    let finalVal: any = val;
    if (!isNaN(Number(val)) && val.trim() !== '') {
      finalVal = Number(val);
    }
    this.updateToken.emit({ path: this.token.originalPath, value: finalVal });
  }
}
