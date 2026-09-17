const {
    getCommandHistory,
    clearCommandHistory
} = require('../services/database.service');


function getLogs(req, res) {
    try {

        const limit = Math.min(
            Math.max(
                Number(req.query.limit) || 150,
                1
            ),
            1000
        );

        const logs = getCommandHistory(limit);

        return res.status(200).json({
            success: true,
            data: {
                logs
            }
        });

    } catch (error) {

        console.error(
            '[LOGS] Failed to load logs:',
            error
        );

        return res.status(500).json({
            success: false,
            message: 'Unable to load command logs.'
        });
    }
}


function clearLogs(req, res) {
    try {

        clearCommandHistory();

        return res.status(200).json({
            success: true,
            message: 'Command history cleared successfully.'
        });

    } catch (error) {

        console.error(
            '[LOGS] Failed to clear logs:',
            error
        );

        return res.status(500).json({
            success: false,
            message: 'Unable to clear command history.'
        });
    }
}


module.exports = {
    getLogs,
    clearLogs
};