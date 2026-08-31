import { PairingService } from '../services/pairing.service';
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

  constructor(
  private router: Router,
  private pairingService: PairingService)  {

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

        hint:
          CapacitorBarcodeScannerTypeHint.QR_CODE,

        cameraDirection:
          CapacitorBarcodeScannerCameraDirection.BACK,

        scanOrientation:
          CapacitorBarcodeScannerScanOrientation.PORTRAIT,

        scanInstructions:
          'Point your camera at the QR code displayed on your desktop.',

        scanButton:
          true,

        scanText:
          'Scan QR Code',

        android: {
          scanningLibrary:
            CapacitorBarcodeScannerAndroidScanningLibrary.MLKIT
        }

      });


    console.log(
      'QR scan result:',
      result
    );


    const scannedData =
      result.ScanResult;


    if (!scannedData) {

      console.log(
        'No QR code detected.'
      );

      return;

    }


    console.log(
      'Raw QR data:',
      scannedData
    );


    // ==========================================
    // PARSE QR DATA
    // ==========================================

    let pairingData: any;

    try {

      pairingData =
        JSON.parse(scannedData);

    } catch (error) {

      console.error(
        'Invalid QR code format:',
        error
      );

      alert(
        'This is not a valid AI Desktop Controller QR code.'
      );

      return;

    }


    // ==========================================
    // VALIDATE QR TYPE
    // ==========================================

    if (
      pairingData.type !==
      'AI_DESKTOP_CONTROLLER'
    ) {

      alert(
        'Invalid Desktop Controller QR code.'
      );

      return;

    }


    // ==========================================
    // VALIDATE REQUIRED DATA
    // ==========================================

    if (
      !pairingData.deviceId ||
      !pairingData.ipAddress ||
      !pairingData.port ||
      !pairingData.pairingToken
    ) {

      alert(
        'QR code is missing required pairing information.'
      );

      return;

    }


    console.log(
      'Desktop device:',
      pairingData.deviceName
    );

    console.log(
      'Desktop device ID:',
      pairingData.deviceId
    );

    console.log(
      'Desktop IP:',
      pairingData.ipAddress
    );

    console.log(
      'Desktop port:',
      pairingData.port
    );


    // ==========================================
    // CHECK EXPIRATION
    // ==========================================

    if (pairingData.expiresAt) {

      const expiresAt =
        new Date(
          pairingData.expiresAt
        ).getTime();

      if (
        Date.now() > expiresAt
      ) {

        alert(
          'This QR code has expired. Please generate a new QR code on the desktop.'
        );

        return;

      }

    }


    // ==========================================
    // VERIFY WITH DESKTOP AGENT
    // ==========================================

    console.log(
      'Sending pairing request to Desktop Agent...'
    );


    const response =
      await this.pairingService.verifyPairing(
        pairingData
      );


    // ==========================================
    // SUCCESS
    // ==========================================

    if (
      response.success
    ) {

      console.log(
        'Desktop Agent pairing successful.'
      );


      // Store pairing information locally
      // ONLY after successful verification.

      localStorage.setItem(
        'paired_device',
        JSON.stringify({
          deviceId:
            pairingData.deviceId,

          deviceName:
            pairingData.deviceName,

          ipAddress:
            pairingData.ipAddress,

          port:
            pairingData.port
        })
      );


      // Store authentication returned
      // by Desktop Agent.

      if (
        response.data?.authentication
      ) {

        localStorage.setItem(
          'desktop_authentication',
          JSON.stringify(
            response.data.authentication
          )
        );

      }


      console.log(
        'Device paired successfully.'
      );


      this.router.navigate(
        ['/dashboard']
      );

    }

  } catch (error) {

    console.error(
      'Pairing failed:',
      error
    );


    alert(
      error instanceof Error
        ? error.message
        : 'Failed to connect to Desktop Agent.'
    );

  }

}

}