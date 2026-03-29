import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/app/components/providers/theme-provider';
import { AppShell } from '@/app/components/layout/app-shell';
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
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange={false}>
          {currentUser ? (
            <AppShell
              currentUser={{
                fullName: currentUser.fullName,
                email: currentUser.email,
                role: currentUser.role,
              }}
            >
              {children}
            </AppShell>
          ) : (
            <main className="min-h-screen">{children}</main>
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
