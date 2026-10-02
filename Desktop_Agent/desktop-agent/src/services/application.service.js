const fs = require('fs');
const path = require('path');
const { execFile, spawn } = require('child_process');

const {
    addCommandHistory
} = require('./database.service');

/* =========================================================
   BROWSER CONFIGURATION
========================================================= */

const BROWSER_CANDIDATES = {
    chrome: [
        path.join(
            process.env.PROGRAMFILES || '',
            'Google',
            'Chrome',
            'Application',
            'chrome.exe'
        ),
        path.join(
            process.env['PROGRAMFILES(X86)'] || '',
            'Google',
            'Chrome',
            'Application',
            'chrome.exe'
        ),
        path.join(
            process.env.LOCALAPPDATA || '',
            'Google',
            'Chrome',
            'Application',
            'chrome.exe'
        )
    ],

    edge: [
        path.join(
            process.env.PROGRAMFILES || '',
            'Microsoft',
            'Edge',
            'Application',
            'msedge.exe'
        ),
        path.join(
            process.env['PROGRAMFILES(X86)'] || '',
            'Microsoft',
            'Edge',
            'Application',
            'msedge.exe'
        ),
        path.join(
            process.env.LOCALAPPDATA || '',
            'Microsoft',
            'Edge',
            'Application',
            'msedge.exe'
        )
    ],

    firefox: [
        path.join(
            process.env.PROGRAMFILES || '',
            'Mozilla Firefox',
            'firefox.exe'
        ),
        path.join(
            process.env['PROGRAMFILES(X86)'] || '',
            'Mozilla Firefox',
            'firefox.exe'
        )
    ]
};

const BROWSER_DISPLAY_NAMES = {
    chrome: 'Google Chrome',
    edge: 'Microsoft Edge',
    firefox: 'Mozilla Firefox'
};


/* =========================================================
   APPLICATION CONFIGURATION
========================================================= */

const APPLICATION_CANDIDATES = {
    notepad: [
        path.join(
            process.env.WINDIR || 'C:\\Windows',
            'System32',
            'notepad.exe'
        )
    ],

    vscode: [
        // Optional manual override: add ADC_VSCODE_PATH=C:\...\Code.exe to .env
        process.env.ADC_VSCODE_PATH || '',

        // User install (default installer)
        path.join(
            process.env.LOCALAPPDATA || '',
            'Programs',
            'Microsoft VS Code',
            'Code.exe'
        ),

        // System install
        path.join(
            process.env.PROGRAMFILES || '',
            'Microsoft VS Code',
            'Code.exe'
        ),
        path.join(
            process.env['PROGRAMFILES(X86)'] || '',
            'Microsoft VS Code',
            'Code.exe'
        )
    ],

    calculator: [
        path.join(
            process.env.WINDIR || 'C:\\Windows',
            'System32',
            'calc.exe'
        )
    ]
};

const APPLICATION_DISPLAY_NAMES = {
    notepad: 'Notepad',
    vscode: 'Visual Studio Code',
    calculator: 'Windows Calculator'
};


/* =========================================================
   APPLICATION ALIASES
========================================================= */

const APPLICATION_ALIASES = {
    'vs code': 'vscode',
    'visual studio code': 'vscode',
    'visualstudio code': 'vscode',
    'visualstudio': 'vscode',
    'vscode': 'vscode',

    'calculator': 'calculator',
    'windows calculator': 'calculator',
    'windows calculator app': 'calculator',
    'calc': 'calculator',

    'notepad': 'notepad',
    'windows notepad': 'notepad'
};


/* =========================================================
   NORMALIZE APPLICATION NAME
========================================================= */

function normalizeApplicationName(application) {
    const normalized = String(application || '')
        .trim()
        .toLowerCase();

    return APPLICATION_ALIASES[normalized] || normalized;
}


/* =========================================================
   FIND FIRST EXISTING EXECUTABLE
========================================================= */

function firstExistingPath(paths) {
    return paths.find(
        candidate => candidate && fs.existsSync(candidate)
    ) || null;
}


/* =========================================================
   CLEAN ENVIRONMENT FOR LAUNCHED APPS

   If the agent was started from inside VS Code (its integrated
   terminal, a task, etc.) the environment can contain
   ELECTRON_RUN_AS_NODE / VSCODE_* variables. A child Code.exe
   that inherits ELECTRON_RUN_AS_NODE runs as plain Node and
   exits at once without showing any window.
========================================================= */

function buildCleanEnvironment() {
    const env = { ...process.env };

    for (const key of Object.keys(env)) {
        const upper = key.toUpperCase();

        if (
            upper === 'ELECTRON_RUN_AS_NODE' ||
            upper === 'ELECTRON_NO_ATTACH_CONSOLE' ||
            upper.startsWith('VSCODE_')
        ) {
            delete env[key];
        }
    }

    return env;
}


/* =========================================================
   FIND VS CODE USING "where code" (custom install locations)
========================================================= */

function findVsCodeFromPath() {
    return new Promise(resolve => {
        execFile(
            'where',
            ['code'],
            { windowsHide: true },
            (error, stdout) => {
                if (error || !stdout) {
                    resolve(null);
                    return;
                }

                const lines = stdout
                    .split(/\r?\n/)
                    .map(line => line.trim())
                    .filter(Boolean);

                for (const line of lines) {
                    // ...\Microsoft VS Code\bin\code.cmd  ->  ...\Microsoft VS Code\Code.exe
                    const installDir = path.dirname(path.dirname(line));
                    const exe = path.join(installDir, 'Code.exe');

                    if (fs.existsSync(exe)) {
                        resolve(exe);
                        return;
                    }
                }

                resolve(null);
            }
        );
    });
}


/* =========================================================
   GENERIC EXECUTABLE LAUNCHER
========================================================= */

function launchExecutable(executable) {
    return new Promise((resolve, reject) => {
        const child = spawn(
            'cmd.exe',
            [
                '/d',
                '/c',
                'start',
                '',
                executable
            ],
            {
                detached: true,
                windowsHide: true,
                shell: false,
                stdio: 'ignore',
                env: buildCleanEnvironment()
            }
        );

        let settled = false;

        const fail = error => {
            if (settled) {
                return;
            }

            settled = true;
            reject(error);
        };

        child.once('error', fail);

        child.once('spawn', () => {
            if (settled) {
                return;
            }

            settled = true;
            child.unref();
            resolve();
        });
    });
}


/* =========================================================
   LAUNCH REGISTERED BROWSER
========================================================= */

function launchRegisteredBrowser(browser) {
    return new Promise((resolve, reject) => {
        const executableName =
            browser === 'chrome'
                ? 'chrome.exe'
                : `${browser}.exe`;

        execFile(
            'cmd.exe',
            [
                '/d',
                '/c',
                'start',
                '',
                executableName
            ],
            {
                windowsHide: true
            },
            error => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve();
            }
        );
    });
}


/* =========================================================
   LAUNCH BROWSER
========================================================= */

async function launchBrowser(browser) {
    if (process.platform !== 'win32') {
        throw new Error(
            'Browser control is supported on Windows only.'
        );
    }

    const executable = firstExistingPath(
        BROWSER_CANDIDATES[browser] || []
    );

    if (executable) {
        await launchExecutable(executable);
        return;
    }

    await launchRegisteredBrowser(browser);
}


/* =========================================================
   LAUNCH APPLICATION
========================================================= */

async function launchApplication(application) {
    const normalized = normalizeApplicationName(application);

    const candidates = APPLICATION_CANDIDATES[normalized];

    if (!candidates) {
        throw new Error(
            `Unsupported application: ${normalized}`
        );
    }

    let executable = firstExistingPath(candidates);

    // VS Code installed in a custom folder: find it through PATH
    if (!executable && normalized === 'vscode') {
        executable = await findVsCodeFromPath();
    }

    if (!executable) {
        throw new Error(
            normalized === 'vscode'
                ? 'Code.exe was not found. Set ADC_VSCODE_PATH in the agent .env file.'
                : `${normalized} executable was not found.`
        );
    }

    console.log(`Launching ${normalized}: ${executable}`);

    await launchExecutable(executable);

    return {
        success: true,
        application: normalized,
        message: `${APPLICATION_DISPLAY_NAMES[normalized]} opened successfully`
    };
}


/* =========================================================
   EXECUTE APPLICATION COMMAND
========================================================= */

async function executeApplicationCommand(action, application) {

    if (action !== 'open') {
        throw new Error(
            `Unsupported application action: ${action}`
        );
    }

    const normalized = normalizeApplicationName(application);

    const isBrowser =
        Object.prototype.hasOwnProperty.call(
            BROWSER_CANDIDATES,
            normalized
        );

    const isApplication =
        Object.prototype.hasOwnProperty.call(
            APPLICATION_CANDIDATES,
            normalized
        );

    if (!isBrowser && !isApplication) {
        throw new Error(
            `Unsupported application: ${normalized}`
        );
    }

    const displayName =
        isBrowser
            ? BROWSER_DISPLAY_NAMES[normalized]
            : APPLICATION_DISPLAY_NAMES[normalized];

    try {
        if (isBrowser) {
            await launchBrowser(normalized);
        } else {
            await launchApplication(normalized);
        }
    } catch (error) {
        console.error(
            `${normalized} launch error:`,
            error
        );

        addCommandHistory(
            'application',
            `open:${normalized}`,
            'failed',
            error?.message ||
                `Unable to open ${displayName}.`
        );

        throw new Error(
            `Unable to open ${displayName}. ${error?.message || ''}`.trim()
        );
    }

    addCommandHistory(
        'application',
        `open:${normalized}`,
        'success',
        `${displayName} opened successfully`
    );

    return {
        success: true,
        application: normalized,
        message: `${displayName} opened successfully`
    };
}


/* =========================================================
   EXPORT
========================================================= */

module.exports = {
    executeApplicationCommand
};