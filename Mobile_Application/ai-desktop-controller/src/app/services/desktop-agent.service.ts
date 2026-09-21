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

  private getPairedDevice(): PairedDevice {
    const stored = localStorage.getItem('paired_device');
    if (!stored) {
      throw new Error('No paired desktop found.');
    }
    return JSON.parse(stored);
  }

  private getAuthentication(): DesktopAuthentication {
    const stored = localStorage.getItem('desktop_authentication');
    if (!stored) {
      throw new Error('Desktop authentication not found. Please pair again.');
    }
    return JSON.parse(stored);
  }

  async openApplication(application: string): Promise<DesktopResponse> {
    const device = this.getPairedDevice();
    const authentication = this.getAuthentication();
    const url = `http://${device.ipAddress}:${device.port}/application`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authentication.accessToken}`
      },
      body: JSON.stringify({ action: 'open', application })
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result?.message || `Command failed (${response.status})`);
    }
    return result;
  }

  async executeSystemCommand(
    command: 'shutdown' | 'restart' | 'lock' | 'sleep'
  ): Promise<DesktopResponse> {
    const device = this.getPairedDevice();
    const authentication = this.getAuthentication();
    const url = `http://${device.ipAddress}:${device.port}/system`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authentication.accessToken}`
      },
      body: JSON.stringify({ command })
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result?.message || `System command failed (${response.status})`);
    }
    return result;
  }

  async getSystemInfo(): Promise<DesktopResponse> {
    const device = this.getPairedDevice();
    const authentication = this.getAuthentication();
    const url = `http://${device.ipAddress}:${device.port}/system/info`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${authentication.accessToken}` }
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result?.message || `Failed to get system information (${response.status})`);
    }
    return result;
  }

  /**
   * Disconnect from the currently paired Desktop Agent.
   * Notifies the desktop (best-effort) and always clears
   * local pairing/auth data so the user can pair again.
   */
  async disconnect(): Promise<void> {

    try {

      const device = this.getPairedDevice();
      const url = `http://${device.ipAddress}:${device.port}/pair/unpair`;

      console.log('Notifying Desktop Agent of disconnect:', url);

      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {

      console.warn(
        'Could not notify Desktop Agent (continuing local disconnect):',
        error
      );

    } finally {

      localStorage.removeItem('paired_device');
      localStorage.removeItem('desktop_authentication');

      console.log('Local pairing data cleared.');

    }

  }

}