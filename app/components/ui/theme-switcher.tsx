'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="flex items-center gap-2 rounded-md hover:bg-slate-800 dark:hover:bg-slate-700/50 p-2 text-sm font-medium text-slate-300 dark:text-slate-200 transition-colors w-full"
      title="Đổi Giao Diện Sáng / Tối"
    >
      {theme === 'dark' ? (
        <Sun size={18} className="text-amber-400" />
      ) : (
        <Moon size={18} className="text-cyan-400" />
      )}
      <span className="hidden lg:inline">{theme === 'dark' ? 'Giao Diện Sáng' : 'Giao Diện Tối'}</span>
    </button>
  );
}
