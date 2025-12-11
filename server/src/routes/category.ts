import { Router } from 'express';
import {
  getAllCategories,
  getActiveCategories,
  getCategoryByNameEn,
  getCategoriesWithSubCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/category';
import { authenticateToken } from '@/middleware/auth';

const router = Router();

router.get('/', getAllCategories);
router.get('/active', getActiveCategories);
router.get('/with-subcategories', getCategoriesWithSubCategories);
// router.get('/:nameEn', getCategoryByNameEn);
// router.post('/', authenticateToken, createCategory);
// router.put('/:id', authenticateToken, updateCategory);
// router.delete('/:id', authenticateToken, deleteCategory);

export default router;
