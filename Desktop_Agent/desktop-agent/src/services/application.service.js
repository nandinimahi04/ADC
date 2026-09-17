const fs = require('fs');
const path = require('path');
const { execFile, spawn } = require('child_process');

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

function firstExistingPath(paths) {
    return paths.find(
        candidate =>
            candidate &&
            fs.existsSync(candidate)
    ) || null;
}

/**
 * Launch a Windows executable.
 *
 * Uses cmd.exe/start so Windows handles an already-running
 * browser correctly and paths containing spaces safely.
 */
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

/**
 * Fallback to the browser registered in Windows.
 */
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

async function launchBrowser(browser) {

    if (process.platform !== 'win32') {
        throw new Error(
            'Browser control is supported on Windows only.'
        );
    }

    const executable =
        firstExistingPath(
            BROWSER_CANDIDATES[browser] || []
        );

    if (executable) {
        await launchExecutable(executable);
        return;
    }

    await launchRegisteredBrowser(browser);
}

async function executeApplicationCommand(
    action,
    application
) {

    if (action !== 'open') {
        throw new Error(
            `Unsupported application action: ${action}`
        );
    }

    const normalized =
        String(application || '')
            .trim()
            .toLowerCase();

    if (
        !Object.prototype.hasOwnProperty.call(
            BROWSER_CANDIDATES,
            normalized
        )
    ) {
        throw new Error(
            `Unsupported application: ${normalized}`
        );
    }

    try {

        await launchBrowser(normalized);

    } catch (error) {

        console.error(
            `${normalized} launch error:`,
            error
        );

        throw new Error(
            `Unable to open ${BROWSER_DISPLAY_NAMES[normalized]}.`
        );
    }

    return {
        success: true,
        application: normalized,
        message:
            `${BROWSER_DISPLAY_NAMES[normalized]} opened successfully`
    };
}

module.exports = {
    executeApplicationCommand
};