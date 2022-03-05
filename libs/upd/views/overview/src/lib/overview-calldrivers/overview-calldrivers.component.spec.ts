import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OverviewCalldriversComponent } from './overview-calldrivers.component';

describe('OverviewCalldriversComponent', () => {
  let component: OverviewCalldriversComponent;
  let fixture: ComponentFixture<OverviewCalldriversComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OverviewCalldriversComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OverviewCalldriversComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
