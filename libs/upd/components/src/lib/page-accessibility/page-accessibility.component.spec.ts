import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PageAccessibilityComponent } from './page-accessibility.component';

describe('PageAccessibilityComponent', () => {
  let component: PageAccessibilityComponent;
  let fixture: ComponentFixture<PageAccessibilityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PageAccessibilityComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PageAccessibilityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});