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
            {/* Sidebar – ẩn khi sidebarOpen = false */}
            <div
                className={`flex-shrink-0 transition-all duration-300 overflow-hidden ${
                    sidebarOpen ? 'w-[268px]' : 'w-0'
                }`}
            >
                <div className="w-[268px] h-full">
                    <Sidebar currentUser={currentUser} />
                </div>
            </div>

            {/* Main area */}
            <div className="flex-1 min-w-0 flex flex-col">
                {/* Sticky toggle bar */}
                <div className="sticky top-0 z-40 flex items-center gap-2 px-3 py-2 
                    bg-white/80 dark:bg-slate-900/80 
                    backdrop-blur-md 
                    border-b border-slate-200 dark:border-slate-700/50">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 
                            hover:bg-slate-100 dark:hover:bg-slate-800 
                            hover:text-slate-900 dark:hover:text-white 
                            transition-colors"
                        title={sidebarOpen ? 'Ẩn menu' : 'Hiện menu'}
                    >
                        {sidebarOpen
                            ? <PanelLeftClose size={20} />
                            : <PanelLeftOpen size={20} />
                        }
                    </button>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                        {sidebarOpen ? 'Ẩn menu' : 'Mở menu'}
                    </span>
                </div>

                {/* Page content */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
