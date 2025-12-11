import express from 'express';
import {
  getAllSubCategories,
  getActiveSubCategories,
  getSubCategoriesByCategory,
  getSubCategoriesWithProducts,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory
} from '../controllers/subCategory';
import { authenticateToken } from '@/middleware/auth';

const router = express.Router();

router.get('/', getAllSubCategories);
router.get('/active', getActiveSubCategories);
router.get('/by-category/:categoryId', getSubCategoriesByCategory);
router.get('/with-products', getSubCategoriesWithProducts);
// router.post('/', authenticateToken, createSubCategory);
// router.put('/:id', authenticateToken, updateSubCategory);
// router.delete('/:id', authenticateToken, deleteSubCategory);

export default router;
