import { Component } from '@angular/core';
import { Router } from '@angular/router';

import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  backspaceOutline,
  alertCircleOutline,
  shieldCheckmarkOutline,
  checkmarkCircleOutline
} from 'ionicons/icons';

import { SQLiteService } from '../../services/sqlite.service';
import { hashPin } from '../../utils/pin.util';

type Step = 'old' | 'new' | 'confirm' | 'done';

@Component({
  selector: 'app-change-pin',
  standalone: true,
  templateUrl: './change-pin.page.html',
  styleUrls: ['./change-pin.page.scss'],
  imports: [
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon
  ]
})
export class ChangePinPage {

  readonly PIN_LENGTH = 6;
  readonly MAX_OLD_PIN_ATTEMPTS = 5;

  step: Step = 'old';

  pin = '';
  private newPin = '';

  errorMessage = '';
  shake = false;
  busy = false;

  private failedAttempts = 0;

  dots = Array.from({ length: this.PIN_LENGTH }, (_, i) => i);

  numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  constructor(
    private router: Router,
    private sqliteService: SQLiteService
  ) {
    addIcons({
      arrowBackOutline,
      backspaceOutline,
      alertCircleOutline,
      shieldCheckmarkOutline,
      checkmarkCircleOutline
    });
  }

  // Each time the page opens, start from the first step.
  ionViewWillEnter(): void {
    this.reset();
  }

  private reset(): void {
    this.step = 'old';
    this.pin = '';
    this.newPin = '';
    this.errorMessage = '';
    this.failedAttempts = 0;
    this.busy = false;
  }

  // ============================================================
  // TEXT SHOWN FOR EACH STEP
  // ============================================================

  get title(): string {
    switch (this.step) {
      case 'old':     return 'Enter Current PIN';
      case 'new':     return 'Create New PIN';
      case 'confirm': return 'Confirm New PIN';
      default:        return 'PIN Changed';
    }
  }

  get subtitle(): string {
    switch (this.step) {
      case 'old':     return 'Enter your current 6-digit PIN to continue';
      case 'new':     return 'Choose a new 6-digit PIN';
      case 'confirm': return 'Enter the new PIN again to confirm';
      default:        return 'Your new PIN is now active';
    }
  }

  get stepNumber(): number {
    return this.step === 'old' ? 1 : this.step === 'new' ? 2 : 3;
  }

  // ============================================================
  // KEYPAD
  // ============================================================

  pressNumber(digit: string): void {

    if (this.busy || this.step === 'done') return;

    this.errorMessage = '';

    if (this.pin.length >= this.PIN_LENGTH) return;

    this.pin += digit;

    if (this.pin.length === this.PIN_LENGTH) {
      // Small delay so the last dot is visible before moving on.
      setTimeout(() => void this.onPinComplete(), 150);
    }
  }

  deleteDigit(): void {

    if (this.busy || this.step === 'done') return;

    this.errorMessage = '';
    this.pin = this.pin.slice(0, -1);
  }

  private async onPinComplete(): Promise<void> {

    this.busy = true;

    try {

      if (this.step === 'old') {
        await this.verifyOldPin();
      } else if (this.step === 'new') {
        await this.acceptNewPin();
      } else if (this.step === 'confirm') {
        await this.confirmNewPin();
      }

    } catch (error) {

      console.error('Change PIN failed:', error);

      this.errorMessage = 'Something went wrong. Please try again.';
      this.pin = '';

    } finally {
      this.busy = false;
    }
  }

  // ============================================================
  // STEP 1 - CURRENT PIN
  // ============================================================

  private async verifyOldPin(): Promise<void> {

    const savedHash = await this.sqliteService.getPinHash();

    if (!savedHash) {
      this.errorMessage = 'No PIN found on this device.';
      this.pin = '';
      return;
    }

    const enteredHash = await hashPin(this.pin);

    if (enteredHash !== savedHash) {

      this.failedAttempts++;

      if (this.failedAttempts >= this.MAX_OLD_PIN_ATTEMPTS) {
        // Too many wrong tries - leave the screen.
        await this.router.navigate(['/settings']);
        return;
      }

      const left = this.MAX_OLD_PIN_ATTEMPTS - this.failedAttempts;

      this.showError(
        `Incorrect PIN. ${left} ${left === 1 ? 'attempt' : 'attempts'} left.`
      );
      return;
    }

    // Correct
    this.step = 'new';
    this.pin = '';
  }

  // ============================================================
  // STEP 2 - NEW PIN
  // ============================================================

  private async acceptNewPin(): Promise<void> {

    const savedHash = await this.sqliteService.getPinHash();
    const newHash = await hashPin(this.pin);

    if (savedHash && newHash === savedHash) {
      this.showError('New PIN must be different from your current PIN.');
      return;
    }

    this.newPin = this.pin;
    this.step = 'confirm';
    this.pin = '';
  }

  // ============================================================
  // STEP 3 - CONFIRM NEW PIN
  // ============================================================

  private async confirmNewPin(): Promise<void> {

    if (this.pin !== this.newPin) {

      // Go back so the user can choose the new PIN again.
      this.newPin = '';
      this.step = 'new';
      this.showError('PINs did not match. Enter your new PIN again.');
      return;
    }

    const newHash = await hashPin(this.newPin);

    await this.sqliteService.savePin(newHash);

    this.newPin = '';
    this.pin = '';
    this.errorMessage = '';
    this.step = 'done';
  }

  // ============================================================
  // NAVIGATION
  // ============================================================

  goBack(): void {

    if (this.busy) return;

    this.errorMessage = '';
    this.pin = '';

    if (this.step === 'confirm') {
      this.newPin = '';
      this.step = 'new';
      return;
    }

    if (this.step === 'new') {
      this.step = 'old';
      return;
    }

    this.router.navigate(['/settings']);
  }

  finish(): void {
    this.router.navigate(['/settings']);
  }

  private showError(message: string): void {

    this.errorMessage = message;
    this.shake = true;

    setTimeout(() => { this.shake = false; }, 450);
    setTimeout(() => { this.pin = ''; }, 200);
  }
}