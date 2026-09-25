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
        path.join(
            process.env.LOCALAPPDATA || '',
            'Programs',
            'Microsoft VS Code',
            'Code.exe'
        ),
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
                stdio: 'ignore'
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

    const executable = firstExistingPath(candidates);

    if (!executable) {
        throw new Error(
            `${normalized} executable was not found.`
        );
    }

    if (normalized === 'notepad') {
        const child = spawn(
            executable,
            [],
            {
                detached: true,
                windowsHide: false,
                stdio: 'ignore'
            }
        );

        child.unref();

        return {
            success: true,
            application: 'notepad',
            message: 'Notepad opened successfully'
        };
    }

    const child = spawn(
        executable,
        [],
        {
            detached: true,
            windowsHide: false,
            stdio: 'ignore'
        }
    );

    child.unref();

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

        const displayName =
            isBrowser
                ? BROWSER_DISPLAY_NAMES[normalized]
                : APPLICATION_DISPLAY_NAMES[normalized];

        addCommandHistory(
            'application',
            `open:${normalized}`,
            'failed',
            error?.message ||
                `Unable to open ${displayName}.`
        );

        throw new Error(
            `Unable to open ${displayName}.`
        );
    }

    const displayName =
        isBrowser
            ? BROWSER_DISPLAY_NAMES[normalized]
            : APPLICATION_DISPLAY_NAMES[normalized];

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