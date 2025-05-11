const express = require('express');
const gameController = require('../controllers/gameController');

const router = express.Router();

/**
 * @route POST /api/game
 * @desc Create a new game
 * @access Private
 */
router.post('/', gameController.createGame);

/**
 * @route GET /api/game
 * @desc Get all available games
 * @access Private
 */
router.get('/', gameController.getGames);

/**
 * @route GET /api/game/:id
 * @desc Get a specific game by ID
 * @access Private
 */
router.get('/:id', gameController.getGame);

/**
 * @route POST /api/game/:id/join
 * @desc Join an existing game
 * @access Private
 */
router.post('/:id/join', gameController.joinGame);

/**
 * @route POST /api/game/:id/start
 * @desc Start a game
 * @access Private
 */
router.post('/:id/start', gameController.startGame);

module.exports = router; 