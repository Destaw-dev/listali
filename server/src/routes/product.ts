import { Router } from 'express';
import { asyncHandler } from '../middleware/handlers';
import {
  getAllProducts,
  getProductsByCategory,
  getProductsBySubCategory,
  getKosherProducts,
  getOrganicProducts,
  getGlutenFreeProducts,
  // markAsKosher,
  // markAsOrganic,
  // markAsGlutenFree,
  getBySearchByNameHebrew,
  getProductById
} from '../controllers/product';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', asyncHandler(getAllProducts));
router.get('/product/:productId', authenticateToken, asyncHandler(getProductById));
router.get('/category/:categoryId', authenticateToken, asyncHandler(getProductsByCategory));
router.get('/sub-category/:subCategoryId', authenticateToken, asyncHandler(getProductsBySubCategory));
router.get('/search', authenticateToken, asyncHandler(getBySearchByNameHebrew));
router.get('/kosher', authenticateToken, asyncHandler(getKosherProducts));
router.get('/organic', authenticateToken, asyncHandler(getOrganicProducts));
router.get('/gluten-free', authenticateToken, asyncHandler(getGlutenFreeProducts));

// router.post('/:id/mark-kosher', markAsKosher);
// router.post('/:id/mark-organic', markAsKosher);
// router.post('/:id/mark-gluten-free', markAsKosher);

export default router;
