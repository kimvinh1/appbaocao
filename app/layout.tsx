import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/app/components/layout/sidebar';
import { getCurrentUser } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'APP Portal – Hỗ Trợ Kỹ Thuật',
  description: 'Cổng tra cứu tài liệu kỹ thuật, quản lý dự án và log case cho đội APP và khách hàng.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUser = await getCurrentUser();

  return (
    <html lang="vi">
      <body>
        <div className={currentUser ? 'min-h-screen lg:grid lg:grid-cols-[268px_1fr]' : 'min-h-screen'}>
          {currentUser ? (
            <Sidebar
              currentUser={{
                fullName: currentUser.fullName,
                email: currentUser.email,
                role: currentUser.role,
              }}
            />
          ) : null}
          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
