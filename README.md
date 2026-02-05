# ListaLi - Smart Group Shopping

<div dir="rtl">

# ListaLi - מערכת חכמה לניהול קניות קבוצתיות

מערכת מתקדמת לניהול רשימות קניות משותפות עם תמיכה בזמן אמת, שיתוף פעולה קבוצתי, ומסד נתונים של מוצרים.

## 📋 תוכן עניינים

- [תיאור כללי](#תיאור-כללי)
- [תכונות עיקריות](#תכונות-עיקריות)
- [טכנולוגיות](#טכנולוגיות)
- [התקנה והרצה](#התקנה-והרצה)
- [מבנה הפרויקט](#מבנה-הפרויקט)
- [תיעוד](#תיעוד)
- [פיתוח](#פיתוח)
- [רישיון](#רישיון)

## 🎯 תיאור כללי

ListaLi היא אפליקציית Web מתקדמת לניהול רשימות קניות משותפות. המערכת מאפשרת למשתמשים ליצור קבוצות, לנהל רשימות קניות משותפות, ולשתף פעולה בזמן אמת עם חברי הקבוצה.

### תכונות עיקריות

- **ניהול קבוצות**: יצירה וניהול קבוצות קניות עם חברים ומשפחה
- **רשימות קניות משותפות**: יצירה ועריכה משותפת של רשימות קניות
- **עדכונים בזמן אמת**: שימוש ב-WebSocket לעדכונים מיידיים
- **מצב קניות**: מעקב אחר קניות פעילות עם מיקום GPS
- **מסד נתונים של מוצרים**: חיפוש מוצרים לפי שם, ברקוד, או קטגוריה
- **צ'אט קבוצתי**: תקשורת בין חברי הקבוצה
- **תמיכה רב-לשונית**: עברית ואנגלית
- **מצב אורח**: אפשרות לשימוש ללא הרשמה

## 🛠 טכנולוגיות

### Frontend (Client)
- **Next.js 15** - Framework React עם App Router
- **React 19** - ספריית UI
- **TypeScript** - טייפ-ספייפ
- **Tailwind CSS** - עיצוב
- **Zustand** - ניהול state
- **React Query (TanStack Query)** - ניהול data fetching
- **Socket.IO Client** - תקשורת בזמן אמת
- **next-intl** - בינלאומיות
- **Zod** - ולידציה
- **Vitest** - בדיקות

### Backend (Server)
- **Node.js** - Runtime
- **Express.js** - Framework
- **TypeScript** - טייפ-ספייפ
- **MongoDB + Mongoose** - מסד נתונים
- **Socket.IO** - תקשורת בזמן אמת
- **JWT** - אימות
- **bcryptjs** - הצפנת סיסמאות
- **Google OAuth** - התחברות עם Google
- **Cloudinary/ImageKit** - ניהול תמונות
- **Resend** - שליחת אימיילים
- **Jest** - בדיקות

## 🚀 התקנה והרצה

### דרישות מוקדמות

- Node.js 20.x או גבוה יותר
- MongoDB (מקומי או Atlas)
- npm או yarn

### התקנה

1. **שכפול הפרויקט**
```bash
git clone <repository-url>
cd smart-list
```

2. **התקנת תלויות - Client**
```bash
cd client
npm install
```

3. **התקנת תלויות - Server**
```bash
cd ../server
npm install
```

4. **הגדרת משתני סביבה**

צור קובץ `.env` בתיקיית `server` על בסיס `env.example`:
```bash
cp env.example .env
```

ערוך את הקובץ `.env` והגדר את הערכים הנדרשים:
```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/listali
JWT_SECRET=your-secret-key
# ... שאר המשתנים
```

5. **הרצת השרת**
```bash
cd server
npm run dev
```

השרת ירוץ על `http://localhost:5000`

6. **הרצת הלקוח**
```bash
cd client
npm run dev
```

האפליקציה תהיה זמינה ב-`http://localhost:3000`

## 📁 מבנה הפרויקט

```
smart-list/
├── client/                 # Frontend - Next.js
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   ├── components/    # רכיבי React
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilities ו-API clients
│   │   ├── store/         # Zustand stores
│   │   ├── types/         # TypeScript types
│   │   └── messages/      # תרגומים (i18n)
│   ├── public/            # קבצים סטטיים
│   └── package.json
│
├── server/                # Backend - Express.js
│   ├── src/
│   │   ├── controllers/   # Controllers
│   │   ├── models/        # Mongoose models
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Middleware
│   │   ├── socket/        # Socket.IO handlers
│   │   ├── config/        # הגדרות (DB, etc.)
│   │   └── utils/         # Utilities
│   ├── env.example        # דוגמה למשתני סביבה
│   └── package.json
│
└── docs/                  # תיעוד
    ├── README.md
    ├── ARCHITECTURE.md
    ├── API.md
    └── DEPLOYMENT.md
```

## 📚 תיעוד

תיעוד מפורט זמין בתיקיית `docs/`:

- **[docs/README.md](./docs/README.md)** - סקירה כללית של התיעוד
- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - תיעוד ארכיטקטורה מקיף
- **[docs/API.md](./docs/API.md)** - תיעוד מלא של ה-API
- **[docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)** - הוראות פריסה

## 💻 פיתוח

### הרצת בדיקות

**Client:**
```bash
cd client
npm run test          # הרצת בדיקות
npm run test:ui       # UI לבדיקות
npm run test:coverage # כיסוי בדיקות
```

**Server:**
```bash
cd server
npm test              # הרצת בדיקות
npm run test:watch    # מצב watch
```

### Linting

**Client:**
```bash
cd client
npm run lint          # בדיקת lint
npm run lint:fix      # תיקון אוטומטי
```

**Server:**
```bash
cd server
npm run lint          # בדיקת lint
npm run lint:fix      # תיקון אוטומטי
```

### Build

**Client:**
```bash
cd client
npm run build         # בניית production
npm start             # הרצת production build
```

**Server:**
```bash
cd server
npm run build         # קומפילציה ל-TypeScript
npm start             # הרצת production build
```

## 🔐 אבטחה

- אימות JWT עם refresh tokens
- הצפנת סיסמאות עם bcrypt
- Rate limiting למניעת התקפות
- CORS מוגדר
- Helmet.js לאבטחת HTTP headers
- ולידציה של קלט עם express-validator

## 🌐 תמיכה רב-לשונית

האפליקציה תומכת בעברית ואנגלית עם שימוש ב-`next-intl`. קבצי התרגום נמצאים ב-`client/src/messages/`.

## 📱 PWA

האפליקציה תומכת ב-Progressive Web App (PWA) עם:
- Service Worker
- Offline support
- Install prompt
- Manifest.json

## 🤝 תרומה

תרומות מתקבלות בברכה! אנא פתחו issue או pull request.

## 📄 רישיון

פרויקט זה מוגן תחת רישיון MIT - ראה [LICENSE](./LICENSE) לפרטים.

## 👤 מחבר

**Destaw-dev**

---

</div>

<div dir="ltr">

# ListaLi - Smart Group Shopping

A comprehensive system for managing shared shopping lists with real-time collaboration, group management, and product database.

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technologies](#technologies)
- [Installation & Setup](#installation--setup)
- [Project Structure](#project-structure)
- [Documentation](#documentation)
- [Development](#development)
- [License](#license)

## 🎯 Overview

ListaLi is an advanced web application for managing shared shopping lists. The system allows users to create groups, manage shared shopping lists, and collaborate in real-time with group members.

### Key Features

- **Group Management**: Create and manage shopping groups with friends and family
- **Shared Shopping Lists**: Create and collaboratively edit shopping lists
- **Real-time Updates**: WebSocket-based instant updates
- **Shopping Mode**: Track active shopping sessions with GPS location
- **Product Database**: Search products by name, barcode, or category
- **Group Chat**: Communication between group members
- **Multi-language Support**: Hebrew and English
- **Guest Mode**: Use without registration

## 🛠 Technologies

### Frontend (Client)
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **React Query (TanStack Query)** - Data fetching
- **Socket.IO Client** - Real-time communication
- **next-intl** - Internationalization
- **Zod** - Validation
- **Vitest** - Testing

### Backend (Server)
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **MongoDB + Mongoose** - Database
- **Socket.IO** - Real-time communication
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Google OAuth** - Google login
- **Cloudinary/ImageKit** - Image management
- **Resend** - Email service
- **Jest** - Testing

## 🚀 Installation & Setup

### Prerequisites

- Node.js 20.x or higher
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd smart-list
```

2. **Install Client dependencies**
```bash
cd client
npm install
```

3. **Install Server dependencies**
```bash
cd ../server
npm install
```

4. **Configure environment variables**

Create a `.env` file in the `server` directory based on `env.example`:
```bash
cp env.example .env
```

Edit the `.env` file and set the required values:
```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/listali
JWT_SECRET=your-secret-key
# ... other variables
```

5. **Run the server**
```bash
cd server
npm run dev
```

Server will run on `http://localhost:5000`

6. **Run the client**
```bash
cd client
npm run dev
```

Application will be available at `http://localhost:3000`

## 📁 Project Structure

```
smart-list/
├── client/                 # Frontend - Next.js
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilities and API clients
│   │   ├── store/         # Zustand stores
│   │   ├── types/         # TypeScript types
│   │   └── messages/      # Translations (i18n)
│   ├── public/            # Static files
│   └── package.json
│
├── server/                # Backend - Express.js
│   ├── src/
│   │   ├── controllers/   # Controllers
│   │   ├── models/        # Mongoose models
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Middleware
│   │   ├── socket/        # Socket.IO handlers
│   │   ├── config/        # Configuration (DB, etc.)
│   │   └── utils/         # Utilities
│   ├── env.example        # Environment variables example
│   └── package.json
│
└── docs/                  # Documentation
    ├── README.md
    ├── ARCHITECTURE.md
    ├── API.md
    └── DEPLOYMENT.md
```

## 📚 Documentation

Detailed documentation is available in the `docs/` directory:

- **[docs/README.md](./docs/README.md)** - Documentation overview
- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - Comprehensive architecture documentation
- **[docs/API.md](./docs/API.md)** - Complete API documentation
- **[docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)** - Deployment instructions

## 💻 Development

### Running Tests

**Client:**
```bash
cd client
npm run test          # Run tests
npm run test:ui       # Test UI
npm run test:coverage # Test coverage
```

**Server:**
```bash
cd server
npm test              # Run tests
npm run test:watch    # Watch mode
```

### Linting

**Client:**
```bash
cd client
npm run lint          # Check linting
npm run lint:fix      # Auto-fix
```

**Server:**
```bash
cd server
npm run lint          # Check linting
npm run lint:fix      # Auto-fix
```

### Build

**Client:**
```bash
cd client
npm run build         # Build for production
npm start             # Run production build
```

**Server:**
```bash
cd server
npm run build         # Compile TypeScript
npm start             # Run production build
```

## 🔐 Security

- JWT authentication with refresh tokens
- Password hashing with bcrypt
- Rate limiting to prevent attacks
- CORS configured
- Helmet.js for HTTP headers security
- Input validation with express-validator

## 🌐 Internationalization

The application supports Hebrew and English using `next-intl`. Translation files are located in `client/src/messages/`.

## 📱 PWA

The application supports Progressive Web App (PWA) with:
- Service Worker
- Offline support
- Install prompt
- Manifest.json

## 🤝 Contributing

Contributions are welcome! Please open an issue or pull request.

## 📄 License

This project is licensed under the MIT License - see [LICENSE](./LICENSE) for details.

## 👤 Author

**Destaw-dev**

---

</div>
