# راهنمای استقرار نوبت مارکت 🚀

این راهنما نحوه استقرار پروژه نوبت مارکت روی سرور VPS با استفاده از Docker و Nginx را توضیح می‌دهد.

---

## 📋 پیش‌نیازهای سرور

- **سیستم‌عامل:** Ubuntu 22.04 LTS
- **رم:** حداقل 2GB (ترجیحاً 4GB)
- **دیسک:** حداقل 20GB
- **دسترسی:** SSH با دسترسی root یا sudo

---

## ۱. نصب Docker و Docker Compose

```bash
# به‌روزرسانی پکیج‌ها
sudo apt update && sudo apt upgrade -y

# نصب Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# نصب Docker Compose
sudo apt install docker-compose -y

# اضافه کردن کاربر به گروه docker
sudo usermod -aG docker $USER
```

---

## ۲. کلون کردن پروژه

```bash
cd /opt
sudo git clone https://github.com/your-repo/nobat-market.git
cd nobat-market
sudo chown -R $USER:$USER .
```

---

## ۳. پیکربندی متغیرهای محیطی

```bash
cp .env.example .env
nano .env
```

مقدار متغیرها را تنظیم کنید:

```env
# دیتابیس PostgreSQL
DATABASE_URL="postgresql://nobat-market:your_password@db:5432/nobat_market"

# NextAuth
NEXTSECRET="یک رشته تصادفی حداقل ۳۲ کاراکتر"
NEXTAUTH_URL="https://nobat-market.ir"

# Redis
REDIS_URL="redis://redis:6379"

# زرین‌پال (مود واقعی)
PAYMENT_MODE="zarinpal"
ZARINPAL_MERCHANT_ID="کد مرچنت شما"

# آدرس اپلیکیشن
APP_URL="https://nobat-market.ir"
```

---

## ۴. بیلد و اجرای Docker

```bash
# بیلد تصویر Docker
docker-compose build --no-cache

# اجرای سرویس‌ها
docker-compose up -d

# بررسی وضعیت
docker-compose ps

# مشاهده لاگ‌ها
docker-compose logs -f app
```

---

## ۵. اعمال اسکیما دیتابیس

```bash
# اجرای مایگریشن
docker-compose exec app npx prisma db push

# پر کردن با داده نمونه
docker-compose exec app npm run db:seed
```

---

## ۶. پیکربندی Nginx (Reverse Proxy)

### نصب Nginx

```bash
sudo apt install nginx -y
```

### ایجاد فایل پیکربندی

```bash
sudo nano /etc/nginx/sites-available/nobat-market
```

```nginx
server {
    listen 80;
    server_name nobat-market.ir www.nobat-market.ir;

    # ریدایرکت به HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name nobat-market.ir www.nobat-market.ir;

    # SSL ( Certbot خودکار تنظیم می‌کند)
    ssl_certificate /etc/letsencrypt/live/nobat-market.ir/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/nobat-market.ir/privkey.pem;

    # هدرهای امنیتی
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # محدودیت حجم آپلود
    client_max_body_size 10M;

    # کش استاتیک‌ها
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # پروکسی به Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### فعال‌سازی سایت

```bash
sudo ln -s /etc/nginx/sites-available/nobat-market /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## ۷. نصب SSL با Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d nobat-market.ir -d www.nobat-market.ir

# تمدید خودکار
sudo systemctl status certbot.timer
```

---

## ۸. پشتیبان‌گیری از دیتابیس

### پشتیبان‌گیری خودکار

```bash
# ایجاد اسکریپت پشتیبان
sudo nano /opt/backup-nobat-market.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y-%m-%d_%H-%M)
docker-compose exec -T db pg_dump -U nobat-market nobat_market > /opt/backups/nobat-market_$DATE.sql
# حذف بکاپ‌های بیش از ۷ روز
find /opt/backups -name "*.sql" -mtime +7 -delete
```

```bash
sudo chmod +x /opt/backup-nobat-market.sh
# اجرای روزانه با cron
echo "0 2 * * * /opt/backup-nobat-market.sh" | sudo crontab -
```

---

## ۹. مانیتورینگ

```bash
# مشاهده لاگ‌های اپلیکیشن
docker-compose logs -f app

# مشاهده لاگ‌های دیتابیس
docker-compose logs -f db

# بررسی مصرف منابع
docker stats

# بررسی وضعیت سرویس‌ها
docker-compose ps
```

---

## ۱۰. به‌روزرسانی

```bash
cd /opt/nobat-market
git pull origin main
docker-compose build --no-cache
docker-compose up -d
docker-compose exec app npx prisma db push
```

---

## ⚠️ نکات امنیتی مهم

1. **متغیرهای محیطی:** هرگز فایل `.env` را در گیت کامیت نکنید
2. **SSH:** از کلید SSH به جای رمز عبور استفاده کنید
3. **فایروال:** فقط پورت‌های 80 و 443 را باز بگذارید
4. **به‌روزرسانی:** سیستم‌عامل و Docker را به‌روز نگه دارید
5. **پشتیبان‌گیری:** روزانه از دیتابیس پشتیبان بگیرید
6. **SSL:** از Certbot برای تمدید خودکار SSL استفاده کنید
