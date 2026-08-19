import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { CompositeNodeComponent } from './composite-node.component';
import { FlatToken } from '../../models/token.model';

describe('CompositeNodeComponent', () => {
  it('should format nested object values as readable structures instead of [object Object]', () => {
    const component = new CompositeNodeComponent();
    
    component.token = {
      path: 'border.custom',
      originalPath: ['border', 'custom'],
      value: {
        width: '1px',
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      },
      resolvedValue: {},
      type: 'border',
      sourceFile: 'tokens.json'
    } as FlatToken;

    const colorString = component.getSubValueString('color');

    expect(colorString).not.toBe('[object Object]');
    expect(colorString).toContain('dark');
  });
});