'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { SidebarLink } from './sidebar-link';

type SidebarItem = {
    href: string;
    label: string;
    icon: LucideIcon;
};

type SidebarGroupProps = {
    label: string;
    icon: LucideIcon;
    color: string; // tailwind text color class, e.g. 'text-cyan-300'
    items: SidebarItem[];
    defaultOpen?: boolean;
};

export function SidebarGroup({ label, icon: GroupIcon, color, items, defaultOpen = false }: SidebarGroupProps) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div>
            <button
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition hover:bg-slate-800/80"
            >
                <span className={`flex items-center gap-2 ${color}`}>
                    <GroupIcon size={16} />
                    {label}
                </span>
                <ChevronDown
                    size={14}
                    className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                />
            </button>

            {open && (
                <div className="ml-3 mt-1 space-y-1 border-l border-slate-700/60 pl-3">
                    {items.map((item) => (
                        <SidebarLink key={item.href} href={item.href} label={item.label} icon={item.icon} />
                    ))}
                </div>
            )}
        </div>
    );
}
