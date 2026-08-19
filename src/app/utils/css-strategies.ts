import { FlatToken } from '../models/token.model';

/**
 * Interface que define o contrato para estratégias de geração de variáveis CSS.
 */
export interface CssStrategy {
  generate(token: FlatToken, baseVarName: string): string;
}

// --- Funções Auxiliares (Helpers) ---

/**
 * Formata uma declaração CSS com indentação padrão de 2 espaços.
 */
function formatCssDeclaration(cssPropertyName: string, value: unknown): string {
  return `  ${cssPropertyName}: ${value};\n`;
}

/**
 * Converte strings camelCase para kebab-case (ex: fontFamily -> font-family).
 */
function toKebabCase(text: string): string {
  return text.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Verifica se o valor é um objeto simples (não nulo e não array).
 */
function isPlainObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Formata um objeto de sombra individual em sua representação CSS válida.
 */
function formatSingleShadow(shadow: unknown): string {
  if (!isPlainObject(shadow)) {
    return String(shadow);
  }

  const offsetX = shadow['offsetX'] || '0px';
  const offsetY = shadow['offsetY'] || '0px';
  const blur = shadow['blur'] || '0px';
  const spread = shadow['spread'] || '0px';
  const color = shadow['color'] || '#000000';
  const insetPrefix = shadow['type'] === 'innerShadow' ? 'inset ' : '';

  return `${insetPrefix}${offsetX} ${offsetY} ${blur} ${spread} ${color}`;
}

/**
 * Formata a função de timing da transição (suporta array cubic-bezier ou string direta).
 */
function formatTimingFunction(timingFunction: unknown): string {
  if (Array.isArray(timingFunction)) {
    return `cubic-bezier(${timingFunction.join(', ')})`;
  }
  return typeof timingFunction === 'string' ? timingFunction : 'ease';
}

// --- Estratégias de Geração CSS ---

export const primitiveStrategy: CssStrategy = {
  generate(token: FlatToken, baseVarName: string): string {
    const value = token.resolvedValue;
    if (isPlainObject(value)) {
      let css = '';
      for (const [key, propValue] of Object.entries(value)) {
        const kebabKey = toKebabCase(key);
        const finalValue = Array.isArray(propValue) ? propValue.join(', ') : propValue;
        css += formatCssDeclaration(`${baseVarName}-${kebabKey}`, finalValue);
      }
      return css;
    }
    if (Array.isArray(value)) {
      return formatCssDeclaration(baseVarName, value.join(', '));
    }
    return formatCssDeclaration(baseVarName, value);
  }
};

/**
 * Estratégia para tokens de sombra (shadow), tratando tanto sombras simples quanto compostas/múltiplas.
 */
export const shadowStrategy: CssStrategy = {
  generate(token: FlatToken, baseVarName: string): string {
    const value = token.resolvedValue;

    // Caso 1: Múltiplas sombras (array de sombras)
    if (Array.isArray(value)) {
      const combinedShadows = value.map(formatSingleShadow).join(', ');
      return formatCssDeclaration(baseVarName, combinedShadows);
    }

    // Caso 2: Objeto único de sombra
    if (isPlainObject(value)) {
      let css = formatCssDeclaration(baseVarName, formatSingleShadow(value));

      for (const [key, propertyValue] of Object.entries(value)) {
        if (key !== 'type') {
          css += formatCssDeclaration(`${baseVarName}-${key}`, propertyValue);
        }
      }

      return css;
    }

    // Caso 3: Valor primitivo de fallback (ex: 'none')
    return formatCssDeclaration(baseVarName, value);
  }
};

/**
 * Estratégia para tokens de borda (border), gerando o shorthand e sub-propriedades.
 */
export const borderStrategy: CssStrategy = {
  generate(token: FlatToken, baseVarName: string): string {
    const value = token.resolvedValue;

    if (isPlainObject(value)) {
      const width = value['width'] || '1px';
      const style = value['style'] || 'solid';
      const color = value['color'] || 'transparent';

      let css = formatCssDeclaration(baseVarName, `${width} ${style} ${color}`);

      for (const [key, propertyValue] of Object.entries(value)) {
        css += formatCssDeclaration(`${baseVarName}-${key}`, propertyValue);
      }

      return css;
    }

    return formatCssDeclaration(baseVarName, value);
  }
};

/**
 * Estratégia para tokens de tipografia (typography), gerando o shorthand 'font' e sub-propriedades em kebab-case.
 */
export const typographyStrategy: CssStrategy = {
  generate(token: FlatToken, baseVarName: string): string {
    const value = token.resolvedValue;

    if (isPlainObject(value)) {
      const fontStyle = value['fontStyle'] || 'normal';
      const fontWeight = value['fontWeight'] || 'normal';
      const fontSize = value['fontSize'] || 'inherit';
      const lineHeightSuffix = value['lineHeight'] ? `/${value['lineHeight']}` : '';
      const fontFamily = value['fontFamily'] || 'inherit';

      const fontShorthand = `${fontStyle} ${fontWeight} ${fontSize}${lineHeightSuffix} ${fontFamily}`;
      let css = formatCssDeclaration(baseVarName, fontShorthand);

      for (const [key, propertyValue] of Object.entries(value)) {
        const kebabKey = toKebabCase(key);
        css += formatCssDeclaration(`${baseVarName}-${kebabKey}`, propertyValue);
      }

      return css;
    }

    return formatCssDeclaration(baseVarName, value);
  }
};

/**
 * Estratégia para tokens de transição (transition), gerando o shorthand e sub-propriedades em kebab-case.
 */
export const transitionStrategy: CssStrategy = {
  generate(token: FlatToken, baseVarName: string): string {
    const value = token.resolvedValue;

    if (isPlainObject(value)) {
      const duration = value['duration'] || '0s';
      const delay = value['delay'] || '0s';
      const timingFunction = formatTimingFunction(value['timingFunction']);

      const transitionShorthand = `${duration} ${timingFunction} ${delay}`;
      let css = formatCssDeclaration(baseVarName, transitionShorthand);

      for (const [key, propertyValue] of Object.entries(value)) {
        const kebabKey = toKebabCase(key);
        const formattedValue = Array.isArray(propertyValue)
          ? `cubic-bezier(${propertyValue.join(', ')})`
          : propertyValue;

        css += formatCssDeclaration(`${baseVarName}-${kebabKey}`, formattedValue);
      }

      return css;
    }

    return formatCssDeclaration(baseVarName, value);
  }
};

/**
 * Mapeamento das estratégias suportadas por tipo de token.
 */
export const strategyMap: Record<string, CssStrategy> = {
  'shadow': shadowStrategy,
  'border': borderStrategy,
  'typography': typographyStrategy,
  'transition': transitionStrategy
};
