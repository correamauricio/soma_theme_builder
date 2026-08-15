import { Injectable, signal, computed } from '@angular/core';
import { Command } from '../models/history.model';

@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  private _undoStack = signal<Command[]>([]);
  private _redoStack = signal<Command[]>([]);

  canUndo = computed(() => this._undoStack().length > 0);
  canRedo = computed(() => this._redoStack().length > 0);

  execute(command: Command) {
    command.execute();
    this._undoStack.update(stack => [...stack, command]);
    this._redoStack.set([]); // Clear redo stack on new action
  }

  undo() {
    if (!this.canUndo()) return;
    
    const stack = [...this._undoStack()];
    const command = stack.pop();
    if (command) {
      command.undo();
      this._undoStack.set(stack);
      this._redoStack.update(redoStack => [...redoStack, command]);
    }
  }

  redo() {
    if (!this.canRedo()) return;
    
    const stack = [...this._redoStack()];
    const command = stack.pop();
    if (command) {
      command.execute();
      this._redoStack.set(stack);
      this._undoStack.update(undoStack => [...undoStack, command]);
    }
  }
}
