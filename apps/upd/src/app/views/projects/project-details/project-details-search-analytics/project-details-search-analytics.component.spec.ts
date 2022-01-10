import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectDetailsSearchAnalyticsComponent } from './project-details-search-analytics.component';

describe('ProjectDetailsSearchAnalyticsComponent', () => {
  let component: ProjectDetailsSearchAnalyticsComponent;
  let fixture: ComponentFixture<ProjectDetailsSearchAnalyticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProjectDetailsSearchAnalyticsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectDetailsSearchAnalyticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
