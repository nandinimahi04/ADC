import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Response returned by the Desktop Agent.
 */
export interface DesktopAgentResponse {
  success: boolean;
  message: string;
  data?: unknown;
}

/**
 * Pairing information returned by
 * the Desktop Agent.
 */
export interface PairingData {
  type: string;
  deviceName: string;
  deviceId: string;
  ipAddress: string;
  port: number;
  pairingToken: string;
  timestamp: string;
}

/**
 * QR pairing response.
 */
export interface PairingResponse {
  success: boolean;
  message: string;
  data: {
    pairingData: PairingData;
    qrImage: string;
  };
}


/**
 * Service responsible for communication
 * between Angular and the Windows Desktop Agent.
 */
@Injectable({
  providedIn: 'root'
})
export class DesktopAgentService {

  private readonly http = inject(HttpClient);

  /**
   * Desktop Agent base URL.
   *
   * During development the Node.js server
   * will run on localhost:5000.
   *
   * Later this will dynamically use the
   * paired computer's IP address.
   */
  private readonly baseUrl = 'http://localhost:5000';


  /**
   * Open an application on Windows.
   */
  openApplication(
    application: string
  ): Observable<DesktopAgentResponse> {

    return this.http.post<DesktopAgentResponse>(
      `${this.baseUrl}/application`,
      {
        action: 'open',
        application
      }
    );
  }


  /**
   * Execute a system command on Windows.
   *
   * Supported: shutdown, restart, lock, sleep
   */
  executeSystemCommand(
    command: string
  ): Observable<DesktopAgentResponse> {

    return this.http.post<DesktopAgentResponse>(
      `${this.baseUrl}/system`,
      {
        command
      }
    );
  }


  /**
   * Generate a new QR pairing code.
   */
  generatePairingQR(): Observable<PairingResponse> {

    return this.http.post<PairingResponse>(
      `${this.baseUrl}/pair`,
      {}
    );

  }
}
