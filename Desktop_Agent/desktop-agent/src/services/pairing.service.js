const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

const {
    getDeviceIdentity
} = require('../config/device.config');

const {
    getLocalIPAddress
} = require('../utils/network.util');


/**
 * Default Desktop Agent port.
 */
const PORT =
    Number(process.env.PORT) || 5000;


/**
 * Generate QR pairing information.
 *
 * @returns {Promise<Object>}
 */
async function generatePairingData() {

    const identity =
        getDeviceIdentity();


    const ipAddress =
        getLocalIPAddress();


    /**
     * Generate a fresh pairing token.
     *
     * This token will later be validated
     * during authentication.
     */
    const pairingToken =
        uuidv4();


    /**
     * Timestamp when QR was generated.
     */
    const timestamp =
        new Date().toISOString();


    /**
     * Information encoded inside the QR.
     */
    const pairingData = {

        type:
            'AI_DESKTOP_CONTROLLER',

        deviceName:
            identity.deviceName,

        deviceId:
            identity.deviceId,

        ipAddress,

        port:
            PORT,

        pairingToken,

        timestamp

    };


    /**
     * Convert pairing information into
     * a QR-code image.
     *
     * data:image/png;base64,...
     */
    const qrImage =
        await QRCode.toDataURL(
            JSON.stringify(pairingData),
            {
                errorCorrectionLevel: 'H',

                margin: 2,

                width: 320
            }
        );


    return {

        pairingData,

        qrImage

    };

}


module.exports = {
    generatePairingData
};
