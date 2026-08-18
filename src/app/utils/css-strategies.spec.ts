import { describe, it, expect } from 'vitest';
import {
  primitiveStrategy,
  shadowStrategy,
  borderStrategy,
  typographyStrategy,
  transitionStrategy,
  strategyMap
} from './css-strategies';
import { FlatToken } from '../models/token.model';

function createMockToken(type: string, resolvedValue: any): FlatToken {
  return {
    path: 'test.token',
    originalPath: ['test', 'token'],
    value: resolvedValue,
    resolvedValue,
    type,
    sourceFile: 'tokens.json'
  };
}

describe('CSS Strategies', () => {
  describe('primitiveStrategy', () => {
    it('should generate standard CSS variable', () => {
      const token = createMockToken('color', '#3b82f6');
      const css = primitiveStrategy.generate(token, '--color-primary');
      expect(css).toBe('  --color-primary: #3b82f6;\n');
    });
  });

  describe('shadowStrategy', () => {
    it('should format a single shadow object and its sub-properties', () => {
      const token = createMockToken('shadow', {
        offsetX: '0px',
        offsetY: '4px',
        blur: '8px',
        spread: '0px',
        color: 'rgba(0, 0, 0, 0.1)',
        type: 'dropShadow'
      });
      const css = shadowStrategy.generate(token, '--shadow-md');

      expect(css).toContain('  --shadow-md: 0px 4px 8px 0px rgba(0, 0, 0, 0.1);\n');
      expect(css).toContain('  --shadow-md-offsetX: 0px;\n');
      expect(css).toContain('  --shadow-md-offsetY: 4px;\n');
      expect(css).toContain('  --shadow-md-blur: 8px;\n');
      expect(css).toContain('  --shadow-md-spread: 0px;\n');
      expect(css).toContain('  --shadow-md-color: rgba(0, 0, 0, 0.1);\n');
      expect(css).not.toContain('--shadow-md-type');
    });

    it('should handle innerShadow type correctly', () => {
      const token = createMockToken('shadow', {
        offsetX: '0px',
        offsetY: '2px',
        blur: '4px',
        spread: '0px',
        color: '#000000',
        type: 'innerShadow'
      });
      const css = shadowStrategy.generate(token, '--shadow-inner');
      expect(css).toContain('  --shadow-inner: inset 0px 2px 4px 0px #000000;\n');
    });

    it('should format multiple shadows when resolved value is an array', () => {
      const token = createMockToken('shadow', [
        { offsetX: '0px', offsetY: '1px', blur: '2px', spread: '0px', color: '#000' },
        { offsetX: '0px', offsetY: '4px', blur: '8px', spread: '0px', color: '#111', type: 'innerShadow' }
      ]);
      const css = shadowStrategy.generate(token, '--shadow-multi');
      expect(css).toBe('  --shadow-multi: 0px 1px 2px 0px #000, inset 0px 4px 8px 0px #111;\n');
    });

    it('should handle primitive shadow value fallback', () => {
      const token = createMockToken('shadow', 'none');
      const css = shadowStrategy.generate(token, '--shadow-none');
      expect(css).toBe('  --shadow-none: none;\n');
    });
  });

  describe('borderStrategy', () => {
    it('should format border object and sub-properties', () => {
      const token = createMockToken('border', {
        width: '2px',
        style: 'dashed',
        color: '#ff0000'
      });
      const css = borderStrategy.generate(token, '--border-alert');
      expect(css).toContain('  --border-alert: 2px dashed #ff0000;\n');
      expect(css).toContain('  --border-alert-width: 2px;\n');
      expect(css).toContain('  --border-alert-style: dashed;\n');
      expect(css).toContain('  --border-alert-color: #ff0000;\n');
    });

    it('should use default values for missing border properties', () => {
      const token = createMockToken('border', {});
      const css = borderStrategy.generate(token, '--border-default');
      expect(css).toContain('  --border-default: 1px solid transparent;\n');
    });

    it('should handle primitive border value', () => {
      const token = createMockToken('border', '1px solid black');
      const css = borderStrategy.generate(token, '--border-simple');
      expect(css).toBe('  --border-simple: 1px solid black;\n');
    });
  });

  describe('typographyStrategy', () => {
    it('should format typography shorthand and kebab-case sub-properties', () => {
      const token = createMockToken('typography', {
        fontFamily: 'Roboto, sans-serif',
        fontSize: '16px',
        fontWeight: '600',
        lineHeight: '1.5',
        fontStyle: 'italic'
      });
      const css = typographyStrategy.generate(token, '--typography-heading');
      expect(css).toContain('  --typography-heading: italic 600 16px/1.5 Roboto, sans-serif;\n');
      expect(css).toContain('  --typography-heading-font-family: Roboto, sans-serif;\n');
      expect(css).toContain('  --typography-heading-font-size: 16px;\n');
      expect(css).toContain('  --typography-heading-font-weight: 600;\n');
      expect(css).toContain('  --typography-heading-line-height: 1.5;\n');
      expect(css).toContain('  --typography-heading-font-style: italic;\n');
    });

    it('should format typography shorthand without line height when absent', () => {
      const token = createMockToken('typography', {
        fontFamily: 'Inter',
        fontSize: '14px',
        fontWeight: 'normal',
        fontStyle: 'normal'
      });
      const css = typographyStrategy.generate(token, '--typography-body');
      expect(css).toContain('  --typography-body: normal normal 14px Inter;\n');
    });

    it('should handle primitive typography value', () => {
      const token = createMockToken('typography', '16px Inter');
      const css = typographyStrategy.generate(token, '--typography-simple');
      expect(css).toBe('  --typography-simple: 16px Inter;\n');
    });
  });

  describe('transitionStrategy', () => {
    it('should format transition shorthand and cubic-bezier timing function array', () => {
      const token = createMockToken('transition', {
        duration: '300ms',
        delay: '50ms',
        timingFunction: [0.4, 0, 0.2, 1]
      });
      const css = transitionStrategy.generate(token, '--transition-ease-out');
      expect(css).toContain('  --transition-ease-out: 300ms cubic-bezier(0.4, 0, 0.2, 1) 50ms;\n');
      expect(css).toContain('  --transition-ease-out-duration: 300ms;\n');
      expect(css).toContain('  --transition-ease-out-delay: 50ms;\n');
      expect(css).toContain('  --transition-ease-out-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n');
    });

    it('should format transition with string timing function', () => {
      const token = createMockToken('transition', {
        duration: '150ms',
        delay: '0s',
        timingFunction: 'linear'
      });
      const css = transitionStrategy.generate(token, '--transition-fast');
      expect(css).toContain('  --transition-fast: 150ms linear 0s;\n');
      expect(css).toContain('  --transition-fast-timing-function: linear;\n');
    });

    it('should handle primitive transition value', () => {
      const token = createMockToken('transition', 'all 0.2s ease');
      const css = transitionStrategy.generate(token, '--transition-simple');
      expect(css).toBe('  --transition-simple: all 0.2s ease;\n');
    });
  });

  describe('strategyMap', () => {
    it('should have strategies registered for shadow, border, typography, and transition', () => {
      expect(strategyMap['shadow']).toBe(shadowStrategy);
      expect(strategyMap['border']).toBe(borderStrategy);
      expect(strategyMap['typography']).toBe(typographyStrategy);
      expect(strategyMap['transition']).toBe(transitionStrategy);
    });
  });
});
