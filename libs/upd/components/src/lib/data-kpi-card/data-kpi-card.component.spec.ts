import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataKpiCardComponent } from './data-kpi-card.component';

describe('DataKpiCardComponent', () => {
  let component: DataKpiCardComponent;
  let fixture: ComponentFixture<DataKpiCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DataKpiCardComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DataKpiCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
