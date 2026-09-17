const express = require('express');

const {
    getLogs,
    clearLogs
} = require('../controllers/logs.controller');

const router = express.Router();


router.get(
    '/',
    getLogs
);


router.delete(
    '/',
    clearLogs
);


module.exports = router;