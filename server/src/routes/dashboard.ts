import express from 'express';
import { getDashboardData } from '../controllers/dashboard';
import { asyncHandler } from '../middleware/handlers';

const router = express.Router();

router.get('/', asyncHandler(getDashboardData));

export default router;
