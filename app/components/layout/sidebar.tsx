'use client';

import {
    Activity,
    ShieldCheck,
    Dna,
    FolderKanban,
    LayoutDashboard,
    Microscope,
    AlertTriangle,
    FileText,
    FlaskConical,
    TicketCheck,
    LibraryBig,
    LogOut,
} from 'lucide-react';
import { SidebarLink } from './sidebar-link';
import { SidebarGroup } from './sidebar-group';
import { SearchBar } from './search-bar';
import { logoutAction } from '@/app/actions-auth';

type SidebarProps = {
    currentUser: {
        fullName: string;
        email: string;
        role: string;
    };
};

export function Sidebar({ currentUser }: SidebarProps) {
    return (
        <aside className="glass-panel border-b border-slate-700/60 px-4 py-6 lg:min-h-screen lg:border-b-0 lg:border-r lg:overflow-y-auto">
            {/* Brand */}
            <div className="mb-6 px-2">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">APP Team Portal</p>
                <h1 className="mt-1 text-lg font-semibold text-white">Hỗ Trợ Kỹ Thuật</h1>
                <div className="mt-4 rounded-2xl border border-slate-700/60 bg-slate-950/40 px-4 py-3">
                    <p className="text-sm font-semibold text-white">{currentUser.fullName}</p>
                    <p className="mt-1 text-xs text-slate-400">{currentUser.email}</p>
                    <p className="mt-2 inline-flex rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-300">
                        {currentUser.role === 'admin' ? 'Admin' : 'Nhân viên'}
                    </p>
                </div>
            </div>

            {/* Global Search Bar */}
            <SearchBar />

            <nav className="space-y-1">
                {/* Dashboard */}
                <SidebarLink href="/" label="Tổng Quan" icon={LayoutDashboard} />

                <div className="my-3 border-t border-slate-700/40" />

                {/* Illumina */}
                <SidebarGroup
                    label="Illumina"
                    icon={Dna}
                    color="text-orange-300"
                    defaultOpen={true}
                    items={[
                        { href: '/projects', label: 'Quản Lý Dự Án', icon: FolderKanban },
                        
                        { href: '/illumina/ma-loi', label: 'Mã lỗi Illumina', icon: AlertTriangle },
                        { href: '/illumina/case', label: 'Case hỗ trợ', icon: TicketCheck },
                        { href: '/kien-thuc/illumina', label: 'Quy trình kỹ thuật', icon: FileText },
                    ]}
                />

                <div className="my-3 border-t border-slate-700/40" />

                {/* Vi sinh */}
                <SidebarGroup
                    label="Vi Sinh"
                    icon={Microscope}
                    color="text-red-400"
                    items={[
                        { href: '/vi-sinh/ma-loi', label: 'Mã lỗi Vi Sinh', icon: AlertTriangle },
                        { href: '/vi-sinh/case', label: 'Case hỗ trợ', icon: TicketCheck },
                        { href: '/kien-thuc/vi-sinh', label: 'Quy trình kỹ thuật', icon: FileText },
                    ]}
                />

                <div className="my-3 border-t border-slate-700/40" />

                {/* Sinh học phân tử */}
                <SidebarGroup
                    label="Cepheid"
                    icon={FlaskConical}
                    color="text-cyan-300"
                    items={[
                        { href: '/cepheid/ma-loi', label: 'Mã lỗi Cepheid', icon: AlertTriangle },
                        { href: '/cepheid/case', label: 'Case hỗ trợ', icon: TicketCheck },
                        { href: '/kien-thuc/cepheid', label: 'Quy trình kỹ thuật', icon: FileText },
                    ]}
                />

                <div className="my-3 border-t border-slate-700/40" />

                {/* Knowledge Base */}
                <div className="pt-2">
                    <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Quản Lý Chung
                    </p>
                    <SidebarLink href="/kien-thuc" label="Thư Viện Tài Liệu" icon={LibraryBig} />
                    {currentUser.role === 'admin' ? (
                        <SidebarLink href="/quan-tri/nguoi-dung" label="Quản trị người dùng" icon={ShieldCheck} />
                    ) : null}
                </div>

                <div className="pt-4">
                    <form action={logoutAction}>
                        <button
                            type="submit"
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800/80 hover:text-white"
                        >
                            <LogOut size={18} />
                            <span>Đăng xuất</span>
                        </button>
                    </form>
                </div>
            </nav>
        </aside>
    );
}
