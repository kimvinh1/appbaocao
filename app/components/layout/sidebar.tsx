'use client';

import {
    Dna, FolderKanban, LayoutDashboard, Microscope,
    FileText, FlaskConical,
    LibraryBig, LogOut, ShieldCheck,
} from 'lucide-react';
import { SidebarLink } from './sidebar-link';
import { SidebarGroup } from './sidebar-group';
import { SearchBar } from './search-bar';
import { logoutAction } from '@/app/actions-auth';
import { ThemeSwitcher } from '@/app/components/ui/theme-switcher';

type SidebarProps = {
    currentUser: {
        fullName: string;
        email: string;
        role: string;
    };
};

export function Sidebar({ currentUser }: SidebarProps) {
    const initials = currentUser.fullName
        .split(' ')
        .slice(-2)
        .map((n) => n[0])
        .join('')
        .toUpperCase();

    return (
        <aside className="glass-panel h-full lg:min-h-screen lg:overflow-y-auto flex flex-col w-[260px]">
            {/* Brand header */}
            <div className="px-4 pt-5 pb-4 border-b border-[var(--border)]">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--accent)]">APP Team Portal</p>
                <h1 className="mt-0.5 text-[15px] font-bold text-[var(--text-primary)] tracking-tight">Hỗ Trợ Kỹ Thuật</h1>
            </div>

            {/* User card */}
            <div className="px-4 py-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-2.5">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                        {initials}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{currentUser.fullName}</p>
                        <p className="text-[11px] text-[var(--text-muted)] truncate">{currentUser.email}</p>
                    </div>
                    <span className="ml-auto flex-shrink-0 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-[var(--accent-light)] text-[var(--accent)]">
                        {currentUser.role === 'admin' ? 'Admin' : 'Staff'}
                    </span>
                </div>
            </div>

            {/* Search */}
            <div className="px-3 pt-3">
                <SearchBar />
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto pb-4">
                <SidebarLink href="/" label="Tổng Quan" icon={LayoutDashboard} />

                <div className="my-2 border-t border-[var(--border)]" />

                <SidebarGroup
                    label="Illumina"
                    icon={Dna}
                    color="text-orange-500 dark:text-orange-400"
                    defaultOpen={true}
                    items={[
                        { href: '/projects', label: 'Quản Lý Dự Án', icon: FolderKanban },
                        { href: '/kien-thuc/illumina', label: 'Tri thức & mã lỗi', icon: FileText },
                    ]}
                />

                <div className="my-2 border-t border-[var(--border)]" />

                <SidebarGroup
                    label="Vi Sinh"
                    icon={Microscope}
                    color="text-red-500 dark:text-red-400"
                    items={[
                        { href: '/kien-thuc/vi-sinh', label: 'Tri thức & mã lỗi', icon: FileText },
                    ]}
                />

                <div className="my-2 border-t border-[var(--border)]" />

                <SidebarGroup
                    label="Cepheid"
                    icon={FlaskConical}
                    color="text-cyan-600 dark:text-cyan-400"
                    items={[
                        { href: '/kien-thuc/cepheid', label: 'Tri thức & mã lỗi', icon: FileText },
                    ]}
                />

                <div className="my-2 border-t border-[var(--border)]" />

                <p className="section-label px-2.5 pt-1 pb-0.5">Quản Lý Chung</p>
                <SidebarLink href="/kien-thuc" label="Thư Viện Tài Liệu" icon={LibraryBig} />
                {currentUser.role === 'admin' && (
                    <SidebarLink href="/quan-tri/nguoi-dung" label="Quản trị người dùng" icon={ShieldCheck} />
                )}
            </nav>

            {/* Footer */}
            <div className="px-3 py-3 border-t border-[var(--border)] space-y-0.5">
                <ThemeSwitcher />
                <form action={logoutAction}>
                    <button
                        type="submit"
                        className="nav-link w-full text-left"
                    >
                        <LogOut size={16} className="flex-shrink-0" />
                        <span>Đăng xuất</span>
                    </button>
                </form>
            </div>
        </aside>
    );
}
