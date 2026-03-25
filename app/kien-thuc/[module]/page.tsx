import { getArticles } from '@/app/actions-kb';
import { ArrowLeft, FileText, Plus, Tag } from 'lucide-react';
import Link from 'next/link';
import { getModuleTheme, normalizeModuleKey } from '@/lib/module-theme';

export default async function ModuleKienThucPage({ params }: { params: Promise<{ module: string }> }) {
    const { module: rawModule } = await params;
    const module = normalizeModuleKey(rawModule);
    const articles = await getArticles(module);
    const cfg = getModuleTheme(module);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <Link href="/kien-thuc" className="flex items-center gap-1 text-xs text-slate-400 hover:text-white mb-2 transition">
                        <ArrowLeft size={12} /> Thư Viện Tài Liệu
                    </Link>
                    <h2 className={`text-2xl font-semibold ${cfg.textClass}`}>{cfg.label} – Tài Liệu Kỹ Thuật</h2>
                    <p className="mt-1 text-sm text-slate-400">{articles.length} tài liệu</p>
                </div>
                <Link
                    href={`/kien-thuc/moi?module=${module}`}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium ring-1 transition ${cfg.buttonClass}`}
                >
                    <Plus size={16} /> Thêm Tài Liệu
                </Link>
            </div>

            {articles.length === 0 ? (
                <div className="glass-panel rounded-2xl px-8 py-16 text-center">
                    <FileText size={40} className="mx-auto mb-4 text-slate-600" />
                    <p className="text-slate-400">Chưa có tài liệu nào cho module này.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {articles.map((article) => {
                        const tags = article.tags ? article.tags.split(',').filter(Boolean) : [];
                        return (
                            <Link
                                key={article.id}
                                href={`/kien-thuc/bai/${article.id}`}
                                className="glass-panel rounded-xl p-4 flex flex-col gap-2 transition hover:bg-slate-800/50 block"
                            >
                                <p className="font-semibold text-white">{article.title}</p>
                                <p className="text-xs uppercase tracking-wide text-slate-500">
                                    {article.category === 'quy-trinh' ? 'Quy trình / SOP' : article.category === 'huong-dan' ? 'Hướng dẫn sử dụng' : article.category === 'troubleshooting' ? 'Xử lý sự cố' : 'FAQ'}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {tags.map((tag) => (
                                        <span key={tag} className="flex items-center gap-1 text-xs text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full">
                                            <Tag size={10} /> {tag.trim()}
                                        </span>
                                    ))}
                                </div>
                                <p className="text-xs text-slate-400">
                                    {article.author} · Cập nhật {new Date(article.updatedAt).toLocaleDateString('vi-VN')}
                                </p>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
