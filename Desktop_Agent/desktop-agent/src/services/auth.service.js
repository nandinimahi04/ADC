const crypto = require('crypto');

const {
    saveAuthSession,
    getAuthSession,
    removeAuthSession,
    removePairedDevice
} = require('./database.service');

const ACCESS_TOKEN_TTL =
    24 * 60 * 60 * 1000;


function generateAccessToken() {

    return crypto
        .randomBytes(32)
        .toString('hex');

}


function createAuthenticationSession(device) {

    const accessToken =
        generateAccessToken();

    const issuedAt =
        new Date();

    const expiresAt =
        new Date(
            issuedAt.getTime() +
            ACCESS_TOKEN_TTL
        );

    const session = {

        accessToken,

        deviceId:
            device.deviceId,

        deviceName:
            device.deviceName,

        issuedAt:
            issuedAt.toISOString(),

        expiresAt:
            expiresAt.toISOString()

    };

    saveAuthSession(session);


    /*
     * Automatically disconnect the device
     * when the 24-hour authentication session
     * expires.
     */
    setTimeout(() => {

        const currentSession =
            getAuthSession();

        /*
         * Make sure this timer still belongs
         * to the currently authenticated device.
         */
        if (
            currentSession &&
            currentSession.accessToken === accessToken
        ) {

            const expiryTime =
                new Date(
                    currentSession.expiresAt
                ).getTime();

            if (
                !Number.isNaN(expiryTime) &&
                Date.now() >= expiryTime
            ) {

                removeAuthSession();

                removePairedDevice();

                console.log(
                    `Authentication expired. Device disconnected: ${device.deviceName}`
                );

            }

        }

    }, ACCESS_TOKEN_TTL);


    return {

        accessToken,

        tokenType:
            'Bearer',

        expiresAt:
            session.expiresAt,

        device: {

            deviceId:
                session.deviceId,

            deviceName:
                session.deviceName

        }

    };

}


function validateAccessToken(token) {

    if (!token) {

        return {
            valid: false,
            message:
                'Access token is required'
        };

    }


    const session =
        getAuthSession();


    if (!session) {

        return {
            valid: false,
            message:
                'No authenticated device exists'
        };

    }


    if (
        token !==
        session.accessToken
    ) {

        return {
            valid: false,
            message:
                'Invalid access token'
        };

    }


    const expiresAt =
        new Date(
            session.expiresAt
        ).getTime();


    if (
        Number.isNaN(expiresAt) ||
        Date.now() >= expiresAt
    ) {

        removeAuthSession();

        removePairedDevice();

        return {
            valid: false,
            message:
                'Access token has expired'
        };

    }


    return {

        valid: true,

        device: {

            deviceId:
                session.deviceId,

            deviceName:
                session.deviceName

        }

    };

}


function getAuthenticatedDevice() {

    const session =
        getAuthSession();


    if (!session) {

        return null;

    }


    const expiresAt =
        new Date(
            session.expiresAt
        ).getTime();


    if (
        Number.isNaN(expiresAt) ||
        Date.now() >= expiresAt
    ) {

        removeAuthSession();

        removePairedDevice();

        return null;

    }


    return {

        deviceId:
            session.deviceId,

        deviceName:
            session.deviceName,

        issuedAt:
            session.issuedAt,

        expiresAt:
            session.expiresAt

    };

}


function revokeAuthentication() {

    removeAuthSession();

    removePairedDevice();

}


module.exports = {

    createAuthenticationSession,

    validateAccessToken,

    getAuthenticatedDevice,

    revokeAuthentication

};