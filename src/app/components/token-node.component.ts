import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FlatToken } from '../models/token.model';
import { PrimitiveNodeComponent } from './nodes/primitive-node.component';
import { ColorNodeComponent } from './nodes/color-node.component';
import { CompositeNodeComponent } from './nodes/composite-node.component';

@Component({
  selector: 'app-token-node',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    PrimitiveNodeComponent,
    ColorNodeComponent,
    CompositeNodeComponent
  ],
  template: `
    <div class="pl-3 border-l border-gray-800 ml-2 mt-1">
      @for (key of getKeys(node); track key) {
        
        <!-- Token Leaf -->
        @if (isToken(node, key)) {
          <div class="group flex flex-col py-2 px-2 mt-1 hover:bg-gray-800 rounded-md text-sm transition-all border border-transparent"
               [class.!bg-gray-800]="isSelected(node, key)"
               [class.!border-gray-700]="isSelected(node, key)"
               (click)="onSelectToken(node, key)">
            <div class="flex items-center justify-between mb-1">
              <span class="font-medium font-mono text-gray-200" [class.text-blue-400]="isSelected(node, key)">{{ key }}</span>
              
              <div class="flex space-x-2">
                @if (node[key]._token.type) {
                  <span class="text-[10px] px-1.5 py-0.5 rounded bg-gray-900 text-gray-400 border border-gray-700 font-mono">{{ node[key]._token.type }}</span>
                }
                @if (isAlias(node[key]._token.value)) {
                  <span class="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 font-mono border border-blue-800 flex items-center space-x-1" [title]="'Linked to ' + node[key]._token.value">
                    <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101"></path></svg>
                    <span>alias</span>
                  </span>
                }
              </div>
            </div>
            
            <!-- Node Router -->
            @switch (getNodeType(node[key]._token)) {
              @case ('color') {
                <app-color-node [token]="node[key]._token" [nodeData]="node" [nodeKey]="key" (updateToken)="onUpdateTokenEvent($event)"></app-color-node>
              }
              @case ('composite') {
                <app-composite-node [token]="node[key]._token" [nodeData]="node" [nodeKey]="key" (updateToken)="onUpdateTokenEvent($event)"></app-composite-node>
              }
              @default {
                <app-primitive-node [token]="node[key]._token" [nodeData]="node" [nodeKey]="key" (updateToken)="onUpdateTokenEvent($event)"></app-primitive-node>
              }
            }
          </div>
        }
        
        <!-- Token Group -->
        @if (hasChildren(node, key)) {
          <div class="mt-2">
            @if (!isToken(node, key)) {
              <div class="py-1 px-2 font-bold text-gray-500 text-[10px] uppercase tracking-widest flex items-center space-x-1">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                <span>{{ key }}</span>
              </div>
            }
            <app-token-node
              [node]="node[key]"
              [selectedPath]="selectedPath"
              (selectToken)="selectToken.emit($event)"
              (updateToken)="updateToken.emit($event)">
            </app-token-node>
          </div>
        }
        
      }
    </div>
  `
})
export class TokenNodeComponent {
  @Input() node: any;
  @Input() selectedPath: string[] | null = null;
  
  @Output() selectToken = new EventEmitter<{ path: string[] }>();
  @Output() updateToken = new EventEmitter<{ path: string[], value: any }>();

  getKeys(node: any) {
    return Object.keys(node || {}).filter(k => k !== '_token');
  }
  
  hasChildren(node: any, key: string) {
    const child = node[key];
    return child && typeof child === 'object' && this.getKeys(child).length > 0;
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

  onUpdateTokenEvent(event: { path: string[], value: any }) {
    this.updateToken.emit(event);
  }

  isAlias(val: any): boolean {
    return typeof val === 'string' && /^\{[^}]+\}$/.test(val.trim());
  }

  getNodeType(token: FlatToken): string {
    if (token.type === 'color') return 'color';
    if (token.value && typeof token.value === 'object') return 'composite';
    return 'primitive';
  }
}
