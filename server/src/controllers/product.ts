import { Request, Response } from "express";
import Product from "../models/product";
import mongoose from "mongoose";
import {
  getPaginationParams,
  successResponse,
} from "@/middleware/errorHandler";
import { IApiResponse } from "@/types";

// GET /api/products
export const getAllProducts = async (
  req: Request,
  res: Response<IApiResponse>
) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const [products, total] = await Promise.all([
      Product.find({ isActive: true })
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments({ isActive: true }),
    ]);
    const pagination = {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };
    return res.json(successResponse(products, "", pagination));
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, error: "שגיאה בטעינת מוצרים" });
  }
};
// GET /api/products
export const getProductById = async (
  req: Request,
  res: Response<IApiResponse>
) => {
  try {
    const productId = req.params.productId as string;
    if (!productId) {
      res.status(404).json({ success: false, error: "Id לא תקין" });
      return;
    }

    const product = await Product.findById(productId);

    return res.status(200).json(successResponse(product));
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, error: "שגיאה בטעינת מוצרים" });
  }
};

// GET /api/products/category/:categoryId
export const getProductsByCategory = async (
  req: Request,
  res: Response<IApiResponse>
) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const categoryId = new mongoose.Types.ObjectId(req.params.categoryId);
    if (!categoryId) {
      res.status(404).json({ success: false, error: "קטגוריה לא תקינה" });
      return;
    }

    const [products, total] = await Promise.all([
      Product.find({ categoryId, isActive: true })
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments({ categoryId, isActive: true }),
    ]);
    const pagination = {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };
    return res.json(successResponse(products, "", pagination));
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, error: "שגיאה בטעינת מוצרים לפי קטגוריה" });
  }
};

// GET /api/products/sub-category/:subCategoryId
export const getProductsBySubCategory = async (
  req: Request,
  res: Response<IApiResponse>
) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);

    const subCategoryId = new mongoose.Types.ObjectId(req.params.subCategoryId);

    if (!subCategoryId) {
      res.status(404).json({ success: false, error: "תת-קטגוריה לא תקינה" });
      return;
    }

    const [products, total] = await Promise.all([
      Product.find({ subCategoryId, isActive: true })
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments({ subCategoryId, isActive: true }),
    ]);
    const pagination = {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };
    return res.json(successResponse(products, "", pagination));
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, error: "שגיאה בטעינת מוצרים לפי תת-קטגוריה" });
  }
};

// GET /api/products/kosher
export const getBySearchByNameHebrew = async (
  req: Request,
  res: Response<IApiResponse>
) => {
  try {
    const { page, limit } = getPaginationParams(req.query);

    const searchTerm = req.query.query as string;

    

    if (!searchTerm) {
      res.status(404).json({ success: false, error: "שם לא תקין" });
      return
    }

    const [products, total] = await Product.searchByNameHebrew(
      searchTerm,
      page,
      limit
    );
    const pagination = {
      page,
      limit,
      total,
      pages: Math.ceil(Number(total) / limit),
    };
    return res.json(successResponse(products, "", pagination));
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, error: "שגיאה בטעינת מוצרים לפי חיפוש" });
  }
};

// GET /api/products/kosher
export const getKosherProducts = async (
  req: Request,
  res: Response<IApiResponse>
) => {
  try {
    const { page, limit } = getPaginationParams(req.query);

    const [products, total] = await Product.getKosherProducts(page, limit);
    const pagination = {
      page,
      limit,
      total,
      pages: Math.ceil(Number(total) / limit),
    };
    return res.json(successResponse(products, "", pagination));
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, error: "שגיאה בטעינת מוצרים כשרים" });
  }
};

// GET /api/products/organic
export const getOrganicProducts = async (
  req: Request,
  res: Response<IApiResponse>
) => {
  try {
    const { page, limit } = getPaginationParams(req.query);

    const [products, total] = await Product.getOrganicProducts(page, limit);
    const pagination = {
      page,
      limit,
      total,
      pages: Math.ceil(Number(total) / limit),
    };
    return res.json(successResponse(products, "", pagination));
  } catch {
    return res
      .status(500)
      .json({ success: false, error: "שגיאה בטעינת מוצרים אורגניים" });
  }
};

// GET /api/products/gluten-free
export const getGlutenFreeProducts = async (
  req: Request,
  res: Response<IApiResponse>
) => {
  try {
    const { page, limit } = getPaginationParams(req.query);

    const [products, total] = await Product.getGlutenFreeProducts(page, limit);
    const pagination = {
      page,
      limit,
      total,
      pages: Math.ceil(Number(total) / limit),
    };
    return res.json(successResponse(products, "", pagination));
  } catch {
    return res
      .status(500)
      .json({ success: false, error: "שגיאה בטעינת מוצרים ללא גלוטן" });
  }
};

// POST /api/products/:id/mark-kosher
export const markAsKosher = async (
  req: Request,
  res: Response<IApiResponse>
) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ success: false, error: "מוצר לא נמצא" });

    await product.markAsKosher();
    return res.json(successResponse(product, "המוצר סומן ככשר"));
  } catch {
    return res.status(500).json({ success: false, error: "שגיאה בסימון ככשר" });
  }
};

// POST /api/products/:id/mark-organic
export const markAsOrganic = async (
  req: Request,
  res: Response<IApiResponse>
) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ success: false, error: "מוצר לא נמצא" });

    await product.markAsOrganic();
    return res.json(successResponse(product, "המוצר סומן כאורגני"));
  } catch {
    return res
      .status(500)
      .json({ success: false, error: "שגיאה בסימון כאורגני" });
  }
};

// POST /api/products/:id/mark-gluten-free
export const markAsGlutenFree = async (
  req: Request,
  res: Response<IApiResponse>
) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ success: false, error: "מוצר לא נמצא" });

    await product.markAsGlutenFree();
    return res.json(successResponse(product, "המוצר סומן כללא גלוטן"));
  } catch {
    return res
      .status(500)
      .json({ success: false, error: "שגיאה בסימון ללא גלוטן" });
  }
};
