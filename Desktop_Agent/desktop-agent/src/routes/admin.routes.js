const express = require('express');

const {
    getPairedDevice,
    removePairedDevice,
    removeAuthSession,
    getCommandHistory,
    clearCommandHistory,
    getSetting,
    setSetting
} = require('../services/database.service');

const router = express.Router();


// ============================================================
// DEVICES
// ============================================================

router.get(
    '/devices',
    (req, res) => {

        try {

            const device =
                getPairedDevice();

            return res.status(200).json({

                success: true,

                data: {

                    devices:
                        device
                            ? [device]
                            : []

                }

            });

        } catch (error) {

            console.error(
                '[ADMIN] Failed to load devices:',
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    'Unable to load connected devices.'

            });

        }

    }
);


// ============================================================
// DISCONNECT DEVICE
// ============================================================

router.post(
    '/devices/disconnect',
    (req, res) => {

        try {

            removePairedDevice();

            removeAuthSession();

            console.log(
                '[ADMIN] Device disconnected.'
            );

            return res.status(200).json({

                success: true,

                message:
                    'Connected device disconnected successfully.'

            });

        } catch (error) {

            console.error(
                '[ADMIN] Device disconnect error:',
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    'Unable to disconnect device.'

            });

        }

    }
);


// ============================================================
// LOGS
// ============================================================

router.get(
    '/logs',
    (req, res) => {

        try {

            const limit =
                Math.min(
                    Math.max(
                        Number(
                            req.query.limit
                        ) || 150,
                        1
                    ),
                    1000
                );


            const logs =
                getCommandHistory(
                    limit
                );


            return res.status(200).json({

                success: true,

                data: {

                    logs

                }

            });

        } catch (error) {

            console.error(
                '[ADMIN] Failed to load logs:',
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    'Unable to load command logs.'

            });

        }

    }
);


// ============================================================
// CLEAR LOGS
// ============================================================

router.delete(
    '/logs',
    (req, res) => {

        try {

            clearCommandHistory();

            console.log(
                '[ADMIN] Command logs cleared.'
            );

            return res.status(200).json({

                success: true,

                message:
                    'Command logs cleared successfully.'

            });

        } catch (error) {

            console.error(
                '[ADMIN] Failed to clear logs:',
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    'Unable to clear command logs.'

            });

        }

    }
);


// ============================================================
// SETTINGS
// ============================================================

router.get(
    '/settings',
    (req, res) => {

        try {

            const settings = {

                agentName:
                    getSetting(
                        'agentName'
                    ) ||
                    'AI Desktop Controller',

                logRetention:
                    getSetting(
                        'logRetention'
                    ) ||
                    '1000',

                autoStart:
                    getSetting(
                        'autoStart'
                    ) ||
                    'false'

            };


            return res.status(200).json({

                success: true,

                data: {

                    settings

                }

            });

        } catch (error) {

            console.error(
                '[ADMIN] Failed to load settings:',
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    'Unable to load settings.'

            });

        }

    }
);


// ============================================================
// UPDATE SETTINGS
// ============================================================

router.put(
    '/settings',
    (req, res) => {

        try {

            const {
                agentName,
                logRetention,
                autoStart
            } = req.body || {};


            // -----------------------------
            // Agent name
            // -----------------------------

            if (
                agentName !== undefined
            ) {

                const name =
                    String(
                        agentName
                    ).trim();


                if (!name) {

                    return res.status(400).json({

                        success: false,

                        message:
                            'Agent name cannot be empty.'

                    });

                }


                setSetting(
                    'agentName',
                    name
                );

            }


            // -----------------------------
            // Log retention
            // -----------------------------

            if (
                logRetention !== undefined
            ) {

                const retention =
                    Math.min(
                        Math.max(
                            Number(
                                logRetention
                            ) || 1000,
                            100
                        ),
                        10000
                    );


                setSetting(
                    'logRetention',
                    String(
                        retention
                    )
                );

            }


            // -----------------------------
            // Auto start
            // -----------------------------

            if (
                autoStart !== undefined
            ) {

                setSetting(
                    'autoStart',
                    String(
                        autoStart
                    )
                );

            }


            console.log(
                '[ADMIN] Settings updated.'
            );


            return res.status(200).json({

                success: true,

                message:
                    'Settings saved successfully.'

            });

        } catch (error) {

            console.error(
                '[ADMIN] Failed to update settings:',
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    'Unable to save settings.'

            });

        }

    }
);


module.exports = router;