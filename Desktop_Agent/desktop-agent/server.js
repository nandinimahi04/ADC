const express = require('express');
const cors = require('cors');
const { execFile } = require('child_process');

const app = express();

const PORT = process.env.PORT || 5000;


// ============================================================
// CORS
// ============================================================

app.use(
    cors({
        origin: true,

        methods: [
            'GET',
            'POST',
            'PUT',
            'DELETE',
            'OPTIONS'
        ],

        allowedHeaders: [
            'Content-Type',
            'Authorization'
        ],

        credentials: false,

        optionsSuccessStatus: 204
    })
);



// ============================================================
// BODY PARSING
// ============================================================

app.use(
    express.json({
        limit: '1mb'
    })
);

app.use(
    express.urlencoded({
        extended: true
    })
);


// ============================================================
// REQUEST LOGGER
// ============================================================

app.use((req, res, next) => {

    //console.log(
        //`[REQUEST] ${req.method} ${req.originalUrl}`
    //);

    next();
});


// ============================================================
// EXISTING ROUTES
// ============================================================

const pairingRoutes =
    require('./src/routes/pairing.routes');

const systemRoutes =
    require('./src/routes/system.routes');

const applicationRoutes =
    require('./src/routes/application.routes');

const deviceRoutes =
    require('./src/routes/device.routes');

const localRoutes =
    require('./src/routes/local.routes');

const logsRoutes =
    require('./src/routes/logs.routes');

const settingsRoutes =
    require('./src/routes/settings.routes');

const adminRoutes =
    require('./src/routes/admin.routes');


const fileRoutes = require('./src/routes/file.routes');


// ============================================================
// ROUTE MOUNTS
// ============================================================

app.use(
    '/pair',
    pairingRoutes
);

app.use(
    '/system',
    systemRoutes
);

app.use(
    '/application',
    applicationRoutes
);

app.use(
    '/device',
    deviceRoutes
);

app.use(
    '/local',
    localRoutes
);

app.use(
    '/logs',
    logsRoutes
);

app.use(
    '/settings',
    settingsRoutes
);

app.use(
    '/admin',
    adminRoutes
);

app.use('/files', fileRoutes);


// Root health/status endpoint
app.get('/', (req, res) => {
  const uptimeSeconds = Math.floor(process.uptime());

  res.json({
    success: true,
    message: 'AI Desktop Controller - Desktop Agent is running',
    port: 5000,
    uptimeSeconds,
    startedAt: new Date(
      Date.now() - (uptimeSeconds * 1000)
    ).toISOString()
  });
});

// ============================================================
// HEALTH CHECK
// ============================================================

app.get('/health', (req, res) => {
    execFile(
        'powershell.exe',
        [
            '-NoProfile',
            '-Command',
            `
            $cpu = (Get-Counter '\\Processor(_Total)\\% Processor Time').CounterSamples[0].CookedValue

            $temp = $null
            try {
                $thermal = Get-CimInstance -Namespace root/wmi -ClassName MSAcpi_ThermalZoneTemperature -ErrorAction Stop |
                    Where-Object { $_.CurrentTemperature -gt 0 } |
                    Select-Object -First 1

                if ($thermal) {
                    $temp = [math]::Round(($thermal.CurrentTemperature / 10) - 273.15, 1)
                }
            } catch {}

            [PSCustomObject]@{
                cpuUtilization = [math]::Round($cpu, 1)
                cpuTemperature = $temp
            } | ConvertTo-Json -Compress
            `
        ],
        {
            windowsHide: true,
            timeout: 5000
        },
        (error, stdout) => {
            if (error) {
                return res.status(503).json({
                    success: false,
                    status: 'unhealthy',
                    cpu: {
                        utilization: null,
                        temperature: null
                    },
                    timestamp: new Date().toISOString()
                });
            }

            try {
                const data = JSON.parse(stdout.trim());

                return res.json({
                    success: true,
                    status: 'healthy',
                    cpu: {
                        utilization: data.cpuUtilization,
                        temperature: data.cpuTemperature,
                        unit: '°C'
                    },
                    timestamp: new Date().toISOString()
                });
            } catch (parseError) {
                return res.status(503).json({
                    success: false,
                    status: 'unhealthy',
                    cpu: {
                        utilization: null,
                        temperature: null
                    },
                    timestamp: new Date().toISOString()
                });
            }
        }
    );
});


// ============================================================
// 404 HANDLER
// ============================================================

app.use(
    (req, res) => {

        console.log(
            `[404] ${req.method} ${req.originalUrl}`
        );

        return res.status(404).json({

            success: false,

            message:
                'Endpoint not found',

            path:
                req.originalUrl

        });

    }
);


// ============================================================
// ERROR HANDLER
// ============================================================

app.use(
    (error, req, res, next) => {

        console.error(
            '[SERVER ERROR]',
            error
        );

        if (res.headersSent) {
            return next(error);
        }

        return res.status(500).json({

            success: false,

            message:
                error.message ||
                'Internal server error'

        });

    }
);




// ============================================================
// START SERVER
// ============================================================

app.listen(
    PORT,
    '0.0.0.0',
    () => {

        console.log('');
        console.log(
            '=========================================='
        );
        console.log(
            '   AI DESKTOP CONTROLLER - DESKTOP AGENT'
        );
        console.log(
            '=========================================='
        );
        console.log(
            `Server running on port ${PORT}`
        );
        console.log(
            `Local: http://localhost:${PORT}`
        );
        console.log(
            `LAN:   http://0.0.0.0:${PORT}`
        );
        console.log(
            '=========================================='
        );
        console.log('');

    }
);