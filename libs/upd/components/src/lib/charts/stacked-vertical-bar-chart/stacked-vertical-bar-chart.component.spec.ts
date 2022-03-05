import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StackedVerticalBarChartComponent } from './stacked-vertical-bar-chart.component';

describe('StackedVerticalBarChartComponent', () => {
  let component: StackedVerticalBarChartComponent;
  let fixture: ComponentFixture<StackedVerticalBarChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StackedVerticalBarChartComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StackedVerticalBarChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
