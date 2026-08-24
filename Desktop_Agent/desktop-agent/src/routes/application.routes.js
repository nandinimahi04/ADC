const express = require('express');

const {
    executeApplication
} = require(
    '../controllers/application.controller'
);

const {
    authenticateRequest
} = require(
    '../middleware/auth.middleware'
);


const router =
    express.Router();


/**
 * Execute an application command.
 *
 * This route is protected.
 *
 * POST /application
 */
router.post(
    '/',
    authenticateRequest,
    executeApplication
);


module.exports = router;