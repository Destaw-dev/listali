# ListaLi API Documentation

<div dir="rtl">

# תיעוד API של ListaLi

תיעוד מלא של כל ה-API endpoints במערכת ListaLi.

## 📋 תוכן עניינים

- [סקירה כללית](#סקירה-כללית)
- [אימות](#אימות-authentication)
- [קבוצות](#קבוצות-groups)
- [רשימות קניות](#רשימות-קניות-shopping-lists)
- [פריטים](#פריטים-items)
- [הודעות](#הודעות-messages)
- [מוצרים](#מוצרים-products)
- [קטגוריות](#קטגוריות-categories)
- [קניות](#קניות-shopping)
- [הגדרות](#הגדרות-settings)
- [דשבורד](#דשבורד-dashboard)
- [WebSocket Events](#websocket-events)

## 🌐 סקירה כללית

### Base URL

```
Development: http://localhost:5000/api
Production: https://api.listali.co.il/api
```

### Headers

כל הבקשות דורשות:
```http
Content-Type: application/json
```

בקשות מוגנות דורשות:
```http
Authorization: Bearer <access_token>
Cookie: refreshToken=<refresh_token>
```

### Response Format

כל התגובות בפורמט JSON:

```json
{
  "success": true,
  "data": { ... },
  "message": "Success message"
}
```

שגיאות:
```json
{
  "success": false,
  "error": "Error message",
  "errors": {
    "field": "Field error message"
  }
}
```

---

## 🔐 אימות (Authentication)

### הרשמה

**POST** `/api/auth/register`

יצירת משתמש חדש.

**Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "firstName": "string",
  "lastName": "string",
  "inviteCode": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "string",
    "refreshToken": "string",
    "sessionId": "string",
    "groupJoined": "string (optional)"
  }
}
```

### התחברות

**POST** `/api/auth/login`

התחברות למשתמש קיים.

**Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "string",
    "refreshToken": "string",
    "sessionId": "string"
  }
}
```

### התנתקות

**POST** `/api/auth/logout`

התנתקות מהמערכת.

**Headers:**
```http
Authorization: Bearer <access_token>
Cookie: refreshToken=<refresh_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### קבלת פרטי משתמש נוכחי

**GET** `/api/auth/me`

קבלת פרטי המשתמש המחובר.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "string",
      "username": "string",
      "email": "string",
      "firstName": "string",
      "lastName": "string",
      "avatar": "string (optional)",
      "preferences": { ... }
    }
  }
}
```

### עדכון פרופיל

**PUT** `/api/auth/profile`

עדכון פרטי הפרופיל.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Body:**
```json
{
  "username": "string (optional)",
  "firstName": "string (optional)",
  "lastName": "string (optional)",
  "avatar": "string (optional)"
}
```

### עדכון אימייל

**PUT** `/api/auth/email`

עדכון כתובת אימייל.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

### שינוי סיסמה

**PUT** `/api/auth/password`

שינוי סיסמה.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Body:**
```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

### רענון Token

**POST** `/api/auth/refresh`

רענון access token באמצעות refresh token.

**Headers:**
```http
Cookie: refreshToken=<refresh_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "string"
  }
}
```

### בדיקת זמינות שם משתמש

**GET** `/api/auth/check-username/:username`

בדיקה אם שם משתמש זמין.

**Response:**
```json
{
  "success": true,
  "data": {
    "available": true
  }
}
```

### בדיקת זמינות אימייל

**GET** `/api/auth/check-email/:email`

בדיקה אם אימייל זמין.

**Response:**
```json
{
  "success": true,
  "data": {
    "available": true
  }
}
```

### אימות אימייל

**POST** `/api/auth/verify-email`

אימות כתובת אימייל.

**Body:**
```json
{
  "token": "string"
}
```

### שליחת אימייל אימות מחדש

**POST** `/api/auth/resend-verification`

שליחת אימייל אימות מחדש.

**Headers:**
```http
Authorization: Bearer <access_token>
```

### Google OAuth

**POST** `/api/auth/google`

התחברות עם Google.

**GET** `/api/auth/google/url`

קבלת URL להתחברות Google.

**GET** `/api/auth/google/callback`

Callback מ-Google OAuth.

### הזמנות

**GET** `/api/auth/invitations`

קבלת כל ההזמנות של המשתמש.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**POST** `/api/auth/invitations/accept`

קבלת הזמנה לקבוצה.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Body:**
```json
{
  "code": "string"
}
```

**POST** `/api/auth/invitations/decline`

דחיית הזמנה לקבוצה.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Body:**
```json
{
  "code": "string"
}
```

---

## 👥 קבוצות (Groups)

כל ה-endpoints דורשים אימות.

### קבלת כל הקבוצות של המשתמש

**GET** `/api/groups`

קבלת כל הקבוצות שהמשתמש חבר בהן.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "string",
      "name": "string",
      "description": "string",
      "members": [ ... ],
      "owner": "string",
      "inviteCode": "string"
    }
  ]
}
```

### יצירת קבוצה

**POST** `/api/groups`

יצירת קבוצה חדשה.

**Body:**
```json
{
  "name": "string",
  "description": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "string",
    "name": "string",
    "description": "string",
    "inviteCode": "string"
  }
}
```

### קבלת פרטי קבוצה

**GET** `/api/groups/:groupId`

קבלת פרטי קבוצה ספציפית.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "string",
    "name": "string",
    "description": "string",
    "members": [ ... ],
    "shoppingLists": [ ... ]
  }
}
```

### עדכון קבוצה

**PUT** `/api/groups/:groupId`

עדכון פרטי קבוצה (דורש הרשאות ניהול).

**Body:**
```json
{
  "name": "string (optional)",
  "description": "string (optional)"
}
```

### מחיקת קבוצה

**DELETE** `/api/groups/:groupId`

מחיקת קבוצה (רק הבעלים).

### יציאה מקבוצה

**POST** `/api/groups/:groupId/leave`

יציאה מקבוצה.

### הזמנת משתמש לקבוצה

**POST** `/api/groups/:groupId/invite`

הזמנת משתמש חדש לקבוצה.

**Body:**
```json
{
  "email": "string",
  "role": "admin" | "member"
}
```

### ביטול הזמנה

**DELETE** `/api/groups/:groupId/invitations/:inviteCode`

ביטול הזמנה שנשלחה.

### הסרת חבר מקבוצה

**DELETE** `/api/groups/:groupId/members/:userId`

הסרת חבר מקבוצה (דורש הרשאות ניהול).

### עדכון תפקיד חבר

**PUT** `/api/groups/:groupId/members/:userId/role`

עדכון תפקיד חבר בקבוצה.

**Body:**
```json
{
  "role": "admin" | "member"
}
```

### העברת בעלות

**POST** `/api/groups/:groupId/transfer-ownership`

העברת בעלות על הקבוצה.

**Body:**
```json
{
  "newOwnerId": "string"
}
```

### קבלת חברי קבוצה

**GET** `/api/groups/:groupId/members`

קבלת רשימת כל החברים בקבוצה.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "userId": "string",
      "role": "owner" | "admin" | "member",
      "user": {
        "username": "string",
        "firstName": "string",
        "lastName": "string",
        "avatar": "string"
      }
    }
  ]
}
```

### סטטיסטיקות קבוצה

**GET** `/api/groups/:groupId/stats`

קבלת סטטיסטיקות של הקבוצה.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalMembers": 0,
    "totalLists": 0,
    "activeLists": 0,
    "completedLists": 0
  }
}
```

---

## 🛒 רשימות קניות (Shopping Lists)

כל ה-endpoints דורשים אימות.

### קבלת רשימות קניות של קבוצה

**GET** `/api/shopping-lists/groups/:groupId`

קבלת כל רשימות הקניות של קבוצה.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "string",
      "name": "string",
      "description": "string",
      "status": "active" | "completed" | "archived",
      "priority": "low" | "medium" | "high",
      "items": [ ... ]
    }
  ]
}
```

### קבלת רשימת קניות ספציפית

**GET** `/api/shopping-lists/:listId`

קבלת פרטי רשימת קניות עם כל הפריטים.

**Response:**
```json
{
  "success": true,
  "data": {
    "shoppingList": { ... },
    "items": [ ... ],
    "stats": {
      "totalItems": 0,
      "purchasedItems": 0,
      "remainingItems": 0,
      "progress": 0
    },
    "shoppingSession": {
      "currentUserSession": null,
      "activeSessions": [ ... ]
    }
  }
}
```

### יצירת רשימת קניות

**POST** `/api/shopping-lists/groups/:groupId`

יצירת רשימת קניות חדשה.

**Body:**
```json
{
  "name": "string",
  "description": "string (optional)",
  "priority": "low" | "medium" | "high"
}
```

### עדכון רשימת קניות

**PUT** `/api/shopping-lists/:listId`

עדכון פרטי רשימת קניות.

**Body:**
```json
{
  "name": "string (optional)",
  "description": "string (optional)",
  "priority": "low" | "medium" | "high (optional)"
}
```

### מחיקת רשימת קניות

**DELETE** `/api/shopping-lists/:listId`

מחיקת רשימת קניות.

### הוספת פריט לרשימה

**POST** `/api/shopping-lists/:listId/items`

הוספת פריט לרשימת קניות.

**Body:**
```json
{
  "name": "string",
  "quantity": 0,
  "unit": "string",
  "category": "string (optional)",
  "priority": "low" | "medium" | "high",
  "notes": "string (optional)"
}
```

### הסרת פריט מרשימה

**DELETE** `/api/shopping-lists/:listId/items/:itemId`

הסרת פריט מרשימת קניות.

### השלמת רשימת קניות

**POST** `/api/shopping-lists/:listId/complete`

סימון רשימת קניות כהושלמה.

### העברת רשימות אורח

**POST** `/api/shopping-lists/migrate`

העברת רשימות ממצב אורח למשתמש מחובר.

**Body:**
```json
{
  "lists": [ ... ]
}
```

---

## 📦 פריטים (Items)

כל ה-endpoints דורשים אימות.

### קבלת פריטים

**GET** `/api/items`

קבלת פריטים עם אפשרויות סינון.

**Query Parameters:**
- `shoppingListId`: ID של רשימת קניות
- `status`: סטטוס (pending, purchased, not_available)
- `category`: קטגוריה
- `priority`: עדיפות
- `search`: חיפוש טקסטואלי
- `sort`: שדה למיון
- `page`: מספר עמוד
- `limit`: מספר פריטים בעמוד

**Response:**
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### יצירת פריט

**POST** `/api/items`

יצירת פריט חדש.

**Body:**
```json
{
  "name": "string",
  "quantity": 0,
  "unit": "string",
  "shoppingListId": "string",
  "category": "string (optional)",
  "priority": "low" | "medium" | "high",
  "notes": "string (optional)",
  "product": "string (optional)"
}
```

### יצירת מספר פריטים

**POST** `/api/items/bulk`

יצירת מספר פריטים בבת אחת.

**Body:**
```json
{
  "items": [
    {
      "name": "string",
      "quantity": 0,
      "unit": "string",
      "shoppingListId": "string",
      ...
    }
  ]
}
```

### קבלת פריט ספציפי

**GET** `/api/items/:id`

קבלת פרטי פריט ספציפי.

### עדכון פריט

**PUT** `/api/items/:id`

עדכון פרטי פריט.

**Body:**
```json
{
  "name": "string (optional)",
  "quantity": 0,
  "unit": "string (optional)",
  "priority": "low" | "medium" | "high (optional)",
  "notes": "string (optional)"
}
```

### מחיקת פריט

**DELETE** `/api/items/:id`

מחיקת פריט.

### סימון פריט כנרכש

**POST** `/api/items/:id/purchase`

סימון פריט כנרכש.

**Body:**
```json
{
  "purchasedQuantity": 0,
  "actualPrice": 0
}
```

### ביטול רכישת פריט

**POST** `/api/items/:id/unpurchase`

ביטול סימון פריט כנרכש.

**Body:**
```json
{
  "quantityToUnpurchase": 0
}
```

### סימון פריט כלא זמין

**POST** `/api/items/:id/not-available`

סימון פריט כלא זמין בחנות.

### עדכון כמות פריט

**PUT** `/api/items/:id/quantity`

עדכון כמות פריט.

**Body:**
```json
{
  "quantity": 0
}
```

### רכישה מרוכזת

**POST** `/api/items/batch-purchase`

סימון מספר פריטים כנרכשים בבת אחת.

**Body:**
```json
{
  "itemIds": ["string"],
  "purchasedQuantities": [0]
}
```

### פריטים פופולריים

**GET** `/api/items/popular`

קבלת הפריטים הפופולריים ביותר.

**Query Parameters:**
- `groupId`: ID קבוצה
- `limit`: מספר פריטים

### חיפוש פריטים

**GET** `/api/items/search`

חיפוש פריטים לפי טקסט.

**Query Parameters:**
- `q`: שאילתת חיפוש
- `shoppingListId`: ID רשימת קניות
- `limit`: מספר תוצאות

### סטטיסטיקות קטגוריות

**GET** `/api/items/stats/categories`

קבלת סטטיסטיקות לפי קטגוריות.

**Query Parameters:**
- `shoppingListId`: ID רשימת קניות

### יחידות זמינות

**GET** `/api/items/units`

קבלת רשימת כל היחידות הזמינות.

### פריטים ידניים

**GET** `/api/items/manual`

קבלת פריטים שנוצרו ידנית (ללא מוצר).

### פריטים מבוססי מוצר

**GET** `/api/items/product-based`

קבלת פריטים המבוססים על מוצר מהמסד נתונים.

### פריטים לפי מוצר

**GET** `/api/items/by-product`

קבלת פריטים לפי מוצר ספציפי.

**Query Parameters:**
- `productId`: ID מוצר

---

## 💬 הודעות (Messages)

כל ה-endpoints דורשים אימות.

### קבלת הודעות

**GET** `/api/messages`

קבלת הודעות עם אפשרויות סינון.

**Query Parameters:**
- `groupId`: ID קבוצה
- `page`: מספר עמוד
- `limit`: מספר הודעות בעמוד
- `before`: ID הודעה (לפני)
- `after`: ID הודעה (אחרי)
- `messageType`: סוג הודעה
- `search`: חיפוש טקסטואלי

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "string",
      "content": "string",
      "sender": { ... },
      "messageType": "text" | "image" | "system",
      "timestamp": "date",
      "readBy": [ ... ]
    }
  ],
  "pagination": { ... }
}
```

### יצירת הודעה

**POST** `/api/messages`

יצירת הודעה חדשה.

**Body:**
```json
{
  "content": "string",
  "groupId": "string",
  "messageType": "text" | "image",
  "metadata": {
    "imageUrl": "string (optional)"
  }
}
```

### עדכון הודעה

**PUT** `/api/messages/:id`

עדכון הודעה קיימת.

**Body:**
```json
{
  "content": "string"
}
```

### מחיקת הודעה

**DELETE** `/api/messages/:id`

מחיקת הודעה.

### סימון הודעה כנקראה

**POST** `/api/messages/:id/read`

סימון הודעה כנקראה.

### סימון כל ההודעות כנקראו

**POST** `/api/messages/read-all`

סימון כל ההודעות כנקראו.

**Body:**
```json
{
  "groupId": "string"
}
```

### סימון הודעות קבוצה כנקראו

**POST** `/api/messages/group/:groupId/mark-read`

סימון כל הודעות הקבוצה כנקראו.

### הודעות שלא נקראו

**GET** `/api/messages/unread`

קבלת הודעות שלא נקראו.

**Query Parameters:**
- `groupId`: ID קבוצה

### חיפוש הודעות

**GET** `/api/messages/search`

חיפוש הודעות לפי טקסט.

**Query Parameters:**
- `q`: שאילתת חיפוש
- `groupId`: ID קבוצה
- `limit`: מספר תוצאות

### סטטיסטיקות הודעות

**GET** `/api/messages/stats`

קבלת סטטיסטיקות הודעות.

**Query Parameters:**
- `groupId`: ID קבוצה

### משתמשים פעילים

**GET** `/api/messages/active-users`

קבלת רשימת המשתמשים הפעילים ביותר.

**Query Parameters:**
- `groupId`: ID קבוצה

### סטטוס קריאה

**GET** `/api/messages/:id/read-status`

קבלת סטטוס הקריאה של הודעה.

### הודעות לפי סוג

**GET** `/api/messages/by-type/:type`

קבלת הודעות לפי סוג.

**Query Parameters:**
- `type`: סוג הודעה
- `page`: מספר עמוד
- `limit`: מספר הודעות

### הודעות אחרונות

**GET** `/api/messages/recent`

קבלת הודעות אחרונות.

### מידע על הודעות שלא נקראו

**GET** `/api/messages/group/:groupId/unread-info`

קבלת מידע על הודעות שלא נקראו בקבוצה.

**Response:**
```json
{
  "success": true,
  "data": {
    "unreadCount": 0,
    "lastReadAt": "date"
  }
}
```

### ייצוא הודעות

**GET** `/api/messages/export`

ייצוא הודעות לפורמט JSON/CSV.

**Query Parameters:**
- `groupId`: ID קבוצה
- `format`: json | csv

---

## 🏷️ מוצרים (Products)

### קבלת כל המוצרים

**GET** `/api/products`

קבלת כל המוצרים עם אפשרויות סינון.

**Query Parameters:**
- `page`: מספר עמוד
- `limit`: מספר מוצרים
- `search`: חיפוש טקסטואלי
- `category`: קטגוריה
- `subCategory`: תת-קטגוריה

### קבלת מוצר לפי ID

**GET** `/api/products/product/:productId`

קבלת פרטי מוצר ספציפי.

**Headers:**
```http
Authorization: Bearer <access_token>
```

### קבלת מוצרים לפי קטגוריה

**GET** `/api/products/category/:categoryId`

קבלת מוצרים לפי קטגוריה.

**Headers:**
```http
Authorization: Bearer <access_token>
```

### קבלת מוצרים לפי תת-קטגוריה

**GET** `/api/products/sub-category/:subCategoryId`

קבלת מוצרים לפי תת-קטגוריה.

**Headers:**
```http
Authorization: Bearer <access_token>
```

### חיפוש מוצר לפי שם

**GET** `/api/products/search`

חיפוש מוצר לפי שם בעברית.

**Query Parameters:**
- `name`: שם המוצר

### קבלת מוצר לפי ברקוד

**GET** `/api/products/barcode/:barcode`

קבלת מוצר לפי קוד ברקוד.

**Headers:**
```http
Authorization: Bearer <access_token>
```

### מוצרים כשרים

**GET** `/api/products/kosher`

קבלת מוצרים כשרים בלבד.

### מוצרים אורגניים

**GET** `/api/products/organic`

קבלת מוצרים אורגניים בלבד.

### מוצרים ללא גלוטן

**GET** `/api/products/gluten-free`

קבלת מוצרים ללא גלוטן.

---

## 📂 קטגוריות (Categories)

### קבלת כל הקטגוריות

**GET** `/api/categories`

קבלת כל הקטגוריות.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "string",
      "name": "string",
      "nameEn": "string",
      "icon": "string",
      "color": "string"
    }
  ]
}
```

### קבלת קטגוריות פעילות

**GET** `/api/categories/active`

קבלת רק קטגוריות פעילות.

### קבלת קטגוריות עם תת-קטגוריות

**GET** `/api/categories/with-subcategories`

קבלת קטגוריות עם כל התת-קטגוריות שלהן.

### קבלת כל התת-קטגוריות

**GET** `/api/sub-categories`

קבלת כל התת-קטגוריות.

### קבלת תת-קטגוריות לפי קטגוריה

**GET** `/api/sub-categories/category/:categoryId`

קבלת תת-קטגוריות של קטגוריה ספציפית.

### כשרות

**GET** `/api/kashrut`

קבלת כל סוגי הכשרות.

### אלרגנים

**GET** `/api/allergen`

קבלת כל האלרגנים.

---

## 🛍️ קניות (Shopping)

כל ה-endpoints דורשים אימות.

### התחלת קניות

**POST** `/api/shopping/start`

התחלת מצב קניות לרשימת קניות.

**Body:**
```json
{
  "listId": "string",
  "location": {
    "latitude": 0,
    "longitude": 0,
    "address": "string (optional)",
    "storeName": "string (optional)"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "string",
    "startedAt": "date",
    "totalItems": 0
  }
}
```

### עצירת קניות

**POST** `/api/shopping/stop`

עצירת מצב קניות.

**Body:**
```json
{
  "sessionId": "string"
}
```

### השהיית קניות

**POST** `/api/shopping/pause`

השהיית מצב קניות.

**Body:**
```json
{
  "sessionId": "string"
}
```

### המשכת קניות

**POST** `/api/shopping/resume`

המשכת מצב קניות שהופסק.

**Body:**
```json
{
  "sessionId": "string"
}
```

### עדכון מיקום

**PUT** `/api/shopping/location`

עדכון מיקום במהלך קניות.

**Body:**
```json
{
  "sessionId": "string",
  "location": {
    "latitude": 0,
    "longitude": 0,
    "address": "string (optional)",
    "storeName": "string (optional)"
  }
}
```

### סטטוס קניות נוכחי

**GET** `/api/shopping/status/:listId`

קבלת סטטוס הקניות הנוכחי של המשתמש.

### סשנים פעילים

**GET** `/api/shopping/sessions/:listId`

קבלת כל הסשנים הפעילים לרשימת קניות.

**Response:**
```json
{
  "success": true,
  "data": {
    "currentUserSession": { ... },
    "activeSessions": [ ... ],
    "totalActiveSessions": 0
  }
}
```

### סטטיסטיקות קניות

**GET** `/api/shopping/stats/:listId`

קבלת סטטיסטיקות קניות לרשימה.

### נתוני רשימת קניות

**GET** `/api/shopping/list-data/:listId`

קבלת כל הנתונים הנדרשים למצב קניות.

---

## ⚙️ הגדרות (Settings)

כל ה-endpoints דורשים אימות.

### קבלת העדפות משתמש

**GET** `/api/settings/preferences`

קבלת העדפות המשתמש.

**Response:**
```json
{
  "success": true,
  "data": {
    "theme": "light" | "dark" | "system",
    "language": "he" | "en"
  }
}
```

### עדכון העדפות משתמש

**PUT** `/api/settings/preferences`

עדכון העדפות המשתמש.

**Body:**
```json
{
  "theme": "light" | "dark" | "system",
  "language": "he" | "en"
}
```

### קבלת הגדרות התראות

**GET** `/api/settings/notifications`

קבלת הגדרות התראות.

**Response:**
```json
{
  "success": true,
  "data": {
    "pushNotifications": true,
    "emailNotifications": true,
    "newMessageNotifications": true,
    "shoppingListUpdates": true,
    "groupInvitations": true
  }
}
```

### עדכון הגדרות התראות

**PUT** `/api/settings/notifications`

עדכון הגדרות התראות.

**Body:**
```json
{
  "pushNotifications": true,
  "emailNotifications": true,
  "newMessageNotifications": true,
  "shoppingListUpdates": true,
  "groupInvitations": true
}
```

---

## 📊 דשבורד (Dashboard)

**GET** `/api/dashboard`

קבלת נתוני הדשבורד של המשתמש.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "groups": 0,
      "lists": 0,
      "completedLists": 0,
      "totalItems": 0,
      "purchasedItems": 0,
      "remainingItems": 0
    },
    "growth": {
      "groupsGrowth": 0,
      "listsGrowth": 0,
      "completedTasksGrowth": 0
    },
    "recentActivity": [ ... ],
    "achievements": [ ... ]
  }
}
```

---

## 🔌 WebSocket Events

המערכת משתמשת ב-Socket.IO לתקשורת בזמן אמת.

### Events מהשרת ללקוח

#### `list:updated`
עדכון רשימת קניות.

```json
{
  "listId": "string",
  "groupId": "string",
  "action": "create" | "update" | "delete" | "complete",
  "list": { ... },
  "updatedBy": {
    "id": "string",
    "username": "string"
  },
  "timestamp": "date"
}
```

#### `item:updated`
עדכון פריט.

```json
{
  "itemId": "string",
  "listId": "string",
  "action": "add" | "update" | "delete" | "purchase" | "unpurchase",
  "item": { ... },
  "updatedBy": {
    "id": "string",
    "username": "string"
  },
  "timestamp": "date"
}
```

#### `items:batch-updated`
עדכון מרוכז של פריטים.

```json
{
  "action": "batch_purchase" | "batch_unpurchase",
  "items": [ ... ],
  "updatedBy": { ... },
  "timestamp": "date",
  "listName": "string",
  "listId": "string"
}
```

#### `shopping:started`
התחלת קניות.

```json
{
  "listId": "string",
  "user": { ... },
  "startedAt": "date",
  "sessionId": "string"
}
```

#### `shopping:stopped`
עצירת קניות.

```json
{
  "listId": "string",
  "user": { ... },
  "stoppedAt": "date",
  "sessionId": "string",
  "itemsPurchased": 0,
  "totalItems": 0,
  "shoppingTime": 0
}
```

#### `shopping:paused`
השהיית קניות.

```json
{
  "listId": "string",
  "user": { ... },
  "pausedAt": "date",
  "sessionId": "string"
}
```

#### `shopping:resumed`
המשכת קניות.

```json
{
  "listId": "string",
  "user": { ... },
  "resumedAt": "date",
  "sessionId": "string"
}
```

#### `shopping:location_updated`
עדכון מיקום במהלך קניות.

```json
{
  "listId": "string",
  "user": { ... },
  "sessionId": "string",
  "location": {
    "latitude": 0,
    "longitude": 0,
    "address": "string",
    "storeName": "string"
  }
}
```

#### `chat:message`
הודעה חדשה בצ'אט.

```json
{
  "groupId": "string",
  "message": {
    "id": "string",
    "content": "string",
    "senderId": "string",
    "senderName": "string",
    "timestamp": "date",
    "type": "text" | "image" | "system"
  }
}
```

#### `user:status_changed`
שינוי סטטוס משתמש.

```json
{
  "userId": "string",
  "status": "online" | "offline" | "shopping" | "away",
  "timestamp": "date"
}
```

#### `notification`
התראה חדשה.

```json
{
  "type": "string",
  "title": "string",
  "message": "string",
  "data": { ... },
  "timestamp": "date"
}
```

### Events מלקוח לשרת

#### `join_group`
הצטרפות לחדר קבוצה.

```javascript
socket.emit('join_group', { groupId: 'string' });
```

#### `leave_group`
יציאה מחדר קבוצה.

```javascript
socket.emit('leave_group', { groupId: 'string' });
```

---

## ⚠️ קודי שגיאה

| קוד | תיאור |
|-----|-------|
| 200 | הצלחה |
| 201 | נוצר בהצלחה |
| 400 | בקשה שגויה |
| 401 | לא מאומת |
| 403 | אין הרשאה |
| 404 | לא נמצא |
| 409 | קונפליקט (למשל שם משתמש קיים) |
| 422 | שגיאת ולידציה |
| 429 | יותר מדי בקשות |
| 500 | שגיאת שרת |

---

**עודכן לאחרונה**: 2025

</div>

<div dir="ltr">

# ListaLi API Documentation

Complete documentation of all API endpoints in the ListaLi system.

## 📋 Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Groups](#groups)
- [Shopping Lists](#shopping-lists)
- [Items](#items)
- [Messages](#messages)
- [Products](#products)
- [Categories](#categories)
- [Shopping](#shopping)
- [Settings](#settings)
- [Dashboard](#dashboard)
- [WebSocket Events](#websocket-events)

## 🌐 Overview

### Base URL

```
Development: http://localhost:5000/api
Production: https://api.listali.co.il/api
```

### Headers

All requests require:
```http
Content-Type: application/json
```

Protected requests require:
```http
Authorization: Bearer <access_token>
Cookie: refreshToken=<refresh_token>
```

### Response Format

All responses are in JSON format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Success message"
}
```

Errors:
```json
{
  "success": false,
  "error": "Error message",
  "errors": {
    "field": "Field error message"
  }
}
```

---

## 🔐 Authentication

### Register

**POST** `/api/auth/register`

Create a new user account.

**Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "firstName": "string",
  "lastName": "string",
  "inviteCode": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "string",
    "refreshToken": "string",
    "sessionId": "string",
    "groupJoined": "string (optional)"
  }
}
```

### Login

**POST** `/api/auth/login`

Login to an existing account.

**Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "string",
    "refreshToken": "string",
    "sessionId": "string"
  }
}
```

### Logout

**POST** `/api/auth/logout`

Logout from the system.

**Headers:**
```http
Authorization: Bearer <access_token>
Cookie: refreshToken=<refresh_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Get Current User

**GET** `/api/auth/me`

Get details of the currently logged-in user.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "string",
      "username": "string",
      "email": "string",
      "firstName": "string",
      "lastName": "string",
      "avatar": "string (optional)",
      "preferences": { ... }
    }
  }
}
```

### Update Profile

**PUT** `/api/auth/profile`

Update user profile information.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Body:**
```json
{
  "username": "string (optional)",
  "firstName": "string (optional)",
  "lastName": "string (optional)",
  "avatar": "string (optional)"
}
```

### Update Email

**PUT** `/api/auth/email`

Update user email address.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

### Change Password

**PUT** `/api/auth/password`

Change user password.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Body:**
```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

### Refresh Token

**POST** `/api/auth/refresh`

Refresh access token using refresh token.

**Headers:**
```http
Cookie: refreshToken=<refresh_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "string"
  }
}
```

### Check Username Availability

**GET** `/api/auth/check-username/:username`

Check if username is available.

**Response:**
```json
{
  "success": true,
  "data": {
    "available": true
  }
}
```

### Check Email Availability

**GET** `/api/auth/check-email/:email`

Check if email is available.

**Response:**
```json
{
  "success": true,
  "data": {
    "available": true
  }
}
```

### Verify Email

**POST** `/api/auth/verify-email`

Verify email address.

**Body:**
```json
{
  "token": "string"
}
```

### Resend Verification Email

**POST** `/api/auth/resend-verification`

Resend verification email.

**Headers:**
```http
Authorization: Bearer <access_token>
```

### Google OAuth

**POST** `/api/auth/google`

Login with Google.

**GET** `/api/auth/google/url`

Get Google login URL.

**GET** `/api/auth/google/callback`

Google OAuth callback.

### Invitations

**GET** `/api/auth/invitations`

Get all user invitations.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**POST** `/api/auth/invitations/accept`

Accept a group invitation.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Body:**
```json
{
  "code": "string"
}
```

**POST** `/api/auth/invitations/decline`

Decline a group invitation.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Body:**
```json
{
  "code": "string"
}
```

---

## 👥 Groups

All endpoints require authentication.

### Get User Groups

**GET** `/api/groups`

Get all groups the user is a member of.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "string",
      "name": "string",
      "description": "string",
      "members": [ ... ],
      "owner": "string",
      "inviteCode": "string"
    }
  ]
}
```

### Create Group

**POST** `/api/groups`

Create a new group.

**Body:**
```json
{
  "name": "string",
  "description": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "string",
    "name": "string",
    "description": "string",
    "inviteCode": "string"
  }
}
```

### Get Group

**GET** `/api/groups/:groupId`

Get details of a specific group.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "string",
    "name": "string",
    "description": "string",
    "members": [ ... ],
    "shoppingLists": [ ... ]
  }
}
```

### Update Group

**PUT** `/api/groups/:groupId`

Update group details (requires management permissions).

**Body:**
```json
{
  "name": "string (optional)",
  "description": "string (optional)"
}
```

### Delete Group

**DELETE** `/api/groups/:groupId`

Delete a group (owner only).

### Leave Group

**POST** `/api/groups/:groupId/leave`

Leave a group.

### Invite User

**POST** `/api/groups/:groupId/invite`

Invite a new user to the group.

**Body:**
```json
{
  "email": "string",
  "role": "admin" | "member"
}
```

### Cancel Invitation

**DELETE** `/api/groups/:groupId/invitations/:inviteCode`

Cancel a sent invitation.

### Remove Member

**DELETE** `/api/groups/:groupId/members/:userId`

Remove a member from the group (requires management permissions).

### Update Member Role

**PUT** `/api/groups/:groupId/members/:userId/role`

Update member role in group.

**Body:**
```json
{
  "role": "admin" | "member"
}
```

### Transfer Ownership

**POST** `/api/groups/:groupId/transfer-ownership`

Transfer group ownership.

**Body:**
```json
{
  "newOwnerId": "string"
}
```

### Get Group Members

**GET** `/api/groups/:groupId/members`

Get list of all group members.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "userId": "string",
      "role": "owner" | "admin" | "member",
      "user": {
        "username": "string",
        "firstName": "string",
        "lastName": "string",
        "avatar": "string"
      }
    }
  ]
}
```

### Get Group Stats

**GET** `/api/groups/:groupId/stats`

Get group statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalMembers": 0,
    "totalLists": 0,
    "activeLists": 0,
    "completedLists": 0
  }
}
```

---

## 🛒 Shopping Lists

All endpoints require authentication.

### Get Group Shopping Lists

**GET** `/api/shopping-lists/groups/:groupId`

Get all shopping lists of a group.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "string",
      "name": "string",
      "description": "string",
      "status": "active" | "completed" | "archived",
      "priority": "low" | "medium" | "high",
      "items": [ ... ]
    }
  ]
}
```

### Get Shopping List

**GET** `/api/shopping-lists/:listId`

Get details of a shopping list with all items.

**Response:**
```json
{
  "success": true,
  "data": {
    "shoppingList": { ... },
    "items": [ ... ],
    "stats": {
      "totalItems": 0,
      "purchasedItems": 0,
      "remainingItems": 0,
      "progress": 0
    },
    "shoppingSession": {
      "currentUserSession": null,
      "activeSessions": [ ... ]
    }
  }
}
```

### Create Shopping List

**POST** `/api/shopping-lists/groups/:groupId`

Create a new shopping list.

**Body:**
```json
{
  "name": "string",
  "description": "string (optional)",
  "priority": "low" | "medium" | "high"
}
```

### Update Shopping List

**PUT** `/api/shopping-lists/:listId`

Update shopping list details.

**Body:**
```json
{
  "name": "string (optional)",
  "description": "string (optional)",
  "priority": "low" | "medium" | "high (optional)"
}
```

### Delete Shopping List

**DELETE** `/api/shopping-lists/:listId`

Delete a shopping list.

### Add Item to List

**POST** `/api/shopping-lists/:listId/items`

Add an item to a shopping list.

**Body:**
```json
{
  "name": "string",
  "quantity": 0,
  "unit": "string",
  "category": "string (optional)",
  "priority": "low" | "medium" | "high",
  "notes": "string (optional)"
}
```

### Remove Item from List

**DELETE** `/api/shopping-lists/:listId/items/:itemId`

Remove an item from a shopping list.

### Complete Shopping List

**POST** `/api/shopping-lists/:listId/complete`

Mark a shopping list as completed.

### Migrate Guest Lists

**POST** `/api/shopping-lists/migrate`

Migrate guest lists to logged-in user.

**Body:**
```json
{
  "lists": [ ... ]
}
```

---

## 📦 Items

All endpoints require authentication.

### Get Items

**GET** `/api/items`

Get items with filtering options.

**Query Parameters:**
- `shoppingListId`: Shopping list ID
- `status`: Status (pending, purchased, not_available)
- `category`: Category
- `priority`: Priority
- `search`: Text search
- `sort`: Sort field
- `page`: Page number
- `limit`: Items per page

**Response:**
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### Create Item

**POST** `/api/items`

Create a new item.

**Body:**
```json
{
  "name": "string",
  "quantity": 0,
  "unit": "string",
  "shoppingListId": "string",
  "category": "string (optional)",
  "priority": "low" | "medium" | "high",
  "notes": "string (optional)",
  "product": "string (optional)"
}
```

### Create Multiple Items

**POST** `/api/items/bulk`

Create multiple items at once.

**Body:**
```json
{
  "items": [
    {
      "name": "string",
      "quantity": 0,
      "unit": "string",
      "shoppingListId": "string",
      ...
    }
  ]
}
```

### Get Item

**GET** `/api/items/:id`

Get details of a specific item.

### Update Item

**PUT** `/api/items/:id`

Update item details.

**Body:**
```json
{
  "name": "string (optional)",
  "quantity": 0,
  "unit": "string (optional)",
  "priority": "low" | "medium" | "high (optional)",
  "notes": "string (optional)"
}
```

### Delete Item

**DELETE** `/api/items/:id`

Delete an item.

### Purchase Item

**POST** `/api/items/:id/purchase`

Mark an item as purchased.

**Body:**
```json
{
  "purchasedQuantity": 0,
  "actualPrice": 0
}
```

### Unpurchase Item

**POST** `/api/items/:id/unpurchase`

Unmark an item as purchased.

**Body:**
```json
{
  "quantityToUnpurchase": 0
}
```

### Mark Item as Not Available

**POST** `/api/items/:id/not-available`

Mark an item as not available in store.

### Update Item Quantity

**PUT** `/api/items/:id/quantity`

Update item quantity.

**Body:**
```json
{
  "quantity": 0
}
```

### Batch Purchase

**POST** `/api/items/batch-purchase`

Mark multiple items as purchased at once.

**Body:**
```json
{
  "itemIds": ["string"],
  "purchasedQuantities": [0]
}
```

### Popular Items

**GET** `/api/items/popular`

Get most popular items.

**Query Parameters:**
- `groupId`: Group ID
- `limit`: Number of items

### Search Items

**GET** `/api/items/search`

Search items by text.

**Query Parameters:**
- `q`: Search query
- `shoppingListId`: Shopping list ID
- `limit`: Number of results

### Category Statistics

**GET** `/api/items/stats/categories`

Get statistics by categories.

**Query Parameters:**
- `shoppingListId`: Shopping list ID

### Available Units

**GET** `/api/items/units`

Get list of all available units.

### Manual Items

**GET** `/api/items/manual`

Get items created manually (without product).

### Product-Based Items

**GET** `/api/items/product-based`

Get items based on products from database.

### Items by Product

**GET** `/api/items/by-product`

Get items by specific product.

**Query Parameters:**
- `productId`: Product ID

---

## 💬 Messages

All endpoints require authentication.

### Get Messages

**GET** `/api/messages`

Get messages with filtering options.

**Query Parameters:**
- `groupId`: Group ID
- `page`: Page number
- `limit`: Messages per page
- `before`: Message ID (before)
- `after`: Message ID (after)
- `messageType`: Message type
- `search`: Text search

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "string",
      "content": "string",
      "sender": { ... },
      "messageType": "text" | "image" | "system",
      "timestamp": "date",
      "readBy": [ ... ]
    }
  ],
  "pagination": { ... }
}
```

### Create Message

**POST** `/api/messages`

Create a new message.

**Body:**
```json
{
  "content": "string",
  "groupId": "string",
  "messageType": "text" | "image",
  "metadata": {
    "imageUrl": "string (optional)"
  }
}
```

### Update Message

**PUT** `/api/messages/:id`

Update an existing message.

**Body:**
```json
{
  "content": "string"
}
```

### Delete Message

**DELETE** `/api/messages/:id`

Delete a message.

### Mark Message as Read

**POST** `/api/messages/:id/read`

Mark a message as read.

### Mark All Messages as Read

**POST** `/api/messages/read-all`

Mark all messages as read.

**Body:**
```json
{
  "groupId": "string"
}
```

### Mark Group Messages as Read

**POST** `/api/messages/group/:groupId/mark-read`

Mark all group messages as read.

### Get Unread Messages

**GET** `/api/messages/unread`

Get unread messages.

**Query Parameters:**
- `groupId`: Group ID

### Search Messages

**GET** `/api/messages/search`

Search messages by text.

**Query Parameters:**
- `q`: Search query
- `groupId`: Group ID
- `limit`: Number of results

### Message Statistics

**GET** `/api/messages/stats`

Get message statistics.

**Query Parameters:**
- `groupId`: Group ID

### Active Users

**GET** `/api/messages/active-users`

Get list of most active users.

**Query Parameters:**
- `groupId`: Group ID

### Read Status

**GET** `/api/messages/:id/read-status`

Get read status of a message.

### Messages by Type

**GET** `/api/messages/by-type/:type`

Get messages by type.

**Query Parameters:**
- `type`: Message type
- `page`: Page number
- `limit`: Number of messages

### Recent Messages

**GET** `/api/messages/recent`

Get recent messages.

### Unread Info

**GET** `/api/messages/group/:groupId/unread-info`

Get unread messages info for group.

**Response:**
```json
{
  "success": true,
  "data": {
    "unreadCount": 0,
    "lastReadAt": "date"
  }
}
```

### Export Messages

**GET** `/api/messages/export`

Export messages to JSON/CSV format.

**Query Parameters:**
- `groupId`: Group ID
- `format`: json | csv

---

## 🏷️ Products

### Get All Products

**GET** `/api/products`

Get all products with filtering options.

**Query Parameters:**
- `page`: Page number
- `limit`: Number of products
- `search`: Text search
- `category`: Category
- `subCategory`: Sub-category

### Get Product by ID

**GET** `/api/products/product/:productId`

Get details of a specific product.

**Headers:**
```http
Authorization: Bearer <access_token>
```

### Get Products by Category

**GET** `/api/products/category/:categoryId`

Get products by category.

**Headers:**
```http
Authorization: Bearer <access_token>
```

### Get Products by Sub-Category

**GET** `/api/products/sub-category/:subCategoryId`

Get products by sub-category.

**Headers:**
```http
Authorization: Bearer <access_token>
```

### Search Product by Name

**GET** `/api/products/search`

Search product by Hebrew name.

**Query Parameters:**
- `name`: Product name

### Get Product by Barcode

**GET** `/api/products/barcode/:barcode`

Get product by barcode code.

**Headers:**
```http
Authorization: Bearer <access_token>
```

### Kosher Products

**GET** `/api/products/kosher`

Get only kosher products.

### Organic Products

**GET** `/api/products/organic`

Get only organic products.

### Gluten-Free Products

**GET** `/api/products/gluten-free`

Get only gluten-free products.

---

## 📂 Categories

### Get All Categories

**GET** `/api/categories`

Get all categories.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "string",
      "name": "string",
      "nameEn": "string",
      "icon": "string",
      "color": "string"
    }
  ]
}
```

### Get Active Categories

**GET** `/api/categories/active`

Get only active categories.

### Get Categories with Sub-Categories

**GET** `/api/categories/with-subcategories`

Get categories with all their sub-categories.

### Get All Sub-Categories

**GET** `/api/sub-categories`

Get all sub-categories.

### Get Sub-Categories by Category

**GET** `/api/sub-categories/category/:categoryId`

Get sub-categories of a specific category.

### Kashrut

**GET** `/api/kashrut`

Get all kashrut types.

### Allergens

**GET** `/api/allergen`

Get all allergens.

---

## 🛍️ Shopping

All endpoints require authentication.

### Start Shopping

**POST** `/api/shopping/start`

Start shopping mode for a shopping list.

**Body:**
```json
{
  "listId": "string",
  "location": {
    "latitude": 0,
    "longitude": 0,
    "address": "string (optional)",
    "storeName": "string (optional)"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "string",
    "startedAt": "date",
    "totalItems": 0
  }
}
```

### Stop Shopping

**POST** `/api/shopping/stop`

Stop shopping mode.

**Body:**
```json
{
  "sessionId": "string"
}
```

### Pause Shopping

**POST** `/api/shopping/pause`

Pause shopping mode.

**Body:**
```json
{
  "sessionId": "string"
}
```

### Resume Shopping

**POST** `/api/shopping/resume`

Resume paused shopping mode.

**Body:**
```json
{
  "sessionId": "string"
}
```

### Update Location

**PUT** `/api/shopping/location`

Update location during shopping.

**Body:**
```json
{
  "sessionId": "string",
  "location": {
    "latitude": 0,
    "longitude": 0,
    "address": "string (optional)",
    "storeName": "string (optional)"
  }
}
```

### Get Current Shopping Status

**GET** `/api/shopping/status/:listId`

Get current user's shopping status.

### Get Active Sessions

**GET** `/api/shopping/sessions/:listId`

Get all active sessions for a shopping list.

**Response:**
```json
{
  "success": true,
  "data": {
    "currentUserSession": { ... },
    "activeSessions": [ ... ],
    "totalActiveSessions": 0
  }
}
```

### Get Shopping Statistics

**GET** `/api/shopping/stats/:listId`

Get shopping statistics for a list.

### Get Shopping List Data

**GET** `/api/shopping/list-data/:listId`

Get all data needed for shopping mode.

---

## ⚙️ Settings

All endpoints require authentication.

### Get User Preferences

**GET** `/api/settings/preferences`

Get user preferences.

**Response:**
```json
{
  "success": true,
  "data": {
    "theme": "light" | "dark" | "system",
    "language": "he" | "en"
  }
}
```

### Update User Preferences

**PUT** `/api/settings/preferences`

Update user preferences.

**Body:**
```json
{
  "theme": "light" | "dark" | "system",
  "language": "he" | "en"
}
```

### Get Notification Settings

**GET** `/api/settings/notifications`

Get notification settings.

**Response:**
```json
{
  "success": true,
  "data": {
    "pushNotifications": true,
    "emailNotifications": true,
    "newMessageNotifications": true,
    "shoppingListUpdates": true,
    "groupInvitations": true
  }
}
```

### Update Notification Settings

**PUT** `/api/settings/notifications`

Update notification settings.

**Body:**
```json
{
  "pushNotifications": true,
  "emailNotifications": true,
  "newMessageNotifications": true,
  "shoppingListUpdates": true,
  "groupInvitations": true
}
```

---

## 📊 Dashboard

**GET** `/api/dashboard`

Get user dashboard data.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "groups": 0,
      "lists": 0,
      "completedLists": 0,
      "totalItems": 0,
      "purchasedItems": 0,
      "remainingItems": 0
    },
    "growth": {
      "groupsGrowth": 0,
      "listsGrowth": 0,
      "completedTasksGrowth": 0
    },
    "recentActivity": [ ... ],
    "achievements": [ ... ]
  }
}
```

---

## 🔌 WebSocket Events

The system uses Socket.IO for real-time communication.

### Server to Client Events

#### `list:updated`
Shopping list updated.

```json
{
  "listId": "string",
  "groupId": "string",
  "action": "create" | "update" | "delete" | "complete",
  "list": { ... },
  "updatedBy": {
    "id": "string",
    "username": "string"
  },
  "timestamp": "date"
}
```

#### `item:updated`
Item updated.

```json
{
  "itemId": "string",
  "listId": "string",
  "action": "add" | "update" | "delete" | "purchase" | "unpurchase",
  "item": { ... },
  "updatedBy": {
    "id": "string",
    "username": "string"
  },
  "timestamp": "date"
}
```

#### `items:batch-updated`
Batch item updates.

```json
{
  "action": "batch_purchase" | "batch_unpurchase",
  "items": [ ... ],
  "updatedBy": { ... },
  "timestamp": "date",
  "listName": "string",
  "listId": "string"
}
```

#### `shopping:started`
Shopping started.

```json
{
  "listId": "string",
  "user": { ... },
  "startedAt": "date",
  "sessionId": "string"
}
```

#### `shopping:stopped`
Shopping stopped.

```json
{
  "listId": "string",
  "user": { ... },
  "stoppedAt": "date",
  "sessionId": "string",
  "itemsPurchased": 0,
  "totalItems": 0,
  "shoppingTime": 0
}
```

#### `shopping:paused`
Shopping paused.

```json
{
  "listId": "string",
  "user": { ... },
  "pausedAt": "date",
  "sessionId": "string"
}
```

#### `shopping:resumed`
Shopping resumed.

```json
{
  "listId": "string",
  "user": { ... },
  "resumedAt": "date",
  "sessionId": "string"
}
```

#### `shopping:location_updated`
Location updated during shopping.

```json
{
  "listId": "string",
  "user": { ... },
  "sessionId": "string",
  "location": {
    "latitude": 0,
    "longitude": 0,
    "address": "string",
    "storeName": "string"
  }
}
```

#### `chat:message`
New chat message.

```json
{
  "groupId": "string",
  "message": {
    "id": "string",
    "content": "string",
    "senderId": "string",
    "senderName": "string",
    "timestamp": "date",
    "type": "text" | "image" | "system"
  }
}
```

#### `user:status_changed`
User status changed.

```json
{
  "userId": "string",
  "status": "online" | "offline" | "shopping" | "away",
  "timestamp": "date"
}
```

#### `notification`
New notification.

```json
{
  "type": "string",
  "title": "string",
  "message": "string",
  "data": { ... },
  "timestamp": "date"
}
```

### Client to Server Events

#### `join_group`
Join a group room.

```javascript
socket.emit('join_group', { groupId: 'string' });
```

#### `leave_group`
Leave a group room.

```javascript
socket.emit('leave_group', { groupId: 'string' });
```

---

## ⚠️ Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict (e.g., username exists) |
| 422 | Validation Error |
| 429 | Too Many Requests |
| 500 | Server Error |

---

**Last Updated**: 2025

</div>
