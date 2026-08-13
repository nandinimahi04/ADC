import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PairingComponent } from './pairing.component';

describe('PairingComponent', () => {
  let component: PairingComponent;
  let fixture: ComponentFixture<PairingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PairingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PairingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
