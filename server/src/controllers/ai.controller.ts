import { Request, Response } from "express";
import { parseShoppingListFromText } from "../ai.service";
import { logger } from "../utils/logger";
import Product from "../models/product";
import { Category } from "../models/category";

type ParsedAIItem = { name: string; quantity?: number; unit?: string; category?: string };
type ProductDoc = { name?: string; _id?: { toString(): string }; categoryId?: { toString(): string } };

function getCoreSearchTerm(name: string): string {
  const words = name.trim().split(/\s+/);
  const core: string[] = [];
  for (const w of words) {
    if (/\d/.test(w)) break;
    core.push(w);
  }
  return core.length > 0 ? core.join(' ') : (words[0] || '');
}

function normalizeObjectId(value: { toString(): string } | string | null | undefined): string | null {
  if (!value) return null;
  const normalized = typeof value === 'string' ? value : value.toString();
  return normalized && normalized !== '[object Object]' ? normalized : null;
}

export const parseText = async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ message: "Text content is required" });
    }

    const allCategories = await Category.find({}).select('_id name').lean();
    const categoryNames = allCategories.map((c) => c.name);
    const categoryIdByName = new Map(allCategories.map((c) => [c.name, String(c._id)]));

    const parsedItems = await parseShoppingListFromText(text, categoryNames);

    const searchResults = await Promise.allSettled(
      (parsedItems as ParsedAIItem[]).map((item) =>
        Product.searchByNameHebrew(getCoreSearchTerm(item.name), 1, 10)
      )
    );

    const items = (parsedItems as ParsedAIItem[]).map((item, i: number) => {
      const result = searchResults[i];
      const products: ProductDoc[] = result?.status === "fulfilled" ? (result.value[0] as ProductDoc[]) : [];

      const expectedCategoryId = item.category ? categoryIdByName.get(item.category) : null;
      const categoryMatchedProduct = expectedCategoryId
        ? (products.find((p) => normalizeObjectId(p.categoryId) === expectedCategoryId) ?? null)
        : null;
      const fallbackProduct = !expectedCategoryId ? (products[0] ?? null) : null;
      const match = categoryMatchedProduct ?? fallbackProduct;
      const matchedCategoryId = normalizeObjectId(match?.categoryId);

      return {
        ...item,
        productId: normalizeObjectId(match?._id) ?? null,
        categoryId: expectedCategoryId ?? matchedCategoryId ?? null,
      };
    });

    return res.status(200).json({ items });
  } catch (error) {
    logger.error("AI Controller Error", { error });
    return res.status(500).json({ message: "Failed to process text" });
  }
};
