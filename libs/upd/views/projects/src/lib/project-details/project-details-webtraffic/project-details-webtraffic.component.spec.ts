import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectDetailsWebtrafficComponent } from './project-details-webtraffic.component';

describe('ProjectDetailsWebtrafficComponent', () => {
  let component: ProjectDetailsWebtrafficComponent;
  let fixture: ComponentFixture<ProjectDetailsWebtrafficComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProjectDetailsWebtrafficComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectDetailsWebtrafficComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
