import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageDetailsWebtrafficComponent } from './page-details-webtraffic.component';

describe('PageDetailsWebtrafficComponent', () => {
  let component: PageDetailsWebtrafficComponent;
  let fixture: ComponentFixture<PageDetailsWebtrafficComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PageDetailsWebtrafficComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PageDetailsWebtrafficComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
