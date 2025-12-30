import { Request, Response } from 'express';
import { SubCategory } from '../models/subCategory';
import { IApiResponse, ISubCategory } from '../types';
import { errorResponse, successResponse } from '../middleware/handlers';
import mongoose from 'mongoose';

export const getAllSubCategories = async (_: Request, res: Response<IApiResponse<ISubCategory[] | null>>) => {
  try {
    const subs = await SubCategory.find().sort({ sortOrder: 1 });
    res.status(200).json(successResponse(subs, 'All subcategories retrieved'));
  } catch (error) {
    res.status(500).json(errorResponse('error loading subcategories', 500, error instanceof Error ? error.message : 'Failed to get all subcategories'));
  }
};

export const getActiveSubCategories = async (_: Request, res: Response<IApiResponse<ISubCategory[] | null>>) => {
  try {
    const subs = await SubCategory.find({ isActive: true }).sort({ sortOrder: 1 });
    res.status(200).json(successResponse(subs, 'Active subcategories retrieved'));
  } catch (error) {
    res.status(500).json(errorResponse('error loading active subcategories', 500, error instanceof Error ? error.message : 'Failed to get active subcategories'));
  }
};

export const getSubCategoriesByCategory = async (req: Request, res: Response<IApiResponse<ISubCategory[] | null>>) => {
  try {
    const { categoryId } = req.params;

    if (!categoryId) {
      res.status(400).json({
        success: false,
        error: 'invalid categoryId or missing'
      });
      return;
    }
    const subs = await SubCategory.getByCategory(new mongoose.Types.ObjectId(categoryId));
    res.status(200).json(successResponse(subs, 'Subcategories by category retrieved'));
  } catch (error) {
    res.status(400).json(errorResponse('error loading subcategories by category', 400, error instanceof Error ? error.message : 'Failed to get subcategories by category'));
  }
};

export const getSubCategoriesWithProducts = async (req: Request, res: Response<IApiResponse<ISubCategory[] | null>>) => {
  try {
    const categoryId = req.query.categoryId as string | undefined;
    const subs = await SubCategory.getWithProducts(
        categoryId && mongoose.Types.ObjectId.isValid(categoryId)
          ? new mongoose.Types.ObjectId(categoryId)
          : undefined
      );
    res.status(200).json(successResponse(subs, 'Subcategories with products retrieved'));
  } catch (error) {
    res.status(500).json(errorResponse('error loading subcategories with products', 500, error instanceof Error ? error.message : 'Failed to get subcategories with products'));
  }
};

export const createSubCategory = async (req: Request, res: Response<IApiResponse<ISubCategory | null | void>>) => {
  try {
    const newSub = new SubCategory(req.body);
    const saved = await newSub.save();
    res.status(201).json(successResponse(saved, 'Subcategory created successfully'));
  } catch (error) {
    res.status(400).json(errorResponse('error creating subcategory', 400, error instanceof Error ? error.message : 'Failed to create subcategory'));
  }
};

export const updateSubCategory = async (req: Request, res: Response<IApiResponse<ISubCategory | null | void>>) => {
  try {
    const updated = await SubCategory.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!updated) {
      res.status(404).json(errorResponse('subcategory not found', 404));
      return;
    }
    res.status(200).json(successResponse(updated, 'Subcategory updated'));
  } catch (error) {
    res.status(400).json(errorResponse('error updating subcategory', 400, error instanceof Error ? error.message : 'Failed to update subcategory'));
  }
};

export const deleteSubCategory = async (req: Request, res: Response<IApiResponse<null | void>>) => {
  try {
    const deleted = await SubCategory.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json(errorResponse('subcategory not found', 404));
      return;
    }
    res.status(200).json(successResponse(null, 'Subcategory deleted'));
  } catch (error) {
    res.status(500).json(errorResponse('error deleting subcategory', 500, error instanceof Error ? error.message : 'Failed to delete subcategory'));
  }
};
