const systemService =
    require('../services/system.service');


/**
 * Handle system control requests.
 *
 * POST /system
 *
 * Body:
 *
 * {
 *   "command": "shutdown" | "restart" | "lock" | "sleep"
 * }
 */
async function controlSystem(req, res) {

    try {

        const { command } = req.body;


        // Validate request
        if (!command) {

            return res.status(400).json({

                success: false,

                message:
                    'command is required'

            });

        }


        const allowedCommands = [
            'shutdown',
            'restart',
            'lock',
            'sleep'
        ];

        if (!allowedCommands.includes(command)) {

            return res.status(400).json({

                success: false,

                message:
                    `Invalid command. Allowed: ${allowedCommands.join(', ')}`

            });

        }


        const result =
            await systemService.executeSystemCommand(
                command
            );


        return res.status(200).json({

            success: true,

            message:
                `${command} executed successfully`,

            data: result

        });

    }

    catch (error) {

        console.error(
            'System Controller Error:',
            error
        );


        return res.status(500).json({

            success: false,

            message:
                error.message ||
                'Failed to execute system command'

        });

    }

}


module.exports = {
    controlSystem
};
