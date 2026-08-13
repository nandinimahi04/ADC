const os = require('os');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');


/**
 * Location where the Desktop Agent stores
 * its persistent device identity.
 */
const identityFile =
    path.join(__dirname, 'device-identity.json');


/**
 * Create or load the Desktop Agent identity.
 *
 * The Device ID must remain the same between
 * server restarts.
 */
function getDeviceIdentity() {

    if (fs.existsSync(identityFile)) {

        try {

            const storedIdentity =
                JSON.parse(
                    fs.readFileSync(
                        identityFile,
                        'utf-8'
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
     * Generate identity for the first time.
     */
    const identity = {

        deviceId: uuidv4(),

        deviceName:
            os.hostname()

    };


    /**
     * Persist the identity so that the same
     * Device ID is used after restarting.
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
    getDeviceIdentity
};
