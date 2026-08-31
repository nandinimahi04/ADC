import { Injectable } from '@angular/core';

export interface DesktopPairingData {
  type: string;
  deviceName: string;
  deviceId: string;
  ipAddress: string;
  port: number;
  pairingToken: string;
  timestamp: string;
  expiresAt: string;
}

export interface PairingResponse {
  success: boolean;
  message: string;
  data?: {
    status: string;
    device: {
      deviceId: string;
      deviceName: string;
      pairedAt: string;
    };
    authentication?: any;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PairingService {

  /**
   * Verify the Android device with
   * the Desktop Agent.
   */
  async verifyPairing(
    pairingData: DesktopPairingData
  ): Promise<PairingResponse> {

    const url =
      `http://${pairingData.ipAddress}:${pairingData.port}/pair/verify`;

    console.log(
      'Connecting to Desktop Agent:',
      url
    );

    const response =
      await fetch(url, {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({

          // Desktop device identity
          deviceId:
            pairingData.deviceId,

          // One-time QR token
          pairingToken:
            pairingData.pairingToken,

          // Android device name
          deviceName:
            'Android Phone'

        })
      });

    const result =
      await response.json();

    console.log(
      'Pairing response:',
      result
    );

    if (!response.ok) {

      throw new Error(
        result?.message ||
        'Desktop Agent pairing failed'
      );

    }

    return result;
  }
}