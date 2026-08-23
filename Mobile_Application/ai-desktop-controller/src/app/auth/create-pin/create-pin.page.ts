import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  shieldCheckmarkOutline,
  backspaceOutline,
  arrowForwardOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-create-pin',
  standalone: true,
  templateUrl: './create-pin.page.html',
  styleUrls: ['./create-pin.page.scss'],
  imports: [
    IonContent,
    IonButton,
    IonIcon
  ]
})
export class CreatePinPage {

  pin = '';

  numbers = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9'
  ];

  dots = [1, 2, 3, 4, 5, 6];

  constructor(private router: Router) {

    addIcons({
      shieldCheckmarkOutline,
      backspaceOutline,
      arrowForwardOutline
    });

  }

  pressNumber(number: string): void {

    // Maximum 6 digits
    if (this.pin.length >= 6) {
      return;
    }

    this.pin += number;

  }

  deleteDigit(): void {

    if (this.pin.length === 0) {
      return;
    }

    this.pin = this.pin.slice(0, -1);

  }

  continue(): void {

    if (this.pin.length !== 6) {
      return;
    }

    // Temporarily store the PIN.
    // We will replace this with proper secure storage later.
    localStorage.setItem('pending_pin', this.pin);

    // Next step: confirm PIN
    this.router.navigate(['/confirm-pin']);

  }

}