import { Request, Response } from "express";
import { Category } from "../models/category";
import { errorResponse, successResponse } from "../middleware/handlers";
import { IApiResponse, ICategory } from "../types";


export const getAllCategories = async (
  req: Request,
  res: Response<IApiResponse<ICategory[] | null>>
) => {
  try {
    const categories = await Category.find().sort({ sortOrder: 1 });
    res.status(200).json(successResponse(categories, "categories loaded successfully"));
  } catch(error) {
    res.status(500).json(errorResponse("error loading categories", 500, error instanceof Error ? error.message : 'Failed to get categories'));
  }
};

export const getActiveCategories = async (
  _: Request,
  res: Response<IApiResponse<ICategory[] | null>>
) => {
  try {
    const categories = await Category.getActive();
    res.status(200).json(successResponse(categories, "active categories loaded successfully"));
  } catch (error) {
    res.status(500).json(errorResponse("error loading active categories", 500, error instanceof Error ? error.message : 'Failed to get active categories'));
  }
};

export const getCategoryByNameEn = async (
  req: Request,
  res: Response<IApiResponse<ICategory | null>>
) => {
  try {
    const category = await Category.getByNameEn(req.params.nameEn as string);
    if (!category) {
      res.status(404).json(errorResponse("category not found", 404));
      return;
    }
    res.status(200).json(successResponse(category, "category loaded successfully"));
  } catch (error) {
    res.status(500).json(errorResponse("error loading category by name", 500, error instanceof Error ? error.message : 'Failed to get category by name'));
  }
};

export const getCategoriesWithSubCategories = async (
  _: Request,
  res: Response<IApiResponse<ICategory[] | null>>
) => {
  try {
    const data = await Category.getWithSubCategories();
    res.status(200).json(successResponse(data, "categories and subcategories loaded successfully"));
  } catch (error) {
    res.status(500).json(errorResponse("error loading categories with subcategories", 500, error instanceof Error ? error.message : 'Failed to get categories with subcategories'));
  }
};

export const createCategory = async (
  req: Request,
  res: Response<IApiResponse<ICategory | null>>
) => {
  try {
    const newCategory = new Category(req.body);
    const saved = await newCategory.save();
    res.status(201).json(successResponse(saved, "category created successfully"));
  } catch (error) {
    res.status(400).json(errorResponse(error instanceof Error ? error.message : "error creating category", 400, error instanceof Error ? error.message : 'Failed to create category'));
  }
};

export const updateCategory = async (
  req: Request,
  res: Response<IApiResponse<ICategory | null>>
) => {
  try {
    const updated = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      res.status(404).json(errorResponse("category not found", 404));
      return;
    }
    res.status(200).json(successResponse(updated, "category updated successfully"));
  } catch (error) {
    res.status(400).json(errorResponse(error instanceof Error ? error.message : "error updating category", 400, error instanceof Error ? error.message : 'Failed to update category'));
  }
};

export const deleteCategory = async (
  req: Request,
  res: Response<IApiResponse<null>>
) => {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json(errorResponse("category not found", 404));
      return;
    }
    res.status(200).json(successResponse(null, "category deleted successfully"));
  } catch (error) {
    res.status(500).json(errorResponse("error deleting category", 500, error instanceof Error ? error.message : 'Failed to delete category'));
  }
};
