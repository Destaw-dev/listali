import express from 'express';
import { getDashboardData } from '../controllers/dashboard';
import { asyncHandler } from '../middleware/handlers';

const router = express.Router();

// GET /api/dashboard - Get dashboard data
router.get('/', asyncHandler(getDashboardData));

export default router;
