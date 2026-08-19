import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AliasAutocompleteComponent } from './alias-autocomplete.component';
import { TokenService } from '../services/token.service';

describe('AliasAutocompleteComponent', () => {
  let component: AliasAutocompleteComponent;
  let fixture: ComponentFixture<AliasAutocompleteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AliasAutocompleteComponent],
      providers: [
        {
          provide: TokenService,
          useValue: {
            allFlatTokens: () => []
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AliasAutocompleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should select all text in the input when clicked by the user for fast editing', async () => {
    const inputEl: HTMLInputElement = fixture.nativeElement.querySelector('input');
    component.value = 'border.radius.sm';
    fixture.detectChanges();
    await fixture.whenStable();

    inputEl.dispatchEvent(new Event('click'));

    expect(inputEl.selectionStart).toBe(0);
    expect(inputEl.selectionEnd).toBe('border.radius.sm'.length);
  });

  it('should mirror the user input as the first suggestion in the autocomplete dropdown', () => {
    const typedValue = 'custom-raw-value';

    const inputEl: HTMLInputElement = fixture.nativeElement.querySelector('input');
    inputEl.value = typedValue;
    inputEl.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const options = component.matchingTokens();
    expect(options.length).toBeGreaterThan(0);
    expect(options[0].path).toBe(typedValue);
    expect(options[0].type).toBe('custom');
  });
});
