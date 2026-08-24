const {
    createAuthenticationSession
} = require('./auth.service');

const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

const {
    getDeviceIdentity
} = require('../config/device.config');

const {
    getLocalIPAddress
} = require('../utils/network.util');


/**
 * Desktop Agent port.
 */
const PORT =
    Number(process.env.PORT) || 5000;


/**
 * Pairing token validity period.
 *
 * Current value:
 * 5 minutes.
 */
const PAIRING_TOKEN_TTL =
    5 * 60 * 1000;


/**
 * Current pairing state.
 *
 * This is intentionally kept in memory for now.
 *
 * Later this state will move to SQLite.
 */
let pairingState = {

    status: 'unpaired',

    activePairing: null,

    pairedDevice: null

};


/**
 * Generate a new pairing QR.
 *
 * Every time this function is called:
 *
 * - A new pairing token is generated.
 * - Previous active token becomes invalid.
 * - Token expiry is calculated.
 * - QR code is generated.
 *
 * @returns {Promise<Object>}
 */
async function generatePairingData() {

    const identity =
        getDeviceIdentity();


    const ipAddress =
        getLocalIPAddress();


    const pairingToken =
        uuidv4();


    const timestamp =
        new Date().toISOString();


    const expiresAt =
        new Date(
            Date.now() +
            PAIRING_TOKEN_TTL
        ).toISOString();


    /**
     * Data encoded inside QR.
     *
     * This information is safe to expose through
     * the QR because actual verification happens
     * on the Desktop Agent.
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

        timestamp,

        expiresAt

    };


    /**
     * Generate QR image.
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


    /**
     * Store the active token.
     *
     * Only one QR token is active at a time.
     */
    pairingState = {

        status: 'waiting',

        activePairing: {

            deviceId:
                identity.deviceId,

            pairingToken,

            createdAt:
                timestamp,

            expiresAt,

            used: false

        },

        pairedDevice:
            pairingState.pairedDevice

    };


    return {

        pairingData,

        qrImage

    };

}


/**
 * Verify a pairing request.
 *
 * @param {Object} request
 * @returns {Object}
 */
function verifyPairing(request) {

    const {
        deviceId,
        pairingToken,
        deviceName
    } = request;


    /**
     * Validate required fields.
     */
    if (!deviceId || !pairingToken) {

        return {

            success: false,

            statusCode: 400,

            message:
                'deviceId and pairingToken are required'

        };

    }


    /**
     * Make sure a QR has been generated.
     */
    if (!pairingState.activePairing) {

        return {

            success: false,

            statusCode: 400,

            message:
                'No active pairing request exists'

        };

    }


    const activePairing =
        pairingState.activePairing;


    /**
     * Prevent reuse of a token.
     */
    if (activePairing.used) {

        return {

            success: false,

            statusCode: 401,

            message:
                'Pairing token has already been used'

        };

    }


    /**
     * Check token expiry.
     */
    const currentTime =
        Date.now();

    const expiryTime =
        new Date(
            activePairing.expiresAt
        ).getTime();


    if (
        Number.isNaN(expiryTime) ||
        currentTime > expiryTime
    ) {

        pairingState.status =
            'expired';

        pairingState.activePairing =
            null;


        return {

            success: false,

            statusCode: 401,

            message:
                'Pairing token has expired'

        };

    }


    /**
     * Verify Desktop Agent device ID.
     */
    if (
        deviceId !==
        activePairing.deviceId
    ) {

        return {

            success: false,

            statusCode: 401,

            message:
                'Invalid device ID'

        };

    }


    /**
     * Verify pairing token.
     */
    if (
        pairingToken !==
        activePairing.pairingToken
    ) {

        return {

            success: false,

            statusCode: 401,

            message:
                'Invalid pairing token'

        };

    }


    /**
     * Mark token as consumed.
     *
     * This prevents the same QR code from
     * being used again.
     */
    activePairing.used = true;


    /**
     * Generate the paired-device record.
     *
     * The Android application will later
     * provide a real device ID/name.
     */
    const pairedDevice = {

        deviceId,

        deviceName:
            deviceName ||
            'Android Device',

        pairedAt:
            new Date().toISOString()

    };


    pairingState = {

        status: 'paired',

        activePairing: null,

        pairedDevice

    };


    /**
 * Create an authenticated session immediately
 * after successful pairing.
 */
const authentication =
    createAuthenticationSession(
        pairedDevice
    );


return {

    success: true,

    statusCode: 200,

    message:
        'Device paired and authenticated successfully',

    data: {

        status:
            'paired',

        device:
            pairedDevice,

        authentication

    }

};

}


/**
 * Return the current pairing status.
 *
 * @returns {Object}
 */
function getPairingStatus() {

    /**
     * If a waiting token exists, check whether
     * it has expired before returning the state.
     */
    if (
        pairingState.status === 'waiting' &&
        pairingState.activePairing
    ) {

        const expiresAt =
            new Date(
                pairingState.activePairing.expiresAt
            ).getTime();


        if (
            Number.isNaN(expiresAt) ||
            Date.now() > expiresAt
        ) {

            pairingState.status =
                'expired';

            pairingState.activePairing =
                null;

        }

    }


    return {

        status:
            pairingState.status,

        paired:
            pairingState.status === 'paired',

        device:
            pairingState.pairedDevice,

        expiresAt:
            pairingState.activePairing?.expiresAt
            || null

    };

}


/**
 * Clear the current pairing.
 *
 * This will be useful later from the Settings
 * page when implementing "Unpair Device".
 */
function unpairDevice() {

    pairingState = {

        status: 'unpaired',

        activePairing: null,

        pairedDevice: null

    };


    return {

        success: true,

        message:
            'Device unpaired successfully'

    };

}


module.exports = {

    generatePairingData,

    verifyPairing,

    getPairingStatus,

    unpairDevice

};