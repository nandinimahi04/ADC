import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection
} from '@capacitor-community/sqlite';

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

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  /**
   * Initialize database.
   *
   * Android:
   *     Uses native SQLite.
   *
   * Browser:
   *     Uses localStorage only for development/testing.
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
      'Running in browser. Using browser storage for PIN testing.'
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

      console.log(
        'Retrieving existing SQLite connection.'
      );

      this.db = await this.sqlite.retrieveConnection(
        this.DB_NAME,
        false
      );

    } else {

      console.log(
        'Creating SQLite connection.'
      );

      this.db = await this.sqlite.createConnection(
        this.DB_NAME,
        false,
        'no-encryption',
        1,
        false
      );
    }

    const isDBOpen = await this.db.isDBOpen();

    console.log(
      'SQLite database open:',
      isDBOpen.result
    );

    if (!isDBOpen.result) {
      await this.db.open();
    }

    await this.createTables();

    console.log(
      'SQLite database initialized successfully.'
    );

  } catch (error) {

    console.error(
      'SQLite initialization failed:',
      error
    );

    throw error;
  }
}
  /**
   * Create required database tables.
   */
  private async createTables(): Promise<void> {

    const query = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY NOT NULL,
        pin_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `;

    await this.db.execute(query);
  }

  /**
   * Save PIN hash.
   *
   * Android:
   *     Saves into SQLite.
   *
   * Browser:
   *     Saves into localStorage for testing only.
   */
  async savePin(pinHash: string): Promise<void> {

    // ------------------------------------------------
    // WEB
    // ------------------------------------------------
    if (Capacitor.getPlatform() === 'web') {

      localStorage.setItem(
        this.WEB_PIN_KEY,
        pinHash
      );

      console.log(
        'PIN hash saved in browser storage.'
      );

      return;
    }

    // ------------------------------------------------
    // ANDROID
    // ------------------------------------------------
    if (!this.db) {

      throw new Error(
        'SQLite database is not initialized.'
      );
    }

    const existing =
      await this.db.query(
        'SELECT id FROM users LIMIT 1;'
      );

    if (
      existing.values &&
      existing.values.length > 0
    ) {

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

    console.log(
      'PIN hash saved in SQLite.'
    );
  }

  /**
   * Get stored PIN hash.
   */
  async getPinHash(): Promise<string | null> {

    // ------------------------------------------------
    // WEB
    // ------------------------------------------------
    if (Capacitor.getPlatform() === 'web') {

      return localStorage.getItem(
        this.WEB_PIN_KEY
      );
    }

    // ------------------------------------------------
    // ANDROID
    // ------------------------------------------------
    if (!this.db) {

      throw new Error(
        'SQLite database is not initialized.'
      );
    }

    const result =
      await this.db.query(
        `SELECT pin_hash
         FROM users
         LIMIT 1;`
      );

    if (
      !result.values ||
      result.values.length === 0
    ) {

      return null;
    }

    return result.values[0]['pin_hash'];
  }

  /**
   * Check whether a PIN already exists.
   */
  async hasPin(): Promise<boolean> {

    // ------------------------------------------------
    // WEB
    // ------------------------------------------------
    if (Capacitor.getPlatform() === 'web') {

      return (
        localStorage.getItem(
          this.WEB_PIN_KEY
        ) !== null
      );
    }

    // ------------------------------------------------
    // ANDROID
    // ------------------------------------------------
    if (!this.db) {

      throw new Error(
        'SQLite database is not initialized.'
      );
    }

    const result =
      await this.db.query(
        `SELECT id
         FROM users
         LIMIT 1;`
      );

    return !!(
      result.values &&
      result.values.length > 0
    );
  }
}