import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PagesDetailsCoreWebVitalsComponent } from './pages-details-core-web-vitals.component';

describe('PagesDetailsCoreWebVitalsComponent', () => {
  let component: PagesDetailsCoreWebVitalsComponent;
  let fixture: ComponentFixture<PagesDetailsCoreWebVitalsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PagesDetailsCoreWebVitalsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PagesDetailsCoreWebVitalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});