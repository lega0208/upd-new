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
import dayjs from 'dayjs';
import { Calendar } from 'primeng/calendar';
import { EN_CA, LocaleId } from '@dua-upd/upd/i18n';
import { I18nFacade } from '@dua-upd/upd/state';
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

  private i18n = inject(I18nFacade);

  lang = signal<LocaleId>(this.i18n.service.currentLang);

  dates: WritableSignal<Date[]> = signal([]);

  dateFormat = computed(() => (this.lang() === EN_CA ? 'M dd yy' : 'dd M yy'));

  calendarDates: Date[] = [];

  presetLabel = 'None';

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

  selectedPreset: DateRangePreset = this.presetOptions[0];

  onWeekSelect(event: any): void {
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
      return;
    }

    if (dayjs(endDate).isBefore(dayjs(startDate))) {
      this.resetSelection();
      return;
    }

    this.disabledDays = [1, 2, 3, 4, 5, 6];
  }

  onMonthChange(event: any): void {
    // is this right? seems like it replaces values when it should be adding them?
    const selectedDate =
      this.dates().length === 2 ? dayjs(event).endOf('month') : dayjs(event);

    this.dates.mutate(
      (dates) => (dates[dates.length - 1] = selectedDate.toDate()),
    );
  }

  resetSelection(): void {
    this.dates.set([]);
    this.disabledDays = [1, 2, 3, 4, 5, 6];
  }

  constructor() {
    effect(() => {
      const dates = this.dates();

      if (dates.length === 0 || dates.length === 2) {
        this.dateChange.emit(dates);
      }
    });
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

  handleSelect(granularity: string, event: Date) {
    const dates = this.dates();

    switch (granularity) {
      case 'day':
        if (dates.length === 2) {
          this.dates.set([event]);
          break;
        }

        this.dates.mutate((dates) => dates.push(event));
        break;

      case 'week':
        this.onWeekSelect(event);
        break;

      case 'month':
        this.onMonthChange(event);
        break;
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
