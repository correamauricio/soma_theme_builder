import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ShortcutService } from './shortcut.service';
import { HistoryService } from './history.service';

describe('ShortcutService', () => {
  let service: ShortcutService;
  let historyServiceMock: any;

  beforeEach(() => {
    historyServiceMock = {
      undo: vi.fn(),
      redo: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        ShortcutService,
        { provide: HistoryService, useValue: historyServiceMock }
      ]
    });

    service = TestBed.inject(ShortcutService);
    service.init();
  });

  afterEach(() => {
    service.ngOnDestroy();
    vi.restoreAllMocks();
  });

  function dispatchKeydownEvent(
    key: string,
    ctrlKey: boolean = false,
    metaKey: boolean = false,
    shiftKey: boolean = false,
    targetTagName: string = 'DIV',
    isContentEditable: boolean = false
  ) {
    const event = new KeyboardEvent('keydown', {
      key,
      ctrlKey,
      metaKey,
      shiftKey,
      bubbles: true,
      cancelable: true
    });

    // Mock target properties
    Object.defineProperty(event, 'target', {
      value: {
        tagName: targetTagName,
        isContentEditable
      },
      writable: false
    });

    window.dispatchEvent(event);
    return event;
  }

  it('should call history.undo on Ctrl+Z', () => {
    const event = dispatchKeydownEvent('z', true, false, false);
    expect(event.defaultPrevented).toBe(true);
    expect(historyServiceMock.undo).toHaveBeenCalledTimes(1);
    expect(historyServiceMock.redo).not.toHaveBeenCalled();
  });

  it('should call history.undo on Cmd+Z', () => {
    const event = dispatchKeydownEvent('z', false, true, false);
    expect(event.defaultPrevented).toBe(true);
    expect(historyServiceMock.undo).toHaveBeenCalledTimes(1);
  });

  it('should call history.redo on Ctrl+Shift+Z', () => {
    const event = dispatchKeydownEvent('z', true, false, true);
    expect(event.defaultPrevented).toBe(true);
    expect(historyServiceMock.redo).toHaveBeenCalledTimes(1);
    expect(historyServiceMock.undo).not.toHaveBeenCalled();
  });

  it('should call history.redo on Cmd+Shift+Z', () => {
    const event = dispatchKeydownEvent('z', false, true, true);
    expect(event.defaultPrevented).toBe(true);
    expect(historyServiceMock.redo).toHaveBeenCalledTimes(1);
  });

  it('should ignore shortcuts if target is an INPUT', () => {
    const event = dispatchKeydownEvent('z', true, false, false, 'INPUT');
    expect(event.defaultPrevented).toBe(false);
    expect(historyServiceMock.undo).not.toHaveBeenCalled();
  });

  it('should ignore shortcuts if target is a TEXTAREA', () => {
    const event = dispatchKeydownEvent('z', true, false, false, 'TEXTAREA');
    expect(event.defaultPrevented).toBe(false);
    expect(historyServiceMock.undo).not.toHaveBeenCalled();
  });

  it('should ignore shortcuts if target is contentEditable', () => {
    const event = dispatchKeydownEvent('z', true, false, false, 'DIV', true);
    expect(event.defaultPrevented).toBe(false);
    expect(historyServiceMock.undo).not.toHaveBeenCalled();
  });

  it('should ignore other keyboard events', () => {
    const event = dispatchKeydownEvent('a', true, false, false); // Ctrl+A
    expect(event.defaultPrevented).toBe(false);
    expect(historyServiceMock.undo).not.toHaveBeenCalled();
  });

  it('should ignore Z without modifiers', () => {
    const event = dispatchKeydownEvent('z', false, false, false);
    expect(event.defaultPrevented).toBe(false);
    expect(historyServiceMock.undo).not.toHaveBeenCalled();
  });
});
