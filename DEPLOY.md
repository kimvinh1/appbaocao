# Hướng dẫn Deploy v2 (Vercel + Turso – Miễn phí)

## Thay đổi so với v1
- Bỏ Supabase hoàn toàn
- File đính kèm → nhập link Google Drive
- Database → Turso (SQLite cloud, miễn phí)
- Host → Vercel (miễn phí)

---

## Bước 1: Tạo database Turso

1. Vào https://app.turso.tech → đăng ký miễn phí
2. Tạo database mới (đặt tên tuỳ, chọn region gần nhất – Singapore)
3. Vào database → **Connect** → copy 2 giá trị:
   - `TURSO_DATABASE_URL` (dạng `libsql://...`)
   - `TURSO_AUTH_TOKEN`

---

## Bước 2: Đẩy schema lên Turso

```bash
# Cài dependency
npm install

# Copy .env.example → .env và điền DATABASE_URL + DATABASE_AUTH_TOKEN
cp .env.example .env

# Đẩy schema lên Turso
npm run db:push
```

---

## Bước 3: Deploy lên Vercel

1. Push code lên GitHub (tạo repo mới cho v2)
2. Vào https://vercel.com → Import repo
3. Trong **Environment Variables**, thêm:
   - `DATABASE_URL` = giá trị Turso URL
   - `DATABASE_AUTH_TOKEN` = giá trị Turso token
   - `AUTH_SECRET` = chuỗi random 32 ký tự
4. Deploy → Done!

---

## Tạo tài khoản admin đầu tiên

Sau khi deploy, chạy script seed hoặc dùng Turso shell:

```bash
# Dùng Turso CLI
turso db shell your-db-name

# Tạo user admin (thay password hash bằng giá trị thực)
INSERT INTO User (id, fullName, email, passwordHash, role, isActive, createdAt)
VALUES (
  lower(hex(randomblob(16))),
  'Admin',
  'admin@example.com',
  '<chạy script hash-password để lấy hash>',
  'admin',
  1,
  datetime('now')
);
```

> Để tạo password hash, chạy: `node -e "const {scryptSync,randomBytes}=require('crypto'); const s=randomBytes(16).toString('hex'); console.log(s+':'+scryptSync('YOUR_PASSWORD',s,64).toString('hex'))"`

---

## Lưu ý về Google Drive

Khi dán link vào form, file trên Drive phải được set:
**Share → Anyone with the link → Viewer**

Nếu không, khách hàng sẽ không mở được link.
