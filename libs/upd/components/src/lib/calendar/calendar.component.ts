import {
  Component,
  ViewChild,
  Output,
  EventEmitter,
  Input,
  SimpleChanges,
  OnChanges,
  ViewEncapsulation,
  signal,
  WritableSignal,
  effect,
} from '@angular/core';
import dayjs from 'dayjs';
import { Calendar } from 'primeng/calendar';
import { dateRangeConfigs } from '@dua-upd/utils-common';

export type DateRangePreset = {
  label: string;
  value: {
    start: Date;
    end: Date;
  } | null;
};

@Component({
  selector: 'upd-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class CalendarComponent implements OnChanges {
  @ViewChild('myCalendar') datePicker!: Calendar;

  @Input() granularity = 'day';
  @Input() showPreset = false;
  @Input() showAction = false;
  @Input() required = false;
  @Input() dateFormat = 'M dd yy';
  @Input() invalid = false;
  @Input() set initialDates(dates: [Date, Date] | undefined) {
    this.calendarDates = dates?.length ? dates : undefined;
  }

  @Output() dateChange = new EventEmitter<Date[] | Date>();

  calendarDates?: Date[] = this.initialDates;

  dates: WritableSignal<Date[]> = signal(this.initialDates || []);

  minSelectableDate: Date = new Date(2020, 0, 1);
  maxSelectableDate = dayjs().subtract(1, 'day').toDate();

  startOfWeek = dayjs().startOf('week').toDate();

  disabledDays: number[] = [1, 2, 3, 4, 5, 6];
  disabledDates: Date[] = [this.startOfWeek];

  presetOptions: DateRangePreset[] = [
    {
      label: 'None',
      value: null,
    },
    ...dateRangeConfigs.map((config) => {
      const dateRange = config.getDateRange();
      return {
        label: config.label,
        value: {
          start: dateRange.start.toDate(),
          end: dateRange.end.toDate(),
        },
      };
    }),
  ];

  constructor() {
    effect(
      () => {
        const dates = this.dates();

        if (dates.length === 0 || dates.length === 2) {
          this.dateChange.emit(dates);
        }
      },
      { allowSignalWrites: true },
    );
  }

  processDateSelection(
    startDate: Date,
    endDate: Date,
    currentDate: Date,
    isWeekSelect = false,
  ) {
    if (!startDate) {
      this.resetSelection();
    }

    if (!endDate && isWeekSelect) {
      this.minSelectableDate = startDate;
      this.disabledDays = [0, 1, 2, 3, 4, 5];
      return;
    }

    if (dayjs(endDate).isBefore(dayjs(startDate))) {
      this.resetSelection();
      this.dates.set([currentDate]);
    }

    if (isWeekSelect) {
      this.minSelectableDate = new Date(2020, 0, 1);
      this.disabledDays = [1, 2, 3, 4, 5, 6];
    }
  }

  resetSelection(): void {
    this.dates.set([]);
    this.minSelectableDate = new Date(2020, 0, 1);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!changes['granularity']) return;

    if (this.granularity === 'month') {
      this.maxSelectableDate = dayjs()
        .subtract(1, 'month')
        .endOf('month')
        .toDate();
      return;
    }

    if (this.granularity === 'week') {
      this.minSelectableDate = new Date(2020, 0, 1);
      this.disabledDays = [1, 2, 3, 4, 5, 6];
      this.maxSelectableDate = dayjs()
        .subtract(1, 'week')
        .endOf('week')
        .toDate();

      return;
    }

    this.maxSelectableDate = dayjs().subtract(1, 'day').toDate();
  }

  closeCalendar() {
    this.datePicker.overlayVisible = false;
  }

  resetCalendar() {
    this.datePicker.clear();
    this.minSelectableDate = new Date(2020, 0, 1);
    this.dates.set([]);
  }

  handleSelect(granularity: string, date: Date) {
    if (this.dates().length === 2) {
      this.dates.set([date]);
    } else {
      this.dates.mutate((dates) => dates.push(date));
    }

    const [startDate, endDate] = this.dates();

    if (granularity === 'week') {
      if (!startDate || startDate.getDay() === 6) {
        this.resetSelection();
        return;
      }
      this.processDateSelection(startDate, endDate, date, true);
      return;
    }

    if (granularity === 'month') {
      const selectedDate =
        this.dates().length === 2 ? dayjs(date).endOf('month') : dayjs(date);
      this.dates.mutate(
        (dates) => (dates[dates.length - 1] = selectedDate.toDate()),
      );
      this.processDateSelection(startDate, endDate, date);
      return;
    }

    this.processDateSelection(startDate, endDate, date);
  }

  onPresetSelect(preset: DateRangePreset['value']) {
    if (!preset) {
      return;
    }

    const { start, end } = preset;

    // make sure timezone offset is correct
    this.dates.set([start, end]);
  }
}
