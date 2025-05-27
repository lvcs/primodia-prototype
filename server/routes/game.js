import { Router } from 'express';
import { createGame, getGames, getGame, joinGame, startGame } from '../controllers/gameController';

const router = Router();

/**
 * @route POST /api/game
 * @desc Create a new game
 * @access Private
 */
router.post('/', createGame);

/**
 * @route GET /api/game
 * @desc Get all available games
 * @access Private
 */
router.get('/', getGames);

/**
 * @route GET /api/game/:id
 * @desc Get a specific game by ID
 * @access Private
 */
router.get('/:id', getGame);

/**
 * @route POST /api/game/:id/join
 * @desc Join an existing game
 * @access Private
 */
router.post('/:id/join', joinGame);

/**
 * @route POST /api/game/:id/start
 * @desc Start a game
 * @access Private
 */
router.post('/:id/start', startGame);

export default router; 