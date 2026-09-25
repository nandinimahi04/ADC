const {
    mouse,
    keyboard,
    Button,
    Key
} = require('@nut-tree-fork/nut-js');


/* =========================================================
   KEY MAP
========================================================= */

const KEY_MAP = {
    backspace: Key.Backspace,
    tab: Key.Tab,
    enter: Key.Enter,
    escape: Key.Escape,
    esc: Key.Escape,
    space: Key.Space,

    up: Key.Up,
    down: Key.Down,
    left: Key.Left,
    right: Key.Right,

    home: Key.Home,
    end: Key.End,
    pageup: Key.PageUp,
    pagedown: Key.PageDown,

    insert: Key.Insert,
    delete: Key.Delete,

    shift: Key.LeftShift,
    ctrl: Key.LeftControl,
    control: Key.LeftControl,
    alt: Key.LeftAlt,
    win: Key.LeftWin,
    windows: Key.LeftWin,

    capslock: Key.CapsLock,

    f1: Key.F1,
    f2: Key.F2,
    f3: Key.F3,
    f4: Key.F4,
    f5: Key.F5,
    f6: Key.F6,
    f7: Key.F7,
    f8: Key.F8,
    f9: Key.F9,
    f10: Key.F10,
    f11: Key.F11,
    f12: Key.F12
};


/* =========================================================
   MOUSE BUTTON MAP
========================================================= */

const BUTTON_MAP = {
    left: Button.LEFT,
    right: Button.RIGHT,
    middle: Button.MIDDLE
};


/* =========================================================
   GET KEY
========================================================= */

function getKey(key) {
    if (!key) {
        throw new Error('Keyboard key is required.');
    }

    const normalized = String(key)
        .trim()
        .toLowerCase();

    /*
       Special key
    */
    if (KEY_MAP[normalized]) {
        return KEY_MAP[normalized];
    }

    /*
       Single character
       Examples:
       a
       b
       1
       ?
    */
    if (normalized.length === 1) {
        return normalized;
    }

    throw new Error(`Unsupported keyboard key: ${key}`);
}


/* =========================================================
   GET MOUSE BUTTON
========================================================= */

function getButton(button) {
    const normalized = String(button || 'left')
        .trim()
        .toLowerCase();

    if (!BUTTON_MAP[normalized]) {
        throw new Error(
            `Unsupported mouse button: ${button}`
        );
    }

    return BUTTON_MAP[normalized];
}


/* =========================================================
   TYPE TEXT
========================================================= */

async function typeText(text) {
    if (text === undefined || text === null) {
        throw new Error('Text is required.');
    }

    const value = String(text);

    await keyboard.type(value);

    return {
        success: true,
        action: 'type',
        text: value,
        message: 'Text typed successfully'
    };
}


/* =========================================================
   PRESS KEY
========================================================= */

async function pressKey(key) {
    const mappedKey = getKey(key);

    await keyboard.pressKey(mappedKey);
    await keyboard.releaseKey(mappedKey);

    return {
        success: true,
        action: 'press',
        key: String(key),
        message: `Key ${key} pressed successfully`
    };
}


/* =========================================================
   KEY COMBINATION
========================================================= */

async function pressCombination(keys) {
    if (!Array.isArray(keys) || keys.length === 0) {
        throw new Error(
            'keys must be a non-empty array.'
        );
    }

    const mappedKeys = keys.map(getKey);

    for (const key of mappedKeys) {
        await keyboard.pressKey(key);
    }

    for (const key of [...mappedKeys].reverse()) {
        await keyboard.releaseKey(key);
    }

    return {
        success: true,
        action: 'combination',
        keys,
        message: `Key combination ${keys.join('+')} executed successfully`
    };
}


/* =========================================================
   MOVE MOUSE
========================================================= */

async function moveMouse(x, y) {
    const mouseX = Number(x);
    const mouseY = Number(y);

    if (!Number.isFinite(mouseX) || !Number.isFinite(mouseY)) {
        throw new Error(
            'Valid numeric x and y coordinates are required.'
        );
    }

    await mouse.setPosition({
        x: mouseX,
        y: mouseY
    });

    return {
        success: true,
        action: 'move',
        x: mouseX,
        y: mouseY,
        message: 'Mouse moved successfully'
    };
}


/* =========================================================
   MOUSE CLICK
========================================================= */

async function clickMouse(button = 'left') {
    const mappedButton = getButton(button);

    await mouse.click(mappedButton);

    return {
        success: true,
        action: 'click',
        button,
        message: `${button} mouse click executed successfully`
    };
}


/* =========================================================
   DOUBLE CLICK
========================================================= */

async function doubleClickMouse(button = 'left') {
    const mappedButton = getButton(button);

    await mouse.doubleClick(mappedButton);

    return {
        success: true,
        action: 'doubleClick',
        button,
        message: `${button} mouse double-click executed successfully`
    };
}


/* =========================================================
   MOUSE BUTTON DOWN
========================================================= */

async function mouseDown(button = 'left') {
    const mappedButton = getButton(button);

    await mouse.pressButton(mappedButton);

    return {
        success: true,
        action: 'mouseDown',
        button,
        message: `${button} mouse button pressed`
    };
}


/* =========================================================
   MOUSE BUTTON UP
========================================================= */

async function mouseUp(button = 'left') {
    const mappedButton = getButton(button);

    await mouse.releaseButton(mappedButton);

    return {
        success: true,
        action: 'mouseUp',
        button,
        message: `${button} mouse button released`
    };
}


/* =========================================================
   SCROLL
========================================================= */

async function scrollMouse(amount) {
    const scrollAmount = Number(amount);

    if (!Number.isFinite(scrollAmount)) {
        throw new Error(
            'Valid numeric scroll amount is required.'
        );
    }

    await mouse.scrollDown(scrollAmount);

    return {
        success: true,
        action: 'scroll',
        amount: scrollAmount,
        message: 'Mouse scrolled successfully'
    };
}


/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
    typeText,
    pressKey,
    pressCombination,
    moveMouse,
    clickMouse,
    doubleClickMouse,
    mouseDown,
    mouseUp,
    scrollMouse
};