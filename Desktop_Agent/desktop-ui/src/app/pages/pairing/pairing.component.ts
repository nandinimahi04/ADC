import {
  Component,
  OnInit,
  OnDestroy,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  DesktopAgentService,
  PairingData
} from '../../core/services/desktop-agent.service';


@Component({
  selector: 'app-pairing',
  standalone: true,
  imports: [
  CommonModule
],
  templateUrl: './pairing.component.html',
  styleUrl: './pairing.component.scss'
})
export class PairingComponent
  implements OnInit, OnDestroy {

  private readonly desktopAgent =
    inject(DesktopAgentService);


  /**
   * QR image returned by the backend.
   */
  qrImage = '';


  /**
   * Device information used for pairing.
   */
  pairingData:
    PairingData | null = null;


  /**
   * Loading state.
   */
  isLoading = false;


  /**
   * Error message.
   */
  errorMessage = '';


  /**
   * Actual connected Android device name.
   */
  connectedDeviceName = '';


  /**
   * Whether a device is currently connected.
   */
  isDeviceConnected = false;


  /**
   * Timer used to check pairing status.
   */
  private statusTimer:
    ReturnType<typeof setInterval> | null = null;


  /**
   * Initial QR generation.
   */
  ngOnInit(): void {

    this.generateQR();

    this.startPairingStatusCheck();

  }


  /**
   * Clean up polling when page is destroyed.
   */
  ngOnDestroy(): void {

    this.stopPairingStatusCheck();

  }


  /**
   * Request a new QR code.
   */
  generateQR(): void {

    this.isLoading = true;

    this.errorMessage = '';

    this.desktopAgent
      .generatePairingQR()
      .subscribe({

        next: (response) => {

          this.qrImage =
            response.data.qrImage;

          this.pairingData =
            response.data.pairingData;

          this.isLoading = false;

        },

        error: (error) => {

          console.error(
            'QR generation failed:',
            error
          );

          this.errorMessage =
            'Unable to connect to Desktop Agent.';

          this.isLoading = false;

        }

      });

  }


  /**
   * Start checking whether
   * an Android device has paired.
   */
  startPairingStatusCheck(): void {

    this.checkPairingStatus();


    this.statusTimer =
      setInterval(() => {

        this.checkPairingStatus();

      }, 2000);

  }


  /**
   * Stop checking pairing status.
   */
  stopPairingStatusCheck(): void {

    if (this.statusTimer !== null) {

      clearInterval(
        this.statusTimer
      );

      this.statusTimer = null;

    }

  }


  /**
   * Check Desktop Agent pairing status.
   */
  checkPairingStatus(): void {

    this.desktopAgent
      .getPairingStatus()
      .subscribe({

        next: (response) => {

          console.log(
            'Pairing status:',
            response
          );


          if (
            response.success &&
            response.data.paired &&
            response.data.device
          ) {

            this.isDeviceConnected =
              true;

            this.connectedDeviceName =
              response.data.device.deviceName;


            console.log(
              'Android device connected:',
              this.connectedDeviceName
            );

          } else {

            this.isDeviceConnected =
              false;

            this.connectedDeviceName =
              '';

          }

        },

        error: (error) => {

          console.error(
            'Pairing status check failed:',
            error
          );

        }

      });

  }

}