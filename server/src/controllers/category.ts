import { Request, Response } from "express";
import { Category } from "../models/category";
import { errorResponse, successResponse } from "@/middleware/errorHandler";
import { IApiResponse } from "@/types";



export const getAllCategories = async (
  req: Request,
  res: Response<IApiResponse>
) => {
  try {
    const categories = await Category.find().sort({ sortOrder: 1 });
    res.status(200).json(successResponse(categories, "קטגוריות נטענו בהצלחה"));
  } catch(error) {
    res.status(500).json(errorResponse("שגיאה בטעינת קטגוריות", 500, error instanceof Error ? error.message : 'Failed to get categories'));
  }
};

export const getActiveCategories = async (
  _: Request,
  res: Response<IApiResponse>
) => {
  try {
    const categories = await Category.getActive();
    res.status(200).json(successResponse(categories, "קטגוריות פעילות נטענו בהצלחה"));
  } catch (error) {
    res.status(500).json(errorResponse("שגיאה בטעינת קטגוריות פעילות", 500, error instanceof Error ? error.message : 'Failed to get active categories'));
  }
};

export const getCategoryByNameEn = async (
  req: Request,
  res: Response<IApiResponse>
) => {
  try {
    const category = await Category.getByNameEn(req.params.nameEn as string);
    if (!category) {
      res.status(404).json(errorResponse("קטגוריה לא נמצאה", 404));
      return;
    }
    res.status(200).json(successResponse(category, "קטגוריה נטענה בהצלחה"));
  } catch (error) {
    res.status(500).json(errorResponse("שגיאה בטעינת קטגוריה", 500, error instanceof Error ? error.message : 'Failed to get category by name'));
  }
};

export const getCategoriesWithSubCategories = async (
  _: Request,
  res: Response<IApiResponse>
) => {
  try {
    const data = await Category.getWithSubCategories();
    res.status(200).json(successResponse(data, "קטגוריות ותתי־קטגוריות נטענו בהצלחה"));
  } catch (error) {
    res.status(500).json(errorResponse("שגיאה בטעינת קטגוריות עם תתי־קטגוריות", 500, error instanceof Error ? error.message : 'Failed to get categories with subcategories'));
  }
};

export const createCategory = async (
  req: Request,
  res: Response<IApiResponse>
) => {
  try {
    const newCategory = new Category(req.body);
    const saved = await newCategory.save();
    res.status(201).json(successResponse(saved, "קטגוריה נוצרה בהצלחה"));
  } catch (error) {
    res.status(400).json(errorResponse(error instanceof Error ? error.message : "שגיאה ביצירת קטגוריה", 400, error instanceof Error ? error.message : 'Failed to create category'));
  }
};

export const updateCategory = async (
  req: Request,
  res: Response<IApiResponse>
) => {
  try {
    const updated = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      res.status(404).json(errorResponse("קטגוריה לא נמצאה", 404));
      return;
    }
    res.status(200).json(successResponse(updated, "קטגוריה עודכנה בהצלחה"));
  } catch (error) {
    res.status(400).json(errorResponse(error instanceof Error ? error.message : "שגיאה בעדכון קטגוריה", 400, error instanceof Error ? error.message : 'Failed to update category'));
  }
};

export const deleteCategory = async (
  req: Request,
  res: Response<IApiResponse>
) => {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json(errorResponse("קטגוריה לא נמצאה", 404));
      return;
    }
    res.status(200).json(successResponse(null, "קטגוריה נמחקה בהצלחה"));
  } catch (error) {
    res.status(500).json(errorResponse("שגיאה במחיקת קטגוריה", 500, error instanceof Error ? error.message : 'Failed to delete category'));
  }
};
