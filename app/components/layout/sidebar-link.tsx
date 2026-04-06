'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';

type SidebarLinkProps = {
  href: string;
  label: string;
  icon: LucideIcon;
};

function getActiveAccent(href: string) {
  if (href === '/projects' || href.startsWith('/illumina') || href === '/kien-thuc/illumina' || href === '/logs') {
    return 'text-orange-500 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 font-semibold';
  }
  if (href.startsWith('/vi-sinh') || href === '/kien-thuc/vi-sinh') {
    return 'text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 font-semibold';
  }
  if (href.startsWith('/cepheid') || href === '/kien-thuc/cepheid' || href.startsWith('/sinh-hoc-phan-tu')) {
    return 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 font-semibold';
  }
  return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 font-semibold';
}

export function SidebarLink({ href, label, icon: Icon }: SidebarLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={`nav-link ${isActive ? `active ${getActiveAccent(href)}` : ''}`}
    >
      <Icon size={16} className="flex-shrink-0" />
      <span>{label}</span>
    </Link>
  );
}
