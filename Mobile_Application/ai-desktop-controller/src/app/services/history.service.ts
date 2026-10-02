import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import {
  SQLiteService,
  CommandHistoryRecord
} from './sqlite.service';

export type HistoryEntry = CommandHistoryRecord;

export interface RetentionOption {
  label: string;
  days: number;   // 0 = keep forever
}

/** Shown as a scrollable list in Settings → History. */
export const RETENTION_OPTIONS: RetentionOption[] = [
  { label: '1 day',    days: 1 },
  { label: '2 days',   days: 2 },
  { label: '3 days',   days: 3 },
  { label: '7 days',   days: 7 },
  { label: '15 days',  days: 15 },
  { label: '1 month',  days: 30 },
  { label: '2 months', days: 60 },
  { label: '3 months', days: 90 },
  { label: '6 months', days: 180 },
  { label: '1 year',   days: 365 },
  { label: 'Never (keep forever)', days: 0 }
];

const RETENTION_KEY = 'history_retention_days';
const DEFAULT_RETENTION_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class HistoryService {

  /** Emits whenever history is added or deleted (dashboard listens). */
  readonly changes$ = new Subject<void>();

  constructor(private sqlite: SQLiteService) {}

  // ------------------------------------------------------------
  // RECORD
  // ------------------------------------------------------------

  /** Never throws: a logging problem must not break a command. */
  async record(
    commandType: 'system' | 'application',
    command: string,
    status: 'success' | 'failed',
    message = ''
  ): Promise<void> {

    try {

      const device = this.readActiveDevice();

      await this.sqlite.addHistory({
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        commandType,
        command,
        status,
        message
      });

      await this.purgeExpired();

      this.changes$.next();

    } catch (error) {
      console.error('Failed to record history:', error);
    }
  }

  // ------------------------------------------------------------
  // READ / DELETE
  // ------------------------------------------------------------

  all(limit = 500): Promise<HistoryEntry[]> {
    return this.sqlite.getHistory(limit);
  }

  recent(count = 3): Promise<HistoryEntry[]> {
    return this.sqlite.getHistory(count);
  }

  async delete(id: number): Promise<void> {
    await this.sqlite.deleteHistoryItem(id);
    this.changes$.next();
  }

  async clearAll(): Promise<void> {
    await this.sqlite.clearHistory();
    this.changes$.next();
  }

  // ------------------------------------------------------------
  // RETENTION (auto-delete after N days, 0 = keep forever)
  // ------------------------------------------------------------

  getRetentionDays(): number {
    const stored = localStorage.getItem(RETENTION_KEY);
    if (stored === null) return DEFAULT_RETENTION_DAYS;
    const n = Number(stored);
    return Number.isFinite(n) && n >= 0 ? n : DEFAULT_RETENTION_DAYS;
  }

  async setRetentionDays(days: number): Promise<void> {
    localStorage.setItem(RETENTION_KEY, String(days));
    await this.purgeExpired();
    this.changes$.next();
  }

  /** Short label for the current setting, e.g. "7 days" or "Never". */
  retentionLabel(days: number = this.getRetentionDays()): string {
    if (days === 0) return 'Never';
    return RETENTION_OPTIONS.find(o => o.days === days)?.label
      ?? `${days} days`;
  }

  async purgeExpired(): Promise<void> {
    const days = this.getRetentionDays();
    if (days <= 0) return;

    const cutoff = new Date(Date.now() - days * DAY_MS).toISOString();
    await this.sqlite.deleteHistoryOlderThan(cutoff);
  }

  // ------------------------------------------------------------
  // DISPLAY HELPERS (shared by dashboard + history page)
  // ------------------------------------------------------------

  titleFor(item: HistoryEntry): string {

    if (item.commandType === 'application') {
      const [action, target] = item.command.split(':');
      return target
        ? `${this.cap(action)} ${this.cap(target)}`
        : this.cap(item.command);
    }

    return this.cap(item.command);
  }

  iconFor(item: HistoryEntry): string {

    if (item.commandType === 'application') return 'apps-outline';

    switch (item.command) {
      case 'shutdown': return 'power-outline';
      case 'restart':  return 'refresh-outline';
      case 'lock':     return 'lock-closed-outline';
      case 'sleep':    return 'moon-outline';
      default:         return 'terminal-outline';
    }
  }

  timeAgo(iso: string): string {

    const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);

    if (seconds < 60)    return 'Just now';
    if (seconds < 3600)  return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;

    return `${Math.floor(seconds / 86400)} d ago`;
  }

  private cap(v: string): string {
    return v ? v.charAt(0).toUpperCase() + v.slice(1) : v;
  }

  private readActiveDevice(): { deviceId: string; deviceName: string } {
    try {
      const d = JSON.parse(localStorage.getItem('paired_device') || '{}');
      return {
        deviceId: d.deviceId || '',
        deviceName: d.deviceName || 'Unknown device'
      };
    } catch {
      return { deviceId: '', deviceName: 'Unknown device' };
    }
  }
}