import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TokenService } from '../services/token.service';

@Component({
  selector: 'app-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex-1 h-full bg-white flex flex-col relative overflow-hidden" id="preview-sandbox">
      <!-- Inject dynamically generated CSS Variables -->
      <div [innerHTML]="safeCss()"></div>
      
      <!-- Top Bar of Preview -->
      <div class="bg-gray-100 border-b border-gray-200 p-4 flex justify-between items-center z-10">
        <h2 class="font-bold text-gray-700 uppercase tracking-wider text-sm flex items-center space-x-2">
           <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
           <span>Live Preview</span>
        </h2>
      </div>

      <!-- Live Sandbox Area -->
      <!-- We use the custom CSS variables for styling to prove they work -->
      <div class="p-8 overflow-y-auto flex-1 preview-container" 
           style="background-color: var(--color-background-DEFAULT); color: var(--color-text-main); font-family: var(--typography-fontFamily-sans);">
        
        <div class="max-w-3xl mx-auto space-y-12">
           
           <!-- Hero Section -->
           <div class="text-center space-y-4">
              <h1 class="text-5xl font-extrabold tracking-tight" style="color: var(--color-brand-main);">
                 Discover Our New Design System
              </h1>
              <p class="text-lg max-w-2xl mx-auto" style="color: var(--color-text-muted);">
                 This preview sandbox dynamically updates its styles whenever you modify design tokens in the editor. Experience the power of W3C standard tokens in real-time.
              </p>
              <div class="pt-4 space-x-4">
                 <button class="font-semibold transition-all hover:opacity-90 shadow-lg"
                         style="background-color: var(--color-primary-500); color: var(--color-text-onPrimary); padding: var(--spacing-md) var(--spacing-xl); border-radius: var(--radii-full);">
                    Get Started
                 </button>
                 <button class="font-semibold border-2 transition-all hover:bg-gray-50"
                         style="border-color: var(--color-primary-500); color: var(--color-primary-500); padding: calc(var(--spacing-md) - 2px) var(--spacing-xl); border-radius: var(--radii-full);">
                    View Documentation
                 </button>
              </div>
           </div>

           <!-- Components Demo -->
           <div class="grid grid-cols-2 gap-8">
              <!-- Card Component -->
              <div class="shadow-xl overflow-hidden transition-transform hover:-translate-y-1"
                   style="background-color: var(--color-background-DEFAULT); border-radius: var(--radii-md); border: 1px solid var(--color-background-muted);">
                 <div class="h-32 w-full" style="background-color: var(--color-primary-500); opacity: 0.2;"></div>
                 <div style="padding: var(--spacing-lg);">
                    <h3 class="font-bold text-xl mb-2">Beautiful Components</h3>
                    <p style="color: var(--color-text-muted); margin-bottom: var(--spacing-md);">Build interfaces faster than ever before with fully tokenized components.</p>
                    <a href="#" class="font-medium inline-flex items-center" style="color: var(--color-primary-500);">
                      Learn more
                      <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                    </a>
                 </div>
              </div>

              <!-- Form Component -->
              <div class="shadow-xl"
                   style="background-color: var(--color-background-DEFAULT); padding: var(--spacing-lg); border-radius: var(--radii-md); border: 1px solid var(--color-background-muted);">
                 <h3 class="font-bold text-xl mb-4">Contact Us</h3>
                 <div class="space-y-4">
                    <div>
                       <label class="block text-sm font-medium mb-1" style="color: var(--color-text-main);">Email</label>
                       <input type="email" class="w-full border shadow-sm outline-none transition-colors"
                              style="border-radius: var(--radii-md); padding: var(--spacing-sm) var(--spacing-md); border-color: var(--color-background-muted);">
                    </div>
                    <div>
                       <label class="block text-sm font-medium mb-1" style="color: var(--color-text-main);">Message</label>
                       <textarea class="w-full border shadow-sm outline-none transition-colors" rows="3"
                                 style="border-radius: var(--radii-md); padding: var(--spacing-sm) var(--spacing-md); border-color: var(--color-background-muted);"></textarea>
                    </div>
                    <button class="w-full font-semibold transition-all hover:opacity-90 shadow-md"
                            style="background-color: var(--color-primary-500); color: var(--color-text-onPrimary); padding: var(--spacing-sm) var(--spacing-md); border-radius: var(--radii-md);">
                       Send Message
                    </button>
                 </div>
              </div>
           </div>
           
           <!-- Color Palette -->
           <div class="mt-8">
              <h3 class="font-bold text-lg mb-4">Generated Primary Palette</h3>
              <div class="flex space-x-2">
                 <div class="w-16 h-16 rounded shadow-inner" style="background-color: var(--color-primary-500);"></div>
                 <div class="w-16 h-16 rounded shadow-inner" style="background-color: var(--color-primary-600);"></div>
              </div>
           </div>
           
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Ensure the preview container restricts custom properties to itself */
    .preview-container {
      transition: background-color 0.3s ease, color 0.3s ease;
    }
  `]
})
export class PreviewComponent {
  tokenService = inject(TokenService);
  sanitizer = inject(DomSanitizer);

  safeCss(): SafeHtml {
    // Inject the CSS Variables generated from the tokens into a <style> block
    // Specifically scope it to #preview-sandbox to avoid affecting the editor itself,
    // though the root tokens are prefixed. We use `#preview-sandbox` to scope it.
    const cssVars = this.tokenService.cssVariables();
    const scopedCss = cssVars.replace(':root', '#preview-sandbox');
    return this.sanitizer.bypassSecurityTrustHtml(`<style>${scopedCss}</style>`);
  }
}
