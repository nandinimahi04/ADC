const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const {
    addCommandHistory
} = require('./database.service');

/**
 * Supported system commands.
 *
 * Each command maps to a safe, explicit
 * Windows operation.
 */
const SYSTEM_COMMANDS = {
    shutdown: {
        command: 'shutdown',
        args: ['/s', '/t', '0'],
        description: 'Shut down the computer'
    },

    restart: {
        command: 'shutdown',
        args: ['/r', '/t', '0'],
        description: 'Restart the computer'
    },

    lock: {
        command: 'rundll32.exe',
        args: ['user32.dll,LockWorkStation'],
        description: 'Lock the workstation'
    },

    sleep: {
        command: 'rundll32.exe',
        args: ['powrprof.dll,SetSuspendState', '0,1,0'],
        description: 'Put the computer to sleep'
    }
};


/**
 * Execute a supported Windows system command.
 */
function executeSystemCommand(command) {
    return new Promise((resolve, reject) => {
        const config = SYSTEM_COMMANDS[command];

        if (!config) {
            const error = new Error(
                `Unsupported system command: ${command}`
            );

            addCommandHistory(
                'system',
                command,
                'failed',
                error.message
            );

            return reject(error);
        }

        console.log(
            `Executing system command: ${command}`,
            `(${config.description})`
        );

        const process = spawn(
            config.command,
            config.args,
            {
                detached: true,
                windowsHide: true,
                shell: false
            }
        );

        process.on('error', (error) => {
            addCommandHistory(
                'system',
                command,
                'failed',
                error.message || 'System command failed'
            );

            reject(error);
        });

        process.unref();

        addCommandHistory(
            'system',
            command,
            'success',
            `System command "${command}" executed successfully`
        );

        resolve({
            command,
            description: config.description,
            status: 'executed'
        });
    });
}


/**
 * Get the Windows temporary directories.
 *
 * Only these predefined locations are allowed.
 * No path supplied by the mobile application is used.
 */
function getTempDirectories() {
    const directories = new Set();

    if (process.platform !== 'win32') {
        return [];
    }

    if (process.env.TEMP) {
        directories.add(path.resolve(process.env.TEMP));
    }

    if (process.env.TMP) {
        directories.add(path.resolve(process.env.TMP));
    }

    const windowsDirectory =
        process.env.WINDIR ||
        process.env.SystemRoot;

    if (windowsDirectory) {
        directories.add(
            path.resolve(windowsDirectory, 'Temp')
        );
    }

    return [...directories];
}


/**
 * Calculate the size of a file.
 */
function getFileSize(filePath) {
    try {
        const stats = fs.statSync(filePath);

        if (stats.isFile()) {
            return stats.size;
        }
    } catch {
        // File may have disappeared or be locked.
    }

    return 0;
}


/**
 * Recursively clean a predefined temporary directory.
 *
 * Files that are currently locked/in use are skipped.
 */
function cleanDirectory(directory, result) {
    if (!fs.existsSync(directory)) {
        return;
    }

    let entries;

    try {
        entries = fs.readdirSync(directory, {
            withFileTypes: true
        });
    } catch {
        result.skipped++;
        return;
    }

    for (const entry of entries) {
        const target = path.join(
            directory,
            entry.name
        );

        try {
            if (entry.isDirectory()) {
                cleanDirectory(target, result);

                /*
                 * Remove the directory only if it is now empty.
                 * Non-empty directories are normally caused by
                 * locked/in-use files.
                 */
                try {
                    fs.rmdirSync(target);
                } catch {
                    // Ignore non-empty or locked directories.
                }

                continue;
            }

            if (entry.isFile()) {
                const size = getFileSize(target);

                try {
                    fs.unlinkSync(target);

                    result.filesRemoved++;
                    result.bytesFreed += size;
                } catch {
                    result.skipped++;
                }
            }
        } catch {
            result.skipped++;
        }
    }
}


/**
 * Clean Windows temporary files.
 *
 * This function only touches:
 *   %TEMP%
 *   %TMP%
 *   %WINDIR%\Temp
 *
 * No arbitrary path can be supplied by the client.
 */
function cleanupTempFiles() {
    return new Promise((resolve, reject) => {
        if (process.platform !== 'win32') {
            const error = new Error(
                'Temporary file cleanup is supported on Windows only.'
            );

            addCommandHistory(
                'system',
                'cleanup-temp',
                'failed',
                error.message
            );

            return reject(error);
        }

        try {
            const directories = getTempDirectories();

            const result = {
                filesRemoved: 0,
                bytesFreed: 0,
                skipped: 0,
                directoriesChecked: directories.length
            };

            for (const directory of directories) {
                console.log(
                    `Cleaning temporary directory: ${directory}`
                );

                cleanDirectory(
                    directory,
                    result
                );
            }

            const spaceFreedMB =
                Math.round(
                    (result.bytesFreed / 1024 / 1024) * 100
                ) / 100;

            const message =
                `Removed ${result.filesRemoved} files, ` +
                `freed ${spaceFreedMB} MB, ` +
                `skipped ${result.skipped} items.`;

            addCommandHistory(
                'system',
                'cleanup-temp',
                'success',
                message
            );

            console.log(
                `Temporary file cleanup completed: ${message}`
            );

            resolve({
                success: true,
                command: 'cleanup-temp',
                message,
                filesRemoved: result.filesRemoved,
                bytesFreed: result.bytesFreed,
                spaceFreedMB,
                skipped: result.skipped,
                directoriesChecked: result.directoriesChecked
            });
        } catch (error) {
            addCommandHistory(
                'system',
                'cleanup-temp',
                'failed',
                error.message || 'Temporary file cleanup failed'
            );

            reject(error);
        }
    });
}


module.exports = {
    executeSystemCommand,
    cleanupTempFiles
};