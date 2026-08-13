const {
    generatePairingData
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
            'QR Pairing Error:',
            error
        );


        return res.status(500).json({

            success: false,

            message:
                'Failed to generate QR pairing code'

        });

    }

}


module.exports = {
    generatePairingQR
};
