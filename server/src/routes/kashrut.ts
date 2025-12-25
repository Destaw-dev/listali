import express from 'express';
import {
  getAllKashrut,
  // createKashrut,
  // deleteKashrut
} from '../controllers/kashrut';
// import { authenticateToken } from '@/middleware/auth';

const router = express.Router();

router.get('/', getAllKashrut);
// router.post('/', authenticateToken, createKashrut);
// router.delete('/:id', authenticateToken, deleteKashrut);

export default router;
