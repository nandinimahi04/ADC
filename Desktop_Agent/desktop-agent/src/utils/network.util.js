const os = require('os');

/**
 * Returns the first usable local IPv4 address.
 *
 * The Desktop Agent communicates with the Android
 * device through the local Wi-Fi network.
 *
 * @returns {string}
 */
function getLocalIPAddress() {

    const interfaces = os.networkInterfaces();

    for (const interfaceName of Object.keys(interfaces)) {

        const addresses = interfaces[interfaceName];

        if (!addresses) {
            continue;
        }

        for (const address of addresses) {

            /**
             * We only need IPv4 addresses.
             */
            if (address.family !== 'IPv4') {
                continue;
            }

            /**
             * Ignore loopback addresses such as:
             * 127.0.0.1
             */
            if (address.internal) {
                continue;
            }

            return address.address;
        }
    }

    /**
     * Fallback when no network interface is found.
     */
    return '127.0.0.1';
}


module.exports = {
    getLocalIPAddress
};
