import {
  Component,
  OnInit,
  inject
} from '@angular/core';

import {
  DesktopAgentService,
  PairingData
} from '../../core/services/desktop-agent.service';


@Component({
  selector: 'app-pairing',
  standalone: true,
  imports: [],
  templateUrl: './pairing.component.html',
  styleUrl: './pairing.component.scss'
})
export class PairingComponent
  implements OnInit {

  private readonly desktopAgent =
    inject(DesktopAgentService);


  /**
   * QR image returned by the backend.
   */
  qrImage = '';


  /**
   * Device information.
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
   * Initial QR generation.
   */
  ngOnInit(): void {

    this.generateQR();

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

}
