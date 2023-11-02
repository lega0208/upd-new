import { Component, ChangeDetectorRef, AfterViewInit, SimpleChanges, OnChanges, inject } from '@angular/core';
import { combineLatest, map } from 'rxjs';
import {
  DateSelectionFacade,
} from '@dua-upd/upd/state';
import { LocaleId } from '@dua-upd/upd/i18n';
import { I18nFacade } from '@dua-upd/upd/state';
import { dateRangeConfigs, dayjs, DateRangeType } from '@dua-upd/utils-common';
import { FormControl } from '@angular/forms';

const START_YEAR = 2020;

@Component({
  selector: 'upd-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
})
export class CalendarComponent implements AfterViewInit, OnChanges {
  private i18n = inject(I18nFacade);
  private selectorService: DateSelectionFacade = inject(DateSelectionFacade);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  currentDate = new Date();
  currentYear = this.currentDate.getFullYear();
  currentMonth = this.currentDate.getMonth();

  dateRangePickerControl = new FormControl();

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

  // attachHoverEvent() {
  //   setTimeout(() => {
  //     const dateCells = document.querySelectorAll('.p-datepicker-calendar td span:not(.p-disabled)');
  //     dateCells.forEach(cell => {
  //       cell.addEventListener('mouseover', this.previewRange.bind(this));
  //     });
  //   });
  // }

  handleDateSelect(event: any) {
    // Here, event will likely be an object that contains the selected date.
    // But, based on the documentation or your understanding, adapt as necessary.

    // const rangeLength = document.getElementsByClassName('p-highlight').length;
    // (document.getElementsByClassName('p-highlight')[0] as HTMLElement).style.background = 'blue';

    // if(rangeLength > 0)
    //   (document.getElementsByClassName('p-highlight')[rangeLength-1] as HTMLElement).style.background = 'blue';
    

    const selectedDate = event;  // Modify if event structure is different.

    console.log('Selected date:', selectedDate);
  
    // If a start date has been selected but not an end date:
    if (this.date) {
      this.attachHoverEvent();
    } else {
      this.detachHoverEvent();
    }
  }
  
  // detachHoverEvent() {
  //   const dateCells = document.querySelectorAll('.p-datepicker-calendar td span:not(.p-disabled)');
  //   dateCells.forEach(cell => {
  //     cell.removeEventListener('mouseover', this.previewRange.bind(this));
  //     cell.classList.remove('hovered-range');  // Clearing the hover styles as well.
  //   });
  // }

//   previewRange(event: any) {
//     console.log('Hovered over:', event.target.innerText); // Log the hovered date.
//     if (this.date && Array.isArray(this.date) && this.date[0] && !this.date[1]) {
//       // Start date is selected but end date is not
//        // A rough way to find the hovered date's month and year might be:
//        const monthYear = this.findMonthYearForCell(event.target);
//        this.hoveredDate = new Date(monthYear.year, monthYear.month, parseInt(event.target.innerText, 10)); 

//        console.log('Hovered date:', this.hoveredDate);
 
//        // Apply a temporary styling from startDate to hoveredDate
//        this.stylePreviewRange();
//      }
//  }
 
 // A function to find the month and year for a given cell
 findMonthYearForCell(cell: Element): { month: number, year: number } {
   // Here, traverse the DOM to find the calendar's month/year header
   // This is a mock implementation and might need adjustments based on your DOM structure
   const headerElem = cell.closest('.p-datepicker-group')?.querySelector('.p-datepicker-month');
   const month = this.months.findIndex(m => headerElem?.textContent?.includes(m.label));
   const year = parseInt(headerElem?.textContent?.match(/\d{4}/)?.[0] ?? '0', 10);
   return { month, year };
 }

 attachHoverEvent() {
  setTimeout(() => {
      const dateCells = document.querySelectorAll('.p-datepicker-calendar td span:not(.p-disabled)');
      console.log('dateCells', dateCells);
      dateCells.forEach(cell => {
          cell.addEventListener('mouseover', this.previewRange.bind(this));
          cell.addEventListener('mouseout', this.clearPreviewRangeStyles.bind(this));
      });
  });
}

detachHoverEvent() {
  const dateCells = document.querySelectorAll('.p-datepicker-calendar td span:not(.p-disabled)');
  dateCells.forEach(cell => {
      cell.removeEventListener('mouseover', this.previewRange.bind(this));
      cell.removeEventListener('mouseout', this.clearPreviewRangeStyles.bind(this));
      cell.classList.remove('hovered-range');
  });
}

previewRange(event: any) {
  if (this.date && Array.isArray(this.date) && this.date[0] && !this.date[1]) {
      const { month, year } = this.findMonthYearForCell(event.target);
      this.hoveredDate = new Date(year, month, parseInt(event.target.innerText, 10));
      console.log('Hovered over:', this.hoveredDate);
      this.stylePreviewRange();
  }
}

stylePreviewRange() {
  const startDate = this.date;
  const endDate = this.hoveredDate;
  const dateCells = document.querySelectorAll('.p-datepicker-calendar td span:not(.p-disabled)') as NodeListOf<HTMLElement>;

  let inRange = false;
  dateCells.forEach(cell => {
      const { month, year } = this.findMonthYearForCell(cell);
      const currentDate = new Date(year, month, parseInt(cell.innerText, 10));

      if (currentDate.getTime() === startDate.getTime()) inRange = true;

      if (inRange) cell.classList.add('hovered-range');

      if (currentDate.getTime() === endDate.getTime()) inRange = false;
  });
}

clearPreviewRangeStyles() {
  const dateCells = document.querySelectorAll('.hovered-range') as NodeListOf<HTMLElement>;
  dateCells.forEach(cell => {
      cell.classList.remove('hovered-range');
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

isEndpoint(day: number): boolean {
  if (!Array.isArray(this.date) || this.date.length < 2) return false;

  const currentFullDate = new Date(this.selectedYear, this.selectedMonth, day);
  const startDate = this.date[0];
  const endDate = this.date[1];

  return currentFullDate.getTime() === startDate.getTime() || currentFullDate.getTime() === endDate.getTime();
}

isInDateRange(day: number): boolean {
  if (!Array.isArray(this.date) || this.date.length < 2) return false;

  const currentFullDate = new Date(this.selectedYear, this.selectedMonth, day);
  const startDate = this.date[0];
  const endDate = this.date[1];

  return currentFullDate > startDate && currentFullDate < endDate;
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