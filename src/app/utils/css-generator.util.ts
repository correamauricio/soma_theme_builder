import { FlatToken } from '../models/token.model';
import { strategyMap, primitiveStrategy } from './css-strategies';

export function generateCssVariables(tokens: FlatToken[]): string {
  let css = ':root {\n';
  for (const t of tokens) {
    const cssVarName = `--${t.path.replace(/\./g, '-')}`;
    
    // Default to primitive strategy unless a specific strategy exists for the type
    const strategy = strategyMap[t.type] || primitiveStrategy;
    css += strategy.generate(t, cssVarName);
  }
  css += '}\n';
  return css;
}
