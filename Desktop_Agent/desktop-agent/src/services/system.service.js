const { spawn } = require('child_process');

/**
 * Supported system commands.
 *
 * Each command maps to a safe, explicit
 * Windows command. No arbitrary execution.
 */
const SYSTEM_COMMANDS = {

    shutdown: {
        command: 'shutdown',
        args: ['/s', '/t', '0'],
        description: 'Shut down the computer'
    },

    restart: {
        command: 'shutdown',
        args: ['/r', '/t', '0'],
        description: 'Restart the computer'
    },

    lock: {
        command: 'rundll32.exe',
        args: ['user32.dll,LockWorkStation'],
        description: 'Lock the workstation'
    },

    sleep: {
        command: 'rundll32.exe',
        args: ['powrprof.dll,SetSuspendState', '0,1,0'],
        description: 'Put the computer to sleep'
    }

};


/**
 * Execute a supported system command.
 *
 * @param {string} command - shutdown | restart | lock | sleep
 * @returns {Promise<Object>}
 */
function executeSystemCommand(command) {

    return new Promise((resolve, reject) => {

        const config = SYSTEM_COMMANDS[command];

        if (!config) {

            return reject(
                new Error(
                    `Unsupported system command: ${command}`
                )
            );

        }


        console.log(
            `Executing system command: ${command}`,
            `(${config.description})`
        );


        const process = spawn(
            config.command,
            config.args,
            {
                detached: true,
                windowsHide: true,
                shell: false
            }
        );


        process.on('error', (error) => {

            reject(error);

        });


        process.unref();

        resolve({

            command,

            description: config.description,

            status: 'executed'

        });

    });

}


module.exports = {
    executeSystemCommand
};
