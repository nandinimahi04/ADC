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

const {
    savePairedDevice,
    getPairedDevice,
    touchPairedDevice,
    removePairedDevice
} = require('./database.service');


const PORT =
    Number(process.env.PORT) || 5000;

const PAIRING_TOKEN_TTL =
    5 * 60 * 1000;


let activePairing = null;


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

    const qrImage =
        await QRCode.toDataURL(
            JSON.stringify(pairingData),
            {
                errorCorrectionLevel: 'H',
                margin: 2,
                width: 320
            }
        );

    activePairing = {

        deviceId:
            identity.deviceId,

        pairingToken,

        createdAt:
            timestamp,

        expiresAt,

        used: false

    };

    return {

        pairingData,

        qrImage

    };

}


function verifyPairing(request) {

    const {
        deviceId,
        pairingToken,
        deviceName
    } = request;


    if (!deviceId || !pairingToken) {

        return {

            success: false,

            statusCode: 400,

            message:
                'deviceId and pairingToken are required'

        };

    }


    if (!activePairing) {

        return {

            success: false,

            statusCode: 400,

            message:
                'No active pairing request exists'

        };

    }


    if (activePairing.used) {

        return {

            success: false,

            statusCode: 401,

            message:
                'Pairing token has already been used'

        };

    }


    const expiryTime =
        new Date(
            activePairing.expiresAt
        ).getTime();


    if (
        Number.isNaN(expiryTime) ||
        Date.now() > expiryTime
    ) {

        activePairing = null;

        return {

            success: false,

            statusCode: 401,

            message:
                'Pairing token has expired'

        };

    }


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


    activePairing.used = true;

    
    const pairedDevice = {

        deviceId,

        deviceName:
            deviceName ||
            'Android Device',

        pairedAt:
            new Date().toISOString()

    };


    savePairedDevice(
        pairedDevice
    );


    const authentication =
        createAuthenticationSession(
            pairedDevice
        );


    activePairing = null;


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


function getPairingStatus() {

    const storedDevice =
        touchPairedDevice();


    if (!storedDevice) {

        return {

            status:
                activePairing
                    ? 'waiting'
                    : 'unpaired',

            paired: false,

            device: null,

            expiresAt:
                activePairing?.expiresAt ||
                null

        };

    }


    return {

        status:
            'paired',

        paired: true,

        device: {

            deviceId:
                storedDevice.deviceId,

            deviceName:
                storedDevice.deviceName,

            pairedAt:
                storedDevice.pairedAt,

            lastSeenAt:
                storedDevice.lastSeenAt,

            status:
                storedDevice.status

        },

        expiresAt:
            activePairing?.expiresAt ||
            null

    };

}


function unpairDevice() {

    removePairedDevice();

    activePairing = null;


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