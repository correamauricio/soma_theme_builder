import { FlatToken } from '../models/token.model';

export function generateCssVariables(tokens: FlatToken[]): string {
  let css = ':root {\n';
  for (const t of tokens) {
    const cssVarName = `--${t.path.replace(/\./g, '-')}`;
    css += `  ${cssVarName}: ${t.resolvedValue};\n`;
  }
  css += '}\n';
  return css;
}
