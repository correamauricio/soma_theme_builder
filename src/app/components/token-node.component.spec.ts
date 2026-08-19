import { TestBed, ComponentFixture } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { TokenNodeComponent } from './token-node.component';
import { FlatToken } from '../models/token.model';

describe('TokenNodeComponent', () => {
  let component: TokenNodeComponent;
  let fixture: ComponentFixture<TokenNodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TokenNodeComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TokenNodeComponent);
    component = fixture.componentInstance;
  });

  it('should filter out the internal _token property when extracting node keys', () => {
    const node = {
      _token: { path: 'color.blue', value: '#00f', type: 'color' },
      '500': { _token: { path: 'color.blue.500', value: '#0055ff', type: 'color' } },
      '600': { _token: { path: 'color.blue.600', value: '#0033cc', type: 'color' } }
    };

    const keys = component.getKeys(node);
    expect(keys).toEqual(['500', '600']);
    expect(keys).not.toContain('_token');
  });

  it('should identify a node as a token when _token is present', () => {
    const tree = {
      primary: {
        _token: { path: 'color.primary', value: '#3b82f6', type: 'color' }
      },
      spacing: {
        sm: { _token: { path: 'spacing.sm', value: '8px', type: 'dimension' } }
      }
    };

    expect(component.isToken(tree, 'primary')).toBe(true);
    expect(component.isToken(tree, 'spacing')).toBe(false);
  });

  it('should detect alias expressions in token values', () => {
    expect(component.isAlias('{color.blue.500}')).toBe(true);
    expect(component.isAlias('  {spacing.md}  ')).toBe(true);
    expect(component.isAlias('#3b82f6')).toBe(false);
    expect(component.isAlias('16px')).toBe(false);
  });

  it('should resolve correct component presentation node types', () => {
    const colorToken = { type: 'color', value: '#fff' } as FlatToken;
    const compositeToken = { type: 'shadow', value: { offsetX: '0px', offsetY: '4px' } } as FlatToken;
    const primitiveToken = { type: 'dimension', value: '16px' } as FlatToken;

    expect(component.getNodeType(colorToken)).toBe('color');
    expect(component.getNodeType(compositeToken)).toBe('composite');
    expect(component.getNodeType(primitiveToken)).toBe('primitive');
  });

  it('should render both parent token and nested child tokens in DOM when path collides with a group', () => {
    // Hybrid structure: "blue" is a token ($value: '#0000ff') but also contains child token "500"
    component.node = {
      blue: {
        _token: {
          path: 'color.blue',
          originalPath: ['color', 'blue'],
          value: '#0000ff',
          type: 'color',
          resolvedValue: '#0000ff',
          sourceFile: 'tokens.json'
        },
        '500': {
          _token: {
            path: 'color.blue.500',
            originalPath: ['color', 'blue', '500'],
            value: '#0055ff',
            type: 'color',
            resolvedValue: '#0055ff',
            sourceFile: 'tokens.json'
          }
        }
      }
    };

    fixture.detectChanges();

    const elementText = fixture.nativeElement.textContent;

    // IDEAL: The UI should render both the parent token "blue" and the nested child token "500".
    // Currently, because "blue" has _token, the template exclusively renders it as a leaf and skips the group block,
    // causing "500" to be omitted from the DOM output. This test will FAIL until hybrid rendering is implemented.
    expect(elementText).toContain('blue');
    expect(elementText).toContain('500');
  });
});