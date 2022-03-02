import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupedVerticalBarChartComponent } from './grouped-vertical-bar-chart.component';

describe('GroupedVerticalBarChartComponent', () => {
  let component: GroupedVerticalBarChartComponent;
  let fixture: ComponentFixture<GroupedVerticalBarChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GroupedVerticalBarChartComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupedVerticalBarChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
