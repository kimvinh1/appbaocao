import { getArticles } from '@/app/actions-kb';
import { BookOpen, FileText, Microscope, Dna, FlaskConical, Plus, Tag } from 'lucide-react';
import Link from 'next/link';
import { MODULE_THEMES, normalizeModuleKey } from '@/lib/module-theme';
import { getArticleCategoryLabel } from '@/lib/knowledge-center';

const MODULE_CONFIG = {
    illumina: { ...MODULE_THEMES.illumina, color: MODULE_THEMES.illumina.textClass, bg: MODULE_THEMES.illumina.badgeClass, icon: Dna },
    'vi-sinh': { ...MODULE_THEMES['vi-sinh'], color: MODULE_THEMES['vi-sinh'].textClass, bg: MODULE_THEMES['vi-sinh'].badgeClass, icon: Microscope },
    cepheid: { ...MODULE_THEMES.cepheid, color: MODULE_THEMES.cepheid.textClass, bg: MODULE_THEMES.cepheid.badgeClass, icon: FlaskConical },
} as const;

export default async function KienThucPage() {
    const articles = await getArticles();

    const grouped = articles.reduce<Record<string, typeof articles>>((acc, article) => {
        const normalizedModule = normalizeModuleKey(article.module);
        if (!acc[normalizedModule]) acc[normalizedModule] = [];
        acc[normalizedModule].push(article);
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                        <BookOpen size={22} className="text-cyan-300" /> Thư Viện Tài Liệu
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">Tất cả quy trình, case xử lý sự cố và tài liệu dùng để chia sẻ cho khách hàng.</p>
                </div>
                <Link
                    href="/kien-thuc/moi"
                    className="flex items-center gap-2 rounded-xl bg-cyan-500/20 px-4 py-2 text-sm font-medium text-cyan-300 ring-1 ring-cyan-400/40 transition hover:bg-cyan-500/30"
                >
                    <Plus size={16} /> Thêm Tài Liệu
                </Link>
            </div>

            {/* Quick links by module */}
            <div className="grid gap-4 sm:grid-cols-3">
                {(Object.entries(MODULE_CONFIG) as [string, typeof MODULE_CONFIG[keyof typeof MODULE_CONFIG]][]).map(([key, cfg]) => {
                    const count = grouped[key]?.length ?? 0;
                    const Icon = cfg.icon;
                    return (
                        <Link
                            key={key}
                            href={`/kien-thuc/${key}`}
                            className={`glass-panel rounded-2xl p-4 border transition hover:scale-[1.02] ${cfg.bg}`}
                        >
                            <div className="flex items-center gap-3">
                                <Icon size={20} className={cfg.color} />
                                <p className={`font-semibold ${cfg.color}`}>{cfg.label}</p>
                            </div>
                            <p className="mt-3 text-3xl font-semibold text-white">{count}</p>
                            <p className="text-xs text-slate-400 mt-1">tài liệu</p>
                        </Link>
                    );
                })}
            </div>

            {/* All articles */}
            {articles.length === 0 ? (
                <div className="glass-panel rounded-2xl px-8 py-16 text-center">
                    <FileText size={40} className="mx-auto mb-4 text-slate-600" />
                    <p className="text-slate-400">Chưa có tài liệu nào. Nhấn &quot;Thêm Tài Liệu&quot; để bắt đầu.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {articles.map((article) => {
                        const cfg = MODULE_CONFIG[(article.module === 'sinh-hoc-phan-tu' ? 'cepheid' : article.module) as keyof typeof MODULE_CONFIG];
                        const tags = article.tags ? article.tags.split(',').filter(Boolean) : [];
                        return (
                            <Link
                                key={article.id}
                                href={`/kien-thuc/bai/${article.id}`}
                                className="glass-panel rounded-xl p-4 flex items-start gap-4 transition hover:bg-slate-800/50 block"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        {cfg && (
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
                                                {cfg.label}
                                            </span>
                                        )}
                                        {tags.map((tag) => (
                                            <span key={tag} className="flex items-center gap-1 text-xs text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full">
                                                <Tag size={10} /> {tag.trim()}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="font-semibold text-white truncate">{article.title}</p>
                                    <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">
                                        {getArticleCategoryLabel(article.category)}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        {article.author} · {new Date(article.updatedAt).toLocaleDateString('vi-VN')}
                                    </p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
