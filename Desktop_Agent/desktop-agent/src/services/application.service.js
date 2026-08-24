const {
    exec
} = require('child_process');


/**
 * Open Google Chrome on Windows.
 *
 * @returns {Promise<Object>}
 */
function openChrome() {

    return new Promise(
        (resolve, reject) => {

            /**
             * Windows `start` command launches
             * an application independently.
             */
            exec(
                'start "" chrome',
                (error) => {

                    if (error) {

                        console.error(
                            'Chrome launch error:',
                            error
                        );


                        return reject(
                            new Error(
                                'Unable to open Google Chrome'
                            )
                        );

                    }


                    resolve({

                        success: true,

                        application:
                            'chrome',

                        message:
                            'Google Chrome opened successfully'

                    });

                }
            );

        }
    );

}


/**
 * Process application commands.
 *
 * @param {string} action
 * @param {string} application
 * @returns {Promise<Object>}
 */
async function executeApplicationCommand(
    action,
    application
) {

    if (
        action === 'open' &&
        application === 'chrome'
    ) {

        return await openChrome();

    }


    throw new Error(
        `Unsupported application command: ${action} ${application}`
    );

}


module.exports = {
    executeApplicationCommand
};