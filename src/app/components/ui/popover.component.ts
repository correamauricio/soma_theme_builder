import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OverlayModule, CdkOverlayOrigin } from '@angular/cdk/overlay';

@Component({
  selector: 'app-popover',
  standalone: true,
  imports: [CommonModule, OverlayModule],
  template: `
    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="triggerOrigin!"
      [cdkConnectedOverlayOpen]="isOpen"
      [cdkConnectedOverlayWidth]="width"
      (overlayOutsideClick)="onOutsideClick($event)"
    >
      <ng-content></ng-content>
    </ng-template>
  `
})
export class PopoverComponent {
  @Input() triggerOrigin?: CdkOverlayOrigin;
  @Input() isOpen = false;
  @Input() width: string | number = 'auto';
  @Output() closed = new EventEmitter<MouseEvent>();

  onOutsideClick(event: MouseEvent) {
    this.closed.emit(event);
  }
}
