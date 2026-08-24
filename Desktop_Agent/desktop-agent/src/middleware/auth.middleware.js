const {
    validateAccessToken
} = require('../services/auth.service');


/**
 * Authentication middleware.
 *
 * Expected header:
 *
 * Authorization: Bearer <access-token>
 *
 * Every protected API must pass through this
 * middleware before reaching its controller.
 */
function authenticateRequest(req, res, next) {

    try {

        const authorization =
            req.headers.authorization;


        /**
         * Authorization header is required.
         */
        if (!authorization) {

            return res.status(401).json({

                success: false,

                message:
                    'Authorization header is required'

            });

        }


        /**
         * Expected format:
         *
         * Bearer TOKEN
         */
        const parts =
            authorization.split(' ');


        if (
            parts.length !== 2 ||
            parts[0] !== 'Bearer' ||
            !parts[1]
        ) {

            return res.status(401).json({

                success: false,

                message:
                    'Invalid authorization format'

            });

        }


        const accessToken =
            parts[1];


        /**
         * Validate token.
         */
        const authentication =
            validateAccessToken(
                accessToken
            );


        if (!authentication.valid) {

            return res.status(401).json({

                success: false,

                message:
                    authentication.message

            });

        }


        /**
         * Store authenticated device information
         * on the request.
         *
         * Controllers can access:
         *
         * req.device
         */
        req.device =
            authentication.device;


        next();

    }

    catch (error) {

        console.error(
            'Authentication Middleware Error:',
            error
        );


        return res.status(500).json({

            success: false,

            message:
                'Authentication failed'

        });

    }

}


module.exports = {
    authenticateRequest
};