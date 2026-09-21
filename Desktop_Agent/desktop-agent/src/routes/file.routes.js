const express = require('express');

const {
    getDrives,
    getDirectory,
    open,
    close,
    createFolder,
    rename,
    remove
} = require('../controllers/file.controller');

const {
    authenticateRequest
} = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticateRequest);

router.get('/drives', getDrives);
router.get('/list', getDirectory);
router.post('/open', open);
router.post('/close', close);
router.post('/folder', createFolder);
router.post('/rename', rename);
router.delete('/item', remove);

module.exports = router;