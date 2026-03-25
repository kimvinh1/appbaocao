'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';

type SidebarLinkProps = {
  href: string;
  label: string;
  icon: LucideIcon;
};

function getActiveClass(href: string) {
  if (href === '/projects' || href === '/logs' || href.startsWith('/illumina')) {
    return 'bg-orange-500/20 text-orange-300 ring-1 ring-orange-400/40';
  }

  if (href.startsWith('/vi-sinh') || href === '/kien-thuc/vi-sinh') {
    return 'bg-red-500/20 text-red-400 ring-1 ring-red-400/40';
  }

  if (
    href.startsWith('/sinh-hoc-phan-tu') ||
    href.startsWith('/cepheid') ||
    href === '/kien-thuc/sinh-hoc-phan-tu' ||
    href === '/kien-thuc/cepheid'
  ) {
    return 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/40';
  }

  return 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/40';
}

export function SidebarLink({ href, label, icon: Icon }: SidebarLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
        isActive
          ? getActiveClass(href)
          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
      }`}
    >
      <Icon size={18} />
      <span>{label}</span>
    </Link>
  );
}
