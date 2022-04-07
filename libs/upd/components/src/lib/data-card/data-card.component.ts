import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-data-card',
  templateUrl: './data-card.component.html',
  styleUrls: ['./data-card.component.scss'],
})
export class DataCardComponent {
  @Input() current: string | number = '';
  @Input() past = 0;
  @Input() comparison = 0;
  @Input() title = '';
  @Input() tooltip = '';
  arrow: string = '';
  textStyle: string = '';
  isPast = 0;

  constructor() {}
}

const diff = (a: number, b: number) => {
  return (a - b) / b;
};

const percDiff = (a: number, b: number) => {
  const diff = Math.round(((a - b) / b) * 100);
  return diff > 0 ? `+ ${Math.abs(diff)}%` : `- ${Math.abs(diff)}%`;
};

const absoluteNum = (num: number) => {
  return Math.abs(num);
};

const getSign = (diff: number) => {
  const m =
    Math.sign(diff) === -1
      ? 'arrow_downward:text-danger'
      : 'arrow_upward:text-success';
  return m.split(':');
};
