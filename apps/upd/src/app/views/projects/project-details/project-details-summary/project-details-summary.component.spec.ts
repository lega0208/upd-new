import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectDetailsSummaryComponent } from './project-details-summary.component';

describe('ProjectDetailsSummaryComponent', () => {
  let component: ProjectDetailsSummaryComponent;
  let fixture: ComponentFixture<ProjectDetailsSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProjectDetailsSummaryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectDetailsSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
