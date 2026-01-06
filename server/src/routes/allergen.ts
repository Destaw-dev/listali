import express from 'express';
import {
  getAllAllergens,
} from '../controllers/allergen';

const router = express.Router();

router.get('/', getAllAllergens);

export default router;
