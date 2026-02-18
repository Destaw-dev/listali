# ListaLi

<div dir="rtl">

## מה זה ListaLi?

ListaLi היא מערכת לניהול קניות קבוצתיות בזמן אמת.  
הפרויקט בנוי כמונוריפו עם:

- `client` - אפליקציית Next.js 15 + React 19
- `server` - API מבוסס Express + MongoDB + Socket.IO

## יכולות מרכזיות

- ניהול קבוצות ורשימות קניות משותפות
- עדכונים בזמן אמת עם WebSocket
- צ'אט קבוצתי
- תמיכה ב-`he` ו-`en`
- מצב אורח
- תמיכה ב-PWA והתראות Push

## טכנולוגיות

- Frontend: Next.js, React, TypeScript, Tailwind CSS, Zustand, TanStack Query, next-intl, Vitest
- Backend: Node.js, Express, TypeScript, MongoDB/Mongoose, Socket.IO, JWT, Jest

## דרישות מוקדמות

- Node.js 20+
- npm 10+
- MongoDB (לוקאלי או Atlas)

## התקנה מהירה

```bash
git clone <repository-url>
cd Listali
```

התקנת תלויות:

```bash
cd server && npm install
cd ../client && npm install
```

## משתני סביבה

### Server (`server/.env`)

התחל מ:

```bash
cd server
cp .env.example .env
```

משתנים חשובים לפיתוח מקומי:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/listali

CLIENT_URL=http://localhost:3000
# אופציונלי למספר origins:
# CLIENT_URLS=http://localhost:3000,http://127.0.0.1:3000

JWT_ACCESS_SECRET=replace-me
JWT_REFRESH_SECRET=replace-me
JWT_ACCESS_EXPIRE_MINUTES=15
JWT_REFRESH_EXPIRE_DAYS=30

RESEND_API_KEY=replace-me

# אופציונלי ל-Push:
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=
```

הערה: הקובץ `server/env.example` הוא תבנית נוספת שמכוונת יותר לסביבת production.

### Client (`client/.env.local`)

צור קובץ `client/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=http://localhost:5000
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
```

## הרצה מקומית

Terminal 1:

```bash
cd server
npm run dev
```

Terminal 2:

```bash
cd client
npm run dev
```

כתובות ברירת מחדל:

- Client: `http://localhost:3000` (מפנה ל-`/he/welcome`)
- Server: `http://localhost:5000`
- Health: `http://localhost:5000/health`
- API base: `http://localhost:5000/api`

## סקריפטים שימושיים

### Client

```bash
cd client
npm run dev
npm run build
npm run start
npm run lint
npm run lint:fix
npm run test
npm run test:run
npm run test:ui
npm run test:coverage
```

### Server

```bash
cd server
npm run dev
npm run build
npm run start
npm run lint
npm run lint:fix
npm test
npm run test:watch
```

## מבנה הפרויקט

```text
Listali/
├── client/      # Next.js app (UI)
├── server/      # Express API + Socket.IO
└── docs/        # Architecture / API / Deployment docs
```

## תיעוד נוסף

- `docs/README.md`
- `docs/ARCHITECTURE.md`
- `docs/API.md`
- `docs/DEPLOYMENT.md`

## רישיון

MIT - ראה `LICENSE`.

</div>

<div dir="ltr">

## What is ListaLi?

ListaLi is a real-time collaborative shopping platform.  
This repo is a monorepo with:

- `client` - Next.js 15 + React 19 app
- `server` - Express API with MongoDB and Socket.IO

## Core Features

- Shared group shopping lists
- Real-time updates via WebSocket
- Group chat
- `he` / `en` localization
- Guest mode
- PWA support and push notifications

## Tech Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS, Zustand, TanStack Query, next-intl, Vitest
- Backend: Node.js, Express, TypeScript, MongoDB/Mongoose, Socket.IO, JWT, Jest

## Prerequisites

- Node.js 20+
- npm 10+
- MongoDB (local or Atlas)

## Quick Start

```bash
git clone <repository-url>
cd Listali
```

Install dependencies:

```bash
cd server && npm install
cd ../client && npm install
```

## Environment Variables

### Server (`server/.env`)

Start from:

```bash
cd server
cp .env.example .env
```

Local development essentials:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/listali

CLIENT_URL=http://localhost:3000
# Optional multi-origin support:
# CLIENT_URLS=http://localhost:3000,http://127.0.0.1:3000

JWT_ACCESS_SECRET=replace-me
JWT_REFRESH_SECRET=replace-me
JWT_ACCESS_EXPIRE_MINUTES=15
JWT_REFRESH_EXPIRE_DAYS=30

RESEND_API_KEY=replace-me

# Optional for Push:
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=
```

Note: `server/env.example` is an additional template aimed more at production-style settings.

### Client (`client/.env.local`)

Create `client/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=http://localhost:5000
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
```

## Local Run

Terminal 1:

```bash
cd server
npm run dev
```

Terminal 2:

```bash
cd client
npm run dev
```

Default URLs:

- Client: `http://localhost:3000` (redirects to `/he/welcome`)
- Server: `http://localhost:5000`
- Health: `http://localhost:5000/health`
- API base: `http://localhost:5000/api`

## Useful Scripts

### Client

```bash
cd client
npm run dev
npm run build
npm run start
npm run lint
npm run lint:fix
npm run test
npm run test:run
npm run test:ui
npm run test:coverage
```

### Server

```bash
cd server
npm run dev
npm run build
npm run start
npm run lint
npm run lint:fix
npm test
npm run test:watch
```

## Project Structure

```text
Listali/
├── client/      # Next.js app (UI)
├── server/      # Express API + Socket.IO
└── docs/        # Architecture / API / Deployment docs
```

## Additional Docs

- `docs/README.md`
- `docs/ARCHITECTURE.md`
- `docs/API.md`
- `docs/DEPLOYMENT.md`

## License

MIT - see `LICENSE`.

</div>
