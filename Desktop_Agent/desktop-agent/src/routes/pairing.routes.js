const express = require('express');

const {
    generatePairingQR
} = require(
    '../controllers/pairing.controller'
);


const router = express.Router();


/**
 * Generate QR pairing information.
 *
 * POST /pair
 */
router.post(
    '/',
    generatePairingQR
);


module.exports = router;
