import { Injectable } from '@angular/core';

export interface DesktopAuth {
  accessToken: string;
  tokenType: string;
  expiresAt: string;
}

export interface PairedDesktop {
  deviceId: string;
  deviceName: string;
  ipAddress: string;
  port: number;
  pairedAt: string;
  authentication?: DesktopAuth;
}

export type DeviceConnectionState =
  | 'online'
  | 'offline'
  | 'unpaired';

export interface DesktopHistoryItem {
  id: number;
  commandType: string;
  command: string;
  status: string;
  message?: string;
  createdAt: string;
}

const REGISTRY_KEY = 'paired_devices';
const ACTIVE_DEVICE_KEY = 'paired_device';
const ACTIVE_AUTH_KEY = 'desktop_authentication';

/**
 * Keeps a list of every desktop this phone has been paired with.
 *
 * The rest of the app still works with ONE "active" desktop,
 * stored under 'paired_device' / 'desktop_authentication'.
 */
@Injectable({
  providedIn: 'root'
})
export class PairedDevicesService {

  // ============================================================
  // REGISTRY
  // ============================================================

  list(): PairedDesktop[] {

    const devices = this.read();

    // Migration: a desktop paired before this feature existed.
    const legacy = this.readActive();

    if (legacy && !devices.some(d => d.deviceId === legacy.deviceId)) {

      devices.push({
        ...legacy,
        pairedAt: new Date().toISOString(),
        authentication: this.readActiveAuth()
      });

      this.write(devices);
    }

    return devices;
  }

  get(deviceId: string): PairedDesktop | undefined {
    return this.list().find(d => d.deviceId === deviceId);
  }

  getActiveId(): string | null {
    return this.readActive()?.deviceId ?? null;
  }

  /** Add (or update) a desktop after a successful pairing. */
  upsert(device: PairedDesktop): void {

    const devices = this.read().filter(
      d => d.deviceId !== device.deviceId
    );

    devices.push(device);

    this.write(devices);
  }

  /**
   * Remove a desktop from this phone.
   * If it was the active one, the most recently paired remaining
   * desktop becomes active (when promoteNext is true).
   */
  forget(
    deviceId: string,
    promoteNext = true
  ): { wasActive: boolean; remaining: number } {

    const wasActive = this.getActiveId() === deviceId;

    const remaining = this.read().filter(
      d => d.deviceId !== deviceId
    );

    this.write(remaining);

    if (wasActive) {

      const next = remaining[remaining.length - 1];

      if (next && promoteNext) {
        this.setActive(next);
      } else {
        localStorage.removeItem(ACTIVE_DEVICE_KEY);
        localStorage.removeItem(ACTIVE_AUTH_KEY);
      }
    }

    return { wasActive, remaining: remaining.length };
  }

  /**
   * If no desktop is active but others are still paired,
   * make the most recently paired one active.
   */
  ensureActive(): void {

    if (this.getActiveId()) return;

    const devices = this.read();
    const latest = devices[devices.length - 1];

    if (latest) {
      this.setActive(latest);
    }
  }

  /** Make a paired desktop the one the app controls. */
  setActive(device: PairedDesktop): void {

    localStorage.setItem(
      ACTIVE_DEVICE_KEY,
      JSON.stringify({
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        ipAddress: device.ipAddress,
        port: device.port
      })
    );

    if (device.authentication) {
      localStorage.setItem(
        ACTIVE_AUTH_KEY,
        JSON.stringify(device.authentication)
      );
    } else {
      localStorage.removeItem(ACTIVE_AUTH_KEY);
    }
  }

  // ============================================================
  // NETWORK
  // ============================================================

  /** Ask the desktop whether it is reachable and still paired. */
  async checkState(device: PairedDesktop): Promise<DeviceConnectionState> {

    try {

      const response = await this.request(
        device,
        '/pair/status',
        { method: 'GET' },
        4000
      );

      if (response.status === 401) {
        return 'unpaired';
      }

      const result = await response.json();

      const paired =
        result?.data?.paired === true &&
        result?.data?.status !== 'disconnected';

      return paired ? 'online' : 'unpaired';

    } catch {
      return 'offline';
    }
  }

  /**
   * Tell the desktop to unpair, then remove it from this phone.
   * The device is ALWAYS removed locally, even if the desktop
   * could not be reached.
   */
  async disconnect(device: PairedDesktop): Promise<{
    remoteOk: boolean;
    wasActive: boolean;
    remaining: number;
  }> {

    let remoteOk = false;

    try {

      const response = await this.request(
        device,
        '/pair/unpair',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        },
        5000
      );

      remoteOk = response.ok;

    } catch {
      remoteOk = false;
    }

    return { remoteOk, ...this.forget(device.deviceId) };
  }

  /** Command history stored on the desktop. */
  async getHistory(
    device: PairedDesktop,
    limit = 100
  ): Promise<DesktopHistoryItem[]> {

    let response: Response;

    try {

      response = await this.request(
        device,
        `/logs?limit=${limit}`,
        { method: 'GET', cache: 'no-store' },
        8000
      );

    } catch {
      throw new Error(
        'Could not reach this desktop. Make sure it is turned on and on the same network.'
      );
    }

    if (response.status === 401) {
      throw new Error(
        'This desktop no longer accepts this phone. Pair again to view history.'
      );
    }

    const result = await response.json();

    if (!response.ok || !result?.success) {
      throw new Error(
        result?.message || 'Unable to load command history.'
      );
    }

    return (result.data?.logs ?? []) as DesktopHistoryItem[];
  }

  private async request(
    device: PairedDesktop,
    path: string,
    init: RequestInit,
    timeoutMs: number
  ): Promise<Response> {

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {

      const headers: Record<string, string> = {
        ...(init.headers as Record<string, string> | undefined)
      };

      if (device.authentication?.accessToken) {
        headers['Authorization'] =
          `Bearer ${device.authentication.accessToken}`;
      }

      return await fetch(
        `http://${device.ipAddress}:${device.port}${path}`,
        { ...init, headers, signal: controller.signal }
      );

    } finally {
      clearTimeout(timer);
    }
  }

  // ============================================================
  // STORAGE HELPERS
  // ============================================================

  private read(): PairedDesktop[] {
    try {
      const parsed = JSON.parse(
        localStorage.getItem(REGISTRY_KEY) || '[]'
      );
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private write(devices: PairedDesktop[]): void {
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(devices));
  }

  private readActive():
    Omit<PairedDesktop, 'pairedAt' | 'authentication'> | null {
    try {
      const stored = localStorage.getItem(ACTIVE_DEVICE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private readActiveAuth(): DesktopAuth | undefined {
    try {
      const stored = localStorage.getItem(ACTIVE_AUTH_KEY);
      return stored ? JSON.parse(stored) : undefined;
    } catch {
      return undefined;
    }
  }
}