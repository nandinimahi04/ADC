import { Injectable } from '@angular/core';

export interface DesktopResponse {
  success: boolean;
  message: string;
  data?: unknown;
}

export interface PairingStatusResponse {
  success: boolean;
  message?: string;
  data?: {
    status: string;
    paired: boolean;
    authenticated?: boolean;
    device?: {
      deviceId: string;
      deviceName: string;
      pairedAt?: string;
      lastSeenAt?: string;
      status?: string;
    } | null;
    expiresAt?: string | null;
  };
}

interface PairedDevice {
  deviceId: string;
  deviceName: string;
  ipAddress: string;
  port: number;
}

interface DesktopAuthentication {
  accessToken: string;
  tokenType: string;
  expiresAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class DesktopAgentService {

  // ============================================================
  // LOCAL PAIRING DATA
  // ============================================================

  private getPairedDevice(): PairedDevice {
    const stored = localStorage.getItem('paired_device');

    if (!stored) {
      throw new Error('No paired desktop found.');
    }

    return JSON.parse(stored) as PairedDevice;
  }

  private getAuthentication(): DesktopAuthentication {
    const stored = localStorage.getItem(
      'desktop_authentication'
    );

    if (!stored) {
      throw new Error(
        'Desktop authentication not found. Please pair again.'
      );
    }

    return JSON.parse(
      stored
    ) as DesktopAuthentication;
  }

  private getDesktopBaseUrl(): string {
    const device = this.getPairedDevice();

    return `http://${device.ipAddress}:${device.port}`;
  }

  private getAuthHeaders(): HeadersInit {
    const authentication =
      this.getAuthentication();

    return {
      'Authorization':
        `Bearer ${authentication.accessToken}`
    };
  }

  // ============================================================
  // PAIRING STATUS
  // ============================================================

  async getPairingStatus(): Promise<PairingStatusResponse> {

    try {

      const baseUrl =
        this.getDesktopBaseUrl();

      const response = await fetch(
        `${baseUrl}/pair/status`,
        {
          method: 'GET',
          headers: {
            ...this.getAuthHeaders()
          },
          cache: 'no-store'
        }
      );

      let result: PairingStatusResponse;

      try {

        result =
          await response.json() as PairingStatusResponse;

      } catch {

        result = {
          success: false,
          message:
            'Invalid response from Desktop Agent.',
          data: {
            status: 'disconnected',
            paired: false,
            authenticated: false,
            device: null,
            expiresAt: null
          }
        };

      }

      // --------------------------------------------------------
      // Authentication expired / revoked
      // --------------------------------------------------------

      if (response.status === 401) {

        console.warn(
          'Desktop Agent authentication expired or was revoked.'
        );

        await this.clearLocalPairing();

        return {
          success: false,
          message:
            'Authentication expired.',
          data: {
            status: 'disconnected',
            paired: false,
            authenticated: false,
            device: null,
            expiresAt: null
          }
        };
      }

      // --------------------------------------------------------
      // Other HTTP errors
      // --------------------------------------------------------

      if (!response.ok) {

        throw new Error(
          result?.message ||
          `Failed to get pairing status (${response.status})`
        );

      }

      // --------------------------------------------------------
      // Desktop says device is disconnected
      // --------------------------------------------------------

      if (
        result?.data?.paired === false ||
        result?.data?.status === 'disconnected' ||
        result?.data?.device?.status === 'disconnected'
      ) {

        console.warn(
          'Desktop Agent reports this mobile device as disconnected.'
        );

        await this.clearLocalPairing();

      }

      return result;

    } catch (error) {

      console.error(
        'Failed to get pairing status:',
        error
      );

      throw error;
    }
  }

  // ============================================================
  // CONNECTION STATUS
  // ============================================================

  async getConnectionStatus():
    Promise<PairingStatusResponse> {

    return this.getPairingStatus();
  }

  // ============================================================
  // CLEAR LOCAL PAIRING
  // ============================================================

  async clearLocalPairing(): Promise<void> {

    localStorage.removeItem(
      'paired_device'
    );

    localStorage.removeItem(
      'desktop_authentication'
    );

    console.log(
      'Mobile pairing and authentication data cleared.'
    );
  }

  // ============================================================
  // APPLICATION
  // ============================================================

  async openApplication(
    application: string
  ): Promise<DesktopResponse> {

    const device =
      this.getPairedDevice();

    const authentication =
      this.getAuthentication();

    const url =
      `http://${device.ipAddress}:${device.port}/application`;

    const response = await fetch(
      url,
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',

          'Authorization':
            `Bearer ${authentication.accessToken}`
        },

        body: JSON.stringify({
          action: 'open',
          application
        })
      }
    );

    const result =
      await response.json();

    if (!response.ok) {

      throw new Error(
        result?.message ||
        `Command failed (${response.status})`
      );

    }

    return result as DesktopResponse;
  }

  // ============================================================
  // SYSTEM COMMAND
  // ============================================================

  async executeSystemCommand(
    command:
      | 'shutdown'
      | 'restart'
      | 'lock'
      | 'sleep'
  ): Promise<DesktopResponse> {

    const device =
      this.getPairedDevice();

    const authentication =
      this.getAuthentication();

    const url =
      `http://${device.ipAddress}:${device.port}/system`;

    const response = await fetch(
      url,
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',

          'Authorization':
            `Bearer ${authentication.accessToken}`
        },

        body: JSON.stringify({
          command
        })
      }
    );

    const result =
      await response.json();

    if (!response.ok) {

      throw new Error(
        result?.message ||
        `System command failed (${response.status})`
      );

    }

    return result as DesktopResponse;
  }

  // ============================================================
  // SYSTEM INFORMATION
  // ============================================================

  async getSystemInfo():
    Promise<DesktopResponse> {

    const device =
      this.getPairedDevice();

    const authentication =
      this.getAuthentication();

    const url =
      `http://${device.ipAddress}:${device.port}/system/info`;

    const response = await fetch(
      url,
      {
        method: 'GET',

        headers: {
          'Authorization':
            `Bearer ${authentication.accessToken}`
        },

        cache: 'no-store'
      }
    );

    const result =
      await response.json();

    if (!response.ok) {

      throw new Error(
        result?.message ||
        `Failed to get system information (${response.status})`
      );

    }

    return result as DesktopResponse;
  }

  // ============================================================
  // DISCONNECT
  // ============================================================

  async disconnect(): Promise<void> {

    let disconnectError: unknown = null;

    try {

      const device =
        this.getPairedDevice();

      const authentication =
        this.getAuthentication();

      const url =
        `http://${device.ipAddress}:${device.port}/pair/unpair`;

      console.log(
        'Sending disconnect request to Desktop Agent:',
        url
      );

      const response = await fetch(
        url,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',

            'Authorization':
              `Bearer ${authentication.accessToken}`
          },

          body: JSON.stringify({})
        }
      );

      let result:
        DesktopResponse | null = null;

      try {

        result =
          await response.json() as DesktopResponse;

      } catch {
        // Server returned no JSON body.
      }

      console.log(
        'Desktop Agent disconnect response:',
        result
      );

      if (!response.ok) {

        throw new Error(
          result?.message ||
          `Disconnect failed (${response.status})`
        );

      }

      if (
        result &&
        !result.success
      ) {

        throw new Error(
          result.message ||
          'Desktop Agent rejected the disconnect request.'
        );

      }

      console.log(
        'Desktop Agent disconnected successfully.'
      );

    } catch (error) {

      disconnectError = error;

      console.error(
        'Desktop Agent disconnect request failed:',
        error
      );

    } finally {

      // Always remove mobile-side pairing data.
      await this.clearLocalPairing();

    }

    /*
     * Important:
     *
     * Even if the Desktop Agent was unreachable,
     * the mobile application is now locally disconnected.
     */
    if (disconnectError) {

      throw disconnectError;

    }
  }
}