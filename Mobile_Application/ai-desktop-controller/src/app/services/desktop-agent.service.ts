import { Injectable } from '@angular/core';

export interface DesktopResponse {
  success: boolean;
  message: string;
  data?: unknown;
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

  /**
   * Get the paired Desktop Agent information.
   */
  private getPairedDevice(): PairedDevice {

    const stored =
      localStorage.getItem('paired_device');

    if (!stored) {
      throw new Error('No paired desktop found.');
    }

    return JSON.parse(stored);
  }


  /**
   * Get the authentication token
   * created during pairing.
   */
  private getAuthentication(): DesktopAuthentication {

    const stored =
      localStorage.getItem('desktop_authentication');

    if (!stored) {
      throw new Error(
        'Desktop authentication not found. Please pair again.'
      );
    }

    return JSON.parse(stored);
  }


  /**
   * Open an application on the Windows PC.
   */
  async openApplication(
    application: string
  ): Promise<DesktopResponse> {

    const device =
      this.getPairedDevice();

    const authentication =
      this.getAuthentication();

    const url =
      `http://${device.ipAddress}:${device.port}/application`;

    console.log(
      'Sending application command:',
      url
    );

    const response =
      await fetch(url, {

        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
          'Authorization':
            `Bearer ${authentication.accessToken}`
        },

        body: JSON.stringify({
          action: 'open',
          application
        })

      });

    const result =
      await response.json();

    console.log(
      'Desktop Agent response:',
      result
    );

    if (!response.ok) {

      throw new Error(
        result?.message ||
        `Command failed (${response.status})`
      );

    }

    return result;
  }
    /**
   * Execute a system command on the Windows PC.
   */
  async executeSystemCommand(
    command: 'shutdown' | 'restart' | 'lock' | 'sleep'
  ): Promise<DesktopResponse> {

    const device =
      this.getPairedDevice();

    const authentication =
      this.getAuthentication();

    const url =
      `http://${device.ipAddress}:${device.port}/system`;

    console.log(
      'Sending system command:',
      command,
      url
    );

    const response =
      await fetch(url, {

        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
          'Authorization':
            `Bearer ${authentication.accessToken}`
        },

        body: JSON.stringify({
          command
        })

      });

    const result =
      await response.json();

    console.log(
      'System command response:',
      result
    );

    if (!response.ok) {

      throw new Error(
        result?.message ||
        `System command failed (${response.status})`
      );

    }

    return result;
  }
  async getSystemInfo(): Promise<DesktopResponse> {

  const device =
    this.getPairedDevice();

  const authentication =
    this.getAuthentication();

  const url =
    `http://${device.ipAddress}:${device.port}/system/info`;

  const response =
    await fetch(url, {

      method: 'GET',

      headers: {
        'Authorization':
          `Bearer ${authentication.accessToken}`
      }

    });

  const result =
    await response.json();

  if (!response.ok) {

    throw new Error(
      result?.message ||
      `Failed to get system information (${response.status})`
    );

  }

  return result;
}
}