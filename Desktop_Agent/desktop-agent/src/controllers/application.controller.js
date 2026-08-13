const applicationService =
    require('../services/application.service');


/**
 * Handle application control requests.
 *
 * POST /application
 *
 * Body:
 *
 * {
 *   "action": "open",
 *   "application": "chrome"
 * }
 */
async function controlApplication(req, res) {

    try {

        const {
            action,
            application
        } = req.body;


        // Validate request
        if (!action || !application) {

            return res.status(400).json({

                success: false,

                message:
                    'action and application are required'

            });

        }


        // Currently only opening applications
        // is implemented.
        if (action !== 'open') {

            return res.status(400).json({

                success: false,

                message:
                    'Only the open action is currently supported'

            });

        }


        const result =
            await applicationService.openApplication(
                application
            );


        return res.status(200).json({

            success: true,

            message:
                `${application} opened successfully`,

            data: result

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
                'Failed to execute application command'

        });

    }

}


module.exports = {
    controlApplication
};
