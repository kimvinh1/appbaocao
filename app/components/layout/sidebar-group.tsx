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
    color: string;
    items: SidebarItem[];
    defaultOpen?: boolean;
};

export function SidebarGroup({ label, icon: GroupIcon, color, items, defaultOpen = false }: SidebarGroupProps) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div>
            <button
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-sm font-semibold transition-colors hover:bg-[var(--bg-hover)]"
            >
                <span className={`flex items-center gap-2 ${color}`}>
                    <GroupIcon size={15} />
                    {label}
                </span>
                <ChevronDown
                    size={14}
                    className="text-[var(--text-muted)] transition-transform duration-200"
                    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
            </button>

            {open && (
                <div className="ml-2 mt-0.5 space-y-0.5 border-l border-[var(--border)] pl-3">
                    {items.map((item) => (
                        <SidebarLink key={item.href} href={item.href} label={item.label} icon={item.icon} />
                    ))}
                </div>
            )}
        </div>
    );
}
