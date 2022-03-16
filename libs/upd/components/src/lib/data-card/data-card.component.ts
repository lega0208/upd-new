import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-data-card',
  templateUrl: './data-card.component.html',
  styleUrls: ['./data-card.component.scss'],
})
export class DataCardComponent implements OnInit {
  @Input() current = 0;
  @Input() past = 0;
  @Input() title = '';
  arrow: string = '';
  textStyle: string = '';
  comparison = 0;
  isPast = 0;

  constructor() {}

  ngOnInit(): void {
    if (this.past > 0) {
      const difference = diff(this.current, this.past);
      const sign = getSign(difference);

      (this.arrow = sign[0]),
        (this.textStyle = sign[1]),
        (this.comparison = absoluteNum(difference));

      this.isPast = 1;
    }
  }
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
