'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

export function ThemeSwitcher() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const isDark = resolvedTheme === 'dark';

    return (
        <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors w-full
                text-slate-600 dark:text-slate-300
                hover:bg-slate-100 dark:hover:bg-slate-800/80
                hover:text-slate-900 dark:hover:text-white"
            title="Đổi giao diện Sáng / Tối"
        >
            {isDark ? (
                <Sun size={18} className="text-amber-400 flex-shrink-0" />
            ) : (
                <Moon size={18} className="text-indigo-500 flex-shrink-0" />
            )}
            <span>{isDark ? 'Giao Diện Sáng' : 'Giao Diện Tối'}</span>
        </button>
    );
}
