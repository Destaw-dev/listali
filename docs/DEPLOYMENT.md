# ListaLi Deployment Guide

<div dir="rtl">

# מדריך פריסה של ListaLi

מדריך מפורט לפריסת מערכת ListaLi בסביבות שונות.

## 📋 תוכן עניינים

- [סקירה כללית](#סקירה-כללית)
- [דרישות מוקדמות](#דרישות-מוקדמות)
- [הגדרת סביבת פיתוח](#הגדרת-סביבת-פיתוח)
- [פריסה ל-Production](#פריסה-ל-production)
- [פריסה עם Docker](#פריסה-עם-docker)
- [פריסה ל-Hetzner VPS](#פריסה-ל-hetzner-vps)
- [הגדרת MongoDB](#הגדרת-mongodb)
- [הגדרת משתני סביבה](#הגדרת-משתני-סביבה)
- [טיפול בבעיות](#טיפול-בבעיות)
- [אבטחה](#אבטחה)
- [גיבויים](#גיבויים)

## 🎯 סקירה כללית

מערכת ListaLi מורכבת משני חלקים עיקריים:

1. **Client (Frontend)** - Next.js application
2. **Server (Backend)** - Express.js API server

הפריסה יכולה להתבצע במספר דרכים:
- פריסה מקומית לפיתוח
- פריסה ל-VPS (Hetzner, DigitalOcean, וכו')
- פריסה עם Docker
- פריסה ל-Vercel (Frontend) + VPS (Backend)

## 📦 דרישות מוקדמות

### כללי
- Node.js 20.x או גבוה יותר
- npm או yarn
- Git
- MongoDB (מקומי או Atlas)

### לפריסה ב-Production
- שרת VPS (Hetzner, DigitalOcean, וכו')
- דומיין (אופציונלי אבל מומלץ)
- גישה ל-SSH
- Docker ו-Docker Compose (לפריסה עם Docker)

---

## 💻 הגדרת סביבת פיתוח

### 1. שכפול הפרויקט

```bash
git clone <repository-url>
cd smart-list
```

### 2. התקנת תלויות

**Client:**
```bash
cd client
npm install
```

**Server:**
```bash
cd ../server
npm install
```

### 3. הגדרת משתני סביבה

**Server:**

צור קובץ `.env` בתיקיית `server`:
```bash
cd server
cp env.example .env
```

ערוך את הקובץ `.env`:
```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/listali
JWT_SECRET=your-development-secret-key
JWT_ACCESS_EXPIRE_MINUTES=15
JWT_REFRESH_EXPIRE_DAYS=30
```

**Client:**

צור קובץ `.env.local` בתיקיית `client`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 4. הרצת MongoDB

**אפשרות א': MongoDB מקומי**

התקן MongoDB:
```bash
# macOS
brew install mongodb-community

# Ubuntu/Debian
sudo apt-get install mongodb

# או השתמש ב-MongoDB Atlas (מומלץ)
```

הרץ MongoDB:
```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

**אפשרות ב': MongoDB Atlas (מומלץ)**

1. צור חשבון ב-[MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. צור cluster חדש (Free tier זמין)
3. קבל את connection string
4. עדכן את `MONGODB_URI` ב-`.env`

### 5. הרצת השרת

```bash
cd server
npm run dev
```

השרת ירוץ על `http://localhost:5000`

### 6. הרצת הלקוח

```bash
cd client
npm run dev
```

האפליקציה תהיה זמינה ב-`http://localhost:3000`

---

## 🚀 פריסה ל-Production

### פריסת Frontend (Vercel)

**1. הכנה:**

ודא שיש לך:
- חשבון Vercel
- הפרויקט ב-GitHub/GitLab

**2. פריסה:**

1. התחבר ל-[Vercel](https://vercel.com)
2. לחץ על "New Project"
3. בחר את ה-repository
4. הגדר את הפרויקט:
   - **Framework Preset**: Next.js
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

**3. משתני סביבה:**

הוסף ב-Vercel Dashboard → Settings → Environment Variables:

```env
NEXT_PUBLIC_API_URL=https://api.listali.co.il
```

**4. פריסה:**

Vercel יפרוס אוטומטית עם כל push ל-main branch.

### פריסת Backend

ראה [פריסה עם Docker](#פריסה-עם-docker) או [פריסה ל-Hetzner VPS](#פריסה-ל-hetzner-vps).

---

## 🐳 פריסה עם Docker

### דרישות

- Docker
- Docker Compose

### שלבים

**1. בניית Image:**

```bash
cd server
docker build -t listali-api .
```

**2. הרצה עם Docker Compose:**

```bash
cd server
docker compose up -d
```

**3. בדיקת סטטוס:**

```bash
docker compose ps
docker compose logs -f
```

**4. בדיקת Health:**

```bash
curl http://localhost:5000/health
```

### עדכון

```bash
cd server
git pull
docker compose up -d --build
```

---

## 🌐 פריסה ל-Hetzner VPS

### דרישות

- Hetzner VPS עם Ubuntu 22.04+
- דומיין (אופציונלי)
- גישה ל-SSH

### שלבים

**1. הגדרת DNS**

אם יש לך דומיין, הגדר A record:
```
Type: A
Name: api
Value: YOUR_VPS_IP
TTL: 300
```

**2. התחברות לשרת**

```bash
ssh root@YOUR_VPS_IP
```

**3. עדכון המערכת**

```bash
apt update && apt upgrade -y
```

**4. התקנת Docker**

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt install docker-compose-plugin -y
```

**5. הגדרת Firewall**

```bash
apt install ufw -y
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

**6. שכפול הפרויקט**

```bash
cd ~
git clone <repository-url> smart-list
cd smart-list/server
```

**7. הגדרת משתני סביבה**

```bash
cp env.example .env
nano .env
```

ערוך את הקובץ עם הערכים הנכונים:
```env
NODE_ENV=production
PORT=5000
CLIENT_URL=https://listali.co.il
CLIENT_URLS=https://listali.co.il,https://www.listali.co.il
COOKIE_DOMAIN=.listali.co.il
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/listali
JWT_SECRET=your-strong-secret-key-min-32-chars
# ... שאר המשתנים
```

**8. יצירת Secrets חזקים**

```bash
# יצירת JWT_SECRET
openssl rand -base64 32
```

**9. בנייה והרצה**

```bash
docker compose up -d --build
```

**10. בדיקת הלוגים**

```bash
docker compose logs -f
```

**11. בדיקת Health**

```bash
curl http://localhost:5000/health
curl https://api.listali.co.il/health
```

### הגדרת Caddy (Reverse Proxy + SSL)

הקובץ `Caddyfile` כבר מוגדר. Caddy יתקין אוטומטית SSL certificates מ-Let's Encrypt.

**Caddyfile:**
```
api.listali.co.il {
  encode gzip
  reverse_proxy api:5000

  header {
    -Server
  }

  log {
    output stdout
    format console
  }
}
```

### פקודות תחזוקה

```bash
# צפייה בלוגים
docker compose logs -f

# הפעלה מחדש
docker compose restart

# עדכון
git pull
docker compose up -d --build

# עצירה
docker compose down
```

---

## 🗄️ הגדרת MongoDB

### אפשרות א': MongoDB Atlas (מומלץ)

1. צור חשבון ב-[MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. צור cluster חדש
3. הגדר Network Access (הוסף את ה-IP של השרת)
4. צור משתמש Database
5. קבל את Connection String
6. עדכן את `MONGODB_URI` ב-`.env`

**Connection String דוגמה:**
```
mongodb+srv://username:password@cluster.mongodb.net/listali?retryWrites=true&w=majority
```

### אפשרות ב': MongoDB מקומי

**התקנה:**

```bash
# Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

**Connection String:**
```
mongodb://localhost:27017/listali
```

---

## ⚙️ הגדרת משתני סביבה

### Server (.env)

```env
# Node Environment
NODE_ENV=production

# Server Configuration
PORT=5000

# Client Configuration
CLIENT_URL=https://listali.co.il
CLIENT_URLS=https://listali.co.il,https://www.listali.co.il

# Cookie Domain
COOKIE_DOMAIN=.listali.co.il

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/listali

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_ACCESS_EXPIRE_MINUTES=15
JWT_REFRESH_EXPIRE_DAYS=30

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://api.listali.co.il/api/auth/google/callback

# Email Service
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=noreply@listali.co.il

# Image Services (optional)
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret

IMAGEKIT_PUBLIC_KEY=your-imagekit-key
IMAGEKIT_PRIVATE_KEY=your-imagekit-secret
IMAGEKIT_URL_ENDPOINT=your-imagekit-endpoint
```

### Client (.env.local)

```env
NEXT_PUBLIC_API_URL=https://api.listali.co.il
```

---

## 🔧 טיפול בבעיות

### בעיה: השרת לא מתחיל

**פתרון:**
1. בדוק את הלוגים: `docker compose logs api`
2. ודא ש-MongoDB מחובר
3. בדוק את משתני הסביבה
4. ודא שהפורט לא תפוס: `lsof -i :5000`

### בעיה: CORS errors

**פתרון:**
1. ודא ש-`CLIENT_URL` ב-`.env` נכון
2. בדוק שה-URL מדויק (כולל https/http)
3. ודא שה-`CLIENT_URLS` כולל את כל ה-variants

### בעיה: Cookies לא עובדים

**פתרון:**
1. ודא ש-`COOKIE_DOMAIN` נכון (`.listali.co.il` עם נקודה)
2. ודא ש-`NODE_ENV=production`
3. בדוק שהקוקיז הם `Secure` ו-`SameSite=None`

### בעיה: WebSocket לא מתחבר

**פתרון:**
1. בדוק את הגדרות CORS ב-`app.ts`
2. ודא ש-Caddyfile תומך ב-WebSocket
3. בדוק את הלוגים של Caddy: `docker compose logs caddy`

### בעיה: SSL לא עובד

**פתרון:**
1. ודא שה-DNS מצביע ל-IP הנכון
2. בדוק שפורטים 80 ו-443 פתוחים
3. בדוק את הלוגים של Caddy
4. המתן כמה דקות ל-Let's Encrypt

---

## 🔐 אבטחה

### Checklist אבטחה

- [ ] Firewall מוגדר (UFW)
- [ ] SSH עם מפתחות בלבד (ללא סיסמה)
- [ ] Secrets חזקים ב-`.env`
- [ ] `.env` לא ב-git
- [ ] MongoDB credentials מאובטחים
- [ ] SSL certificates פעילים
- [ ] CORS מוגדר נכון (לא `*`)
- [ ] Cookies מאובטחים
- [ ] עדכוני אבטחה קבועים

### יצירת Secrets חזקים

```bash
# JWT Secret
openssl rand -base64 32

# או עם Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### הגדרת Firewall

```bash
# התקנה
apt install ufw -y

# הגדרת חוקים
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp    # HTTPS

# הפעלה
ufw enable

# בדיקה
ufw status
```

---

## 💾 גיבויים

### גיבוי MongoDB

**MongoDB Atlas:**
- גיבויים אוטומטיים מופעלים כברירת מחדל
- ניתן להגדיר גיבויים ידניים

**MongoDB מקומי:**

```bash
# יצירת גיבוי
mongodump --uri="mongodb://localhost:27017/listali" --out=/backup/$(date +%Y%m%d)

# שחזור גיבוי
mongorestore --uri="mongodb://localhost:27017/listali" /backup/20240101
```

### גיבוי משתני סביבה

```bash
# גיבוי .env
cp .env ~/.env.backup.$(date +%Y%m%d)

# שמירה במקום מאובטח (לא ב-git!)
```

### סקריפט גיבוי אוטומטי

צור `~/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/backup/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# גיבוי MongoDB
mongodump --uri="$MONGODB_URI" --out=$BACKUP_DIR/mongodb

# גיבוי .env
cp .env $BACKUP_DIR/.env

# דחיסה
tar -czf $BACKUP_DIR.tar.gz $BACKUP_DIR
rm -rf $BACKUP_DIR

echo "Backup completed: $BACKUP_DIR.tar.gz"
```

הרץ עם cron:
```bash
crontab -e
# הוסף: 0 2 * * * /home/listali/backup.sh
```

---

## 📊 ניטור

### Health Checks

```bash
# בדיקה ידנית
curl https://api.listali.co.il/health

# סקריפט אוטומטי
#!/bin/bash
curl -f https://api.listali.co.il/health || echo "Health check failed!"
```

### צפייה בלוגים

```bash
# כל הלוגים
docker compose logs -f

# לוגים של API בלבד
docker compose logs -f api

# לוגים אחרונים
docker compose logs --tail=100 api

# חיפוש שגיאות
docker compose logs api | grep -i error
```

### ניטור משאבים

```bash
# סטטיסטיקות containers
docker stats

# שימוש בדיסק
docker system df

# ניקוי
docker system prune
```

---

## 🔄 עדכונים

### עדכון קוד

```bash
cd ~/smart-list/server
git pull
docker compose up -d --build
docker compose logs -f
```

### עדכון תלויות

```bash
cd server
npm update
npm audit fix
docker compose up -d --build
```

---

## 📞 תמיכה

אם נתקלת בבעיות:

1. בדוק את הלוגים: `docker compose logs -f`
2. ודא שמשתני הסביבה נכונים
3. בדוק את ה-health endpoint
4. בדוק את ה-DNS
5. ודא שה-firewall מוגדר נכון

---

**עודכן לאחרונה**: 2025

</div>

<div dir="ltr">

# ListaLi Deployment Guide

Detailed guide for deploying ListaLi system in various environments.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Development Environment Setup](#development-environment-setup)
- [Production Deployment](#production-deployment)
- [Docker Deployment](#docker-deployment)
- [Hetzner VPS Deployment](#hetzner-vps-deployment)
- [MongoDB Setup](#mongodb-setup)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)
- [Security](#security)
- [Backups](#backups)

## 🎯 Overview

The ListaLi system consists of two main components:

1. **Client (Frontend)** - Next.js application
2. **Server (Backend)** - Express.js API server

Deployment can be done in several ways:
- Local deployment for development
- VPS deployment (Hetzner, DigitalOcean, etc.)
- Docker deployment
- Vercel (Frontend) + VPS (Backend)

## 📦 Prerequisites

### General
- Node.js 20.x or higher
- npm or yarn
- Git
- MongoDB (local or Atlas)

### For Production Deployment
- VPS server (Hetzner, DigitalOcean, etc.)
- Domain name (optional but recommended)
- SSH access
- Docker and Docker Compose (for Docker deployment)

---

## 💻 Development Environment Setup

### 1. Clone the Project

```bash
git clone <repository-url>
cd smart-list
```

### 2. Install Dependencies

**Client:**
```bash
cd client
npm install
```

**Server:**
```bash
cd ../server
npm install
```

### 3. Configure Environment Variables

**Server:**

Create a `.env` file in the `server` directory:
```bash
cd server
cp env.example .env
```

Edit the `.env` file:
```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/listali
JWT_SECRET=your-development-secret-key
JWT_ACCESS_EXPIRE_MINUTES=15
JWT_REFRESH_EXPIRE_DAYS=30
```

**Client:**

Create a `.env.local` file in the `client` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 4. Run MongoDB

**Option A: Local MongoDB**

Install MongoDB:
```bash
# macOS
brew install mongodb-community

# Ubuntu/Debian
sudo apt-get install mongodb

# Or use MongoDB Atlas (recommended)
```

Run MongoDB:
```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

**Option B: MongoDB Atlas (Recommended)**

1. Create an account on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (Free tier available)
3. Get the connection string
4. Update `MONGODB_URI` in `.env`

### 5. Run the Server

```bash
cd server
npm run dev
```

Server will run on `http://localhost:5000`

### 6. Run the Client

```bash
cd client
npm run dev
```

Application will be available at `http://localhost:3000`

---

## 🚀 Production Deployment

### Frontend Deployment (Vercel)

**1. Preparation:**

Make sure you have:
- Vercel account
- Project on GitHub/GitLab

**2. Deployment:**

1. Log in to [Vercel](https://vercel.com)
2. Click "New Project"
3. Select your repository
4. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

**3. Environment Variables:**

Add in Vercel Dashboard → Settings → Environment Variables:

```env
NEXT_PUBLIC_API_URL=https://api.listali.co.il
```

**4. Deploy:**

Vercel will automatically deploy with every push to main branch.

### Backend Deployment

See [Docker Deployment](#docker-deployment) or [Hetzner VPS Deployment](#hetzner-vps-deployment).

---

## 🐳 Docker Deployment

### Requirements

- Docker
- Docker Compose

### Steps

**1. Build Image:**

```bash
cd server
docker build -t listali-api .
```

**2. Run with Docker Compose:**

```bash
cd server
docker compose up -d
```

**3. Check Status:**

```bash
docker compose ps
docker compose logs -f
```

**4. Health Check:**

```bash
curl http://localhost:5000/health
```

### Update

```bash
cd server
git pull
docker compose up -d --build
```

---

## 🌐 Hetzner VPS Deployment

### Requirements

- Hetzner VPS with Ubuntu 22.04+
- Domain name (optional)
- SSH access

### Steps

**1. DNS Configuration**

If you have a domain, set up A record:
```
Type: A
Name: api
Value: YOUR_VPS_IP
TTL: 300
```

**2. Connect to Server**

```bash
ssh root@YOUR_VPS_IP
```

**3. Update System**

```bash
apt update && apt upgrade -y
```

**4. Install Docker**

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt install docker-compose-plugin -y
```

**5. Configure Firewall**

```bash
apt install ufw -y
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

**6. Clone Project**

```bash
cd ~
git clone <repository-url> smart-list
cd smart-list/server
```

**7. Configure Environment Variables**

```bash
cp env.example .env
nano .env
```

Edit the file with correct values:
```env
NODE_ENV=production
PORT=5000
CLIENT_URL=https://listali.co.il
CLIENT_URLS=https://listali.co.il,https://www.listali.co.il
COOKIE_DOMAIN=.listali.co.il
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/listali
JWT_SECRET=your-strong-secret-key-min-32-chars
# ... other variables
```

**8. Generate Strong Secrets**

```bash
# Generate JWT_SECRET
openssl rand -base64 32
```

**9. Build and Run**

```bash
docker compose up -d --build
```

**10. Check Logs**

```bash
docker compose logs -f
```

**11. Health Check**

```bash
curl http://localhost:5000/health
curl https://api.listali.co.il/health
```

### Caddy Configuration (Reverse Proxy + SSL)

The `Caddyfile` is already configured. Caddy will automatically install SSL certificates from Let's Encrypt.

**Caddyfile:**
```
api.listali.co.il {
  encode gzip
  reverse_proxy api:5000

  header {
    -Server
  }

  log {
    output stdout
    format console
  }
}
```

### Maintenance Commands

```bash
# View logs
docker compose logs -f

# Restart
docker compose restart

# Update
git pull
docker compose up -d --build

# Stop
docker compose down
```

---

## 🗄️ MongoDB Setup

### Option A: MongoDB Atlas (Recommended)

1. Create an account on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Configure Network Access (add server IP)
4. Create Database user
5. Get Connection String
6. Update `MONGODB_URI` in `.env`

**Example Connection String:**
```
mongodb+srv://username:password@cluster.mongodb.net/listali?retryWrites=true&w=majority
```

### Option B: Local MongoDB

**Installation:**

```bash
# Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

**Connection String:**
```
mongodb://localhost:27017/listali
```

---

## ⚙️ Environment Variables

### Server (.env)

```env
# Node Environment
NODE_ENV=production

# Server Configuration
PORT=5000

# Client Configuration
CLIENT_URL=https://listali.co.il
CLIENT_URLS=https://listali.co.il,https://www.listali.co.il

# Cookie Domain
COOKIE_DOMAIN=.listali.co.il

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/listali

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_ACCESS_EXPIRE_MINUTES=15
JWT_REFRESH_EXPIRE_DAYS=30

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://api.listali.co.il/api/auth/google/callback

# Email Service
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=noreply@listali.co.il

# Image Services (optional)
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret

IMAGEKIT_PUBLIC_KEY=your-imagekit-key
IMAGEKIT_PRIVATE_KEY=your-imagekit-secret
IMAGEKIT_URL_ENDPOINT=your-imagekit-endpoint
```

### Client (.env.local)

```env
NEXT_PUBLIC_API_URL=https://api.listali.co.il
```

---

## 🔧 Troubleshooting

### Issue: Server won't start

**Solution:**
1. Check logs: `docker compose logs api`
2. Ensure MongoDB is connected
3. Check environment variables
4. Ensure port is not taken: `lsof -i :5000`

### Issue: CORS errors

**Solution:**
1. Ensure `CLIENT_URL` in `.env` is correct
2. Check that URL is exact (including https/http)
3. Ensure `CLIENT_URLS` includes all variants

### Issue: Cookies not working

**Solution:**
1. Ensure `COOKIE_DOMAIN` is correct (`.listali.co.il` with dot)
2. Ensure `NODE_ENV=production`
3. Check that cookies are `Secure` and `SameSite=None`

### Issue: WebSocket won't connect

**Solution:**
1. Check CORS settings in `app.ts`
2. Ensure Caddyfile supports WebSocket
3. Check Caddy logs: `docker compose logs caddy`

### Issue: SSL not working

**Solution:**
1. Ensure DNS points to correct IP
2. Check that ports 80 and 443 are open
3. Check Caddy logs
4. Wait a few minutes for Let's Encrypt

---

## 🔐 Security

### Security Checklist

- [ ] Firewall configured (UFW)
- [ ] SSH with keys only (no password)
- [ ] Strong secrets in `.env`
- [ ] `.env` not in git
- [ ] MongoDB credentials secure
- [ ] SSL certificates active
- [ ] CORS configured correctly (not `*`)
- [ ] Cookies secure
- [ ] Regular security updates

### Generate Strong Secrets

```bash
# JWT Secret
openssl rand -base64 32

# Or with Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Configure Firewall

```bash
# Install
apt install ufw -y

# Configure rules
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS

# Enable
ufw enable

# Check
ufw status
```

---

## 💾 Backups

### MongoDB Backup

**MongoDB Atlas:**
- Automatic backups enabled by default
- Can configure manual backups

**Local MongoDB:**

```bash
# Create backup
mongodump --uri="mongodb://localhost:27017/listali" --out=/backup/$(date +%Y%m%d)

# Restore backup
mongorestore --uri="mongodb://localhost:27017/listali" /backup/20240101
```

### Environment Variables Backup

```bash
# Backup .env
cp .env ~/.env.backup.$(date +%Y%m%d)

# Store in secure location (not in git!)
```

### Automated Backup Script

Create `~/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/backup/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# Backup MongoDB
mongodump --uri="$MONGODB_URI" --out=$BACKUP_DIR/mongodb

# Backup .env
cp .env $BACKUP_DIR/.env

# Compress
tar -czf $BACKUP_DIR.tar.gz $BACKUP_DIR
rm -rf $BACKUP_DIR

echo "Backup completed: $BACKUP_DIR.tar.gz"
```

Run with cron:
```bash
crontab -e
# Add: 0 2 * * * /home/listali/backup.sh
```

---

## 📊 Monitoring

### Health Checks

```bash
# Manual check
curl https://api.listali.co.il/health

# Automated script
#!/bin/bash
curl -f https://api.listali.co.il/health || echo "Health check failed!"
```

### View Logs

```bash
# All logs
docker compose logs -f

# API logs only
docker compose logs -f api

# Last logs
docker compose logs --tail=100 api

# Search errors
docker compose logs api | grep -i error
```

### Monitor Resources

```bash
# Container stats
docker stats

# Disk usage
docker system df

# Cleanup
docker system prune
```

---

## 🔄 Updates

### Update Code

```bash
cd ~/smart-list/server
git pull
docker compose up -d --build
docker compose logs -f
```

### Update Dependencies

```bash
cd server
npm update
npm audit fix
docker compose up -d --build
```

---

## 📞 Support

If you encounter issues:

1. Check logs: `docker compose logs -f`
2. Ensure environment variables are correct
3. Check health endpoint
4. Check DNS
5. Ensure firewall is configured correctly

---

**Last Updated**: 2025

</div>
