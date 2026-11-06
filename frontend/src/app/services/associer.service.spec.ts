import { TestBed } from '@angular/core/testing';

import { AssocierService } from './associer.service';

describe('AssocierService', () => {
  let service: AssocierService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AssocierService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
