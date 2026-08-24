const crypto = require('crypto');


/**
 * Authentication state.
 *
 * Temporary in-memory storage for the current phase.
 *
 * Later this will be persisted in SQLite.
 */
let authenticationState = {

    accessToken: null,

    deviceId: null,

    deviceName: null,

    issuedAt: null,

    expiresAt: null

};


/**
 * Access token lifetime.
 *
 * 24 hours for the current development phase.
 *
 * Later this should be configurable.
 */
const ACCESS_TOKEN_TTL =
    24 * 60 * 60 * 1000;


/**
 * Generate a cryptographically secure
 * authentication token.
 *
 * @returns {string}
 */
function generateAccessToken() {

    return crypto
        .randomBytes(32)
        .toString('hex');

}


/**
 * Create an authentication session
 * after successful device pairing.
 *
 * @param {Object} device
 * @returns {Object}
 */
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


    authenticationState = {

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


    return {

        accessToken,

        tokenType: 'Bearer',

        expiresAt:
            expiresAt.toISOString(),

        device: {

            deviceId:
                device.deviceId,

            deviceName:
                device.deviceName

        }

    };

}


/**
 * Validate an access token.
 *
 * @param {string} token
 * @returns {Object}
 */
function validateAccessToken(token) {

    if (!token) {

        return {

            valid: false,

            message:
                'Access token is required'

        };

    }


    if (
        !authenticationState.accessToken
    ) {

        return {

            valid: false,

            message:
                'No authenticated device exists'

        };

    }


    /**
     * Check token equality.
     */
    if (
        token !==
        authenticationState.accessToken
    ) {

        return {

            valid: false,

            message:
                'Invalid access token'

        };

    }


    /**
     * Check expiry.
     */
    const expiresAt =
        new Date(
            authenticationState.expiresAt
        ).getTime();


    if (
        Number.isNaN(expiresAt) ||
        Date.now() > expiresAt
    ) {

        authenticationState =
            {

                accessToken: null,

                deviceId: null,

                deviceName: null,

                issuedAt: null,

                expiresAt: null

            };


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
                authenticationState.deviceId,

            deviceName:
                authenticationState.deviceName

        }

    };

}


/**
 * Return the current authenticated device.
 *
 * @returns {Object|null}
 */
function getAuthenticatedDevice() {

    if (
        !authenticationState.accessToken
    ) {

        return null;

    }


    return {

        deviceId:
            authenticationState.deviceId,

        deviceName:
            authenticationState.deviceName,

        issuedAt:
            authenticationState.issuedAt,

        expiresAt:
            authenticationState.expiresAt

    };

}


/**
 * Revoke the current authentication token.
 */
function revokeAuthentication() {

    authenticationState = {

        accessToken: null,

        deviceId: null,

        deviceName: null,

        issuedAt: null,

        expiresAt: null

    };

}


module.exports = {

    createAuthenticationSession,

    validateAccessToken,

    getAuthenticatedDevice,

    revokeAuthentication

};