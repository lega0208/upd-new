import { Component, Input } from '@angular/core';
import { of } from 'rxjs';
import { DateRangePeriod } from "@dua-upd/upd/state";

import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'upd-date-selector-dropdown',
  template: `
    <div ngbDropdown class="d-inline-block">
      <button
        class="btn bg-white border border-1 dropdown-toggle"
        id="range-button"
        ngbDropdownToggle
        translate="{{ selectedPeriod | async}}"
      >
        <span class="material-icons align-top pe-1" aria-hidden="true">calendar_today</span>
        <span></span>&nbsp;
      </button>
      <div ngbDropdownMenu aria-labelledby="range-button">
        <button
          *ngFor="let selectionOption of selectionOptions"
          (click)="onSelect(selectionOption.value)"
          ngbDropdownItem
          translate
        >
          {{ selectionOption.label }}
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./date-selector.component.css'],
})
export class DateSelectorDropdownComponent {

  constructor(private translateService: TranslateService) {}
  @Input() selectedPeriod = of('');
  @Input() selectionOptions: { label: string; value: DateRangePeriod }[] = [];
  @Input() onSelect: (value: DateRangePeriod) => void = (value) => console.log(value);
}
