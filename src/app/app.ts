import { Component } from '@angular/core';
import { HeaderComponent } from './components/header.component';
import { SidebarComponent } from './components/sidebar.component';
import { EditorComponent } from './components/editor.component';
import { PreviewComponent } from './components/preview.component';
import { ShortcutService } from './services/shortcut.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeaderComponent, SidebarComponent, EditorComponent, PreviewComponent],
  template: `
    <div class="h-screen w-screen flex flex-col bg-gray-900 overflow-hidden font-sans">
      <app-header class="shrink-0"></app-header>
      <div class="flex-1 flex overflow-hidden">
        <app-sidebar></app-sidebar>
        <app-editor></app-editor>
        <app-preview class="flex-1"></app-preview>
      </div>
    </div>
  `,
  styles: []
})
export class App {
  constructor(shortcutService: ShortcutService) {
    shortcutService.init();
  }
}
