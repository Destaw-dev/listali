# תיעוד ListaLi

<div dir="rtl">

# תיעוד ListaLi

ברוכים הבאים לתיעוד המלא של פרויקט ListaLi - מערכת חכמה לניהול קניות קבוצתיות.

## 📚 תוכן התיעוד

תיעוד זה כולל:

1. **[API.md](./API.md)** - תיעוד מלא של כל ה-API endpoints
   - אימות והרשמה
   - ניהול קבוצות
   - רשימות קניות
   - פריטים
   - הודעות וצ'אט
   - מוצרים וקטגוריות
   - הגדרות ודשבורד

2. **[DEPLOYMENT.md](./DEPLOYMENT.md)** - הוראות פריסה מפורטות
   - הגדרת סביבת פיתוח
   - פריסה ל-production
   - הגדרת MongoDB
   - הגדרת משתני סביבה
   - Docker deployment
   - פריסה ל-Hetzner

3. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - תיעוד ארכיטקטורה מקיף
   - מבנה המערכת הכללי
   - ארכיטקטורת Client ו-Server
   - זרימת נתונים
   - ארכיטקטורת WebSocket
   - מבנה Database
   - דיאגרמות ותרשימים

## 🚀 התחלה מהירה

### לקריאה מהירה

אם אתה חדש בפרויקט, מומלץ להתחיל עם:
1. [README הראשי](../README.md) - סקירה כללית של הפרויקט
2. [ARCHITECTURE.md](./ARCHITECTURE.md) - הבנת הארכיטקטורה הכללית
3. [API.md](./API.md) - הבנת ה-API endpoints
4. [DEPLOYMENT.md](./DEPLOYMENT.md) - אם אתה מתכנן לפרוס

### למפתחים

אם אתה מפתח חדש בפרויקט:
1. קרא את [README הראשי](../README.md)
2. עיין ב-[ARCHITECTURE.md](./ARCHITECTURE.md) להבנת המבנה הכללי
3. עיין ב-[API.md](./API.md) להבנת ה-endpoints
4. בדוק את קבצי ה-types ב-`client/src/types` ו-`server/src/types`
5. עיין ב-controllers ו-routes להבנת הלוגיקה

## 📖 מבנה התיעוד

```
docs/
├── README.md          # קובץ זה - סקירה כללית
├── ARCHITECTURE.md    # תיעוד ארכיטקטורה
├── API.md             # תיעוד מלא של ה-API
├── DEPLOYMENT.md      # הוראות פריסה
└── deployment/        # קבצי פריסה נוספים (אם קיימים)
```

## 🔍 חיפוש בתיעוד

### לפי נושא

- **ארכיטקטורה**: ראה `ARCHITECTURE.md` → Overview
- **אימות**: ראה `API.md` → Authentication
- **קבוצות**: ראה `API.md` → Groups
- **רשימות קניות**: ראה `API.md` → Shopping Lists
- **WebSocket**: ראה `ARCHITECTURE.md` → WebSocket Architecture
- **פריסה**: ראה `DEPLOYMENT.md`

### לפי endpoint

כל ה-endpoints מתועדים ב-`API.md` עם:
- Method (GET, POST, PUT, DELETE)
- Path
- Headers נדרשים
- Body parameters
- Response format
- דוגמאות

## 💡 טיפים

1. **השתמש ב-Ctrl+F** לחיפוש בתיעוד
2. **עיין בדוגמאות** ב-API.md להבנה טובה יותר
3. **בדוק את ה-types** ב-TypeScript להבנת המבנה המדויק
4. **השתמש ב-Postman/Insomnia** לבדיקת ה-API

## 🐛 דיווח על בעיות

אם מצאת שגיאה בתיעוד או שיש לך הצעה לשיפור:
1. פתח issue ב-GitHub
2. ציין את הקובץ והסעיף הרלוונטי
3. תאר את הבעיה או ההצעה

## 📝 עדכון התיעוד

התיעוד מתעדכן באופן קבוע. אם אתה מעדכן קוד:
1. עדכן את התיעוד הרלוונטי
2. ודא שהדוגמאות עדיין תקפות
3. בדוק שהפורמט עקבי

---

**עודכן לאחרונה**: 2025

</div>

<div dir="ltr">

# ListaLi Documentation

Welcome to the complete documentation for ListaLi - Smart Group Shopping system.

## 📚 Documentation Contents

This documentation includes:

1. **[API.md](./API.md)** - Complete API endpoints documentation
   - Authentication & Registration
   - Group Management
   - Shopping Lists
   - Items
   - Messages & Chat
   - Products & Categories
   - Settings & Dashboard

2. **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Detailed deployment instructions
   - Development environment setup
   - Production deployment
   - MongoDB configuration
   - Environment variables
   - Docker deployment
   - Hetzner deployment

3. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Comprehensive architecture documentation
   - Overall system structure
   - Client and Server architecture
   - Data flow
   - WebSocket architecture
   - Database structure
   - Diagrams and charts

## 🚀 Quick Start

### Quick Reading

If you're new to the project, it's recommended to start with:
1. [Main README](../README.md) - Project overview
2. [ARCHITECTURE.md](./ARCHITECTURE.md) - Understanding overall architecture
3. [API.md](./API.md) - Understanding API endpoints
4. [DEPLOYMENT.md](./DEPLOYMENT.md) - If you plan to deploy

### For Developers

If you're a new developer on the project:
1. Read the [Main README](../README.md)
2. Review [ARCHITECTURE.md](./ARCHITECTURE.md) to understand the overall structure
3. Review [API.md](./API.md) to understand the endpoints
4. Check the type files in `client/src/types` and `server/src/types`
5. Review controllers and routes to understand the logic

## 📖 Documentation Structure

```
docs/
├── README.md          # This file - Overview
├── ARCHITECTURE.md    # Architecture documentation
├── API.md             # Complete API documentation
├── DEPLOYMENT.md      # Deployment instructions
└── deployment/        # Additional deployment files (if any)
```

## 🔍 Searching Documentation

### By Topic

- **Architecture**: See `ARCHITECTURE.md` → Overview
- **Authentication**: See `API.md` → Authentication
- **Groups**: See `API.md` → Groups
- **Shopping Lists**: See `API.md` → Shopping Lists
- **WebSocket**: See `ARCHITECTURE.md` → WebSocket Architecture
- **Deployment**: See `DEPLOYMENT.md`

### By Endpoint

All endpoints are documented in `API.md` with:
- Method (GET, POST, PUT, DELETE)
- Path
- Required headers
- Body parameters
- Response format
- Examples

## 💡 Tips

1. **Use Ctrl+F** to search in documentation
2. **Review examples** in API.md for better understanding
3. **Check the types** in TypeScript to understand the exact structure
4. **Use Postman/Insomnia** to test the API

## 🐛 Reporting Issues

If you found an error in the documentation or have a suggestion for improvement:
1. Open an issue on GitHub
2. Specify the relevant file and section
3. Describe the problem or suggestion

## 📝 Updating Documentation

Documentation is updated regularly. If you update code:
1. Update the relevant documentation
2. Ensure examples are still valid
3. Check that the format is consistent

---

**Last Updated**: 2025

</div>
