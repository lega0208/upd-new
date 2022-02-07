import { Component, Input, OnInit } from '@angular/core';
import { NgbPopoverConfig } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-card',
  template: `
    <div class="card pb-3 pt-2" [ngClass]="h !== 0 ? 'h-' + h : ''">
      <div class="card-body card-pad pt-2 h-100">
        <h3
          *ngIf="title != ''"
          class="card-title h6"
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

    // get ref -> use parent size and resize?
    //  there might be some sort of built-in utility
  }
}
