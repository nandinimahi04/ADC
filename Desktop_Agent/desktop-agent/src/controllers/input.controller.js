const {
    typeText,
    pressKey,
    pressCombination,
    moveMouse,
    clickMouse,
    doubleClickMouse,
    mouseDown,
    mouseUp,
    scrollMouse
} = require('../services/input.service');


/* =========================================================
   TYPE TEXT
========================================================= */

async function handleTypeText(req, res) {
    try {
        const { text } = req.body || {};

        const result = await typeText(text);

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('[INPUT TYPE] Error:', error);

        return res.status(400).json({
            success: false,
            message: error.message || 'Unable to type text.'
        });
    }
}


/* =========================================================
   PRESS KEY
========================================================= */

async function handlePressKey(req, res) {
    try {
        const { key } = req.body || {};

        const result = await pressKey(key);

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('[INPUT KEY] Error:', error);

        return res.status(400).json({
            success: false,
            message: error.message || 'Unable to press key.'
        });
    }
}


/* =========================================================
   KEY COMBINATION
========================================================= */

async function handleKeyCombination(req, res) {
    try {
        const { keys } = req.body || {};

        const result = await pressCombination(keys);

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('[INPUT COMBINATION] Error:', error);

        return res.status(400).json({
            success: false,
            message:
                error.message ||
                'Unable to execute keyboard combination.'
        });
    }
}


/* =========================================================
   MOVE MOUSE
========================================================= */

async function handleMouseMove(req, res) {
    try {
        const { x, y } = req.body || {};

        const result = await moveMouse(x, y);

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('[MOUSE MOVE] Error:', error);

        return res.status(400).json({
            success: false,
            message:
                error.message ||
                'Unable to move mouse.'
        });
    }
}


/* =========================================================
   MOUSE CLICK
========================================================= */

async function handleMouseClick(req, res) {
    try {
        const { button = 'left' } = req.body || {};

        const result = await clickMouse(button);

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('[MOUSE CLICK] Error:', error);

        return res.status(400).json({
            success: false,
            message:
                error.message ||
                'Unable to click mouse.'
        });
    }
}


/* =========================================================
   MOUSE DOUBLE CLICK
========================================================= */

async function handleMouseDoubleClick(req, res) {
    try {
        const { button = 'left' } = req.body || {};

        const result = await doubleClickMouse(button);

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('[MOUSE DOUBLE CLICK] Error:', error);

        return res.status(400).json({
            success: false,
            message:
                error.message ||
                'Unable to double-click mouse.'
        });
    }
}


/* =========================================================
   MOUSE BUTTON DOWN
========================================================= */

async function handleMouseDown(req, res) {
    try {
        const { button = 'left' } = req.body || {};

        const result = await mouseDown(button);

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('[MOUSE DOWN] Error:', error);

        return res.status(400).json({
            success: false,
            message:
                error.message ||
                'Unable to press mouse button.'
        });
    }
}


/* =========================================================
   MOUSE BUTTON UP
========================================================= */

async function handleMouseUp(req, res) {
    try {
        const { button = 'left' } = req.body || {};

        const result = await mouseUp(button);

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('[MOUSE UP] Error:', error);

        return res.status(400).json({
            success: false,
            message:
                error.message ||
                'Unable to release mouse button.'
        });
    }
}


/* =========================================================
   MOUSE SCROLL
========================================================= */

async function handleMouseScroll(req, res) {
    try {
        const { amount } = req.body || {};

        const result = await scrollMouse(amount);

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('[MOUSE SCROLL] Error:', error);

        return res.status(400).json({
            success: false,
            message:
                error.message ||
                'Unable to scroll mouse.'
        });
    }
}


/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
    handleTypeText,
    handlePressKey,
    handleKeyCombination,

    handleMouseMove,
    handleMouseClick,
    handleMouseDoubleClick,
    handleMouseDown,
    handleMouseUp,
    handleMouseScroll
};