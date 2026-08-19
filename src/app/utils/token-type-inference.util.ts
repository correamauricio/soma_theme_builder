const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const RGB_HSL_COLOR_REGEX = /^(rgba?|hsla?)\(/;
const MODERN_COLOR_REGEX = /^(oklch|color|lab|lch)\(/;
const DIMENSION_REGEX = /^-?[0-9.]+(px|rem|em|vw|vh|vmin|vmax|%)$/;
const DURATION_REGEX = /^[0-9.]+(ms|s)$/;

export function inferTokenType(tokenValue: any): string {
  if (tokenValue == null) return 'unknown';

  if (typeof tokenValue === 'string') {
    const trimmed = tokenValue.trim();
    if (HEX_COLOR_REGEX.test(trimmed)) return 'color';
    if (RGB_HSL_COLOR_REGEX.test(trimmed)) return 'color';
    if (MODERN_COLOR_REGEX.test(trimmed)) return 'color';
    if (DIMENSION_REGEX.test(trimmed)) return 'dimension';
    if (DURATION_REGEX.test(trimmed)) return 'duration';
    return 'unknown';
  }

  if (typeof tokenValue === 'number') {
    return 'number';
  }

  if (typeof tokenValue === 'object' && !Array.isArray(tokenValue)) {
    if ('fontFamily' in tokenValue || 'fontSize' in tokenValue) return 'typography';
    if ('offsetX' in tokenValue && 'offsetY' in tokenValue) return 'shadow';
    if ('width' in tokenValue && 'style' in tokenValue && 'color' in tokenValue) return 'border';
    if ('duration' in tokenValue && 'timingFunction' in tokenValue) return 'transition';
  }

  if (Array.isArray(tokenValue)) {
    if (tokenValue.length > 0 && typeof tokenValue[0] === 'object' && 'offsetX' in tokenValue[0]) return 'shadow';
    if (tokenValue.length === 4 && typeof tokenValue[0] === 'number') return 'cubicBezier';
  }

  return 'unknown';
}
