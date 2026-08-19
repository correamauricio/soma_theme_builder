import { describe, it, expect, beforeEach } from 'vitest';
import { TokenStateService } from './token-state.service';

describe('TokenStateService', () => {
  let service: TokenStateService;

  beforeEach(() => {
    service = new TokenStateService();
  });

  it('should preserve custom metadata and extension properties when updating a token value', () => {
    const newFile = {
      name: 'test-meta.json',
      content: {
        color: {
          brand: {
            $value: '#ff0000',
            $type: 'color',
            $description: 'A brand color',
            figmaExtensions: {
              blendMode: 'multiply'
            }
          }
        }
      }
    };
    
    service.addFile(newFile.name, newFile.content);
    service.updateTokenValue(['color', 'brand'], '#00ff00');
    
    const file = service.files().find(f => f.name === 'test-meta.json');
    expect(file).toBeDefined();
    
    const brandNode = file?.content.color.brand;
    
    expect(brandNode['$value']).toBe('#00ff00');
    expect(brandNode['$type']).toBe('color');
    expect(brandNode['$description']).toBe('A brand color');
    expect(brandNode.figmaExtensions.blendMode).toBe('multiply');
  });
});