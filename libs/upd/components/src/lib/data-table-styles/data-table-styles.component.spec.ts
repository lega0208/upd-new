import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataTableStylesComponent } from './data-table-styles.component';

describe('DataTableStylesComponent', () => {
  let component: DataTableStylesComponent;
  let fixture: ComponentFixture<DataTableStylesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DataTableStylesComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DataTableStylesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
