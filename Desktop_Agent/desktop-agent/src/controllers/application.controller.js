const {
    executeApplicationCommand
} = require('../services/application.service');


/**
 * Execute an application command.
 *
 * POST /application
 *
 * Example:
 *
 * {
 *   "action": "open",
 *   "application": "chrome"
 * }
 */
async function executeApplication(
    req,
    res
) {

    try {

        const {
            action,
            application
        } = req.body;


        /**
         * Validate request body.
         */
        if (!action || !application) {

            return res.status(400).json({

                success: false,

                message:
                    'action and application are required'

            });

        }


        /**
         * Execute command.
         */
        const result =
            await executeApplicationCommand(
                action,
                application
            );


        return res.status(200).json({

            success: true,

            message:
                result.message,

            data: {

                application:
                    result.application,

                action

            },

            executedBy:
                req.device

        });

    }

    catch (error) {

        console.error(
            'Application Controller Error:',
            error
        );


        return res.status(500).json({

            success: false,

            message:
                error.message ||
                'Application command failed'

        });

    }

}


module.exports = {
    executeApplication
};