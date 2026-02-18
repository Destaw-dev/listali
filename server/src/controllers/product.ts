import { Request, Response } from "express";
import Product from "../models/product";
import mongoose from "mongoose";
import {
  getPaginationParams,
  successResponse,
  errorResponse,
} from "../middleware/handlers";
import { IApiResponse, IProduct } from "../types";

export const getAllProducts = async (
  req: Request,
  res: Response<IApiResponse<IProduct[] | null>>
) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const [products, total] = await Promise.all([
      Product.find({ isActive: true })
        // .sort({ name: 1 })
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
      .json(errorResponse("error loading products"));
  }
};
export const getProductById = async (
  req: Request,
  res: Response<IApiResponse<IProduct | null>>
) => {
  try {
    const productId = req.params.productId as string;
    if (!productId) {
      res.status(404).json(errorResponse("invalid id"));
      return;
    }

    const product = await Product.findById(productId);

    return res.status(200).json(successResponse(product));
  } catch (err) {
    return res
      .status(500)
      .json(errorResponse("error loading product"));
  }
};

export const getProductsByCategory = async (
  req: Request,
  res: Response<IApiResponse<IProduct[] | null>>
) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const categoryId = new mongoose.Types.ObjectId(req.params.categoryId);
    if (!categoryId) {
      res.status(404).json(errorResponse("invalid category"));
      return;
    }

    const [products, total] = await Promise.all([
      Product.find({ categoryId, isActive: true })
        // .sort({ name: 1 })
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
      .json(errorResponse("error loading products by category"));
  }
};

export const getProductsBySubCategory = async (
  req: Request,
  res: Response<IApiResponse<IProduct[] | null>>
) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);

    const subCategoryId = new mongoose.Types.ObjectId(req.params.subCategoryId);

    if (!subCategoryId) {
      res.status(404).json(errorResponse("invalid sub category"));
      return;
    }

    const [products, total] = await Promise.all([
      Product.find({ subCategoryId, isActive: true })
        // .sort({ name: 1 })
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
      .json(errorResponse("error loading products by sub category"));
  }
};

export const getProductByBarcode = async (
  req: Request,
  res: Response<IApiResponse<IProduct | null>>
) => {
  try {
    const barcode = req.params.barcode as string;
    if (!barcode) {
      res.status(404).json(errorResponse("invalid barcode"));
      return;
    }

    const product = await Product.findOne({ barcode });
    return res.status(200).json(successResponse(product));
  } catch (err) {
    return res
      .status(500)
      .json(errorResponse("error loading product by barcode"));
  }
};

export const getBySearchByNameHebrew = async (
  req: Request,
  res: Response<IApiResponse<IProduct[] | null>>
) => {
  try {
    const { page, limit } = getPaginationParams(req.query);

    const searchTerm = req.query.query as string;

    if (!searchTerm) {
      res.status(404).json(errorResponse("invalid search term"));
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
    return res.json(successResponse(products, "products loaded successfully", pagination));
  } catch (err) {
    return res
      .status(500)
      .json(errorResponse("error loading products by search"));
  }
};

export const getKosherProducts = async (
  req: Request,
  res: Response<IApiResponse<IProduct[] | null>>
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
      .json(errorResponse("error loading kosher products"));
  }
};

export const getOrganicProducts = async (
  req: Request,
  res: Response<IApiResponse<IProduct[] | null>>
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
      .json(errorResponse("error loading organic products"));
  }
};

export const getGlutenFreeProducts = async (
  req: Request,
  res: Response<IApiResponse<IProduct[] | null>>
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
      .json(errorResponse("error loading gluten free products"));
  }
};

export const markAsKosher = async (
  req: Request,
  res: Response<IApiResponse<IProduct | null>>
) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json(errorResponse("product not found"));

    await product.markAsKosher();
    return res.json(successResponse(product, "product marked as kosher"));
  } catch {
    return res.status(500).json(errorResponse("error marking as kosher"));
  }
};

export const markAsOrganic = async (
  req: Request,
  res: Response<IApiResponse<IProduct | null>>
) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json(errorResponse("product not found"));

    await product.markAsOrganic();
    return res.json(successResponse(product, "product marked as organic"));
  } catch {
    return res
      .status(500)
      .json(errorResponse("error marking as organic"));
  }
};

export const markAsGlutenFree = async (
  req: Request,
  res: Response<IApiResponse<IProduct | null>>
) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json(errorResponse("product not found"));

    await product.markAsGlutenFree();
    return res.json(successResponse(product, "product marked as gluten free"));
  } catch {
    return res
      .status(500)
      .json(errorResponse("error marking as gluten free"));
  }
};
