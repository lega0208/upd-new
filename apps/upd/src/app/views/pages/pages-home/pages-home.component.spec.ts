import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PagesHomeComponent } from './pages-home.component';

describe('PagesHomeComponent', () => {
  let component: PagesHomeComponent;
  let fixture: ComponentFixture<PagesHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PagesHomeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PagesHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
