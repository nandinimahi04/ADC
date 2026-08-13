const express = require('express');

const {
    controlApplication
} = require(
    '../controllers/application.controller'
);


const router = express.Router();


/**
 * Application control endpoint.
 *
 * POST /application
 */
router.post(
    '/',
    controlApplication
);


module.exports = router;
