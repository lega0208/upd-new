import { Component, Input } from '@angular/core';
import { of } from 'rxjs';
import { DateRangePeriod } from "@cra-arc/upd/state";

@Component({
  selector: 'app-date-selector-dropdown',
  template: `
    <div ngbDropdown class="d-inline-block">
      <button
        class="btn bg-white border border-1 dropdown-toggle"
        id="range-button"
        ngbDropdownToggle
      >
        <span class="material-icons align-top">calendar_today</span>
        <span data-i18n="dr-lastweek">{{ selectedPeriod | async }}</span>
      </button>
      <div ngbDropdownMenu aria-labelledby="range-button">
        <button
          *ngFor="let selectionOption of selectionOptions"
          (click)="onSelect(selectionOption.value)"
          ngbDropdownItem
        >
          {{ selectionOption.label }}
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./date-selector.component.css'],
})
export class DateSelectorDropdownComponent {
  @Input() selectedPeriod = of('');
  @Input() selectionOptions: { label: string; value: DateRangePeriod }[] = [];
  @Input() onSelect: (value: DateRangePeriod) => void = (value) => console.log(value);
}
