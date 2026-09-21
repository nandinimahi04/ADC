const {
    listDrives,
    listDirectory,
    openFile,
    closeFile,
    createFolder: createFolderOperation,
    renameItem,
    deleteItem
} = require('../services/file.service');

const {
    addCommandHistory
} = require('../services/database.service');

function record(req, command, status, message) {
    addCommandHistory({
        deviceId: req.device?.deviceId,
        commandType: 'file',
        command,
        status,
        message
    });
}

async function getDrives(req, res) {
    try {
        const drives = await listDrives();

        return res.json({
            success: true,
            data: { drives }
        });
    } catch (error) {
        record(
            req,
            'drives',
            'failed',
            error.message
        );

        return res.status(500).json({
            success: false,
            message: 'Unable to list drives'
        });
    }
}

async function getDirectory(req, res) {
    try {
        const result =
            await listDirectory(req.query.path);

        return res.json({
            success: true,
            data: result
        });
    } catch (error) {
        record(
            req,
            `list:${req.query?.path || ''}`,
            'failed',
            error.message
        );

        return res.status(400).json({
            success: false,
            message:
                error.message ||
                'Unable to list directory'
        });
    }
}

async function open(req, res) {
    try {
        const result =
            await openFile(req.body?.path);

        record(
            req,
            `open:${result.path}`,
            'success',
            result.message
        );

        return res.json({
            success: true,
            message: result.message,
            data: result
        });
    } catch (error) {
        record(
            req,
            `open:${req.body?.path || ''}`,
            'failed',
            error.message
        );

        return res.status(400).json({
            success: false,
            message:
                error.message ||
                'Unable to open file'
        });
    }
}

async function close(req, res) {
    try {
        const result =
            await closeFile(req.body?.path);

        record(
            req,
            `close:${result.path}`,
            'success',
            result.message
        );

        return res.json({
            success: true,
            message: result.message,
            data: result
        });
    } catch (error) {
        record(
            req,
            `close:${req.body?.path || ''}`,
            'failed',
            error.message
        );

        return res.status(400).json({
            success: false,
            message:
                error.message ||
                'Unable to close file'
        });
    }
}

async function createFolder(req, res) {
    try {
        const result =
            await createFolderOperation(
                req.body?.path,
                req.body?.name
            );

        record(
            req,
            `mkdir:${result.path}`,
            'success',
            result.message
        );

        return res.status(201).json({
            success: true,
            message: result.message,
            data: result
        });
    } catch (error) {
        record(
            req,
            `mkdir:${req.body?.path || ''}`,
            'failed',
            error.message
        );

        return res.status(400).json({
            success: false,
            message:
                error.message ||
                'Unable to create folder'
        });
    }
}

async function rename(req, res) {
    try {
        const result =
            await renameItem(
                req.body?.path,
                req.body?.newName
            );

        record(
            req,
            `rename:${result.oldPath}`,
            'success',
            result.message
        );

        return res.json({
            success: true,
            message: result.message,
            data: result
        });
    } catch (error) {
        record(
            req,
            `rename:${req.body?.path || ''}`,
            'failed',
            error.message
        );

        return res.status(400).json({
            success: false,
            message:
                error.message ||
                'Unable to rename item'
        });
    }
}

async function remove(req, res) {
    try {
        const result =
            await deleteItem(
                req.body?.path ||
                req.query?.path
            );

        record(
            req,
            `delete:${result.path}`,
            'success',
            result.message
        );

        return res.json({
            success: true,
            message: result.message,
            data: result
        });
    } catch (error) {
        record(
            req,
            `delete:${req.body?.path || req.query?.path || ''}`,
            'failed',
            error.message
        );

        return res.status(400).json({
            success: false,
            message:
                error.message ||
                'Unable to delete item'
        });
    }
}

module.exports = {
    getDrives,
    getDirectory,
    open,
    close,
    createFolder,
    rename,
    remove
};