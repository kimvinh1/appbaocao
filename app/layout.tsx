import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/app/components/providers/theme-provider';
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
    <html lang="vi" suppressHydrationWarning>
      <body className="bg-slate-50 text-slate-900 dark:bg-[#020617] dark:text-slate-200 transition-colors">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
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
        </ThemeProvider>
      </body>
    </html>
  );
}
