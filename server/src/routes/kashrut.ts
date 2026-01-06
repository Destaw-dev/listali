import express from 'express';
import {
  getAllKashrut,
} from '../controllers/kashrut';

const router = express.Router();

router.get('/', getAllKashrut);

export default router;
