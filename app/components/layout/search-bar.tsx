'use client';

import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function SearchBar() {
    const router = useRouter();
    const [query, setQuery] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="px-5 mb-4 relative">
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
                type="text"
                placeholder="Tìm kiếm..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-700/60 text-sm text-slate-300 rounded-lg pl-10 pr-4 py-2 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
            />
        </form>
    );
}
