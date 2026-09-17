const {
    getPairedDevice
} = require('../services/database.service');


function getDevice(req, res) {

    try {

        const device =
            getPairedDevice();

        return res.status(200).json({

            success: true,

            data: {

                connected:
                    !!device,

                device

            }

        });

    }

    catch (error) {

        console.error(
            'Device information error:',
            error
        );

        return res.status(500).json({

            success: false,

            message:
                'Failed to retrieve device information'

        });

    }

}


module.exports = {
    getDevice
};