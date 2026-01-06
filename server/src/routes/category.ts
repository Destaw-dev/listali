import { Router } from 'express';
import {
  getAllCategories,
  getActiveCategories,
  getCategoriesWithSubCategories,
} from '../controllers/category';

const router = Router();

router.get('/', getAllCategories);
router.get('/active', getActiveCategories);
router.get('/with-subcategories', getCategoriesWithSubCategories);

export default router;
