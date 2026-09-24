const fs = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');
const util = require('util');
const { v4: uuidv4 } = require('uuid');

const execAsync = util.promisify(exec);

const identityFile =
    path.join(__dirname, 'device-identity.json');


/**
 * Get the Windows Device Name.
 *
 * This reads the Computer Name configured in Windows.
 * Uses execSync — fine here since this only runs at
 * startup / pairing time, not on a repeating timer.
 */
function getWindowsDeviceName() {

    try {

        const deviceName = execSync(
            'powershell -NoProfile -Command "(Get-ComputerInfo).CsName"',
            {
                encoding: 'utf8'
            }
        ).trim();

        if (deviceName) {
            return deviceName;
        }

    } catch (error) {

        console.error(
            'Failed to get Windows device name:',
            error.message
        );

    }

    // Fallback
    return require('os').hostname();
}


/**
 * Get the current battery status.
 *
 * Reads from Win32_Battery via PowerShell. Desktops
 * with no battery (most desktop PCs) simply return
 * hasBattery: false instead of an error.
 */
function getBatteryInfo() {

    const notAvailable = {
        hasBattery: false,
        batteryPercentage: null,
        isCharging: null
    };

    try {

        const output = execSync(
            'powershell -NoProfile -Command "' +
            '$b = Get-CimInstance -ClassName Win32_Battery | Select-Object -First 1; ' +
            'if ($b) { $b | Select-Object EstimatedChargeRemaining,BatteryStatus | ConvertTo-Json -Compress } ' +
            'else { \'null\' }"',
            {
                encoding: 'utf8'
            }
        ).trim();

        if (!output || output === 'null') {
            return notAvailable;
        }

        const parsed = JSON.parse(output);

        const isCharging = parsed.BatteryStatus !== 1;

        return {
            hasBattery: true,
            batteryPercentage:
                typeof parsed.EstimatedChargeRemaining === 'number'
                    ? parsed.EstimatedChargeRemaining
                    : null,
            isCharging
        };

    } catch (error) {

        console.error(
            'Failed to get battery information:',
            error.message
        );

        return notAvailable;

    }
}


/**
 * =========================================================
 * ASYNC / NON-BLOCKING VERSIONS
 * =========================================================
 *
 * The sync versions above use execSync, which freezes the
 * ENTIRE Node process (including in-flight button commands
 * like Shutdown/Lock/Browser) until PowerShell returns.
 *
 * The dashboard polls system info every 15 seconds, so that
 * blocking was intermittently delaying every other command.
 * These async versions run PowerShell without blocking the
 * event loop, so other requests keep responding instantly
 * while a battery/name lookup is in flight.
 */

async function getWindowsDeviceNameAsync() {

    try {

        const { stdout } = await execAsync(
            'powershell -NoProfile -Command "(Get-ComputerInfo).CsName"'
        );

        const deviceName = stdout.trim();

        if (deviceName) {
            return deviceName;
        }

    } catch (error) {

        console.error(
            'Failed to get Windows device name (async):',
            error.message
        );

    }

    return require('os').hostname();
}

async function getBatteryInfoAsync() {

    const notAvailable = {
        hasBattery: false,
        batteryPercentage: null,
        isCharging: null
    };

    try {

        const { stdout } = await execAsync(
            'powershell -NoProfile -Command "' +
            '$b = Get-CimInstance -ClassName Win32_Battery | Select-Object -First 1; ' +
            'if ($b) { $b | Select-Object EstimatedChargeRemaining,BatteryStatus | ConvertTo-Json -Compress } ' +
            'else { \'null\' }"'
        );

        const output = stdout.trim();

        if (!output || output === 'null') {
            return notAvailable;
        }

        const parsed = JSON.parse(output);

        const isCharging = parsed.BatteryStatus !== 1;

        return {
            hasBattery: true,
            batteryPercentage:
                typeof parsed.EstimatedChargeRemaining === 'number'
                    ? parsed.EstimatedChargeRemaining
                    : null,
            isCharging
        };

    } catch (error) {

        console.error(
            'Failed to get battery information (async):',
            error.message
        );

        return notAvailable;

    }
}


/**
 * Create or load the Desktop Agent identity.
 *
 * Device ID remains persistent between restarts.
 */
function getDeviceIdentity() {

    if (fs.existsSync(identityFile)) {

        try {

            const storedIdentity =
                JSON.parse(
                    fs.readFileSync(
                        identityFile,
                        'utf8'
                    )
                );

            /**
             * Always refresh the device name from Windows.
             *
             * Device ID remains unchanged.
             */
            storedIdentity.deviceName =
                getWindowsDeviceName();

            fs.writeFileSync(
                identityFile,
                JSON.stringify(
                    storedIdentity,
                    null,
                    4
                )
            );

            return storedIdentity;

        } catch (error) {

            console.error(
                'Failed to read device identity:',
                error
            );

        }
    }


    /**
     * First-time identity creation.
     */
    const identity = {

        deviceId: uuidv4(),

        deviceName:
            getWindowsDeviceName()

    };


    /**
     * Persist identity.
     */
    fs.writeFileSync(
        identityFile,
        JSON.stringify(
            identity,
            null,
            4
        )
    );


    return identity;
}


module.exports = {
    getDeviceIdentity,
    getWindowsDeviceName,
    getBatteryInfo,
    getWindowsDeviceNameAsync,
    getBatteryInfoAsync
};