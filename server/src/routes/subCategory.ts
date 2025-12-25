import express from 'express';
import {
  getAllSubCategories,
  getActiveSubCategories,
  getSubCategoriesByCategory,
  getSubCategoriesWithProducts,
} from '../controllers/subCategory';

const router = express.Router();

router.get('/', getAllSubCategories);
router.get('/active', getActiveSubCategories);
router.get('/by-category/:categoryId', getSubCategoriesByCategory);
router.get('/with-products', getSubCategoriesWithProducts);

export default router;
