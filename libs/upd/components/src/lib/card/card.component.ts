import { Component, Input } from '@angular/core';
import { NgbPopoverConfig } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'upd-card',
  template: `
    <div class="card pt-2" [ngClass]="h !== 0 ? 'h-' + h : ''">
      <div class="card-body card-pad pt-2 h-100">
        <h3
          *ngIf="title !== ''"
          class="card-title h6 pb-2"
          [class.card-tooltip]="titleTooltip"
        >
          <!-- <span [ngbPopover]="tooltip" [ngbTooltip]="tooltip" placement="top">{{ title }}</span> -->
        <span placement="top" ngbTooltip="{{titleTooltip | translate}}">{{ title | translate }}</span>
        </h3>
        <ng-content></ng-content>
      </div>
    </div>
  `,
  providers: [NgbPopoverConfig],
})
export class CardComponent {
  @Input() title = '';
  @Input() titleTooltip = '';
  @Input() h = 0;

  constructor(config: NgbPopoverConfig) {
    config.disablePopover = this.titleTooltip !== '';
    config.placement = 'right';
    config.triggers = 'hover focus';
  }
}
