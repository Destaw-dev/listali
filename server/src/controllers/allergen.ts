import { Request, Response } from 'express';
import { AllergenModel, IAllergen } from '../models/allergen';
import { IApiResponse } from '../types';
import { errorResponse, successResponse } from '../middleware/handlers';

export const getAllAllergens = async (_: Request, res: Response<IApiResponse<IAllergen[] | null>>) => {
  try {
    const allergens = await AllergenModel.find().sort({ allergenId: 1 }).lean();
    res.status(200).json(successResponse(allergens, 'Allergens retrieved successfully'));
  } catch (error) {
    res.status(500).json(errorResponse('error loading allergens', 500, error instanceof Error ? error.message : 'Failed to get allergens'));
  }
};

export const createAllergen = async (req: Request, res: Response<IApiResponse<IAllergen | null>>) => {
  try {
    const newAllergen = new AllergenModel(req.body);
    const saved = await newAllergen.save();
    res.status(201).json(successResponse(saved.toObject(), 'Allergen created successfully'));
  } catch (error) {
    res.status(400).json(errorResponse('error creating allergen', 400, error instanceof Error ? error.message : 'Failed to create allergen'));
  }
};

export const deleteAllergen = async (req: Request, res: Response<IApiResponse<null>>) => {
  try {
    const deleted = await AllergenModel.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json(errorResponse('allergen not found', 404));
      return;
    }
    res.status(200).json(successResponse(null, 'Allergen deleted successfully'));
  } catch (error) {
    res.status(500).json(errorResponse('error deleting allergen', 500, error instanceof Error ? error.message : 'Failed to delete allergen'));
  }
};