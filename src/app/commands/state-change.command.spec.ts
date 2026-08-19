import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StateChangeCommand } from './state-change.command';
import { TokenStateService } from '../services/token-state.service';
import { TokenStateMemento } from '../models/history.model';

describe('StateChangeCommand (Memento Pattern Encapsulation)', () => {
  let mockStateService: any;

  beforeEach(() => {
    mockStateService = {
      createMemento: vi.fn().mockReturnValue({} as TokenStateMemento),
      restoreMemento: vi.fn()
    };
  });

  it('should capture previous state snapshot (memento) immediately upon instantiation without executing the action', () => {
    const action = vi.fn();
    new StateChangeCommand(mockStateService as unknown as TokenStateService, action);
    
    expect(mockStateService.createMemento).toHaveBeenCalledTimes(1);
    expect(action).not.toHaveBeenCalled();
  });

  it('should run the mutation action and capture the resulting next state snapshot on the first execute() call', () => {
    const action = vi.fn();
    const cmd = new StateChangeCommand(mockStateService as unknown as TokenStateService, action);
    
    cmd.execute();
    
    expect(action).toHaveBeenCalledTimes(1);
    expect(mockStateService.createMemento).toHaveBeenCalledTimes(2); // Initial state + Post-mutation state
  });

  it('should restore the previous state snapshot when undo() is called', () => {
    const mockMemento = { id: 'memento1' };
    mockStateService.createMemento.mockReturnValueOnce(mockMemento);
    
    const cmd = new StateChangeCommand(mockStateService as unknown as TokenStateService, vi.fn());
    
    cmd.undo();
    
    expect(mockStateService.restoreMemento).toHaveBeenCalledWith(mockMemento);
  });

  it('should restore the cached next state snapshot directly upon subsequent execute() calls without re-running the mutation action', () => {
    const action = vi.fn();
    const cmd = new StateChangeCommand(mockStateService as unknown as TokenStateService, action);
    
    // First execution runs action and caches nextState
    cmd.execute();
    expect(action).toHaveBeenCalledTimes(1);

    // Subsequent execution (e.g. during Redo) should restore nextState rather than re-running action
    cmd.execute();
    expect(action).toHaveBeenCalledTimes(1);
    expect(mockStateService.restoreMemento).toHaveBeenCalledTimes(1);
  });
});
