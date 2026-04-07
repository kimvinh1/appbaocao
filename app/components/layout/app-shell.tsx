'use client';

import { useState } from 'react';
import { Sidebar } from '@/app/components/layout/sidebar';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

type AppShellProps = {
    currentUser: {
        fullName: string;
        email: string;
        role: string;
    };
    children: React.ReactNode;
};

export function AppShell({ currentUser, children }: AppShellProps) {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="min-h-screen flex">
            {/* Sidebar */}
            <div
                className="flex-shrink-0 transition-all duration-300 overflow-hidden"
                style={{ width: sidebarOpen ? '260px' : '0px' }}
            >
                <div className="w-[260px] h-full">
                    <Sidebar currentUser={currentUser} />
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 min-w-0 flex flex-col">
                {/* Top bar */}
                <div className="sticky top-0 z-40 flex items-center gap-2 px-4 h-10 border-b border-[var(--border)] bg-[var(--bg-page)]/90 backdrop-blur-md">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="flex items-center gap-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1 rounded-md hover:bg-[var(--bg-hover)]"
                        title={sidebarOpen ? 'Ẩn menu' : 'Hiện menu'}
                    >
                        {sidebarOpen
                            ? <PanelLeftClose size={17} />
                            : <PanelLeftOpen size={17} />
                        }
                        <span className="text-xs font-medium">{sidebarOpen ? 'Ẩn menu' : 'Mở menu'}</span>
                    </button>
                </div>

                {/* Page */}
                <main className="flex-1 p-3 sm:p-5 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
