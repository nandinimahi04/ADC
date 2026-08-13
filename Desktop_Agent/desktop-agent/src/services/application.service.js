const { spawn } = require('child_process');

/**
 * Supported Windows applications.
 *
 * Keeping this list explicit prevents arbitrary
 * commands from being executed through the API.
 */
const APPLICATIONS = {

    chrome: {
        command: 'chrome'
    }

};


/**
 * Open a supported Windows application.
 *
 * @param {string} application
 * @returns {Promise<Object>}
 */
function openApplication(application) {

    return new Promise((resolve, reject) => {

        const applicationConfig =
            APPLICATIONS[application];

        if (!applicationConfig) {

            return reject(
                new Error(
                    `Unsupported application: ${application}`
                )
            );

        }


        /**
         * Windows command:
         *
         * cmd /c start "" chrome
         *
         * The empty string is required because
         * Windows interprets the first quoted
         * argument as the window title.
         */
        const process = spawn(
            'cmd.exe',
            [
                '/c',
                'start',
                '""',
                applicationConfig.command
            ],
            {
                detached: true,
                windowsHide: true,
                shell: false
            }
        );


        process.on('error', (error) => {

            reject(error);

        });


        /**
         * We don't wait for Chrome itself to terminate.
         *
         * The command was successfully handed
         * over to Windows.
         */
        process.unref();

        resolve({

            application,

            status: 'started'

        });

    });

}


module.exports = {
    openApplication
};
