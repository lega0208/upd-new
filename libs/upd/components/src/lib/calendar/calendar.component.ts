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
  OnInit,
} from '@angular/core';
import { EN_CA } from '@dua-upd/upd/i18n';
import { DateSelectionFacade } from '@dua-upd/upd/state';
import { I18nFacade } from '@dua-upd/upd/state';
import { dateRangeConfigs, getPeriodDateRange, today } from '@dua-upd/utils-common';
import dayjs from 'dayjs';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'upd-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class CalendarComponent implements OnInit, OnChanges {
  private i18n = inject(I18nFacade);
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

  presetOptions = [
    {
      label: 'None',
      value: 'none',
      dateRange: { start: '', end: '' }
    },
    ...dateRangeConfigs.map(config => {
      const dateRange = config.getDateRange();
      return {
        label: config.label,
        value: config.type,
        dateRange: {
          start: dateRange.start.format('YYYY-MM-DD'),
          end: dateRange.end.format('YYYY-MM-DD'),
        },
      };
    }).flat()
  ];

  lang = this.i18n.service.currentLang;
  dateFormat = this.lang === 'fr-CA' ? 'dd M yy' : 'M dd yy'

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

  ngOnInit(): void {
    combineLatest([
      this.i18n.currentLang$
    ]).subscribe(([lang]) => {
      this.dateFormat = lang === 'fr-CA' ? 'dd M yy' : 'M dd yy'
    })
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

    if (this.presetLabel !== 'None') {
      this.setDateRange(dayjs(selectedOption?.dateRange.start).toDate(), dayjs(selectedOption?.dateRange.end).toDate());
    }
  }

  selectPreset(label: string) {
    this.presetLabel = label;
  }
}
