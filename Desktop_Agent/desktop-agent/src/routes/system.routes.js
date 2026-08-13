const express = require('express');

const {
    controlSystem
} = require(
    '../controllers/system.controller'
);


const router = express.Router();


/**
 * System control endpoint.
 *
 * POST /system
 */
router.post(
    '/',
    controlSystem
);


module.exports = router;
