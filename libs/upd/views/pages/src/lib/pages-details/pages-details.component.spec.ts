import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PagesDetailsComponent } from './pages-details.component';

describe('PageDetailsComponent', () => {
  let component: PagesDetailsComponent;
  let fixture: ComponentFixture<PagesDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PagesDetailsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PagesDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
