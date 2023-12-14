import {
  Component,
  ChangeDetectorRef,
  inject,
  ViewChild,
  Output,
  EventEmitter,
  Input,
  SimpleChanges,
  OnChanges,
  ViewEncapsulation,
} from '@angular/core';
import { DateSelectionFacade } from '@dua-upd/upd/state';
import { I18nFacade } from '@dua-upd/upd/state';
import dayjs from 'dayjs';

@Component({
  selector: 'upd-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class CalendarComponent implements OnChanges {
  private i18n = inject(I18nFacade);
  private selectorService: DateSelectionFacade = inject(DateSelectionFacade);
  currentDate = new Date();
  currentYear = this.currentDate.getFullYear();
  currentMonth = this.currentDate.getMonth();

  @ViewChild('myCalendar') datePicker: any;
  @Input() granularity = 'day';
  @Input() showPreset = false;
  @Input() showAction = false;
  @Input() required = false;
  @Output() dateChange = new EventEmitter<Date[] | Date>();
  presetLabel = 'None';

  minSelectableDate: Date = new Date(2020, 0, 1);

  maxSelectableDate = dayjs().subtract(1, 'day').toDate();

  startOfWeek = dayjs().startOf('week').toDate();
  endOfWeek = dayjs().endOf('week').toDate();
  dates: Date[] = [];
  disabledDays: number[] = [1, 2, 3, 4, 5, 6];
  disabledDates: Date[] = [this.startOfWeek];

  onWeekSelect(event: any): void {
    const startDate = this.dates[0];
    const endDate = this.dates[1];

    if (startDate && startDate.getDay() === 6) {
      this.resetSelection();
      this.dateChange.emit(new Date());
      return;
    }

    if (startDate && !endDate) {
      this.disabledDays = [0, 1, 2, 3, 4, 5];
    } else if (startDate && endDate) {
      if (dayjs(endDate).isBefore(dayjs(startDate))) {
        this.resetSelection();
      } else {
        this.disabledDays = [1, 2, 3, 4, 5, 6];
      }
      this.emitDateChange();
    } else {
      this.resetSelection();
    }
  }

  onMonthChange(event: any): void {
    const selectedDate = dayjs(event);
    if (this.dates[0] && !this.dates[1]) {
      this.dates = [selectedDate.toDate()];
    } else if (this.dates[0] && this.dates[1]) {
      this.dates = [this.dates[0], selectedDate.endOf('month').toDate()];
      this.emitDateChange();
    }
  }

  resetSelection(): void {
    this.dates = [];
    this.disabledDays = [1, 2, 3, 4, 5, 6];
    this.emitDateChange();
  }

  private emitDateChange(): void {
    this.dateChange.emit(this.dates);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['dates']) {
      this.emitDateChange();
    }

    if (changes['granularity']) {
      this.updateMaxSelectableDate();
    }
  }
  updateMaxSelectableDate() {
    this.maxSelectableDate =
      this.granularity === 'day'
        ? dayjs().subtract(1, 'day').toDate()
        : this.granularity === 'week'
        ? dayjs().subtract(1, 'week').endOf('week').toDate()
        : dayjs().subtract(1, 'month').endOf('month').toDate();
  }

  handleDateSelect() {
    this.emitDateChange();
  }

  closeCalendar() {
    this.datePicker.overlayVisible = false;
  }

  resetCalendar() {
    this.dates = [];
    this.dateChange.emit(new Date());
  }

  confirmCalendar() {
    this.dateChange.emit(this.dates);
  }

  handleSelect(granularity: string, event: any): void {
    switch (granularity) {
      case 'day':
        this.handleDateSelect();
        break;
      case 'week':
        this.onWeekSelect(event);
        break;
      case 'month':
        this.onMonthChange(event);
        break;
    }
  }

  selectLastWeek() {
    const startOfLastWeek = dayjs()
      .subtract(1, 'week')
      .startOf('week')
      .toDate();
    const endOfLastWeek = dayjs().subtract(1, 'week').endOf('week').toDate();
    this.setDateRange(startOfLastWeek, endOfLastWeek);
  }

  selectLastMonth() {
    const startOfLastMonth = dayjs()
      .subtract(1, 'month')
      .startOf('month')
      .toDate();
    const endOfLastMonth = dayjs().subtract(1, 'month').endOf('month').toDate();
    this.setDateRange(startOfLastMonth, endOfLastMonth);
  }

  selectLastQuarter() {
    const currentQuarter = Math.floor(dayjs().month() / 3);
    const startOfLastQuarter = dayjs()
      .subtract(1, 'quarter')
      .startOf('quarter')
      .toDate();
    const endOfLastQuarter = dayjs()
      .month(currentQuarter * 3 - 1)
      .endOf('month')
      .toDate();
    this.setDateRange(startOfLastQuarter, endOfLastQuarter);
  }

  selectLastYear() {
    const startOfLastYear = dayjs()
      .subtract(1, 'year')
      .startOf('year')
      .toDate();
    const endOfLastYear = dayjs().subtract(1, 'year').endOf('year').toDate();
    this.setDateRange(startOfLastYear, endOfLastYear);
  }

  selectLastFiscalYear() {
    const startOfLastFiscalYear = dayjs()
      .month(3)
      .startOf('month')
      .subtract(1, 'year')
      .toDate();
    const endOfLastFiscalYear = dayjs().month(2).endOf('month').toDate();
    this.setDateRange(startOfLastFiscalYear, endOfLastFiscalYear);
  }

  selectLast52Weeks() {
    const startOfLast52Weeks = dayjs()
      .subtract(52, 'week')
      .startOf('week')
      .toDate();
    const endOfLast52Weeks = dayjs().subtract(1, 'week').endOf('week').toDate();
    this.setDateRange(startOfLast52Weeks, endOfLast52Weeks);
  }

  selectYearToDate() {
    const startOfYear = dayjs().startOf('year').toDate();
    const currentDate = dayjs().subtract(1, 'day').toDate();
    this.setDateRange(startOfYear, currentDate);
  }

  setDateRange(start: Date, end: Date) {
    this.dates = [start, end];
    this.emitDateChange();
  }

  onPresetSelect(event: any) {
    const presetValue = event;

    const selectedOption = this.presetOptions.find(
      (option) => option.value === presetValue,
    );
    this.presetLabel = selectedOption ? selectedOption.label : 'None';

    switch (presetValue) {
      case 'NONE':
        break;
      case 'LAST_WEEK':
        this.selectLastWeek();
        break;
      case 'LAST_MONTH':
        this.selectLastMonth();
        break;
      case 'LAST_QUARTER':
        this.selectLastQuarter();
        break;
      case 'LAST_YEAR':
        this.selectLastYear();
        break;
      case 'LAST_FISCAL_YEAR':
        this.selectLastFiscalYear();
        break;
      case 'LAST_52_WEEKS':
        this.selectLast52Weeks();
        break;
      case 'YEAR_TO_DATE':
        this.selectYearToDate();
        break;
    }
  }

  presetOptions = [
    { label: 'None', value: 'NONE' },
    { label: 'Last Week', value: 'LAST_WEEK' },
    { label: 'Last Month', value: 'LAST_MONTH' },
    { label: 'Last Quarter', value: 'LAST_QUARTER' },
    { label: 'Last Year', value: 'LAST_YEAR' },
    { label: 'Last Fiscal Year', value: 'LAST_FISCAL_YEAR' },
    { label: 'Last 52 Weeks', value: 'LAST_52_WEEKS' },
    { label: 'Year to Date', value: 'YEAR_TO_DATE' },
  ];

  selectPreset(label: string) {
    this.presetLabel = label;
  }
}
