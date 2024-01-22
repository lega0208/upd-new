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
  @Input() calendarDates?: Date[];
  @Input() dateFormat = 'M dd yy';

  @Output() dateChange = new EventEmitter<Date[] | Date>();

  dates: WritableSignal<Date[]> = signal([]);

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
          this.calendarDates = dates;
        }
      },
      { allowSignalWrites: true },
    );
  }

  processDateSelection(startDate: Date, endDate: Date, isWeekSelect = false) {
    if (!startDate) {
      this.resetSelection();
      return;
    }

    if (!endDate) {
      this.minSelectableDate = startDate;
      if (isWeekSelect) {
        this.disabledDays = [0, 1, 2, 3, 4, 5];
      }
      return;
    }

    if (dayjs(endDate).isBefore(dayjs(startDate))) {
      this.resetSelection();
      return;
    }

    this.minSelectableDate = new Date(2020, 0, 1);

    if (isWeekSelect) {
      this.disabledDays = [1, 2, 3, 4, 5, 6];
    }
  }

  resetSelection(): void {
    this.dates.set([]);
    this.minSelectableDate = new Date(2020, 0, 1);
    this.disabledDays = [1, 2, 3, 4, 5, 6];
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!changes['granularity']) return;

    this.disabledDays = [];
    this.minSelectableDate = new Date(2020, 0, 1);

    if (this.granularity === 'day') {
      this.maxSelectableDate = dayjs().subtract(1, 'day').toDate();
      return;
    }

    if (this.granularity === 'week') {
      this.disabledDays = [1, 2, 3, 4, 5, 6];
      this.maxSelectableDate = dayjs()
        .subtract(1, 'week')
        .endOf('week')
        .toDate();
      return;
    }

    this.maxSelectableDate = dayjs()
      .subtract(1, 'month')
      .endOf('month')
      .toDate();
  }

  closeCalendar() {
    this.datePicker.overlayVisible = false;
  }

  resetCalendar() {
    this.dates.set([]);
    this.dateChange.emit(new Date());
  }

  handleSelect(granularity: string, date: Date) {
    if (this.dates().length === 2) {
      this.dates.set([date]);
    } else {
      this.dates.mutate((dates) => dates.push(date));
    }

    const [startDate, endDate] = this.dates();

    if (granularity === 'day') {
      this.processDateSelection(startDate, endDate);
      return;
    }

    if (granularity === 'week') {
      if (!startDate || startDate.getDay() === 6) {
        this.resetSelection();
        if (startDate && startDate.getDay() === 6) {
          this.dateChange.emit(new Date());
        }
        return;
      }
      this.processDateSelection(startDate, endDate, true);
      return;
    }

    if (granularity === 'month') {
      const selectedDate =
        this.dates().length === 2 ? dayjs(date).endOf('month') : dayjs(date);
      this.dates.mutate(
        (dates) => (dates[dates.length - 1] = selectedDate.toDate()),
      );
      this.processDateSelection(startDate, endDate);
      return;
    }
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
