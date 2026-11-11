import { Injectable } from '@angular/core';

/*
 * ============================================================
 * KEYBOARD SERVICE
 * ============================================================
 *
 * Sends keyboard input from the phone to the Desktop Agent.
 *
 * Desktop Agent endpoints used:
 *   POST /input/keyboard/type         { "text": "Hello" }
 *   POST /input/keyboard/press        { "key": "enter" }
 *   POST /input/keyboard/combination  { "keys": ["ctrl", "c"] }
 *
 * All requests go through ONE queue so that keys always reach
 * the laptop in the same order they were typed on the phone.
 *
 * Keystrokes are NOT saved to history on purpose
 * (it would flood the database and could store passwords).
 */

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

export interface KeyboardResponse {
  success: boolean;
  message?: string;
  data?: unknown;
}

@Injectable({
  providedIn: 'root'
})
export class KeyboardService {

  /** Chain of pending requests – keeps keys in order. */
  private queue: Promise<void> = Promise.resolve();

  /** Called when any queued request fails. */
  onError: ((message: string) => void) | null = null;

  // ============================================================
  // LOCAL PAIRING DATA (same storage keys as DesktopAgentService)
  // ============================================================

  private getPairedDevice(): PairedDevice {
    const stored = localStorage.getItem('paired_device');

    if (!stored) {
      throw new Error('No paired desktop found.');
    }

    return JSON.parse(stored) as PairedDevice;
  }

  private getAuthentication(): DesktopAuthentication {
    const stored = localStorage.getItem('desktop_authentication');

    if (!stored) {
      throw new Error('Desktop authentication not found. Please pair again.');
    }

    return JSON.parse(stored) as DesktopAuthentication;
  }

  private getBaseUrl(): string {
    const device = this.getPairedDevice();
    return `http://${device.ipAddress}:${device.port}`;
  }

  // ============================================================
  // LOW LEVEL REQUEST
  // ============================================================

  private async post(path: string, body: unknown): Promise<KeyboardResponse> {

    const authentication = this.getAuthentication();

    const response = await fetch(
      `${this.getBaseUrl()}/input${path}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authentication.accessToken}`
        },
        body: JSON.stringify(body)
      }
    );

    let result: KeyboardResponse;

    try {
      result = await response.json() as KeyboardResponse;
    } catch {
      result = {
        success: false,
        message: 'Invalid response from Desktop Agent.'
      };
    }

    if (!response.ok) {
      throw new Error(
        result?.message || `Keyboard command failed (${response.status})`
      );
    }

    return result;
  }

  /** Adds a job to the ordered queue. */
  private enqueue(job: () => Promise<unknown>): Promise<void> {

    this.queue = this.queue
      .then(async () => {
        await job();
      })
      .catch((error) => {
        const message =
          error instanceof Error ? error.message : 'Keyboard command failed.';

        console.error('[KEYBOARD]', message);

        if (this.onError) {
          this.onError(message);
        }
      });

    return this.queue;
  }

  // ============================================================
  // PUBLIC API
  // ============================================================

  /** Types plain text on the laptop at the current cursor position. */
  typeText(text: string): Promise<void> {
    if (!text) {
      return this.queue;
    }

    return this.enqueue(() => this.post('/keyboard/type', { text }));
  }

  /** Presses a single key, e.g. 'enter', 'backspace', 'tab', 'up'. */
  pressKey(key: string, times = 1): Promise<void> {
    let last = this.queue;

    for (let i = 0; i < times; i++) {
      last = this.enqueue(() => this.post('/keyboard/press', { key }));
    }

    return last;
  }

  /** Presses a shortcut, e.g. ['ctrl', 'c']. */
  pressCombination(keys: string[]): Promise<void> {
    if (!keys || keys.length === 0) {
      return this.queue;
    }

    if (keys.length === 1) {
      return this.pressKey(keys[0]);
    }

    return this.enqueue(() => this.post('/keyboard/combination', { keys }));
  }
}