import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmPinPage } from './confirm-pin.page';

describe('ConfirmPinPage', () => {
  let component: ConfirmPinPage;
  let fixture: ComponentFixture<ConfirmPinPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmPinPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
