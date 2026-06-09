import { TestBed } from '@angular/core/testing';

import { ProductionCompanyService } from './production-company.service';

describe('ProductionCompanyService', () => {
  let service: ProductionCompanyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProductionCompanyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
