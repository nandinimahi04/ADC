import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection
} from '@capacitor-community/sqlite';

export interface CommandHistoryRecord {
  id: number;
  deviceId: string;
  deviceName: string;
  commandType: 'system' | 'application';
  command: string;
  status: 'success' | 'failed';
  message: string;
  createdAt: string;
}

export type NewCommandHistory = Omit<CommandHistoryRecord, 'id' | 'createdAt'>;

@Injectable({
  providedIn: 'root'
})
export class SQLiteService {

  private sqlite: SQLiteConnection;
  private db!: SQLiteDBConnection;
  private initializationPromise?: Promise<void>;

  private readonly DB_NAME = 'ai_desktop_controller';

  // Used only when running in browser
  private readonly WEB_PIN_KEY = 'ai_desktop_controller_pin_hash';
  private readonly WEB_HISTORY_KEY = 'ai_desktop_controller_history';

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  /**
   * Initialize database.
   *
   * Android:  Uses native SQLite.
   * Browser:  Uses localStorage only for development/testing.
   */
  async initializeDatabase(): Promise<void> {

    // If initialization is already running, wait for the same operation
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.initializeDatabaseInternal();

    try {
      await this.initializationPromise;
    } finally {
      this.initializationPromise = undefined;
    }
  }

  private async initializeDatabaseInternal(): Promise<void> {

    // ------------------------------------------------
    // WEB / BROWSER
    // ------------------------------------------------
    if (Capacitor.getPlatform() === 'web') {

      console.log(
        'Running in browser. Using browser storage for testing.'
      );

      return;
    }

    // ------------------------------------------------
    // ANDROID / NATIVE
    // ------------------------------------------------
    try {

      const isConnection = await this.sqlite.isConnection(
        this.DB_NAME,
        false
      );

      console.log(
        'SQLite connection exists:',
        isConnection.result
      );

      if (isConnection.result) {

        console.log('Retrieving existing SQLite connection.');

        this.db = await this.sqlite.retrieveConnection(
          this.DB_NAME,
          false
        );

      } else {

        console.log('Creating SQLite connection.');

        this.db = await this.sqlite.createConnection(
          this.DB_NAME,
          false,
          'no-encryption',
          1,
          false
        );
      }

      const isDBOpen = await this.db.isDBOpen();

      console.log('SQLite database open:', isDBOpen.result);

      if (!isDBOpen.result) {
        await this.db.open();
      }

      await this.createTables();

      console.log('SQLite database initialized successfully.');

    } catch (error) {

      console.error('SQLite initialization failed:', error);

      throw error;
    }
  }

  /**
   * Create required database tables.
   * IF NOT EXISTS means existing installs keep their PIN
   * and simply get the new history table.
   */
  private async createTables(): Promise<void> {

    const query = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY NOT NULL,
        pin_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS command_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT,
        device_name TEXT,
        command_type TEXT NOT NULL,
        command TEXT NOT NULL,
        status TEXT NOT NULL,
        message TEXT,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_command_history_created_at
        ON command_history (created_at);
    `;

    await this.db.execute(query);
  }

  /**
   * Make sure the database is open before using it.
   */
  private async ready(): Promise<void> {

    if (!this.db) {
      await this.initializeDatabase();
    }

    if (!this.db) {
      throw new Error('SQLite database is not initialized.');
    }
  }

  // ============================================================
  // PIN
  // ============================================================

  async savePin(pinHash: string): Promise<void> {

    // WEB
    if (Capacitor.getPlatform() === 'web') {

      localStorage.setItem(this.WEB_PIN_KEY, pinHash);

      console.log('PIN hash saved in browser storage.');

      return;
    }

    // ANDROID
    if (!this.db) {
      throw new Error('SQLite database is not initialized.');
    }

    const existing =
      await this.db.query('SELECT id FROM users LIMIT 1;');

    if (existing.values && existing.values.length > 0) {

      await this.db.run(
        `UPDATE users
         SET pin_hash = ?,
             created_at = ?
         WHERE id = ?;`,
        [
          pinHash,
          new Date().toISOString(),
          existing.values[0]['id']
        ]
      );

    } else {

      await this.db.run(
        `INSERT INTO users
         (pin_hash, created_at)
         VALUES (?, ?);`,
        [
          pinHash,
          new Date().toISOString()
        ]
      );
    }

    console.log('PIN hash saved in SQLite.');
  }

  async getPinHash(): Promise<string | null> {

    // WEB
    if (Capacitor.getPlatform() === 'web') {
      return localStorage.getItem(this.WEB_PIN_KEY);
    }

    // ANDROID
    if (!this.db) {
      throw new Error('SQLite database is not initialized.');
    }

    const result =
      await this.db.query(
        `SELECT pin_hash
         FROM users
         LIMIT 1;`
      );

    if (!result.values || result.values.length === 0) {
      return null;
    }

    return result.values[0]['pin_hash'];
  }

  async hasPin(): Promise<boolean> {

    // WEB
    if (Capacitor.getPlatform() === 'web') {
      return localStorage.getItem(this.WEB_PIN_KEY) !== null;
    }

    // ANDROID
    if (!this.db) {
      throw new Error('SQLite database is not initialized.');
    }

    const result =
      await this.db.query(
        `SELECT id
         FROM users
         LIMIT 1;`
      );

    return !!(result.values && result.values.length > 0);
  }

  // ============================================================
  // COMMAND HISTORY
  // ============================================================

  private readWebHistory(): CommandHistoryRecord[] {
    try {
      const parsed = JSON.parse(
        localStorage.getItem(this.WEB_HISTORY_KEY) || '[]'
      );
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private writeWebHistory(items: CommandHistoryRecord[]): void {
    localStorage.setItem(this.WEB_HISTORY_KEY, JSON.stringify(items));
  }

  async addHistory(entry: NewCommandHistory): Promise<void> {

    const createdAt = new Date().toISOString();

    // Browser (testing only)
    if (Capacitor.getPlatform() === 'web') {
      const items = this.readWebHistory();
      const nextId = items.reduce((m, i) => Math.max(m, i.id), 0) + 1;
      items.unshift({ ...entry, id: nextId, createdAt });
      this.writeWebHistory(items);
      return;
    }

    // Android
    await this.ready();

    await this.db.run(
      `INSERT INTO command_history
       (device_id, device_name, command_type, command, status, message, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [
        entry.deviceId,
        entry.deviceName,
        entry.commandType,
        entry.command,
        entry.status,
        entry.message,
        createdAt
      ]
    );
  }

  async getHistory(limit = 500): Promise<CommandHistoryRecord[]> {

    if (Capacitor.getPlatform() === 'web') {
      return this.readWebHistory().slice(0, limit);
    }

    await this.ready();

    const result = await this.db.query(
      `SELECT id,
              device_id    AS deviceId,
              device_name  AS deviceName,
              command_type AS commandType,
              command,
              status,
              message,
              created_at   AS createdAt
       FROM command_history
       ORDER BY id DESC
       LIMIT ?;`,
      [limit]
    );

    return (result.values ?? []) as CommandHistoryRecord[];
  }

  async deleteHistoryItem(id: number): Promise<void> {

    if (Capacitor.getPlatform() === 'web') {
      this.writeWebHistory(this.readWebHistory().filter(i => i.id !== id));
      return;
    }

    await this.ready();
    await this.db.run('DELETE FROM command_history WHERE id = ?;', [id]);
  }

  async clearHistory(): Promise<void> {

    if (Capacitor.getPlatform() === 'web') {
      this.writeWebHistory([]);
      return;
    }

    await this.ready();
    await this.db.run('DELETE FROM command_history;');
  }

  /** Delete everything older than the given ISO date. */
  async deleteHistoryOlderThan(isoCutoff: string): Promise<void> {

    if (Capacitor.getPlatform() === 'web') {
      this.writeWebHistory(
        this.readWebHistory().filter(i => i.createdAt >= isoCutoff)
      );
      return;
    }

    await this.ready();
    await this.db.run(
      'DELETE FROM command_history WHERE created_at < ?;',
      [isoCutoff]
    );
  }
}