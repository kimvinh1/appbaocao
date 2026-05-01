# App Bao Cao / IF Support Portal

Web nội bộ hỗ trợ nhóm sản phẩm: quản lý knowledge base, case hỗ trợ, mã lỗi, link tài liệu, log công việc và chia sẻ quy trình cho khách hàng.

## Stack hiện tại

- Frontend/backend: Next.js App Router
- Database: Turso/libSQL qua Prisma
- Upload ảnh: Vercel Blob
- Deploy: GitHub `kimvinh1/appbaocao` -> Vercel project `appbaocao`
- Auth: session cookie lưu trong bảng `Session`

Không dùng Supabase nữa. Nếu thấy biến hoặc file Supabase cũ thì nên bỏ, tránh lỗi build/typecheck.

## Biến môi trường cần có

Local dùng `.env.local`; Vercel cấu hình trong Project Settings -> Environment Variables.

```bash
DATABASE_URL=libsql://...
DATABASE_AUTH_TOKEN=...
AUTH_SECRET=...
BLOB_READ_WRITE_TOKEN=...
```

Không commit `.env`, `.env.local`, `.vercel/` hoặc token thật lên GitHub.

## Chạy local

```bash
npm install
npm run dev
```

Nếu mới đổi schema Prisma:

```bash
npm run db:push
```

## Kiểm tra trước khi deploy

```bash
npm run build
```

Trong môi trường Codex/macOS có thể gặp lỗi native code-signing với SWC/libSQL nếu `node_modules` cũ hoặc thiếu `npm`. Khi đó ưu tiên kiểm tra:

```bash
node node_modules/typescript/lib/tsc.js --noEmit --types node,react,react-dom
node node_modules/prisma/build/index.js validate
node node_modules/prisma/build/index.js generate
```

Vercel sẽ build trên Linux từ GitHub bằng install sạch.

## Deploy

Luồng deploy chính là push lên GitHub `main`; Vercel tự build.

```bash
git status
git add .
git commit -m "message"
git push origin main
```

Sau khi push, kiểm tra status trên GitHub commit hoặc Vercel dashboard. Deploy gần nhất sau khi bỏ Supabase đã pass trên Vercel.

## Database Turso

Schema chính nằm ở `prisma/schema.prisma`.

Ngày 2026-05-01 đã kiểm tra Turso remote và bổ sung:

- `Article.isArchived`
- bảng `ResourceLink`

Nếu sau này lỗi 500 ở trang mới, kiểm tra schema remote trước bằng Turso shell hoặc script nhỏ qua `@libsql/client/http`.

## Reset mật khẩu admin

Không lưu mật khẩu admin trong README. Khi quên pass, reset bằng cách cập nhật `User.passwordHash` trong Turso theo cùng format của `lib/auth.ts`:

```text
salt:scrypt_hash
```

Sau khi reset nên xóa session cũ của user đó trong bảng `Session` để buộc đăng nhập lại.

## Dọn rác repo

Các thư mục/file generated đã được ignore:

- `.next/`, `.next_stale*/`
- `.vercel/`
- `output/`
- `.playwright-cli/`
- `*.tsbuildinfo`
- `.DS_Store`

Nếu cần giữ ảnh/PDF kiểm thử làm tài liệu thật, hãy chuyển sang thư mục có chủ đích trước khi commit.

