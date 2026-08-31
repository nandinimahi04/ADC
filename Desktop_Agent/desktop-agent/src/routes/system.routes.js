const express = require('express');

const {
    controlSystem
} = require('../controllers/system.controller');

const {
    getWindowsDeviceName
} = require('../config/device.config');

const router = express.Router();


/*
 * =========================================
 * SYSTEM INFORMATION
 * =========================================
 *
 * GET /system/info
 *
 * Returns the actual Windows computer name.
 */
router.get(
    '/info',
    (req, res) => {

        try {

            const deviceName =
                getWindowsDeviceName();

            return res.status(200).json({

                success: true,

                data: {
                    deviceName,
                    operatingSystem: 'Windows'
                }

            });

        } catch (error) {

            console.error(
                'System information error:',
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    'Unable to get system information'

            });

        }

    }
);


/*
 * =========================================
 * SYSTEM COMMAND
 * =========================================
 *
 * POST /system
 */
router.post(
    '/',
    controlSystem
);


module.exports = router;