import { getArticles } from '@/app/actions-kb';
import { ArrowLeft, FileText, Filter, Plus, Tag } from 'lucide-react';
import Link from 'next/link';
import { normalizeModuleKey } from '@/lib/module-theme';
import { SharedErrorCodePage } from '@/app/components/kb/error-code-page';
import {
    getArticleCategoryLabel,
    getKnowledgeModuleConfig,
    isArticleCategoryMatch,
    normalizeArticleCategory,
} from '@/lib/knowledge-center';

export default async function ModuleKienThucPage({
    params,
    searchParams,
}: {
    params: Promise<{ module: string }>;
    searchParams: Promise<{ type?: string | string[] }>;
}) {
    const { module: rawModule } = await params;
    const resolvedSearchParams = await searchParams;
    const moduleSlug = normalizeModuleKey(rawModule);
    const articles = await getArticles(moduleSlug);
    const cfg = getKnowledgeModuleConfig(moduleSlug);
    const typeParam = Array.isArray(resolvedSearchParams.type) ? resolvedSearchParams.type[0] : resolvedSearchParams.type;
    const activeType = typeParam === 'case' || typeParam === 'quy-trinh' ? typeParam : 'all';
    const filteredArticles = articles.filter((article) => isArticleCategoryMatch(article.category, activeType));
    const articleCounts = articles.reduce(
        (acc, article) => {
            acc[normalizeArticleCategory(article.category)] += 1;
            return acc;
        },
        { 'quy-trinh': 0, case: 0 } as Record<'quy-trinh' | 'case', number>,
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <Link href="/kien-thuc" className="flex items-center gap-1 text-xs text-slate-400 hover:text-white mb-2 transition">
                        <ArrowLeft size={12} /> Thư Viện Tài Liệu
                    </Link>
                    <h2 className={`text-2xl font-semibold ${cfg.textClass}`}>{cfg.title}</h2>
                    <p className="mt-1 text-sm text-slate-400">{cfg.description}</p>
                </div>
                <Link
                    href={`/kien-thuc/moi?module=${moduleSlug}`}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium ring-1 transition ${cfg.buttonClass}`}
                >
                    <Plus size={16} /> Thêm nội dung
                </Link>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
                <div className="glass-panel rounded-2xl p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Tổng nội dung</p>
                    <p className="mt-2 text-3xl font-semibold text-white">{articles.length}</p>
                </div>
                <div className="glass-panel rounded-2xl p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Quy trình / hướng dẫn</p>
                    <p className="mt-2 text-3xl font-semibold text-white">{articleCounts['quy-trinh']}</p>
                </div>
                <div className="glass-panel rounded-2xl p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Case / xử lý sự cố</p>
                    <p className="mt-2 text-3xl font-semibold text-white">{articleCounts.case}</p>
                </div>
            </div>

            <section className="space-y-4" id="tai-lieu">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h3 className="text-lg font-semibold text-white">Kho nội dung kỹ thuật</h3>
                        <p className="mt-1 text-sm text-slate-400">Soạn SOP, hướng dẫn và case thực tế để chia sẻ theo từng khách hàng.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/70 px-3 py-1.5 text-xs text-slate-400 ring-1 ring-slate-800">
                            <Filter size={12} /> Lọc loại nội dung
                        </span>
                        {[
                            { value: 'all', label: 'Tất cả' },
                            { value: 'quy-trinh', label: 'Quy trình' },
                            { value: 'case', label: 'Case' },
                        ].map((item) => {
                            const href = item.value === 'all'
                                ? `/kien-thuc/${moduleSlug}`
                                : `/kien-thuc/${moduleSlug}?type=${item.value}`;
                            const active = activeType === item.value;
                            return (
                                <Link
                                    key={item.value}
                                    href={href}
                                    className={`rounded-full px-3 py-1.5 text-xs ring-1 transition ${
                                        active
                                            ? `${cfg.buttonClass}`
                                            : 'bg-slate-900/70 text-slate-300 ring-slate-800 hover:bg-slate-800'
                                    }`}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {filteredArticles.length === 0 ? (
                    <div className="glass-panel rounded-2xl px-8 py-16 text-center">
                        <FileText size={40} className="mx-auto mb-4 text-slate-600" />
                        <p className="text-slate-400">Chưa có nội dung nào đúng bộ lọc này.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredArticles.map((article) => {
                            const tags = article.tags ? article.tags.split(',').filter(Boolean) : [];
                            return (
                                <Link
                                    key={article.id}
                                    href={`/kien-thuc/bai/${article.id}`}
                                    className="glass-panel rounded-xl p-4 flex flex-col gap-2 transition hover:bg-slate-800/50 block"
                                >
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-semibold text-white">{article.title}</p>
                                        <span className={`rounded-full px-2 py-0.5 text-[11px] ring-1 ${cfg.badgeClass} ${cfg.textClass}`}>
                                            {getArticleCategoryLabel(article.category)}
                                        </span>
                                    </div>
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
            </section>

            <section id="ma-loi" className="pt-2">
                <SharedErrorCodePage
                    module={moduleSlug}
                    title={`Mã lỗi & hướng xử lý – ${cfg.label}`}
                    description={cfg.errorDescription}
                    instruments={[...cfg.instruments]}
                    colorClass={cfg.textClass}
                    buttonBgClass={cfg.buttonClass}
                    focusBorderClass={cfg.focusBorderClass}
                />
            </section>
        </div>
    );
}
