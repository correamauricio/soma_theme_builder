import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TokenService } from './token.service';
import { HistoryService } from './history.service';
import { TokenStateService } from './token-state.service';

describe('TokenService (Facade & Mutation Orchestration via Command Pattern)', () => {
  let service: TokenService;
  let historyServiceMock: any;
  let stateServiceMock: any;

  beforeEach(() => {
    historyServiceMock = {
      execute: vi.fn()
    };

    stateServiceMock = {
      files: vi.fn().mockReturnValue([]),
      activeFileName: vi.fn().mockReturnValue(''),
      selectedTokenPath: vi.fn().mockReturnValue(null),
      isJsonEditorOpen: vi.fn().mockReturnValue(false),
      duplicateTokensInfo: vi.fn().mockReturnValue([]),
      selectedVariants: vi.fn().mockReturnValue({}),
      disabledFileNames: vi.fn().mockReturnValue(new Set()),
      createMemento: vi.fn(),
      updateTokenValue: vi.fn(),
      updateActiveFileContent: vi.fn(),
      selectVariant: vi.fn(),
      toggleFileDisabled: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        TokenService,
        { provide: HistoryService, useValue: historyServiceMock },
        { provide: TokenStateService, useValue: stateServiceMock }
      ]
    });

    service = TestBed.inject(TokenService);
  });

  it('should route token value modifications through HistoryService using an encapsulated StateChangeCommand', () => {
    service.updateTokenValue(['color', 'primary'], '#FF0000');

    expect(historyServiceMock.execute).toHaveBeenCalledTimes(1);
    const passedCommand = historyServiceMock.execute.mock.calls[0][0];
    expect(passedCommand).toBeDefined();

    // Executing the command encapsulates calling state mutation
    passedCommand.execute();
    expect(stateServiceMock.updateTokenValue).toHaveBeenCalledWith(['color', 'primary'], '#FF0000');
  });

  it('should route file content updates through HistoryService using a StateChangeCommand', () => {
    const updatedContent = { color: { brand: { $value: '#123456' } } };
    service.updateActiveFileContent(updatedContent);

    expect(historyServiceMock.execute).toHaveBeenCalledTimes(1);
    const passedCommand = historyServiceMock.execute.mock.calls[0][0];

    passedCommand.execute();
    expect(stateServiceMock.updateActiveFileContent).toHaveBeenCalledWith(updatedContent);
  });

  it('should route variant selections through HistoryService using a StateChangeCommand', () => {
    service.selectVariant('group-1', 'dark.json');

    expect(historyServiceMock.execute).toHaveBeenCalledTimes(1);
    const passedCommand = historyServiceMock.execute.mock.calls[0][0];

    passedCommand.execute();
    expect(stateServiceMock.selectVariant).toHaveBeenCalledWith('group-1', 'dark.json');
  });

  it('should route toggling file disabled state through HistoryService using a StateChangeCommand', () => {
    service.toggleFileDisabled('theme.json');

    expect(historyServiceMock.execute).toHaveBeenCalledTimes(1);
    const passedCommand = historyServiceMock.execute.mock.calls[0][0];

    passedCommand.execute();
    expect(stateServiceMock.toggleFileDisabled).toHaveBeenCalledWith('theme.json');
  });
});
