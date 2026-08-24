const express = require('express');

const {
    generatePairingQR,
    verifyDevicePairing,
    getStatus,
    unpair
} = require(
    '../controllers/pairing.controller'
);


const router =
    express.Router();


/**
 * =========================================
 * GENERATE QR
 * =========================================
 *
 * POST /pair
 */
router.post(
    '/',
    generatePairingQR
);


/**
 * =========================================
 * VERIFY PAIRING
 * =========================================
 *
 * POST /pair/verify
 */
router.post(
    '/verify',
    verifyDevicePairing
);


/**
 * =========================================
 * PAIRING STATUS
 * =========================================
 *
 * GET /pair/status
 */
router.get(
    '/status',
    getStatus
);


/**
 * =========================================
 * UNPAIR DEVICE
 * =========================================
 *
 * POST /pair/unpair
 */
router.post(
    '/unpair',
    unpair
);


module.exports = router;