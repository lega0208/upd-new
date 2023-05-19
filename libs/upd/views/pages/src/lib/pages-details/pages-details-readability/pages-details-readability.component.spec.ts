import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PagesDetailsReadabilityComponent } from './pages-details-readability.component';

describe('PagesDetailsReadabilityComponent', () => {
  let component: PagesDetailsReadabilityComponent;
  let fixture: ComponentFixture<PagesDetailsReadabilityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PagesDetailsReadabilityComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PagesDetailsReadabilityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
