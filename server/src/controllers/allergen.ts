import { Request, Response } from 'express';
import { AllergenModel } from '../models/allergen';
import { IApiResponse } from '@/types';
import { errorResponse, successResponse } from '@/middleware/errorHandler';

export const getAllAllergens = async (_: Request, res: Response<IApiResponse>) => {
  try {
    const allergens = await AllergenModel.find().sort({ allergenId: 1 });
    res.status(200).json(successResponse(allergens, 'Allergens retrieved successfully'));
  } catch (error) {
    res.status(500).json(errorResponse('שגיאה בטעינת רשימת האלרגנים', 500, error instanceof Error ? error.message : 'Failed to get allergens'));
  }
};

export const createAllergen = async (req: Request, res: Response<IApiResponse>) => {
  try {
    const newAllergen = new AllergenModel(req.body);
    const saved = await newAllergen.save();
    res.status(201).json(successResponse(saved, 'Allergen created successfully'));
  } catch (error) {
    res.status(400).json(errorResponse('שגיאה ביצירת אלרגן', 400, error instanceof Error ? error.message : 'Failed to create allergen'));
  }
};

export const deleteAllergen = async (req: Request, res: Response<IApiResponse>) => {
  try {
    const deleted = await AllergenModel.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json(errorResponse('אלרגן לא נמצא', 404, 'Allergen not found'));
      return;
    }
    res.status(200).json(successResponse(null, 'Allergen deleted successfully'));
  } catch (error) {
    res.status(500).json(errorResponse('שגיאה במחיקת אלרגן', 500, error instanceof Error ? error.message : 'Failed to delete allergen'));
  }
};