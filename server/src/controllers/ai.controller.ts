import { Request, Response } from "express";
import { parseShoppingListFromText } from "../ai.service";
import { logger } from "../utils/logger";
import Product from "../models/product";
import { Category } from "../models/category";

type ParsedAIItem = { name: string; quantity?: number; unit?: string; category?: string };
type ProductDoc = { name?: string; _id?: { toString(): string }; categoryId?: { toString(): string } };

function resolveCategory(
  aiCategory: string | undefined,
  categoryIdByName: Map<string, string>
): string | null {
  if (!aiCategory) return null;
  const trimmed = aiCategory.trim();
  if (!trimmed) return null;
  if (categoryIdByName.has(trimmed)) return categoryIdByName.get(trimmed)!;
  const lower = trimmed.toLowerCase();
  for (const [key, id] of categoryIdByName.entries()) {
    const keyLower = key.trim().toLowerCase();
    if (keyLower === lower || keyLower.includes(lower) || lower.includes(keyLower)) {
      return id;
    }
  }
  return null;
}

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

    const items = await Promise.all(
      (parsedItems as ParsedAIItem[]).map(async (item) => {
        const expectedCategoryId = resolveCategory(item.category, categoryIdByName);

        let products: ProductDoc[] = [];
        try {
          // Pass 1: search with full item name (more specific)
          const [fullResults] = await Product.searchByNameHebrew(item.name, 1, 5);
          products = fullResults as ProductDoc[];

          if (products.length > 0) {
            const hasMatch = !expectedCategoryId || products.some(
              (p) => normalizeObjectId(p.categoryId) === expectedCategoryId
            );
            if (!hasMatch) {
              // Pass 2: fall back to core term for broader results
              const coreTerm = getCoreSearchTerm(item.name);
              if (coreTerm !== item.name) {
                const [coreResults] = await Product.searchByNameHebrew(coreTerm, 1, 10);
                products = coreResults as ProductDoc[];
              }
            }
          } else {
            // Pass 2: no full-name results, try core term
            const coreTerm = getCoreSearchTerm(item.name);
            if (coreTerm !== item.name) {
              const [coreResults] = await Product.searchByNameHebrew(coreTerm, 1, 10);
              products = coreResults as ProductDoc[];
            }
          }
        } catch (err) {
          logger.warn("Product search failed", { name: item.name, err });
        }

        const categoryMatchedProduct = expectedCategoryId
          ? (products.find((p) => normalizeObjectId(p.categoryId) === expectedCategoryId) ?? null)
          : null;
        const fallbackProduct = !expectedCategoryId ? (products[0] ?? null) : null;
        const match = categoryMatchedProduct ?? fallbackProduct;

        return {
          ...item,
          productId: normalizeObjectId(match?._id) ?? null,
          categoryId: expectedCategoryId ?? normalizeObjectId(match?.categoryId) ?? null,
        };
      })
    );

    return res.status(200).json({ items });
  } catch (error) {
    logger.error("AI Controller Error", { error });
    return res.status(500).json({ message: "Failed to process text" });
  }
};
