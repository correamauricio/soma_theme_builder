import { TestBed } from '@angular/core/testing';
import { HistoryService } from './history.service';
import { Command } from '../models/history.model';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('HistoryService (Undo / Redo History Management)', () => {
  let service: HistoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HistoryService);
  });

  const createMockCommand = (): Command => ({
    execute: vi.fn(),
    undo: vi.fn()
  });

  it('should execute command, enable undo, and keep redo disabled upon initial command execution', () => {
    const cmd = createMockCommand();
    expect(service.canUndo()).toBe(false);
    expect(service.canRedo()).toBe(false);

    service.execute(cmd);

    expect(cmd.execute).toHaveBeenCalledTimes(1);
    expect(service.canUndo()).toBe(true);
    expect(service.canRedo()).toBe(false);
  });

  it('should revert the command and enable redo when undo is invoked', () => {
    const cmd = createMockCommand();
    service.execute(cmd);
    
    service.undo();

    expect(cmd.undo).toHaveBeenCalledTimes(1);
    expect(service.canUndo()).toBe(false);
    expect(service.canRedo()).toBe(true);
  });

  it('should re-execute the reverted command and re-enable undo when redo is invoked', () => {
    const cmd = createMockCommand();
    service.execute(cmd);
    service.undo();
    
    vi.clearAllMocks();

    service.redo();

    expect(cmd.execute).toHaveBeenCalledTimes(1);
    expect(service.canUndo()).toBe(true);
    expect(service.canRedo()).toBe(false);
  });

  it('should clear the redo stack and disable redo when a new command is executed after an undo', () => {
    const cmd1 = createMockCommand();
    const cmd2 = createMockCommand();
    
    service.execute(cmd1);
    service.undo();
    expect(service.canRedo()).toBe(true);

    service.execute(cmd2);
    expect(service.canRedo()).toBe(false);
  });

  it('should return early and do nothing when undo is called but the stack is empty', () => {
    expect(service.canUndo()).toBe(false);
    service.undo(); // Should not throw
    expect(service.canUndo()).toBe(false);
  });

  it('should return early and do nothing when redo is called but the stack is empty', () => {
    expect(service.canRedo()).toBe(false);
    service.redo(); // Should not throw
    expect(service.canRedo()).toBe(false);
  });

  it('should safely handle popping undefined from stack (although technically unreachable if length > 0)', () => {
    const cmd = createMockCommand();
    service.execute(cmd);
    
    // Forcibly clear internal state to test the if (command) guard
    (service as any)._undoStack.set([]);
    (service as any).canUndo = () => true; // force pass initial guard

    service.undo();
    expect(cmd.undo).not.toHaveBeenCalled();
    
    (service as any)._redoStack.set([]);
    (service as any).canRedo = () => true;

    service.redo();
    expect(cmd.execute).toHaveBeenCalledTimes(1); // from first execute
  });
});
