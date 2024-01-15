import {
  Component,
  inject,
  ViewChild,
  Output,
  EventEmitter,
  Input,
  SimpleChanges,
  OnChanges,
  ViewEncapsulation,
  signal,
  computed,
  WritableSignal,
  effect,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import dayjs from 'dayjs';
import { Calendar } from 'primeng/calendar';
import { EN_CA, I18nService, LocaleId } from '@dua-upd/upd/i18n';
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

  @Output() dateChange = new EventEmitter<Date[] | Date>();

  private i18n = inject(I18nService);

  lang = this.i18n.langSignal;

  dates: WritableSignal<Date[]> = signal([]);

  dateFormat = computed(() => (this.lang() === EN_CA ? 'M dd yy' : 'dd M yy'));

  calendarDates?: Date[];

  minSelectableDate: Date = new Date(2020, 0, 1);
  maxSelectableDate = dayjs().subtract(1, 'day').toDate();

  startOfWeek = dayjs().startOf('week').toDate();

  disabledDays: number[] = [1, 2, 3, 4, 5, 6];
  disabledDates: Date[] = [this.startOfWeek];

  presetOptions: DateRangePreset[] = [
    {
      label: this.lang() === EN_CA ? 'None' : 'Aucun',
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
        // don't run this effect on init
        if (!this.calendarDates) return;

        const dates = this.dates();

        if (dates.length === 0 || dates.length === 2) {
          this.calendarDates = dates;
          this.dateChange.emit(dates);
        }
      },
      { allowSignalWrites: true },
    );
  }

  onWeekSelect() {
    const [startDate, endDate] = this.dates();

    if (!startDate) {
      this.resetSelection();
      return;
    }

    if (startDate.getDay() === 6) {
      this.resetSelection();
      this.dateChange.emit(new Date());
      return;
    }

    if (!endDate) {
      this.disabledDays = [0, 1, 2, 3, 4, 5];
      this.minSelectableDate = startDate;
      return;
    }

    if (dayjs(endDate).isBefore(dayjs(startDate))) {
      this.resetSelection();
      return;
    }

    this.minSelectableDate = new Date(2020, 0, 1);
    this.disabledDays = [1, 2, 3, 4, 5, 6];
  }

  onMonthChange(date: Date): void {
    // is this right? seems like it replaces values when it should be adding them?
    const selectedDate =
      this.dates().length === 2 ? dayjs(date).endOf('month') : dayjs(date);

    this.dates.mutate(
      (dates) => (dates[dates.length - 1] = selectedDate.toDate()),
    );
  }

  resetSelection(): void {
    this.dates.set([]);
    this.minSelectableDate = new Date(2020, 0, 1);
    this.disabledDays = [1, 2, 3, 4, 5, 6];
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!changes['granularity']) return;

    if (this.granularity === 'day') {
      this.maxSelectableDate = dayjs().subtract(1, 'day').toDate();
      return;
    }

    if (this.granularity === 'week') {
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

    if (granularity === 'week') {
      this.onWeekSelect();
      return;
    }

    if (granularity === 'month') {
      this.onMonthChange(date);
      return;
    }
  }

  onPresetSelect(preset: DateRangePreset['value']) {
    if (!preset) {
      return;
    }

    console.log(preset);

    const { start, end } = preset;

    // make sure timezone offset is correct
    this.dates.set([start, end]);
  }
}
