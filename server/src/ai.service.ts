import Groq from "groq-sdk";
import { logger } from "./utils/logger";

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
  logger.warn("GROQ_API_KEY is missing in environment variables");
}

const client = new Groq({ apiKey: apiKey || "" });

export const parseShoppingListFromText = async (text: string) => {
  const prompt = `
    תפקידך הוא עוזר חכם לאפליקציית קניות. עליך לחלץ רשימת מצרכים מתוך הטקסט הבא (שיכול להיות מתכון, רשימה מבולגנת או טקסט חופשי).

    החזר פלט בפורמט JSON בלבד (מערך של אובייקטים), ללא סימני Markdown (כמו \`\`\`json).

    לכל פריט במערך, מלא את השדות הבאים:
    - name: שם המוצר בעברית (נקה תיאורים מיותרים, למשל "עגבניות אדומות ויפות" -> "עגבניות").
    - quantity: מספר (ברירת מחדל 1 אם לא צוין).
    - unit: יחידת מידה. נסה לנרמל לאחת מהבאות: 'יחידה', 'ק"ג', 'גרם', 'ליטר', 'מ"ל', 'אריזה', 'קופסה', 'שקית', 'בקבוק', 'קופסת שימורים'. אם לא ברור, השתמש ב'יחידה'.
    - category: קטגוריה משוערת בעברית (למשל: 'ירקות ופירות', 'מוצרי חלב', 'בשר ודגים', 'מאפים', 'מזווה', 'משקאות', 'ניקיון', 'אחר').

    הטקסט לניתוח:
    "${text}"
  `;

  try {
    const completion = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
    });

    const textResponse = completion.choices[0]?.message.content || "";

    const start = textResponse.indexOf("[");
    const end = textResponse.lastIndexOf("]");
    if (start === -1 || end === -1 || end < start) {
      logger.error("No JSON array found in Groq response", { textResponse });
      throw new Error("AI returned invalid JSON");
    }
    let jsonText = textResponse.slice(start, end + 1);

    // המרת שברים (1/4, 1/2 וכו') למספרים עשרוניים
    jsonText = jsonText.replace(/(\d+)\/(\d+)/g, (_, num, den) =>
      String(parseInt(num) / parseInt(den))
    );

    // תיקון גרשיים לא מוסקייפים ביחידות עבריות (ק"ג, מ"ל)
    jsonText = jsonText.replace(/ק"ג/g, 'ק\\"ג');
    jsonText = jsonText.replace(/מ"ל/g, 'מ\\"ל');

    try {
      return JSON.parse(jsonText);
    } catch {
      logger.error("Groq returned non-JSON response", { textResponse });
      throw new Error("AI returned invalid JSON");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const details = (error as any)?.status ?? (error as any)?.code ?? "";
    logger.error("Error parsing with Groq", { message, details });
    throw error instanceof Error ? error : new Error("Failed to parse shopping list from AI");
  }
};
