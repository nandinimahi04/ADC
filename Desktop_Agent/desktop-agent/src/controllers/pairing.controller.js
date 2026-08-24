const {
    generatePairingData,
    verifyPairing,
    getPairingStatus,
    unpairDevice
} = require('../services/pairing.service');


/**
 * Generate a new QR pairing code.
 *
 * POST /pair
 */
async function generatePairingQR(req, res) {

    try {

        const result =
            await generatePairingData();


        return res.status(200).json({

            success: true,

            message:
                'QR pairing code generated successfully',

            data: result

        });

    }

    catch (error) {

        console.error(
            'QR Pairing Generation Error:',
            error
        );


        return res.status(500).json({

            success: false,

            message:
                'Failed to generate QR pairing code'

        });

    }

}


/**
 * Verify an Android device pairing request.
 *
 * POST /pair/verify
 *
 * Request body:
 *
 * {
 *   "deviceId": "...",
 *   "pairingToken": "...",
 *   "deviceName": "Android Phone"
 * }
 */
function verifyDevicePairing(req, res) {

    try {

        const result =
            verifyPairing(req.body);


        return res.status(
            result.statusCode
        ).json({

            success:
                result.success,

            message:
                result.message,

            ...(result.data && {
                data: result.data
            })

        });

    }

    catch (error) {

        console.error(
            'Pairing Verification Error:',
            error
        );


        return res.status(500).json({

            success: false,

            message:
                'Failed to verify device pairing'

        });

    }

}


/**
 * Return current pairing status.
 *
 * GET /pair/status
 */
function getStatus(req, res) {

    try {

        const status =
            getPairingStatus();


        return res.status(200).json({

            success: true,

            data: status

        });

    }

    catch (error) {

        console.error(
            'Pairing Status Error:',
            error
        );


        return res.status(500).json({

            success: false,

            message:
                'Failed to retrieve pairing status'

        });

    }

}


/**
 * Remove the current paired device.
 *
 * POST /pair/unpair
 *
 * This endpoint is mainly for future Settings UI.
 */
function unpair(req, res) {

    try {

        const result =
            unpairDevice();


        return res.status(200).json(
            result
        );

    }

    catch (error) {

        console.error(
            'Unpair Error:',
            error
        );


        return res.status(500).json({

            success: false,

            message:
                'Failed to unpair device'

        });

    }

}


module.exports = {

    generatePairingQR,

    verifyDevicePairing,

    getStatus,

    unpair

};