import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApexExampleComponent } from './apex-donut.component';

describe('ApexExampleComponent', () => {
  let component: ApexExampleComponent;
  let fixture: ComponentFixture<ApexExampleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ApexExampleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ApexExampleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
