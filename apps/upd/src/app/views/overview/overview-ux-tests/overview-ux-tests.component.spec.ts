import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OverviewUxTestsComponent } from './overview-ux-tests.component';

describe('OverviewUxTestsComponent', () => {
  let component: OverviewUxTestsComponent;
  let fixture: ComponentFixture<OverviewUxTestsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OverviewUxTestsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OverviewUxTestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
