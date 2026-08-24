const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { v4: uuidv4 } = require('uuid');

const identityFile =
    path.join(__dirname, 'device-identity.json');


/**
 * Get the Windows Device Name.
 *
 * This reads the Computer Name configured in Windows.
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
    getWindowsDeviceName
};