# Hetzner VPS Deployment Guide for Listali Backend

This guide will help you deploy the Listali backend to a Hetzner VPS using Docker and Caddy.

## Prerequisites

- Hetzner VPS with Ubuntu 22.04 or later
- Domain name: `listali.co.il` (or your domain)
- DNS access to configure A records
- SSH access to your VPS

## Step 1: DNS Configuration

Before deploying, configure your DNS:

1. **Create A record for API subdomain:**
   - Type: `A`
   - Name: `api`
   - Value: Your Hetzner VPS IP address
   - TTL: 300 (or default)

2. **Verify DNS propagation:**
   ```bash
   dig api.listali.co.il
   # or
   nslookup api.listali.co.il
   ```

   Wait until the DNS resolves to your VPS IP before proceeding.

## Step 2: Initial Server Setup

### 2.1 Connect to your VPS

```bash
ssh root@YOUR_VPS_IP
```

### 2.2 Update system packages

```bash
apt update && apt upgrade -y
```

### 2.3 Install Docker and Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose plugin
apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version
```

### 2.4 (Optional) Configure Firewall

```bash
# Install UFW if not present
apt install ufw -y

# Allow SSH (important - do this first!)
ufw allow 22/tcp

# Allow HTTP and HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

### 2.5 Create application user (optional but recommended)

```bash
# Create user
adduser listali
usermod -aG docker listali

# Switch to new user
su - listali
```

## Step 3: Clone and Configure Repository

### 3.1 Clone the repository

```bash
cd ~
git clone https://github.com/YOUR_USERNAME/smart-list.git
cd smart-list/server
```

**Or if you prefer a separate backend repo:**

```bash
cd ~
mkdir listali-backend
cd listali-backend
git clone https://github.com/YOUR_USERNAME/smart-list.git .
cd server
```

### 3.2 Create `.env` file

```bash
# Copy the example file
cp env.example .env

# Edit with your actual values
nano .env
```

**Required environment variables:**

```env
NODE_ENV=production
PORT=5000

# Frontend URL (your Vercel deployment)
CLIENT_ORIGIN=https://listali.co.il
CLIENT_URL=https://listali.co.il

# Cookie domain for cross-subdomain cookies
COOKIE_DOMAIN=.listali.co.il

# MongoDB connection string
# Use MongoDB Atlas or your own MongoDB instance
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/listali?retryWrites=true&w=majority

# JWT secrets (generate strong random strings)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_ACCESS_EXPIRE_MINUTES=15
JWT_REFRESH_EXPIRE_DAYS=30

# Google OAuth (if used)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://api.listali.co.il/api/auth/google/callback

# Email service
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=noreply@listali.co.il

# Other service keys (if used)
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
```

**Important:**
- Never commit `.env` to git
- Use strong, random values for secrets
- For MongoDB, use MongoDB Atlas (free tier) or install MongoDB on the VPS

### 3.3 Generate secure secrets

```bash
# Generate JWT secret
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Step 4: Build and Start Services

### 4.1 Build and start containers

```bash
# Build and start in detached mode
docker compose up -d --build

# View logs
docker compose logs -f

# View logs for specific service
docker compose logs -f api
docker compose logs -f caddy
```

### 4.2 Verify services are running

```bash
# Check container status
docker compose ps

# Check API health
curl http://localhost:5000/health

# Check from outside (if DNS is configured)
curl https://api.listali.co.il/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45,
  "environment": "production"
}
```

## Step 5: Verify Deployment

### 5.1 Test API endpoints

```bash
# Health check
curl https://api.listali.co.il/health

# API info
curl https://api.listali.co.il/api
```

### 5.2 Test CORS from browser

Open browser console on your frontend (Vercel) and test:

```javascript
fetch('https://api.listali.co.il/health', {
  credentials: 'include'
})
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

### 5.3 Verify WebSocket connection

Check Socket.IO connection from your frontend. It should connect to:
```
wss://api.listali.co.il/socket.io/
```

## Step 6: Update Frontend Configuration

Update your frontend (Vercel) environment variables:

1. Go to Vercel dashboard → Your project → Settings → Environment Variables
2. Update `NEXT_PUBLIC_API_URL` (or similar) to:
   ```
   https://api.listali.co.il
   ```
3. Redeploy your frontend

## Step 7: Maintenance Commands

### View logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f api
docker compose logs -f caddy

# Last 100 lines
docker compose logs --tail=100 api
```

### Restart services

```bash
# Restart all services
docker compose restart

# Restart specific service
docker compose restart api

# Stop all services
docker compose down

# Stop and remove volumes (⚠️ careful!)
docker compose down -v
```

### Update deployment

```bash
# Navigate to project directory
cd ~/smart-list/server
# or
cd ~/listali-backend/server

# Pull latest changes
git pull

# Rebuild and restart
docker compose up -d --build

# View logs to verify
docker compose logs -f api
```

### Check container resources

```bash
# Container stats
docker stats

# Disk usage
docker system df
```

## Step 8: Troubleshooting

### Issue: Caddy can't get SSL certificate

**Solution:**
1. Verify DNS is pointing to your VPS IP
2. Check Caddy logs: `docker compose logs caddy`
3. Ensure ports 80 and 443 are open: `ufw status`
4. Wait a few minutes for Let's Encrypt rate limits

### Issue: API not responding

**Solution:**
1. Check API logs: `docker compose logs api`
2. Verify MongoDB connection in logs
3. Check if API container is running: `docker compose ps`
4. Test health endpoint: `curl http://localhost:5000/health`

### Issue: CORS errors from frontend

**Solution:**
1. Verify `CLIENT_ORIGIN` in `.env` matches your frontend URL exactly
2. Check Caddy logs for CORS headers
3. Ensure frontend is using `credentials: 'include'` in fetch requests

### Issue: Cookies not working

**Solution:**
1. Verify `COOKIE_DOMAIN=.listali.co.il` in `.env`
2. Ensure `NODE_ENV=production` is set
3. Check browser console for cookie errors
4. Verify cookies are `Secure` and `SameSite=None` in production

### Issue: WebSocket connection fails

**Solution:**
1. Check Caddyfile has WebSocket headers configured
2. Verify Socket.IO CORS settings in `app.ts`
3. Check browser network tab for WebSocket upgrade requests
4. Review Caddy logs: `docker compose logs caddy`

### View detailed logs

```bash
# API logs with timestamps
docker compose logs -f --timestamps api

# Caddy logs
docker compose logs -f caddy

# All logs
docker compose logs -f --timestamps
```

## Step 9: Backup Strategy

### Backup MongoDB

If using MongoDB on the VPS:

```bash
# Create backup
mongodump --uri="mongodb://localhost:27017/listali" --out=/backup/$(date +%Y%m%d)

# Restore backup
mongorestore --uri="mongodb://localhost:27017/listali" /backup/20240101
```

### Backup environment file

```bash
# Backup .env (store securely!)
cp .env ~/.env.backup.$(date +%Y%m%d)
```

## Step 10: Security Checklist

- [ ] Firewall configured (UFW or similar)
- [ ] SSH key authentication only (disable password auth)
- [ ] Strong secrets in `.env` file
- [ ] `.env` file not committed to git
- [ ] MongoDB credentials are secure
- [ ] Caddy SSL certificates are working
- [ ] CORS is configured correctly (not using `*`)
- [ ] Cookies are `Secure` and `SameSite=None` in production
- [ ] Regular security updates: `apt update && apt upgrade`

## Step 11: Monitoring (Optional)

### Set up basic monitoring

```bash
# Install monitoring tools (optional)
apt install htop iotop -y

# Monitor logs
docker compose logs -f | grep -i error
```

### Health check script

Create `~/check-health.sh`:

```bash
#!/bin/bash
curl -f https://api.listali.co.il/health || echo "Health check failed!"
```

Make it executable:
```bash
chmod +x ~/check-health.sh
```

Add to crontab for periodic checks:
```bash
crontab -e
# Add: */5 * * * * /home/listali/check-health.sh
```

## Quick Reference

```bash
# Navigate to project
cd ~/smart-list/server

# Update and deploy
git pull && docker compose up -d --build

# View logs
docker compose logs -f

# Restart
docker compose restart

# Stop
docker compose down

# Health check
curl https://api.listali.co.il/health
```

## Support

If you encounter issues:
1. Check logs: `docker compose logs -f`
2. Verify environment variables in `.env`
3. Test health endpoint: `curl https://api.listali.co.il/health`
4. Check DNS resolution: `dig api.listali.co.il`
5. Verify firewall: `ufw status`

---

**Last updated:** 2024-01-01
**Maintained by:** DevOps Team
