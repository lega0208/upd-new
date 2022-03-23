import { Component, Input } from '@angular/core';
import { NgbPopoverConfig } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-card',
  template: `
    <div class="card pt-2" [ngClass]="h !== 0 ? 'h-' + h : ''">
      <div class="card-body card-pad pt-2 h-100">
        <h3
          *ngIf="title !== ''"
          class="card-title h6 pb-2"
          [class.card-tooltip]="tooltip"
        >
          <span [ngbPopover]="tooltip">{{ title }}</span>
        </h3>
        <ng-content></ng-content>
      </div>
    </div>
  `,
  providers: [NgbPopoverConfig],
})
export class CardComponent {
  @Input('card-title') title: string = '';
  @Input('title-tooltip') tooltip: string = '';
  @Input('h') h: number = 0;

  constructor(config: NgbPopoverConfig) {
    config.disablePopover = this.tooltip !== '';
    config.placement = 'right';
    config.triggers = 'hover focus';
  }
}
