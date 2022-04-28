import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataKpiTableComponent } from './data-kpi-table.component';

describe('DataKpiTableComponent', () => {
  let component: DataKpiTableComponent;
  let fixture: ComponentFixture<DataKpiTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DataKpiTableComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DataKpiTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
