const express = require('express');

const {
    getDevice
} = require('../controllers/device.controller');

const router =
    express.Router();


router.get(
    '/',
    getDevice
);


module.exports = router;