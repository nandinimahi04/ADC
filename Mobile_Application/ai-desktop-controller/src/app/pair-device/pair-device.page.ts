import { Component } from '@angular/core';
import { Router } from '@angular/router';

import {
  IonContent,
  IonButton,
  IonIcon
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';

import {
  arrowBackOutline,
  qrCodeOutline,
  cameraOutline,
  informationCircleOutline,
  scanOutline,
  shieldCheckmarkOutline
} from 'ionicons/icons';

import {
  CapacitorBarcodeScanner,
  CapacitorBarcodeScannerTypeHint,
  CapacitorBarcodeScannerCameraDirection,
  CapacitorBarcodeScannerScanOrientation,
  CapacitorBarcodeScannerAndroidScanningLibrary
} from '@capacitor/barcode-scanner';

@Component({
  selector: 'app-pair-device',
  standalone: true,
  templateUrl: './pair-device.page.html',
  styleUrls: ['./pair-device.page.scss'],
  imports: [
    IonContent,
    IonButton,
    IonIcon
  ]
})
export class PairDevicePage {

  constructor(private router: Router) {

    addIcons({
      arrowBackOutline,
      qrCodeOutline,
      cameraOutline,
      informationCircleOutline,
      scanOutline,
      shieldCheckmarkOutline
    });

  }

  goBack(): void {

    this.router.navigate(['/login']);

  }

  async startScanner(): Promise<void> {

    try {

      console.log('Starting QR scanner...');

      const result =
        await CapacitorBarcodeScanner.scanBarcode({

          // Only scan QR codes
          hint: CapacitorBarcodeScannerTypeHint.QR_CODE,

          // Use rear camera
          cameraDirection:
            CapacitorBarcodeScannerCameraDirection.BACK,

          // Portrait mode
          scanOrientation:
            CapacitorBarcodeScannerScanOrientation.PORTRAIT,

          // Scanner instructions
          scanInstructions:
            'Point your camera at the QR code displayed on your desktop.',

          // Show scanner button
          scanButton: true,

          scanText: 'Scan QR Code',

          // Android scanner library
          android: {
            scanningLibrary:
              CapacitorBarcodeScannerAndroidScanningLibrary.MLKIT
          }

        });

      console.log('QR scan result:', result);

      const scannedData = result.ScanResult;

      if (!scannedData) {

        console.log('No QR code detected.');

        return;

      }

      console.log('QR code data:', scannedData);

      /*
       * Temporary pairing storage.
       *
       * Later we will replace this with the
       * real desktop-device validation/pairing logic.
       */
      localStorage.setItem(
        'paired_device',
        scannedData
      );

      console.log('Device paired successfully.');

      this.router.navigate(['/dashboard']);

    } catch (error) {

      console.error(
        'QR scanner error:',
        error
      );

    }

  }

}