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

    החזר פלט בפורמט JSON בלבד (מערך של אובייקטים), ללא סימני Markdown (כמו \`\`\`json).

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
          content: "You are a JSON API. You MUST output ONLY a valid JSON array. Never write code, explanations, markdown, or any text outside the JSON array.",
        },
        { role: "user", content: prompt },
      ],
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
    const details = (error as { status?: unknown; code?: unknown })?.status ?? (error as { status?: unknown; code?: unknown })?.code ?? "";
    logger.error("Error parsing with Groq", { message, details });
    throw error instanceof Error ? error : new Error("Failed to parse shopping list from AI");
  }
};
