import Groq from "groq-sdk";
import { logger } from "./utils/logger";

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
  logger.warn("GROQ_API_KEY is missing in environment variables");
}

const client = new Groq({ apiKey: apiKey || "" });

export const parseShoppingListFromText = async (text: string, categoryNames: string[] = []) => {
  const categoriesLine = categoryNames.length > 0
    ? `השתמש **בדיוק** באחת מהקטגוריות הבאות: ${categoryNames.map(c => `'${c}'`).join(', ')}.`
    : `קטגוריה משוערת בעברית (למשל: 'ירקות ופירות', 'מוצרי חלב', 'בשר ודגים', 'מאפים', 'מזווה', 'משקאות', 'ניקיון', 'אחר').`;

  const prompt = `
    תפקידך הוא עוזר חכם לאפליקציית קניות. המטרה שלך היא ליצור רשימת קניות — כלומר מה צריך לקנות בסופר — ולא לשחזר את הכמויות המדויקות מהמתכון.

    החזר פלט כאובייקט JSON עם מפתח "items" שערכו מערך. לדוגמה: {"items": [...]}. ללא סימני Markdown (כמו \`\`\`json).

    לכל פריט במערך, מלא את השדות הבאים:
    - name: שם המוצר כפי שמופיע בטקסט (כולל מותג/אחוז אם צוין, כגון "חלב 3% תנובה"). הסר רק כמויות ויחידות שהן חלק מהשם (כגון "500 גרם קמח" -> "קמח").
    - quantity: מספר שלם של יחידות קנייה (ברירת מחדל 1).
    - unit: יחידת קנייה. **חובה** להשתמש רק באחת מהבאות: 'יחידה', 'ק"ג', 'גרם', 'ליטר', 'מ"ל', 'אריזה', 'קופסה', 'שקית', 'בקבוק', 'קופסת שימורים'. **אסור** להשתמש ב'כוס', 'כף', 'כפית' או כל יחידת מטבח אחרת.
    - category: ${categoriesLine}

    כללי המרה מיחידות מטבח ליחידות קנייה:
    - כוס / כמה כוסות של נוזל (חלב, שמן, מים) -> ליטר או מ"ל, כמות 1
    - כוס / כמה כוסות של חומרים יבשים (קמח, סוכר, אורז) -> ק"ג, כמות 1
    - כף / כפית / קורט -> אריזה (כמות 1) לתבלינים/ממרחים, יחידה לביצים וכדומה
    - כמויות קטנות של תבלין -> אריזה (כמות 1)
    - ביצה/ביצים -> יחידה (כמות לפי מספר הביצים)

    דוגמאות:
    - "כוס קמח" -> name: "קמח", quantity: 1, unit: "ק"ג"
    - "3/4 כוס חלב 3% תנובה" -> name: "חלב 3% תנובה", quantity: 1, unit: "ליטר"
    - "2 כפיות אבקת אפייה" -> name: "אבקת אפייה", quantity: 1, unit: "אריזה"
    - "2 כפות סוכר" -> name: "סוכר", quantity: 1, unit: "ק"ג"
    - "ביצה אחת" -> name: "ביצה", quantity: 1, unit: "יחידה"
    - "כפית תמצית וניל" -> name: "תמצית וניל", quantity: 1, unit: "יחידה"
    - "2 כפות שמן" -> name: "שמן", quantity: 1, unit: "בקבוק"

    הטקסט לניתוח:
    "${text}"
  `;

  try {
    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a JSON API. Output ONLY a valid JSON object with a single key 'items' whose value is an array. No explanations, no markdown.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const rawContent = completion.choices[0]?.message.content || "";

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      logger.error("Groq json_object mode returned unparseable content", { rawContent });
      throw new Error("AI returned invalid JSON");
    }

    const items = (parsed as { items?: unknown }).items;
    if (!Array.isArray(items)) {
      logger.error("Groq response missing 'items' array", { parsed });
      throw new Error("AI returned invalid JSON");
    }
    return items;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const details = (error as { status?: unknown; code?: unknown })?.status ?? (error as { status?: unknown; code?: unknown })?.code ?? "";
    logger.error("Error parsing with Groq", { message, details });
    throw error instanceof Error ? error : new Error("Failed to parse shopping list from AI");
  }
};
