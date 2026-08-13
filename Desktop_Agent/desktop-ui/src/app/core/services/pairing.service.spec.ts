import { TestBed } from '@angular/core/testing';

import { PairingService } from './pairing.service';

describe('PairingService', () => {
  let service: PairingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PairingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
