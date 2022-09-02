import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataTableExportsComponent } from './data-table-exports.component';

describe('DataTableExportsComponent', () => {
  let component: DataTableExportsComponent;
  let fixture: ComponentFixture<DataTableExportsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DataTableExportsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DataTableExportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
