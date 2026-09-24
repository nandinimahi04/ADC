const express = require('express');

const {
    controlSystem,cleanupTemp
} = require('../controllers/system.controller');

const {
    getWindowsDeviceNameAsync,
    getBatteryInfoAsync
} = require('../config/device.config');

const router = express.Router();


/*
 * =========================================
 * SYSTEM INFORMATION
 * =========================================
 *
 * GET /system/info
 *
 * Returns the actual Windows computer name
 * and the current battery status.
 *
 * Uses the async (non-blocking) versions of these
 * lookups — this route is polled every 15 seconds,
 * and the old execSync-based versions were freezing
 * the whole server (including button commands like
 * Shutdown/Browser) while PowerShell ran.
 *
 * Cache-Control headers ensure the mobile app (or any
 * network layer in between) never serves a stale
 * cached copy of this response.
 */
router.get(
    '/info',
    async (req, res) => {

        res.set(
            'Cache-Control',
            'no-store, no-cache, must-revalidate, proxy-revalidate'
        );
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');

        try {

            const [deviceName, battery] =
                await Promise.all([
                    getWindowsDeviceNameAsync(),
                    getBatteryInfoAsync()
                ]);

            return res.status(200).json({

                success: true,

                data: {
                    deviceName,
                    operatingSystem: 'Windows',
                    hasBattery: battery.hasBattery,
                    batteryPercentage: battery.batteryPercentage,
                    isCharging: battery.isCharging
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

router.post(
    '/cleanup-temp',
    cleanupTemp
);


module.exports = router;