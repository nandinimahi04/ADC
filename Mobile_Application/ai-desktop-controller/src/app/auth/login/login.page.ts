import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonIcon
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { SQLiteService } from '../../services/sqlite.service';
import { hashPin } from '../../utils/pin.util';

import { addIcons } from 'ionicons';
import {
  lockClosed,
  shieldCheckmark,
  wifi,
  fingerPrint,
  backspace,
  alertCircle
} from 'ionicons/icons';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonIcon
  ],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss']
})
export class LoginPage {

  readonly MAX_PIN_LENGTH = 6;

  pin = '';
  errorMessage = '';
  shake = false;

  dots = Array(this.MAX_PIN_LENGTH);

  firstNine = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9'
  ];

  constructor(
  private router: Router,
  private sqliteService: SQLiteService) {

    addIcons({
      lockClosed,
      shieldCheckmark,
      wifi,
      fingerPrint,
      backspace,
      alertCircle
    });

  }

  pressNumber(number: string): void {

    this.errorMessage = '';

    if (this.pin.length >= this.MAX_PIN_LENGTH) {
      return;
    }

    this.pin += number;

    if (this.pin.length === this.MAX_PIN_LENGTH) {
      this.authenticate();
    }

  }

  deleteDigit(): void {

    this.errorMessage = '';

    if (this.pin.length === 0) {
      return;
    }

    this.pin = this.pin.slice(0, -1);

  }

  fingerprintLogin(): void {

    alert('Biometric authentication will be added in Phase 2');

  }

  async authenticate(): Promise<void> {

  try {

    // Get the hashed PIN stored in SQLite
    const savedPinHash =
      await this.sqliteService.getPinHash();

    if (!savedPinHash) {

      this.errorMessage =
        'No PIN found. Please create a PIN first.';

      this.pin = '';

      return;
    }

    // Hash the PIN entered by the user
    const enteredPinHash =
      await hashPin(this.pin);

    // Compare the two hashes
    if (enteredPinHash !== savedPinHash) {

      this.errorMessage =
        'Incorrect PIN. Try again.';

      this.shake = true;

      setTimeout(() => {
        this.shake = false;
      }, 450);

      setTimeout(() => {
        this.pin = '';
      }, 200);

      return;
    }

    // PIN is correct
    const pairedDevice =
      localStorage.getItem('paired_device');

    if (pairedDevice) {

      this.router.navigate(['/dashboard']);

    } else {

      this.router.navigate(['/pair-device']);

    }

  } catch (error) {

    console.error(
      'PIN authentication failed:',
      error
    );

    this.errorMessage =
      'Unable to verify PIN. Please try again.';

    this.pin = '';
  }
}

}