# 🚀 Digital Ocean Deployment Guide

## Complete setup guide for hosting PrimeBible Pro on a Digital Ocean droplet

---

## Prerequisites

- Digital Ocean account
- Domain name (optional but recommended)
- SSH client
- Basic Linux command line knowledge

---

## Step 1: Create Digital Ocean Droplet

### 1.1 Choose Droplet Configuration

**Recommended Specs:**
- **Distribution:** Ubuntu 24.04 LTS
- **Plan:** Basic (Regular CPU)
- **CPU:** 1 vCPU / 1GB RAM ($6/month) - sufficient for most churches
- **CPU:** 2 vCPU / 2GB RAM ($12/month) - recommended for larger operations
- **Datacenter:** Choose closest to your location
- **Authentication:** SSH Key (more secure) or Password

### 1.2 Additional Options

- **Hostname:** `primebible-server` (or your preference)
- **Tags:** `production`, `bible`, `obs`
- **Backups:** Enable ($1.20/month) - highly recommended
- **Monitoring:** Enable (free)

### 1.3 Create Droplet

Click "Create Droplet" and wait 60 seconds for provision.

---

## Step 2: Initial Server Setup

### 2.1 Connect via SSH

```bash
ssh root@your-droplet-ip
```

### 2.2 Update System

```bash
apt update && apt upgrade -y
```

### 2.3 Create Application User

```bash
adduser primebible
usermod -aG sudo primebible
```

Set a strong password when prompted.

### 2.4 Switch to Application User

```bash
su - primebible
```

---

## Step 3: Install Node.js

### 3.1 Install Node.js 20 LTS (via NodeSource)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 3.2 Verify Installation

```bash
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

---

## Step 4: Upload Application

### 4.1 Option A: Upload via SCP (from your local machine)

```bash
scp primebible-obs-pro.zip primebible@your-droplet-ip:~/
```

### 4.2 Option B: Download from GitHub (if you push it there)

```bash
cd ~
git clone https://github.com/youruser/primebible-obs-pro.git
cd primebible-obs-pro
```

### 4.3 Option C: Manual Upload (if using zip)

```bash
# On server
cd ~
# Upload file via SFTP or web panel
unzip primebible-obs-pro.zip
cd primebible-obs
```

---

## Step 5: Configure Application

### 5.1 Install Dependencies

```bash
cd ~/primebible-obs
npm install --production
```

### 5.2 Edit Configuration

```bash
nano config.json
```

**Important Changes for Production:**

```json
{
  "port": 4456,
  "obsWebsocketUrl": "ws://127.0.0.1:4455",
  "obsPassword": "",
  "overlaySourceName": "PrimeBible Overlay",
  "connectToObsOnStart": false,
  "autoCreateOverlayInAllScenes": false,
  "defaultTheme": "glass-lower",
  "defaultTranslation": "kjv",
  "defaultAnimation": "fade",
  "maxCharsPerSlide": 200,
  "maxLinesPerSlide": 4,
  "enableHistory": true,
  "maxHistoryItems": 100,
  "cacheVerses": true,
  "cacheDuration": 7200000,
  "remotePin": "your-secure-pin-here",  // ⚠️ SET THIS!
  "safeAreaTop": 0,
  "safeAreaBottom": 0,
  "highContrastMode": false,
  "respectReducedMotion": true
}
```

**Security Note:** Always set a `remotePin` for production!

---

## Step 6: Install PM2 (Process Manager)

### 6.1 Install PM2 Globally

```bash
sudo npm install -g pm2
```

### 6.2 Start Application with PM2

```bash
cd ~/primebible-obs
pm2 start server.js --name primebible
```

### 6.3 Configure PM2 to Start on Boot

```bash
pm2 startup
# Follow the command it gives you (copy/paste it)

pm2 save
```

### 6.4 Verify PM2 is Running

```bash
pm2 status
pm2 logs primebible --lines 50
```

---

## Step 7: Install and Configure Nginx

### 7.1 Install Nginx

```bash
sudo apt install -y nginx
```

### 7.2 Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/primebible
```

**Paste this configuration:**

```nginx
# Upstream for the Node.js app
upstream primebible_backend {
    server 127.0.0.1:4456;
    keepalive 64;
}

# HTTP Server (redirects to HTTPS if SSL is enabled)
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;  # Change this!

    # Optional: Redirect to HTTPS (uncomment after SSL setup)
    # return 301 https://$server_name$request_uri;

    # If not using SSL yet, use this:
    location / {
        proxy_pass http://primebible_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # WebSocket support
        proxy_read_timeout 86400;
    }

    # Client max body size for uploads
    client_max_body_size 10M;
}

# HTTPS Server (uncomment after SSL setup)
# server {
#     listen 443 ssl http2;
#     listen [::]:443 ssl http2;
#     server_name your-domain.com www.your-domain.com;
#
#     ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
#     ssl_protocols TLSv1.2 TLSv1.3;
#     ssl_ciphers HIGH:!aNULL:!MD5;
#
#     location / {
#         proxy_pass http://primebible_backend;
#         proxy_http_version 1.1;
#         proxy_set_header Upgrade $http_upgrade;
#         proxy_set_header Connection 'upgrade';
#         proxy_set_header Host $host;
#         proxy_set_header X-Real-IP $remote_addr;
#         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto $scheme;
#         proxy_cache_bypass $http_upgrade;
#         proxy_read_timeout 86400;
#     }
#
#     client_max_body_size 10M;
# }
```

### 7.3 Enable the Site

```bash
sudo ln -s /etc/nginx/sites-available/primebible /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

### 7.4 Configure Firewall

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
sudo ufw status
```

---

## Step 8: Set Up SSL (Recommended)

### 8.1 Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 8.2 Obtain SSL Certificate

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Follow the prompts:
- Enter email address
- Agree to terms
- Choose whether to redirect HTTP to HTTPS (recommended: Yes)

### 8.3 Auto-Renewal

Certbot automatically sets up renewal. Test it:

```bash
sudo certbot renew --dry-run
```

### 8.4 Update Nginx Config (if needed)

If you used the manual nginx config above, uncomment the HTTPS server block and comment out the HTTP location block.

```bash
sudo nano /etc/nginx/sites-available/primebible
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 9: DNS Configuration

### 9.1 Add DNS Records

In your domain registrar's DNS settings:

**A Record:**
- Host: `@` (or blank)
- Value: Your Droplet IP
- TTL: 3600

**A Record (www):**
- Host: `www`
- Value: Your Droplet IP
- TTL: 3600

Wait 5-60 minutes for propagation.

### 9.2 Verify DNS

```bash
dig your-domain.com
nslookup your-domain.com
```

---

## Step 10: Test Everything

### 10.1 Access Control Panel

Visit: `https://your-domain.com/control`

**Expected:**
- ✅ Page loads over HTTPS
- ✅ No certificate warnings
- ✅ WebSocket connects
- ✅ Can fetch verses

### 10.2 Test Mobile Remote

Visit on phone: `https://your-domain.com/remote?pin=your-pin`

**Expected:**
- ✅ Loads on mobile
- ✅ PIN authentication works
- ✅ Can trigger verses
- ✅ WebSocket stable

### 10.3 Test OBS Connection

**Note:** OBS must be on same network OR you need to expose WebSocket port (not recommended for security).

**Local OBS Setup:**
1. In OBS on your local machine
2. Set WebSocket URL to: `ws://localhost:4455` (local OBS)
3. Connect PrimeBible to local OBS
4. Use remote to control it over internet

**OR for Remote OBS:**
Set up SSH tunnel (more secure than exposing port):

```bash
ssh -L 4455:localhost:4455 primebible@your-droplet-ip
```

---

## Step 11: Monitoring & Maintenance

### 11.1 View Application Logs

```bash
pm2 logs primebible --lines 100
pm2 logs primebible --err  # Errors only
```

### 11.2 View Nginx Logs

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 11.3 Monitor Resource Usage

```bash
pm2 monit
htop
```

### 11.4 Restart Application

```bash
pm2 restart primebible
```

### 11.5 Update Application

```bash
cd ~/primebible-obs
git pull  # If using git
# OR upload new files
npm install --production
pm2 restart primebible
```

---

## Step 12: Backup Strategy

### 12.1 Enable Digital Ocean Backups

In Digital Ocean panel:
- Droplet → Backups → Enable

### 12.2 Backup Data Directory

```bash
# Create backup script
nano ~/backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR=~/backups
mkdir -p $BACKUP_DIR

# Backup data directory
tar -czf $BACKUP_DIR/primebible-data-$DATE.tar.gz ~/primebible-obs/data

# Keep only last 7 backups
ls -t $BACKUP_DIR/primebible-data-*.tar.gz | tail -n +8 | xargs rm -f

echo "Backup completed: $BACKUP_DIR/primebible-data-$DATE.tar.gz"
```

```bash
chmod +x ~/backup.sh
```

### 12.3 Schedule Daily Backups

```bash
crontab -e
```

Add this line:
```
0 2 * * * /home/primebible/backup.sh >> /home/primebible/backup.log 2>&1
```

This backs up at 2 AM daily.

---

## Step 13: Security Hardening

### 13.1 Change Default SSH Port

```bash
sudo nano /etc/ssh/sshd_config
```

Change:
```
Port 22
```
To:
```
Port 2222  # Or any port 1024-65535
```

```bash
sudo systemctl restart sshd
```

Update firewall:
```bash
sudo ufw allow 2222/tcp
sudo ufw delete allow 22/tcp
```

### 13.2 Disable Root Login

```bash
sudo nano /etc/ssh/sshd_config
```

Set:
```
PermitRootLogin no
PasswordAuthentication no  # If using SSH keys
```

```bash
sudo systemctl restart sshd
```

### 13.3 Install Fail2Ban

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 13.4 Set Up Rate Limiting in Nginx

```bash
sudo nano /etc/nginx/nginx.conf
```

Add inside `http` block:
```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
```

Update location block in site config:
```nginx
location /api/ {
    limit_req zone=api burst=20;
    proxy_pass http://primebible_backend;
    # ... rest of config
}
```

---

## Step 14: Performance Optimization

### 14.1 Enable Nginx Caching

```bash
sudo nano /etc/nginx/nginx.conf
```

Add inside `http` block:
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=primebible_cache:10m max_size=1g inactive=60m;
```

Update location block:
```nginx
location /api/verse {
    proxy_cache primebible_cache;
    proxy_cache_valid 200 1h;
    proxy_cache_key "$scheme$request_method$host$request_uri";
    add_header X-Cache-Status $upstream_cache_status;
    
    proxy_pass http://primebible_backend;
    # ... rest of config
}
```

### 14.2 Enable Gzip Compression

```bash
sudo nano /etc/nginx/nginx.conf
```

Ensure these are enabled:
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
```

### 14.3 Optimize PM2

```bash
pm2 start server.js --name primebible --max-memory-restart 500M
pm2 save
```

---

## Common Issues & Solutions

### Issue: Can't Connect to Application

**Check:**
```bash
pm2 status
pm2 logs primebible --err
sudo systemctl status nginx
sudo nginx -t
```

**Solution:**
```bash
pm2 restart primebible
sudo systemctl restart nginx
```

### Issue: WebSocket Connection Fails

**Check nginx config has:**
```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection 'upgrade';
```

### Issue: SSL Certificate Error

**Renew certificate:**
```bash
sudo certbot renew
sudo systemctl reload nginx
```

### Issue: Out of Memory

**Increase droplet size** OR **optimize:**
```bash
pm2 start server.js --max-memory-restart 300M
```

---

## Production Checklist

Before going live:

- [ ] Application running under PM2
- [ ] PM2 configured to start on boot
- [ ] Nginx installed and configured
- [ ] SSL certificate installed
- [ ] Firewall (UFW) enabled
- [ ] DNS records pointing to droplet
- [ ] Remote PIN set in config.json
- [ ] Backups enabled (Digital Ocean + cron)
- [ ] Fail2Ban installed
- [ ] SSH hardened (non-root, key-only)
- [ ] Logs monitored
- [ ] All smoke tests passed
- [ ] Documentation accessible
- [ ] Team trained on usage

---

## Maintenance Schedule

**Daily:**
- Check PM2 logs for errors
- Monitor resource usage

**Weekly:**
- Review Nginx access logs
- Check backup script ran successfully
- Test fail2ban is working

**Monthly:**
- Update system packages
- Review and rotate logs
- Test disaster recovery
- Update application if new version available

---

## Support & Monitoring

### Application Monitoring

**Digital Ocean Monitoring:**
- CPU, Memory, Disk, Network graphs
- Alerts when thresholds exceeded

**PM2 Monitoring:**
```bash
pm2 monit  # Real-time monitoring
```

### Set Up Alerts

In Digital Ocean:
- Settings → Alerts
- Create alerts for:
  - CPU > 80% for 5 minutes
  - Memory > 90% for 5 minutes
  - Disk > 85%

---

## Cost Summary

**Monthly Costs:**
- Droplet (Basic 1GB): $6.00
- Backups (optional): $1.20
- Bandwidth: Free (1TB included)
- **Total: ~$7.20/month**

**One-Time Costs:**
- Domain name: $10-15/year
- SSL Certificate: Free (Let's Encrypt)

---

## Next Steps After Deployment

1. **Test thoroughly** with your team
2. **Create user documentation** specific to your setup
3. **Train operators** on the control interface
4. **Schedule maintenance windows**
5. **Monitor for 1 week** before going fully live
6. **Gather feedback** and iterate
7. **Share your success!** ⭐️

---

## 🎉 Congratulations!

Your PrimeBible Pro instance is now live on Digital Ocean!

**Access URLs:**
- Control Panel: `https://your-domain.com/control`
- Mobile Remote: `https://your-domain.com/remote?pin=your-pin`
- Overlay: `https://your-domain.com/overlay`

**Support:**
- Documentation: See README.md
- Smoke Tests: See SMOKE_TEST.md
- Issues: Check logs first, then GitHub issues

---

*Made with ❤️ for worship teams everywhere*
