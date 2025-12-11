import express from 'express';
import {
  getAllAllergens,
  createAllergen,
  deleteAllergen
} from '../controllers/allergen';
import { authenticateToken } from '@/middleware/auth';

const router = express.Router();

router.get('/', getAllAllergens);
// router.post('/', authenticateToken, createAllergen);
// router.delete('/:id', authenticateToken, deleteAllergen);

export default router;
