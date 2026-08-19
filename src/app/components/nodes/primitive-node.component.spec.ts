import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PrimitiveNodeComponent } from './primitive-node.component';
import { AliasAutocompleteComponent } from '../alias-autocomplete.component';
import { TokenService } from '../../services/token.service';

describe('PrimitiveNodeComponent', () => {
  let component: PrimitiveNodeComponent;
  let fixture: ComponentFixture<PrimitiveNodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrimitiveNodeComponent, AliasAutocompleteComponent],
      providers: [
        {
          provide: TokenService,
          useValue: {
            allFlatTokens: () => []
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PrimitiveNodeComponent);
    component = fixture.componentInstance;
    component.token = { value: 'initial', originalPath: ['path', 'to', 'token'], path: 'path.to.token' } as any;
    fixture.detectChanges();
  });

  it('should only commit token update upon finishing input editing rather than on every keystroke to prevent memento state pollution', async () => {
    const emitSpy = vi.spyOn(component.updateToken, 'emit');
    
    const inputEl: HTMLInputElement = fixture.nativeElement.querySelector('input');
    
    // Simulate progressive typing keystrokes
    inputEl.value = '1';
    inputEl.dispatchEvent(new Event('input'));
    
    inputEl.value = '16';
    inputEl.dispatchEvent(new Event('input'));
    
    inputEl.value = '16px';
    inputEl.dispatchEvent(new Event('input'));

    // Should NOT emit on intermediate keystrokes
    expect(emitSpy).not.toHaveBeenCalled();

    // User finishes editing by blurring the input
    inputEl.dispatchEvent(new Event('blur'));
    
    // Should emit exactly once with the finalized value
    expect(emitSpy).toHaveBeenCalledTimes(1);
    expect(emitSpy).toHaveBeenCalledWith({ path: ['path', 'to', 'token'], value: '16px' });
  });
});
