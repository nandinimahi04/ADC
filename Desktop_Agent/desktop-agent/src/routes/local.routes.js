const express = require('express');

const {
    executeApplicationCommand
} = require('../services/application.service');

const router = express.Router();


router.post(
    '/application',
    async (req, res) => {

        try {

            const {
                action,
                application
            } = req.body || {};


            const result =
                await executeApplicationCommand(
                    action,
                    application
                );


            return res.status(200).json({
                success: true,
                data: result
            });

        } catch (error) {

            console.error(
                '[LOCAL APPLICATION] Error:',
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    error.message ||
                    'Unable to execute application command.'
            });
        }
    }
);


module.exports = router;