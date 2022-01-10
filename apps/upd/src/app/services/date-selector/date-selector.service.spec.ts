import { TestBed } from '@angular/core/testing';

import { DateSelectorService } from './date-selector.service';

describe('DateSelectorService', () => {
  let service: DateSelectorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DateSelectorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
