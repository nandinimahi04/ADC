const crypto = require('crypto');

const {
    saveAuthSession,
    getAuthSession,
    touchPairedDevice,
    removeAuthSession
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

    return {

        accessToken,

        tokenType: 'Bearer',

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
            message: 'Access token is required'
        };

    }

    const session =
        getAuthSession();

    if (!session) {

        return {
            valid: false,
            message: 'No authenticated device exists'
        };

    }

    if (
        token !==
        session.accessToken
    ) {

        return {
            valid: false,
            message: 'Invalid access token'
        };

    }

    const expiresAt =
        new Date(
            session.expiresAt
        ).getTime();

    if (
        Number.isNaN(expiresAt) ||
        Date.now() > expiresAt
    ) {

        removeAuthSession();

        return {
            valid: false,
            message: 'Access token has expired'
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
        Date.now() > expiresAt
    ) {

        removeAuthSession();

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

}


module.exports = {

    createAuthenticationSession,

    validateAccessToken,

    getAuthenticatedDevice,

    revokeAuthentication

};