import { Request, Response } from "express";
import { parseShoppingListFromText } from "../ai.service";
import { logger } from "../utils/logger";
import Product from "../models/product";

type ParsedAIItem = { name: string; quantity?: number; unit?: string; category?: string };
type ProductDoc = { name?: string; _id?: { toString(): string }; categoryId?: { toString(): string } };

export const parseText = async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ message: "Text content is required" });
    }

    const parsedItems = await parseShoppingListFromText(text);

    // Enrich each item with a product DB match (parallel, server-side)
    const searchResults = await Promise.allSettled(
      (parsedItems as ParsedAIItem[]).map((item) => Product.searchByNameHebrew(item.name, 1, 1))
    );

    const items = (parsedItems as ParsedAIItem[]).map((item, i: number) => {
      const result = searchResults[i];
      const products: ProductDoc[] = result?.status === "fulfilled" ? (result.value[0] as ProductDoc[]) : [];
      const iName = (item.name || "").toLowerCase().trim();
      const match = products.find(
        (p) => (p.name || "").toLowerCase().trim() === iName
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