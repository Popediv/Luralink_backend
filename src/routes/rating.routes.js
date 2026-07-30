import express from 'express';
import { submitRating, getUserRatings, getMyRatings } from '../controllers/rating.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware);

// GET /api/ratings/my  – all ratings received by the logged-in user
router.get('/my', getMyRatings);

// GET /api/ratings/user/:userId  – public: ratings received by any user
router.get('/user/:userId', getUserRatings);

// POST /api/ratings  – submit a rating (worker ↔ facility, post-shift)
router.post('/', submitRating);

export default router;
