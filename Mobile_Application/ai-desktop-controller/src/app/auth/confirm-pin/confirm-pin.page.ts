import { SQLiteService } from '../../services/sqlite.service';
import { hashPin } from '../../utils/pin.util';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonButton, IonIcon } from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  shieldCheckmarkOutline,
  backspaceOutline,
  arrowForwardOutline,
  alertCircleOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-confirm-pin',
  standalone: true,
  templateUrl: './confirm-pin.page.html',
  styleUrls: ['./confirm-pin.page.scss'],
  imports: [
    IonContent,
    IonButton,
    IonIcon
  ]
})
export class ConfirmPinPage {

  pin = '';
  originalPin = '';

  errorMessage = '';

  numbers = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9'
  ];

  dots = [1, 2, 3, 4, 5, 6];

  constructor(
  private router: Router,
  private sqliteService: SQLiteService) {

    addIcons({
      shieldCheckmarkOutline,
      backspaceOutline,
      arrowForwardOutline,
      alertCircleOutline
    });

    const pendingPin = localStorage.getItem('pending_pin');

    if (pendingPin) {
      this.originalPin = pendingPin;
    } else {
      // No PIN to confirm, return to Create PIN
      this.router.navigate(['/create-pin']);
    }
  }

  pressNumber(number: string): void {

    this.errorMessage = '';

    if (this.pin.length >= 6) {
      return;
    }

    this.pin += number;
  }

  deleteDigit(): void {

    this.errorMessage = '';

    if (this.pin.length === 0) {
      return;
    }

    this.pin = this.pin.slice(0, -1);
  }

  async confirmPin(): Promise<void> {

  if (this.pin.length !== 6) {
    return;
  }

  if (this.pin !== this.originalPin) {

    this.errorMessage = 'PINs do not match. Try again.';

    this.pin = '';

    return;
  }

  try {

    // Hash the PIN before storing it
    const pinHash = await hashPin(this.originalPin);

    // Save hashed PIN into SQLite
    await this.sqliteService.savePin(pinHash);

    // Remove temporary PIN
    localStorage.removeItem('pending_pin');

    console.log('PIN saved successfully in SQLite.');

    // Next step: QR pairing
    this.router.navigate(['/pair-device']);

  } catch (error) {

    console.error(
      'Failed to save PIN:',
      error
    );

    this.errorMessage =
      'Unable to save PIN. Please try again.';
  }
}
}