import { Component, Input, effect, inject } from '@angular/core';
import dayjs from 'dayjs';
import localeData from 'dayjs/plugin/localeData';
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { ColumnConfig } from '@dua-upd/types-common';
import { I18nFacade } from '@dua-upd/upd/state';
import { FR_CA } from '@dua-upd/upd/i18n';

dayjs.extend(localeData);
dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);

interface Cell {
  date: string;
  sum: number;
  fillColour?: string;
  textColour?: string;
  isEmpty?: boolean;
}

interface ColorThresholds {
  [key: string]: string;
}

@Component({
  selector: 'upd-heatmap',
  templateUrl: './heatmap.component.html',
  styleUrls: ['./heatmap.component.scss'],
})
export class HeatmapComponent<T> {
  private i18n = inject(I18nFacade);
  currentLang = this.i18n.currentLang;

  @Input() data: Cell[] = [];
  calendarMonths: Cell[][][] = [];
  weekDays: string[] = dayjs.weekdaysMin();
  dateParams = this.currentLang() == FR_CA ? 'd MMM YYYY' : 'MMM dd, YYYY';
  minSum = Infinity;
  maxSum = -Infinity;
  activeColor = '';
  colorThresholds: ColorThresholds = {
    lowest: '#FFF9C4',
    low: '#FFEB3B',
    medium: '#FFB74D',
    high: '#FF8000',
    highest: '#D32F2F',
  };
  @Input() table: T[] = [];
  @Input() tableCols: ColumnConfig[] = [];

  constructor() {
    effect(() => {
      this.currentLang();

      dayjs.locale(this.currentLang());
      this.weekDays = dayjs.weekdaysMin();
    });

    effect(() => {
      this.initCalendar();
    });
  }

  initCalendar() {
    if (!this.data.length) return;
    this.calculateMinMaxSums();
    this.populateCalendarMonths();
  }

  populateCalendarMonths() {
    let currentMonth = dayjs(this.data[0].date).startOf('month');
    const endMonth = dayjs(this.data[this.data.length - 1].date).startOf(
      'month',
    );

    while (currentMonth.isSameOrBefore(endMonth, 'month')) {
      this.calendarMonths.push(this.generateMonthCalendar(currentMonth));
      currentMonth = currentMonth.add(1, 'month');
    }
  }

  generateMonthCalendar(startOfMonth: dayjs.Dayjs): Cell[][] {
    const daysInMonth = startOfMonth.daysInMonth();
    const rows: Cell[][] = [];
    let week: Cell[] = new Array(startOfMonth.day()).fill(null).map(() => this.emptyCell());  // Ensuring week starts from Sunday
    
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDay = startOfMonth.add(day - 1, 'day');
      const cell = this.data.find(d => dayjs(d.date).isSame(currentDay, 'day'));
      
      if (cell) {
        week.push(this.createCell(cell));
      } else {
        week.push(this.emptyCell());
      }
      
      if (currentDay.day() === 6) {
        rows.push(week);
        week = [];
      }
    }
    
    if (week.length > 0) {
      while (week.length < 7) {
        week.push(this.emptyCell());
      }
      rows.push(week);
    }
    
    return rows;
  }

  fillInitialWeekDays(startOfMonth: dayjs.Dayjs, week: Cell[]): void {
    for (let i = 0; i < startOfMonth.day(); i++) {
      week.push(this.emptyCell());
    }
  }

  fillWeekDaysUntilCurrent(cellDate: dayjs.Dayjs, week: Cell[]): void {
    while (cellDate.day() !== week.length) {
      week.push(this.emptyCell());
    }
  }

  createCell(cell: Cell): Cell {
    return {
      ...cell,
      fillColour: this.getFillColor(cell.sum),
      textColour: this.getTextColor(cell.sum),
      isEmpty: false,
    };
  }

  completeWeekRows(week: Cell[], rows: Cell[][]): void {
    while (week.length < 7) {
      week.push(this.emptyCell());
    }
    if (week.length) rows.push(week);
  }

  calculateMinMaxSums(): void {
    this.data.forEach((cell) => {
      this.minSum = Math.min(this.minSum, cell.sum);
      this.maxSum = Math.max(this.maxSum, cell.sum);
    });
  }

  getFillColor(sum: number): string {
    const normalizedValue = (sum - this.minSum) / (this.maxSum - this.minSum);
    if (normalizedValue >= 0.8) return this.colorThresholds['highest'];
    if (normalizedValue >= 0.6) return this.colorThresholds['high'];
    if (normalizedValue >= 0.4) return this.colorThresholds['medium'];
    if (normalizedValue >= 0.2) return this.colorThresholds['low'];
    return this.colorThresholds['lowest'];
  }

  getTextColor(sum: number): string {
    return (sum - this.minSum) / (this.maxSum - this.minSum) <= 0.6 ? '#111' : '#fff';
  }

  emptyCell(): Cell {
    return { date: '', sum: 0, fillColour: '', textColour: '', isEmpty: true };
  }

  objectKeys(obj: ColorThresholds): string[] {
    return Object.keys(obj);
  }

  setActiveColor(color: string): void {
    this.activeColor = color;
  }

  getMonthStartDate(monthIndex: number): string {
    return dayjs(this.data[0].date)
      .add(monthIndex, 'month')
      .startOf('month')
      .format('YYYY-MM-DD');
  }

  toggleActiveColor(color: string): void {
    this.activeColor = this.activeColor === color ? '' : color;
  }

  hasColoredCells(month: any[]): boolean {
    return month.some((row) =>
      row.some(
        (cell: { isEmpty: boolean; fillColour: string }) =>
          !cell.isEmpty && cell.fillColour,
      ),
    );
  }

  isCellHidden(cell: Cell): boolean {
    return this.activeColor !== '' && cell.fillColour !== this.activeColor;
  }
}
