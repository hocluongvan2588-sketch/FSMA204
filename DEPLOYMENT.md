# 🚀 Hướng dẫn Triển khai (Deployment Guide)

## Triển khai lên Vercel (Khuyến nghị)

### Bước 1: Chuẩn bị

1. **Push code lên GitHub**
\`\`\`bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
\`\`\`

2. **Tạo Supabase Project**
- Truy cập [supabase.com](https://supabase.com)
- Tạo project mới
- Lưu lại URL và API Keys

3. **Chạy SQL Scripts**
- Vào Supabase Dashboard > SQL Editor
- Chạy từng script theo thứ tự:
  - `scripts/001_create_schema.sql`
  - `scripts/002_create_profile_trigger.sql`
  - `scripts/003_seed_data.sql` (optional)

### Bước 2: Deploy lên Vercel

1. **Import Project**
- Truy cập [vercel.com](https://vercel.com)
- Nhấn "New Project"
- Import từ GitHub repository

2. **Cấu hình Environment Variables**

Thêm các biến sau vào Vercel Project Settings:

\`\`\`env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Development Redirect (for testing)
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=https://your-app.vercel.app
\`\`\`

3. **Deploy**
- Nhấn "Deploy"
- Chờ build hoàn thành (2-3 phút)
- Truy cập domain được cấp

### Bước 3: Cấu hình Supabase Redirect URLs

1. Vào Supabase Dashboard
2. Settings > Authentication > URL Configuration
3. Thêm các URLs:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs:
     - `https://your-app.vercel.app/auth/callback`
     - `http://localhost:3000/auth/callback` (cho dev)

### Bước 4: Test Production

1. Truy cập `https://your-app.vercel.app`
2. Đăng ký tài khoản mới
3. Kiểm tra email xác nhận
4. Đăng nhập và test các chức năng

## Custom Domain

### Thêm domain riêng

1. **Mua domain** (từ Namecheap, GoDaddy, etc.)

2. **Thêm vào Vercel**
   - Vercel Dashboard > Settings > Domains
   - Add domain: `foodtrace.yourdomain.com`
   - Copy DNS records

3. **Cấu hình DNS**
   - Vào nhà cung cấp domain
   - Thêm CNAME record:
     \`\`\`
     Type: CNAME
     Name: foodtrace
     Value: cname.vercel-dns.com
     \`\`\`

4. **Update Supabase URLs**
   - Thay đổi redirect URLs sang domain mới
   - Update `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL`

## Triển khai lên VPS (Ubuntu)

### Yêu cầu
- Ubuntu 20.04+
- Node.js 18+
- Nginx
- SSL Certificate (Let's Encrypt)

### Bước 1: Setup Server

\`\`\`bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
\`\`\`

### Bước 2: Clone và Build

\`\`\`bash
# Clone repository
git clone <your-repo-url> /var/www/foodtrace
cd /var/www/foodtrace

# Install dependencies
npm install

# Create .env.local
nano .env.local
# Paste environment variables

# Build application
npm run build
\`\`\`

### Bước 3: Setup PM2

\`\`\`bash
# Start application
pm2 start npm --name "foodtrace" -- start

# Save PM2 configuration
pm2 save

# Setup auto-start on reboot
pm2 startup
# Run the command it outputs
\`\`\`

### Bước 4: Configure Nginx

\`\`\`bash
sudo nano /etc/nginx/sites-available/foodtrace
\`\`\`

Thêm cấu hình:

\`\`\`nginx
server {
    listen 80;
    server_name foodtrace.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
\`\`\`

Enable site:

\`\`\`bash
sudo ln -s /etc/nginx/sites-available/foodtrace /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
\`\`\`

### Bước 5: Setup SSL

\`\`\`bash
sudo certbot --nginx -d foodtrace.yourdomain.com
\`\`\`

Chọn option redirect HTTP to HTTPS.

### Bước 6: Update & Maintenance

\`\`\`bash
# Update code
cd /var/www/foodtrace
git pull
npm install
npm run build
pm2 restart foodtrace

# View logs
pm2 logs foodtrace

# Monitor
pm2 monit
\`\`\`

## Database Backup

### Backup Supabase tự động

1. Vào Supabase Dashboard
2. Settings > Database
3. Enable automated backups
4. Chọn frequency: Daily/Weekly

### Backup thủ công

\`\`\`bash
# Sử dụng pg_dump qua connection string
pg_dump "postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres" > backup_$(date +%Y%m%d).sql
\`\`\`

### Restore

\`\`\`bash
psql "postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres" < backup_20250101.sql
\`\`\`

## Monitoring & Logs

### Vercel
- Vercel Dashboard > Analytics
- Real-time logs
- Performance metrics

### PM2 (VPS)
\`\`\`bash
pm2 logs foodtrace --lines 100
pm2 monit
\`\`\`

### Supabase
- Dashboard > Database > Logs
- Table insights
- Query performance

## Security Checklist

✅ Environment variables không commit vào Git
✅ Supabase Service Role Key chỉ dùng server-side
✅ HTTPS enabled (SSL certificate)
✅ Row Level Security enabled trên tất cả bảng
✅ Rate limiting trên authentication endpoints
✅ CORS configured đúng domain
✅ Security headers configured trong next.config.mjs

## Performance Optimization

1. **Enable caching**
   - Static assets cached by Vercel CDN
   - API responses cache với SWR

2. **Image optimization**
   - Next.js Image component auto-optimize
   - WebP format preferred

3. **Database indexing**
   - Indexes trên foreign keys
   - Indexes trên search fields

4. **CDN Configuration**
   - Static files served từ edge
   - Global distribution

## Troubleshooting

### Lỗi thường gặp

**1. Authentication không hoạt động**
- Kiểm tra Redirect URLs trong Supabase
- Verify environment variables
- Check email confirmation settings

**2. Database connection failed**
- Verify Supabase URL và Keys
- Check IP whitelist (nếu có)
- Test connection từ Supabase Dashboard

**3. Build failed**
- Clear `.next` folder: `rm -rf .next`
- Delete node_modules: `rm -rf node_modules`
- Reinstall: `npm install`
- Rebuild: `npm run build`

**4. Performance issues**
- Enable database indexing
- Optimize queries (use select specific columns)
- Enable caching strategies
- Use SWR for client-side data fetching

## Liên hệ Support

- Technical Issues: support@foodtrace.com
- Documentation: [docs link]
- Community: [Discord/Slack link]

---

Chúc bạn triển khai thành công! 🎉
