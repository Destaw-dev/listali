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
  } catch(err: any) {
    res.status(500).json(errorResponse("שגיאה בטעינת קטגוריות", err.stack));
  }
};

export const getActiveCategories = async (
  _: Request,
  res: Response<IApiResponse>
) => {
  try {
    const categories = await (Category as any).getActive();
    res.status(200).json(successResponse(categories, "קטגוריות פעילות נטענו בהצלחה"));
  } catch (err: any){
    res.status(500).json(errorResponse("שגיאה בטעינת קטגוריות פעילות", err.stack));
  }
};

export const getCategoryByNameEn = async (
  req: Request,
  res: Response<IApiResponse>
) => {
  try {
    const category = await (Category as any).getByNameEn(req.params.nameEn);
    if (!category) {
      res.status(404).json(errorResponse("קטגוריה לא נמצאה", 404));
      return;
    }
    res.status(200).json(successResponse(category, "קטגוריה נטענה בהצלחה"));
  } catch (err: any){
    res.status(500).json(errorResponse("שגיאה בטעינת קטגוריה", err.stack));
  }
};

export const getCategoriesWithSubCategories = async (
  _: Request,
  res: Response<IApiResponse>
) => {
  try {
    const data = await (Category as any).getWithSubCategories();
    res.status(200).json(successResponse(data, "קטגוריות ותתי־קטגוריות נטענו בהצלחה"));
  } catch (err: any){
    res.status(500).json(errorResponse("שגיאה בטעינת קטגוריות עם תתי־קטגוריות", err.stack));
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
  } catch (err: any) {
    res.status(400).json(errorResponse(err.message || "שגיאה ביצירת קטגוריה", err.stack));
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
  } catch (err: any) {
    res.status(400).json(errorResponse(err.message, err.stack));
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
  } catch (err: any){
    res.status(500).json(errorResponse("שגיאה במחיקת קטגוריה", err.stack));
  }
};
