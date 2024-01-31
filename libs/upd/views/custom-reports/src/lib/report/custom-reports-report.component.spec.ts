import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomReportsReportComponent } from './custom-reports-report.component';

describe('CustomReportsReportComponent', () => {
  let component: CustomReportsReportComponent;
  let fixture: ComponentFixture<CustomReportsReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomReportsReportComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomReportsReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
