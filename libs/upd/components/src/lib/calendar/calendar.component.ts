import { Component, ChangeDetectorRef, AfterViewInit, SimpleChanges, OnChanges } from '@angular/core';
import { combineLatest, map } from 'rxjs';
import {
  DateSelectionFacade,
} from '@dua-upd/upd/state';
import { LocaleId } from '@dua-upd/upd/i18n';
import { I18nFacade } from '@dua-upd/upd/state';
import { dateRangeConfigs, dayjs, DateRangeType } from '@dua-upd/utils-common';

const START_YEAR = 2020;

@Component({
  selector: 'upd-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
})
export class CalendarComponent implements AfterViewInit, OnChanges {
  currentDate = new Date();
  currentYear = this.currentDate.getFullYear();
  currentMonth = this.currentDate.getMonth();

  // Date related properties
  date = new Date();
  startDate: Date = new Date(2021, 0, 1);
  minSelectableDate: Date = new Date(2020, 0, 1);
  maxSelectableDate: Date = dayjs().subtract(1, 'day').toDate();
  hoveredDate: any;
  selectedMonth: number = this.currentMonth;
  selectedYear: number = this.currentYear;
  yearRange: { label: string, value: number }[] = this.getYearRange();

  // Data streams
  selectedPeriod$ = this.selectorService.dateSelectionPeriod$;
  periodSelectionLabel$ = this.selectorService.periodSelectionLabel$;
  selectionOptions = dateRangeConfigs.map(config => ({ value: config.type, label: config.label }));

  // Month options
  months: { label: string, value: number }[] = [
    { label: 'Jan', value: 0 },
    { label: 'Feb', value: 1 },
    { label: 'Mar', value: 2 },
    { label: 'Apr', value: 3 },
    { label: 'May', value: 4 },
    { label: 'Jun', value: 5 },
    { label: 'Jul', value: 6 },
    { label: 'Aug', value: 7 },
    { label: 'Sep', value: 8 },
    { label: 'Oct', value: 9 },
    { label: 'Nov', value: 10 },
    { label: 'Dec', value: 11 }
  ];
  

  constructor(
    private i18n: I18nFacade,
    private selectorService: DateSelectionFacade,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit() {
    this.attachHoverEvent();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['date'] && Array.isArray(this.date) && this.date[0] && !this.date[1]) {
      this.attachHoverEvent();
    }
  }

  private createDisplayFormatDateRangesStream() {
    return combineLatest([
      this.selectorService.dateRanges$,
      this.i18n.currentLang$,
    ]).pipe(
      map(([dateRanges, lang]) => ({
        dateRange: dateRangeToDisplayFormat(dateRanges.dateRange, lang),
        comparisonDateRange: dateRangeToDisplayFormat(dateRanges.comparisonDateRange, lang)
      }))
    );
  }

  private getYearRange(): { label: string, value: number }[] {
    const yearOptions: { label: string, value: number }[] = [];
    for (let i = START_YEAR; i <= this.currentYear; i++) {
      yearOptions.push({ label: i.toString(), value: i });
    }
    return yearOptions;
  }

  selectPeriod(period: DateRangeType) {
    this.selectorService.selectDatePeriod(period);
  }

  // Update the calendar date based on the selected month/year
  updateDate() {
    this.date = new Date(this.selectedYear, this.selectedMonth, 1);
    this.cdr.detectChanges(); // <-- This forces the view to update
  }
  updateCalendar() {
    // If current year is selected and selected month exceeds current month, set to current month

    this.date = new Date(this.selectedYear, this.selectedMonth, 1);
  }

  attachHoverEvent() {
    setTimeout(() => {
      const dateCells = document.querySelectorAll('.p-datepicker-calendar td span:not(.p-disabled)');
      dateCells.forEach(cell => {
        cell.addEventListener('mouseover', this.previewRange.bind(this));
      });
    });
  }

  handleDateSelect(event: any) {
    // Here, event will likely be an object that contains the selected date.
    // But, based on the documentation or your understanding, adapt as necessary.
  
    const selectedDate = event;  // Modify if event structure is different.

    console.log('Selected date:', selectedDate);
  
    // If a start date has been selected but not an end date:
    if (Array.isArray(this.date) && this.date[0] && !this.date[1]) {
      this.attachHoverEvent();
    } else {
      this.detachHoverEvent();
    }
  }
  
  detachHoverEvent() {
    const dateCells = document.querySelectorAll('.p-datepicker-calendar td span:not(.p-disabled)');
    dateCells.forEach(cell => {
      cell.removeEventListener('mouseover', this.previewRange.bind(this));
      cell.classList.remove('hovered-range');  // Clearing the hover styles as well.
    });
  }

  previewRange(event: any) {
    console.log('Hovered over:', event.target.innerText); // Log the hovered date.
    if (this.date && Array.isArray(this.date) && this.date[0] && !this.date[1]) {
      // Start date is selected but end date is not
      this.hoveredDate = new Date(event.target.getAttribute('aria-label')); 
      
      // Apply a temporary styling from startDate to hoveredDate
      this.stylePreviewRange();
    }
  }

  stylePreviewRange() {
    const dateCells = document.querySelectorAll('.p-datepicker-calendar td span:not(.p-disabled)');
    let inRange = false;
    const startDate = Array.isArray(this.date) ? this.date[0] : this.date;
  
    dateCells.forEach(cell => {
      const dateCell = cell as HTMLElement;
      const cellDateStr = new Date(dateCell.innerText);
console.log("Cell date string from aria-label:", cellDateStr);
const cellDate = new Date(cellDateStr);
console.log("Parsed cell date:", cellDate);
  
      if (startDate && cellDate.getTime() === startDate.getTime()) { 
        inRange = true;
      }
  
      if (inRange) {
        cell.classList.add('hovered-range');
      } else {
        cell.classList.remove('hovered-range'); // Make sure to remove the hover style if not in the range
      }
  
      if (this.hoveredDate && cellDate.getTime() === this.hoveredDate.getTime()) {
        inRange = false;
      }
    });
  }

handleMonthChange(newValue: number) {
  this.selectedMonth = newValue;
  this.updateCalendar();
}

getSelectedMonthLabel(): string {
  return this.months.find(m => m.value === this.selectedMonth)?.label || '';
}

handleYearChange(year: number) {
  this.selectedYear = year;
  this.updateCalendar();
}
}

// The existing dateRangeToDisplayFormat function:
const dateRangeToDisplayFormat = (date: string, lang: LocaleId) =>
  date
    .split('/')
    .map(
      (d) =>
        dayjs(d)
          .locale(lang)
          .format(lang === 'en-CA' ? 'MMM DD YYYY' : 'DD MMM YYYY') // only add year to end date
    )
    .join(' - ');