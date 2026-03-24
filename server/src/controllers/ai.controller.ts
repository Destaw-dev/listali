import { Request, Response } from "express";
import { parseShoppingListFromText } from "../ai.service";
import { logger } from "../utils/logger";
import Product from "../models/product";

export const parseText = async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ message: "Text content is required" });
    }

    const parsedItems = await parseShoppingListFromText(text);

    // Enrich each item with a product DB match (parallel, server-side)
    const searchResults = await Promise.allSettled(
      parsedItems.map((item: any) => Product.searchByNameHebrew(item.name, 1, 1))
    );

    const items = parsedItems.map((item: any, i: number) => {
      const result = searchResults[i];
      const [products] = result.status === "fulfilled" ? result.value : [[]];
      const iName = (item.name || "").toLowerCase().trim();
      const match = (products as any[]).find(
        (p: any) => (p.name || "").toLowerCase().trim() === iName
      );
      return {
        ...item,
        productId: match?._id?.toString() ?? null,
        categoryId: match?.categoryId?.toString() ?? null,
      };
    });

    return res.status(200).json({ items });
  } catch (error) {
    logger.error("AI Controller Error", { error });
    return res.status(500).json({ message: "Failed to process text" });
  }
};