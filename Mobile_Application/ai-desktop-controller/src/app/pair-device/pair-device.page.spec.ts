import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PairDevicePage } from './pair-device.page';

describe('PairDevicePage', () => {
  let component: PairDevicePage;
  let fixture: ComponentFixture<PairDevicePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PairDevicePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
