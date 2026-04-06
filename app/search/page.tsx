import { globalSearch } from '@/app/actions-search';
import { Search, FileText, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { getModuleTheme } from '@/lib/module-theme';

export default async function SearchPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string | string[] }>;
}) {
    const resolvedSearchParams = await searchParams;
    const queryParam = resolvedSearchParams.q;
    const query = Array.isArray(queryParam) ? (queryParam[0] ?? '') : (queryParam ?? '');
    const results = await globalSearch(query);

    const getTypeStyle = (type: string) => {
        switch (type) {
            case 'article':
                return { icon: <FileText size={16} />, color: 'text-blue-400', label: 'Tài liệu' };
            case 'error_code':
                return { icon: <AlertTriangle size={16} />, color: 'text-orange-400', label: 'Mã lỗi' };
            default:
                return { icon: <FileText size={16} />, color: 'text-slate-400', label: 'Khác' };
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                    <Search size={22} className="text-cyan-400" /> Kết quả tìm kiếm
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                    {query ? `Đang tìm kiếm cho từ khóa: "${query}"` : 'Nhập từ khóa vào ô tìm kiếm ở bên trái.'}
                </p>
            </div>

            {query && results.length === 0 && (
                <div className="glass-panel p-10 text-center rounded-2xl">
                    <Search size={40} className="mx-auto text-slate-600 mb-4" />
                    <h3 className="text-lg font-medium text-white">Không tìm thấy kết quả</h3>
                    <p className="text-slate-400 mt-1">Thử lại với từ khóa khác, có thể ngắn hơn hoặc chung chung hơn.</p>
                </div>
            )}

            {results.length > 0 && (
                <div className="space-y-3">
                    {results.map((item) => {
                        const style = getTypeStyle(item.type);
                        const moduleTheme = getModuleTheme(item.module);
                        return (
                            <Link key={item.id} href={item.link}>
                                <div className="glass-panel rounded-xl p-4 hover:bg-slate-800/50 hover:border-slate-600/60 transition group cursor-pointer">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-800 ${style.color}`}>
                                                    {style.icon} {style.label}
                                                </span>
                                                <span className={`text-[11px] px-2 py-0.5 rounded-full border ${moduleTheme.badgeClass} ${moduleTheme.textClass}`}>
                                                    {moduleTheme.label}
                                                </span>
                                            </div>
                                            <h3 className="text-base font-semibold text-cyan-50 group-hover:text-cyan-400 transition-colors">
                                                {item.title}
                                            </h3>
                                            <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
