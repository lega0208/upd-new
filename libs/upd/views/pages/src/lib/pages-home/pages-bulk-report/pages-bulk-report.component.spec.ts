import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PagesBulkReportComponent } from './pages-bulk-report.component';

describe('PageDetailsSummaryComponent', () => {
  let component: PagesBulkReportComponent;
  let fixture: ComponentFixture<PagesBulkReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PagesBulkReportComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PagesBulkReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
