import { Component, Input } from '@angular/core';
import { NgbPopoverConfig } from '@ng-bootstrap/ng-bootstrap';
import { ColumnConfig } from '../data-table-styles/types';

@Component({
  selector: 'upd-card',
  template: `
    <div class="card pt-2" [ngClass]="cardHeight" tabindex="0">
      <div class="card-body card-pad pt-2 h-100">
        <div class="d-flex justify-content-between">
          <h3
            *ngIf="title !== ''"
            [class]="'card-title pb-2 ' + titleSize"
            [class.card-tooltip]="titleTooltip"
          >
            <span placement="top" ngbTooltip="{{ titleTooltip | translate }}">{{
              title | translate
            }}</span>
          </h3>

          <upd-card-secondary-title
            [config]="config"
            [data]="data"
          ></upd-card-secondary-title>
        </div>
        <ng-content></ng-content>
      </div>
    </div>
  `,
  providers: [NgbPopoverConfig],
})
export class CardComponent {
  @Input() title = '';
  @Input() titleTooltip = '';
  @Input() titleSize: CardTitleSize = 'h6';
  @Input() h = 0;
  @Input() config: ColumnConfig = { field: '', header: '' };
  @Input() data: Record<string, number | string>[] = [];

  constructor(config: NgbPopoverConfig) {
    config.disablePopover = this.titleTooltip !== '';
    config.placement = 'right';
    config.triggers = 'hover focus';
  }

  get cardHeight() {
    return this.h !== 0 ? 'h-' + this.h : '';
  }
}

export type CardTitleSize = 'h3' | 'h4' | 'h5' | 'h6';
