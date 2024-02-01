import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomReportsCreateComponent } from './custom-reports-create.component';

describe('CustomReportsCreateComponent', () => {
  let component: CustomReportsCreateComponent;
  let fixture: ComponentFixture<CustomReportsCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomReportsCreateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomReportsCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
