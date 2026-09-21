const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const { spawn } = require('child_process');

const openedProcesses = new Map();

function cleanPath(input) {
    if (typeof input !== 'string' || !input.trim()) {
        throw new Error('File path is required');
    }

    if (input.includes('\0')) {
        throw new Error('Invalid file path');
    }

    return path.win32.normalize(input.trim());
}

function getItemName(itemPath) {
    return path.win32.basename(itemPath) || itemPath;
}

async function listDrives() {
    const output = await runPowerShell(
        `Get-PSDrive -PSProvider FileSystem | Select-Object -ExpandProperty Root | ConvertTo-Json -Compress`
    );

    const parsed = JSON.parse(output || '[]');
    const roots = Array.isArray(parsed) ? parsed : [parsed];

    return roots
        .filter(Boolean)
        .map(root => ({
            name: root,
            path: root
        }))
        .sort((a, b) => a.path.localeCompare(b.path));
}

async function listDirectory(inputPath) {
    const directoryPath = cleanPath(inputPath);
    const stat = await fsp.stat(directoryPath);

    if (!stat.isDirectory()) {
        throw new Error('Path is not a directory');
    }

    const entries = await fsp.readdir(directoryPath, {
        withFileTypes: true
    });

    const items = await Promise.all(
        entries.map(async entry => {
            const fullPath = path.join(directoryPath, entry.name);

            let size = 0;
            let modifiedAt = null;

            try {
                const itemStat = await fsp.stat(fullPath);

                size = itemStat.isFile()
                    ? itemStat.size
                    : 0;

                modifiedAt = itemStat.mtime.toISOString();
            } catch (_) {
                // Ignore inaccessible/disappeared entries.
            }

            return {
                name: entry.name,
                path: fullPath,
                type: entry.isDirectory()
                    ? 'directory'
                    : 'file',
                size,
                modifiedAt
            };
        })
    );

    items.sort((a, b) => {
        if (a.type !== b.type) {
            return a.type === 'directory' ? -1 : 1;
        }

        return a.name.localeCompare(
            b.name,
            undefined,
            { sensitivity: 'base' }
        );
    });

    return {
        path: directoryPath,
        parentPath:
            path.dirname(directoryPath) === directoryPath
                ? null
                : path.dirname(directoryPath),
        items
    };
}

function runPowerShell(script, extraEnv = {}) {
    return new Promise((resolve, reject) => {
        const child = spawn(
            'powershell.exe',
            [
                '-NoProfile',
                '-NonInteractive',
                '-ExecutionPolicy',
                'Bypass',
                '-Command',
                script
            ],
            {
                windowsHide: true,
                stdio: ['ignore', 'pipe', 'pipe'],
                env: {
                    ...process.env,
                    ...extraEnv
                }
            }
        );

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', chunk => {
            stdout += chunk.toString();
        });

        child.stderr.on('data', chunk => {
            stderr += chunk.toString();
        });

        child.once('error', reject);

        child.once('close', code => {
            if (code === 0) {
                return resolve(stdout.trim());
            }

            reject(
                new Error(
                    stderr.trim() ||
                    'Windows operation failed'
                )
            );
        });
    });
}

async function openFile(inputPath) {
    const filePath = cleanPath(inputPath);
    const stat = await fsp.stat(filePath);

    if (!stat.isFile()) {
        throw new Error('Only files can be opened');
    }

    const output = await runPowerShell(
        '$p = Start-Process -LiteralPath $env:ADC_FILE_PATH -PassThru; Write-Output $p.Id',
        {
            ADC_FILE_PATH: filePath
        }
    );

    const pid = Number(output.trim());

    if (!Number.isInteger(pid) || pid <= 0) {
        throw new Error(
            'Unable to determine the opened application process'
        );
    }

    openedProcesses.set(filePath.toLowerCase(), {
        pid,
        path: filePath,
        openedAt: new Date().toISOString()
    });

    return {
        path: filePath,
        pid,
        message: `${getItemName(filePath)} opened successfully`
    };
}

async function closeFile(inputPath) {
    const filePath = cleanPath(inputPath);
    const key = filePath.toLowerCase();

    const opened = openedProcesses.get(key);

    if (!opened) {
        throw new Error(
            'This file was not opened by the Desktop Agent'
        );
    }

    const output = await runPowerShell(
        '$p = Get-Process -Id $env:ADC_PID -ErrorAction SilentlyContinue; ' +
        'if (-not $p) { Write-Output "not-running"; exit 0 }; ' +
        'if ($p.MainWindowHandle -eq 0) { Write-Output "no-window"; exit 0 }; ' +
        'if ($p.CloseMainWindow()) { Write-Output "closed" } ' +
        'else { Write-Output "close-failed" }',
        {
            ADC_PID: String(opened.pid)
        }
    );

    openedProcesses.delete(key);

    if (output === 'not-running') {
        return {
            path: filePath,
            message: `${getItemName(filePath)} was already closed`
        };
    }

    if (output !== 'closed') {
        throw new Error(
            'Unable to close the application window for this file'
        );
    }

    return {
        path: filePath,
        message: `${getItemName(filePath)} closed successfully`
    };
}

async function createFolder(inputPath, name) {
    const directoryPath = cleanPath(inputPath);

    if (typeof name !== 'string' || !name.trim()) {
        throw new Error('Folder name is required');
    }

    const folderName = name.trim();

    if (
        folderName === '.' ||
        folderName === '..' ||
        /[<>:"/\\|?*]/.test(folderName)
    ) {
        throw new Error('Invalid folder name');
    }

    const folderPath = path.join(
        directoryPath,
        folderName
    );

    await fsp.mkdir(folderPath, {
        recursive: false
    });

    return {
        path: folderPath,
        message: `${folderName} created successfully`
    };
}

async function renameItem(inputPath, newName) {
    const oldPath = cleanPath(inputPath);

    if (typeof newName !== 'string' || !newName.trim()) {
        throw new Error('New name is required');
    }

    const name = newName.trim();

    if (
        name === '.' ||
        name === '..' ||
        /[<>:"/\\|?*]/.test(name)
    ) {
        throw new Error('Invalid file or folder name');
    }

    const newPath = path.join(
        path.dirname(oldPath),
        name
    );

    await fsp.rename(oldPath, newPath);

    const oldKey = oldPath.toLowerCase();
    const opened = openedProcesses.get(oldKey);

    if (opened) {
        openedProcesses.delete(oldKey);

        opened.path = newPath;

        openedProcesses.set(
            newPath.toLowerCase(),
            opened
        );
    }

    return {
        oldPath,
        path: newPath,
        message: `${getItemName(oldPath)} renamed successfully`
    };
}

async function deleteItem(inputPath) {
    const itemPath = cleanPath(inputPath);
    const stat = await fsp.stat(itemPath);

    await fsp.rm(itemPath, {
        recursive: stat.isDirectory()
            ? false
            : undefined,
        force: false
    });

    openedProcesses.delete(
        itemPath.toLowerCase()
    );

    return {
        path: itemPath,
        message: `${getItemName(itemPath)} deleted successfully`
    };
}

module.exports = {
    listDrives,
    listDirectory,
    openFile,
    closeFile,
    createFolder,
    renameItem,
    deleteItem
};