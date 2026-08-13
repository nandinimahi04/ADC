require('dotenv').config();

const express = require('express');
const cors = require('cors');

const applicationRoutes =
    require('./src/routes/application.routes');

const systemRoutes =
    require('./src/routes/system.routes');

const pairingRoutes =
    require('./src/routes/pairing.routes');


const app = express();

const PORT =
    process.env.PORT || 5000;


/**
 * =========================================
 * MIDDLEWARE
 * =========================================
 */

app.use(
    cors()
);

app.use(
    express.json()
);


/**
 * =========================================
 * HEALTH CHECK
 * =========================================
 */

app.get(
    '/',
    (req, res) => {

        res.json({

            status: 'Running'

        });

    }
);


/**
 * =========================================
 * APPLICATION ROUTES
 * =========================================
 */

app.use(
    '/application',
    applicationRoutes
);


/**
 * =========================================
 * SYSTEM ROUTES
 * =========================================
 */

app.use(
    '/system',
    systemRoutes
);


/**
 * =========================================
 * PAIRING ROUTES
 * =========================================
 */

app.use(
    '/pair',
    pairingRoutes
);



/**
 * =========================================
 * START SERVER
 * =========================================
 */

app.listen(
    PORT,
    () => {

        console.log(
            `Desktop Agent running on port ${PORT}`
        );

        console.log(
            `http://localhost:${PORT}`
        );

    }
);
