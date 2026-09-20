import { Injectable, inject } from '@angular/core';
import {
  HttpClient
} from '@angular/common/http';
import {
  Observable
} from 'rxjs';

export interface DesktopAgentResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface PairingData {
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
  data: {
    pairingData: PairingData;
    qrImage: string;
  };
}

export interface PairingStatusResponse {
  success: boolean;
  data: {
    status: string;
    paired: boolean;
    authenticated?: boolean;
    device: {
      deviceId: string;
      deviceName: string;
      pairedAt: string;
      lastSeenAt : string;
      status: string;
    } | null;
    expiresAt: string | null;
  };
}

@Injectable({
  providedIn: 'root'
})
export class DesktopAgentService {

  private readonly http =
    inject(HttpClient);

  private readonly baseUrl =
    'http://localhost:5000';

  /**
   * ============================
   * CONNECTION / DEVICE
   * ============================
   */

  getConnectionStatus():
    Observable<PairingStatusResponse> {

    return this.http.get<PairingStatusResponse>(
      `${this.baseUrl}/pair/status`
    );
  }

  getAgentStatus() {
  return this.http.get<{
    success: boolean;
    message: string;
    port: number;
    uptimeSeconds: number;
    startedAt: string;
  }>(`${this.baseUrl}/`);
}

  getDevices():
    Observable<DesktopAgentResponse> {

    return this.http.get<DesktopAgentResponse>(
      `${this.baseUrl}/admin/devices`
    );
  }

  disconnectAdminDevice():
    Observable<DesktopAgentResponse> {

    return this.http.post<DesktopAgentResponse>(
      `${this.baseUrl}/admin/devices/disconnect`,
      {}
    );
  }

  async cleanupTempFiles(): Promise<any> {
  return this.http.post(
    `${this.baseUrl}/system/cleanup-temp`,
    {}
  ).toPromise();
}

  /**
   * ============================
   * APPLICATION
   * ============================
   */

  openApplication(
    application: string
  ): Observable<DesktopAgentResponse> {

    return this.http.post<DesktopAgentResponse>(
      `${this.baseUrl}/local/application`,
      {
        action: 'open',
        application
      }
    );
  }

  /**
   * ============================
   * SYSTEM
   * ============================
   */

  executeSystemCommand(
    command: string
  ): Observable<DesktopAgentResponse> {

    return this.http.post<DesktopAgentResponse>(
      `${this.baseUrl}/local/system`,
      {
        command
      }
    );
  }

  getSystemInfo():
    Observable<DesktopAgentResponse> {

    return this.http.get<DesktopAgentResponse>(
      `${this.baseUrl}/local/system/info`
    );
  }

  /**
   * ============================
   * PAIRING
   * ============================
   */

  generatePairingQR():
    Observable<PairingResponse> {

    return this.http.post<PairingResponse>(
      `${this.baseUrl}/pair`,
      {}
    );
  }

  getPairingStatus():
    Observable<PairingStatusResponse> {

    return this.getConnectionStatus();
  }

  /**
   * ============================
   * SERVER
   * ============================
   */

  disconnectDevice():
    Observable<DesktopAgentResponse> {

    return this.http.post<DesktopAgentResponse>(
      `${this.baseUrl}/server/disconnect-local`,
      {}
    );
  }

  stopServer():
    Observable<DesktopAgentResponse> {

    return this.http.post<DesktopAgentResponse>(
      `${this.baseUrl}/server/stop`,
      {}
    );
  }

  /**
   * ============================
   * LOGS
   * ============================
   */

  getLogs(
    limit = 100
  ): Observable<DesktopAgentResponse> {

    return this.http.get<DesktopAgentResponse>(
      `${this.baseUrl}/admin/logs?limit=${limit}`
    );
  }

  clearLogs():
    Observable<DesktopAgentResponse> {

    return this.http.delete<DesktopAgentResponse>(
      `${this.baseUrl}/admin/logs`
    );
  }

  /**
   * ============================
   * SETTINGS
   * ============================
   */

  getSettings():
    Observable<DesktopAgentResponse> {

    return this.http.get<DesktopAgentResponse>(
      `${this.baseUrl}/admin/settings`
    );
  }

  saveSettings(
    settings: Record<
      string,
      string | number | boolean
    >
  ): Observable<DesktopAgentResponse> {

    return this.http.put<DesktopAgentResponse>(
      `${this.baseUrl}/admin/settings`,
      settings
    );
  }
}