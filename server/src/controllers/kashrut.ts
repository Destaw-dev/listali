import { Request, Response } from 'express';
import { KashrutModel } from '../models/kashrut';
import { IApiResponse, IKashrut } from '../types';
import { errorResponse, successResponse } from '../middleware/handlers';

export const getAllKashrut = async (_: Request, res: Response<IApiResponse<IKashrut[] | null>>) => {
  try {
    const results = await KashrutModel.find().sort({ idFromApi: 1 }).lean();
    res.status(200).json(successResponse(results as IKashrut[], 'Kashrut list retrieved successfully'));
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    res.status(500).json(errorResponse('error loading kashrut', 500, error.stack || ''));
  }
};

export const createKashrut = async (req: Request, res: Response<IApiResponse<IKashrut | null>>) => {
  try {
    const newKashrut = new KashrutModel(req.body);
    const saved = await newKashrut.save();
    res.status(201).json(successResponse(saved.toObject() as IKashrut, 'Kashrut created successfully'));
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    res.status(400).json(errorResponse('error creating kashrut', 400, error.stack || ''));
  }
};

export const deleteKashrut = async (req: Request, res: Response<IApiResponse<null>>) => {
  try {
    const deleted = await KashrutModel.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json(errorResponse('kashrut not found', 404));
      return;
    }
    res.status(200).json(successResponse(null, 'Kashrut deleted successfully'));
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    res.status(500).json(errorResponse('error deleting kashrut', 500, error.stack || ''));
  }
};
