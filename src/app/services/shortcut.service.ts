import { Injectable, inject, OnDestroy } from '@angular/core';
import { HistoryService } from './history.service';

@Injectable({
  providedIn: 'root'
})
export class ShortcutService implements OnDestroy {
  private history = inject(HistoryService);
  
  private keydownListener = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
    
    // Prevent overriding native undo/redo when typing inside inputs
    if (isInput) {
      return;
    }
    
    // Ctrl/Cmd + Z
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      
      // Ctrl/Cmd + Shift + Z -> Redo
      if (event.shiftKey) {
        this.history.redo();
      } else {
        this.history.undo();
      }
    }
  };

  init() {
    window.addEventListener('keydown', this.keydownListener);
  }

  ngOnDestroy() {
    window.removeEventListener('keydown', this.keydownListener);
  }
}
