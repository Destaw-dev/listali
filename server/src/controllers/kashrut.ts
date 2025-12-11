import { Request, Response } from 'express';
import { KashrutModel } from '../models/kashrut';
import { IApiResponse } from '@/types';
import { errorResponse, successResponse } from '@/middleware/errorHandler';

export const getAllKashrut = async (_: Request, res: Response<IApiResponse>) => {
  try {
    const results = await KashrutModel.find().sort({ KashrutId: 1 });
    res.status(200).json(successResponse(results, 'Kashrut list retrieved successfully'));
  } catch (err: any) {
    res.status(500).json(errorResponse('שגיאה בטעינת כשרויות', 500, err.stack));
  }
};

export const createKashrut = async (req: Request, res: Response<IApiResponse>) => {
  try {
    const newKashrut = new KashrutModel(req.body);
    const saved = await newKashrut.save();
    res.status(201).json(successResponse(saved, 'Kashrut created successfully'));
  } catch (err: any) {
    res.status(400).json(errorResponse('שגיאה ביצירת כשרות', 400, err.stack));
  }
};

export const deleteKashrut = async (req: Request, res: Response<IApiResponse>) => {
  try {
    const deleted = await KashrutModel.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json(errorResponse('כשרות לא נמצאה', 404));
      return;
    }
    res.status(200).json(successResponse(null, 'Kashrut deleted successfully'));
  } catch (err: any) {
    res.status(500).json(errorResponse('שגיאה במחיקת כשרות', 500, err.stack));
  }
};
