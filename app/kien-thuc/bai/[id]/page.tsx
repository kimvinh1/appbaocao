import { createProcedureShare, getArticleById, getContentFeedback, getProcedureSharesByArticle } from '@/app/actions-kb';
import { getCurrentUser } from '@/lib/auth';
import { ArrowLeft, Calendar, Download, Heart, Share2, Tag, ThumbsUp, User } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getModuleTheme, normalizeModuleKey } from '@/lib/module-theme';
import { FeedbackButtons } from '@/app/components/ui/feedback-buttons';

export default async function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const article = await getArticleById(id);
    if (!article) notFound();

    const normalizedModule = normalizeModuleKey(article.module);
    const [currentUser, shares, feedback] = await Promise.all([
        getCurrentUser(),
        getProcedureSharesByArticle(article.id),
        getContentFeedback('article', id),
    ]);
    const cfg = getModuleTheme(normalizedModule);
    const tags = article.tags ? article.tags.split(',').filter(Boolean) : [];

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <div>
                <Link
                    href={`/kien-thuc/${normalizedModule}`}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-white mb-3 transition w-fit"
                >
                    <ArrowLeft size={12} /> {cfg.label}
                </Link>
                <h1 className="text-3xl font-bold text-white leading-snug">{article.title}</h1>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><User size={12} /> {article.author}</span>
                    <span className="flex items-center gap-1">
                        <Calendar size={12} /> {new Date(article.updatedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>
                    <span className={`font-semibold ${cfg.textClass}`}>{cfg.label}</span>
                    <span className="rounded-full bg-slate-800/80 px-2 py-0.5 uppercase tracking-wide text-slate-300">
                        {article.category === 'quy-trinh' ? 'Quy trình / SOP' : article.category === 'huong-dan' ? 'Hướng dẫn sử dụng' : article.category === 'troubleshooting' ? 'Xử lý sự cố' : 'FAQ'}
                    </span>
                </div>
                {tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {tags.map((tag) => (
                            <span key={tag} className="flex items-center gap-1 text-xs text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
                                <Tag size={10} /> {tag.trim()}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className="glass-panel rounded-2xl p-6">
                <div className="space-y-4">
                    {article.content.split('\n').map((line, i) => (
                        line.trim() === '' ? <br key={i} /> : <p key={i} className="text-slate-200 leading-relaxed">{line}</p>
                    ))}
                </div>

                {article.images && article.images.length > 0 && (
                    <div className="mt-6">
                        <p className="mb-3 text-sm font-medium text-slate-300">Ảnh đính kèm</p>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {article.images.map((img) => (
                                <a key={img.id} href={img.imageUrl} target="_blank" rel="noopener noreferrer">
                                    <img
                                        src={img.imageUrl}
                                        alt="Ảnh đính kèm"
                                        className="h-40 w-full rounded-xl object-cover border border-slate-700 hover:opacity-90 transition"
                                    />
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {article.attachmentUrl ? (
                    <div className="mt-6 rounded-xl border border-slate-700/60 bg-slate-950/40 p-4">
                        <p className="text-sm font-medium text-white">Tài liệu đính kèm</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            <a
                                href={article.attachmentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-lg bg-cyan-500/10 px-3 py-2 text-sm text-cyan-300 ring-1 ring-cyan-400/30 hover:bg-cyan-500/20"
                            >
                                Mở file đính kèm
                            </a>
                            <a
                                href={`/api/articles/${article.id}/pdf`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm text-white ring-1 ring-slate-700 transition hover:bg-white/10"
                            >
                                <Download size={15} /> Xuất PDF
                            </a>
                        </div>
                    </div>
                ) : (
                    <div className="mt-6">
                        <a
                            href={`/api/articles/${article.id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm text-white ring-1 ring-slate-700 transition hover:bg-white/10"
                        >
                            <Download size={15} /> Xuất PDF
                        </a>
                    </div>
                )}
            </div>

            {/* ── Đánh giá nội dung ── */}
            <div className="glass-panel rounded-2xl px-6 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-slate-400">Tài liệu này có hữu ích không?</p>
                    <FeedbackButtons
                        contentType="article"
                        contentId={article.id}
                        likeCount={feedback.likeCount}
                        dislikeCount={feedback.dislikeCount}
                        userReaction={feedback.userReaction}
                        showComment={true}
                        size="md"
                    />
                </div>
            </div>

            {currentUser ? (
                <section className="glass-panel rounded-2xl p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                                <Share2 size={18} className={cfg.textClass} /> Chia sẻ quy trình cho khách hàng
                            </h2>
                            <p className="mt-1 text-sm text-slate-400">
                                Tạo link riêng cho khách hàng. Khi khách hàng hoàn tất và phản hồi, hệ thống sẽ cộng thống kê hiệu quả.
                            </p>
                        </div>
                    </div>

                    <form action={createProcedureShare} className="mt-5 grid gap-4 md:grid-cols-3">
                        <input type="hidden" name="articleId" value={article.id} />
                        <label className="text-sm text-slate-300">
                            Tên khách hàng
                            <input
                                name="customerName"
                                required
                                className={`mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition ${cfg.focusBorderClass}`}
                            />
                        </label>
                        <label className="text-sm text-slate-300">
                            Email khách hàng
                            <input
                                name="customerEmail"
                                type="email"
                                className={`mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition ${cfg.focusBorderClass}`}
                            />
                        </label>
                        <div className="flex items-end">
                            <button
                                type="submit"
                                className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium ring-1 transition ${cfg.buttonClass}`}
                            >
                                <Share2 size={16} /> Tạo link chia sẻ
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 space-y-3">
                        {shares.length === 0 ? (
                            <p className="text-sm text-slate-400">Chưa có lượt chia sẻ nào cho tài liệu này.</p>
                        ) : (
                            shares.map((share) => (
                                <div key={share.id} className="rounded-2xl border border-slate-700/60 bg-slate-950/40 p-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <p className="font-medium text-white">{share.customerName}</p>
                                            <p className="mt-1 text-xs text-slate-400">
                                                {share.customerEmail || 'Không có email'} · Chia sẻ bởi {share.sharedBy?.fullName ?? article.author}
                                            </p>
                                            <a
                                                href={`/chia-se/${share.token}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-2 inline-flex text-sm text-cyan-300 hover:underline"
                                            >
                                                Mở link chia sẻ
                                            </a>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                                            <span className="rounded-full bg-slate-800 px-2 py-1">
                                                {share.status === 'completed' ? 'Đã hoàn tất' : 'Chưa hoàn tất'}
                                            </span>
                                            <span className="inline-flex items-center gap-1"><ThumbsUp size={12} /> {share.likeCount}</span>
                                            <span className="inline-flex items-center gap-1"><Heart size={12} /> {share.heartCount}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            ) : null}

            <div className="flex justify-end">
                <Link
                    href={`/kien-thuc/sua/${article.id}`}
                    className={`rounded-xl px-4 py-2 text-sm ring-1 transition ${cfg.buttonClass}`}
                >
                    Chỉnh Sửa Bài
                </Link>
            </div>
        </div>
    );
}
