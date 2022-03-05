import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OverviewWebtrafficComponent } from './overview-webtraffic.component';

describe('OverviewWebtrafficComponent', () => {
  let component: OverviewWebtrafficComponent;
  let fixture: ComponentFixture<OverviewWebtrafficComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OverviewWebtrafficComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OverviewWebtrafficComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
