import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { TokenService } from './services/token.service';
import { TokenStateService } from './services/token-state.service';
import { HistoryService } from './services/history.service';
import { Injector, runInInjectionContext } from '@angular/core';

describe('TokenService Variant Behavior', () => {
  it('should maintain token listing for active file even when different variant is active', () => {
    const injector = Injector.create({
      providers: [
        TokenStateService,
        HistoryService,
        TokenService
      ]
    });

    runInInjectionContext(injector, () => {
      const service = injector.get(TokenService);

      expect(service.activeFileName()).toBe('semantics.json');
      const initialCount = service.flatTokens().length;
      expect(initialCount).toBeGreaterThan(0);

      // Change variant to semantics-dark.json
      const groups = service.variantGroups();
      expect(groups.length).toBeGreaterThan(0);
      service.selectVariant(groups[0].id, 'semantics-dark.json');

      // The viewed file is still semantics.json
      expect(service.activeFileName()).toBe('semantics.json');
      // Tokens list must NOT disappear
      expect(service.flatTokens().length).toBe(initialCount);
      expect(service.groupedTokens()['color']).toBeDefined();
    });
  });
});
