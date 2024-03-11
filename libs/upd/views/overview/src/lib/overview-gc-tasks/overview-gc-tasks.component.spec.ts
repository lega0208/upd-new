import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OverviewGCTasksComponent } from './overview-gc-tasks.component';

describe('OverviewGCTasksComponent', () => {
  let component: OverviewGCTasksComponent;
  let fixture: ComponentFixture<OverviewGCTasksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OverviewGCTasksComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OverviewGCTasksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
