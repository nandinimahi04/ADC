
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const dataDirectory = path.join(__dirname, '../../data');
const databasePath = path.join(dataDirectory, 'adc.sqlite');

fs.mkdirSync(dataDirectory, { recursive: true });

const db = new DatabaseSync(databasePath);

db.exec(`
    CREATE TABLE IF NOT EXISTS paired_devices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT NOT NULL UNIQUE,
        device_name TEXT NOT NULL,
        paired_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'connected'
    );

    CREATE TABLE IF NOT EXISTS auth_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        access_token TEXT NOT NULL UNIQUE,
        device_id TEXT NOT NULL,
        device_name TEXT NOT NULL,
        issued_at TEXT NOT NULL,
        expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS command_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        command_type TEXT NOT NULL,
        command TEXT NOT NULL,
        status TEXT NOT NULL,
        message TEXT,
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT
    );
`);

function savePairedDevice(device) {
    const now = new Date().toISOString();

    db.prepare(`
        INSERT INTO paired_devices
        (
            device_id,
            device_name,
            paired_at,
            last_seen_at,
            status
        )
        VALUES (?, ?, ?, ?, 'connected')
        ON CONFLICT(device_id)
        DO UPDATE SET
            device_name = excluded.device_name,
            last_seen_at = excluded.last_seen_at,
            status = 'connected'
    `).run(
        device.deviceId,
        device.deviceName,
        device.pairedAt || now,
        now
    );

    return getPairedDevice();
}

function getPairedDevice() {
    return db.prepare(`
        SELECT
            device_id AS deviceId,
            device_name AS deviceName,
            paired_at AS pairedAt,
            last_seen_at AS lastSeenAt,
            status
        FROM paired_devices
        WHERE status = 'connected'
        ORDER BY id DESC
        LIMIT 1
    `).get() || null;
}

function removePairedDevice() {
    db.prepare(`
        UPDATE paired_devices
        SET status = 'disconnected'
    `).run();
}

function saveAuthSession(session) {
    db.prepare(`
        DELETE FROM auth_sessions
    `).run();

    db.prepare(`
        INSERT INTO auth_sessions
        (
            access_token,
            device_id,
            device_name,
            issued_at,
            expires_at
        )
        VALUES (?, ?, ?, ?, ?)
    `).run(
        session.accessToken,
        session.deviceId,
        session.deviceName,
        session.issuedAt,
        session.expiresAt
    );

    return session;
}

function getAuthSession() {
    return db.prepare(`
        SELECT
            access_token AS accessToken,
            device_id AS deviceId,
            device_name AS deviceName,
            issued_at AS issuedAt,
            expires_at AS expiresAt
        FROM auth_sessions
        ORDER BY id DESC
        LIMIT 1
    `).get() || null;
}

function removeAuthSession() {
    db.prepare(`
        DELETE FROM auth_sessions
    `).run();
}

function addCommandHistory(
    commandType,
    command,
    status,
    message = ''
) {
    db.prepare(`
        INSERT INTO command_history
        (
            command_type,
            command,
            status,
            message,
            created_at
        )
        VALUES (?, ?, ?, ?, ?)
    `).run(
        commandType,
        command,
        status,
        message,
        new Date().toISOString()
    );
}

function getCommandHistory(limit = 100) {
    return db.prepare(`
        SELECT
            id,
            command_type AS commandType,
            command,
            status,
            message,
            created_at AS createdAt
        FROM command_history
        ORDER BY id DESC
        LIMIT ?
    `).all(Number(limit));
}

function clearCommandHistory() {
    db.prepare(`
        DELETE FROM command_history
    `).run();
}

function getSetting(key) {
    return db.prepare(`
        SELECT value
        FROM app_settings
        WHERE key = ?
    `).get(key)?.value ?? null;
}

function setSetting(key, value) {
    db.prepare(`
        INSERT INTO app_settings (key, value)
        VALUES (?, ?)
        ON CONFLICT(key)
        DO UPDATE SET value = excluded.value
    `).run(key, String(value));
}

module.exports = {
    databasePath,
    savePairedDevice,
    getPairedDevice,
    removePairedDevice,
    saveAuthSession,
    getAuthSession,
    removeAuthSession,
    addCommandHistory,
    getCommandHistory,
    clearCommandHistory,
    getSetting,
    setSetting
};