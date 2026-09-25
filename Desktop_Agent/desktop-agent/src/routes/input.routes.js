const express = require('express');

const {
    handleTypeText,
    handlePressKey,
    handleKeyCombination,

    handleMouseMove,
    handleMouseClick,
    handleMouseDoubleClick,
    handleMouseDown,
    handleMouseUp,
    handleMouseScroll
} = require('../controllers/input.controller');

const router = express.Router();


/* =========================================================
   KEYBOARD
========================================================= */

/*
   POST /input/keyboard/type
   Body:
   {
       "text": "Hello World"
   }
*/
router.post(
    '/keyboard/type',
    handleTypeText
);


/*
   POST /input/keyboard/press
   Body:
   {
       "key": "enter"
   }
*/
router.post(
    '/keyboard/press',
    handlePressKey
);


/*
   POST /input/keyboard/combination
   Body:
   {
       "keys": ["ctrl", "c"]
   }
*/
router.post(
    '/keyboard/combination',
    handleKeyCombination
);


/* =========================================================
   MOUSE
========================================================= */

/*
   POST /input/mouse/move
   Body:
   {
       "x": 500,
       "y": 300
   }
*/
router.post(
    '/mouse/move',
    handleMouseMove
);


/*
   POST /input/mouse/click
   Body:
   {
       "button": "left"
   }
*/
router.post(
    '/mouse/click',
    handleMouseClick
);


/*
   POST /input/mouse/double-click
   Body:
   {
       "button": "left"
   }
*/
router.post(
    '/mouse/double-click',
    handleMouseDoubleClick
);


/*
   POST /input/mouse/down
   Body:
   {
       "button": "left"
   }
*/
router.post(
    '/mouse/down',
    handleMouseDown
);


/*
   POST /input/mouse/up
   Body:
   {
       "button": "left"
   }
*/
router.post(
    '/input/mouse/up',
    handleMouseUp
);


/*
   POST /input/mouse/scroll
   Body:
   {
       "amount": 5
   }
*/
router.post(
    '/mouse/scroll',
    handleMouseScroll
);


module.exports = router;