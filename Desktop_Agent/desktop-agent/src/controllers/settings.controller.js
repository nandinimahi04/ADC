const {
    getSetting,
    setSetting
} = require('../services/database.service');


function getSettings(req, res) {
    try {

        const settings = {
            agentName:
                getSetting('agentName') ||
                'AI Desktop Controller',

            logRetention:
                getSetting('logRetention') ||
                '1000',

            autoStart:
                getSetting('autoStart') ||
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
            '[SETTINGS] Failed to load settings:',
            error
        );

        return res.status(500).json({
            success: false,
            message: 'Unable to load settings.'
        });
    }
}


function updateSettings(req, res) {
    try {

        const {
            agentName,
            logRetention,
            autoStart
        } = req.body || {};


        if (agentName !== undefined) {

            const name =
                String(agentName).trim();

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


        if (logRetention !== undefined) {

            const retention =
                Math.min(
                    Math.max(
                        Number(logRetention) || 1000,
                        100
                    ),
                    10000
                );

            setSetting(
                'logRetention',
                String(retention)
            );
        }


        if (autoStart !== undefined) {

            setSetting(
                'autoStart',
                String(autoStart)
            );
        }


        return res.status(200).json({
            success: true,
            message:
                'Settings saved successfully.'
        });

    } catch (error) {

        console.error(
            '[SETTINGS] Failed to save settings:',
            error
        );

        return res.status(500).json({
            success: false,
            message: 'Unable to save settings.'
        });
    }
}


module.exports = {
    getSettings,
    updateSettings
};