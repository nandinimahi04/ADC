import { TestBed } from '@angular/core/testing';

import { DesktopService } from './desktop.service';

describe('DesktopService', () => {
  let service: DesktopService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DesktopService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
