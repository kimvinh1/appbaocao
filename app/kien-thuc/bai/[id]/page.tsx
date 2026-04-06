import {
    createProcedureShare,
    deleteProcedureShare,
    getArticleById,
    getArticleDislikeComments,
    getContentFeedback,
    getProcedureSharesByArticle,
    getRelatedArticles,
} from '@/app/actions-kb';
import { getCurrentUser } from '@/lib/auth';
import {
    ArrowLeft, Calendar, Clock, Download, Eye, Heart,
    MessageSquare, Share2, Tag, ThumbsDown, ThumbsUp, Trash2, User,
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getModuleTheme, normalizeModuleKey } from '@/lib/module-theme';
import { FeedbackButtons } from '@/app/components/ui/feedback-buttons';
import { ViewTracker } from '@/app/components/ui/view-tracker';
import { CopyLinkButton } from '@/app/components/ui/copy-link-button';
import { ArticleToc } from '@/app/components/ui/article-toc';
import { extractTocAndAddIds } from '@/lib/html-toc';

const CATEGORY_LABEL: Record<string, string> = {
    'quy-trinh': 'Quy trình / SOP',
    'huong-dan': 'Hướng dẫn sử dụng',
    'troubleshooting': 'Xử lý sự cố',
    'faq': 'FAQ',
};

const SHARE_STATUS_META: Record<string, string> = {
    pending: 'bg-slate-800 text-slate-300',
    completed: 'bg-emerald-500/15 text-emerald-300',
    revoked: 'bg-red-500/15 text-red-300',
};

const SHARE_STATUS_LABEL: Record<string, string> = {
    pending: 'Chưa hoàn tất',
    completed: 'Đã hoàn tất',
    revoked: 'Đã thu hồi',
};

const SHARE_EVENT_LABEL: Record<string, string> = {
    completed: 'Xác nhận hoàn tất',
    like: 'Đánh giá hữu ích',
    heart: 'Đánh giá rất hiệu quả',
};

function formatDateTime(value: Date | string) {
    return new Date(value).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default async function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const article = await getArticleById(id);
    if (!article) notFound();

    const normalizedModule = normalizeModuleKey(article.module);

    const [currentUser, shares, feedback, dislikeComments, relatedArticles] = await Promise.all([
        getCurrentUser(),
        getProcedureSharesByArticle(article.id),
        getContentFeedback('article', id),
        getCurrentUser().then((u) =>
            u && (u.fullName === article.author || u.role === 'admin')
                ? getArticleDislikeComments(article.id)
                : Promise.resolve([])
        ),
        getRelatedArticles(article.module, article.category, article.id, 3),
    ]);

    const cfg = getModuleTheme(normalizedModule);
    const tags = article.tags ? article.tags.split(',').filter(Boolean) : [];

    // Parse TOC từ rich-text content
    const isHtml = /^[\s]*<[a-zA-Z]/.test(article.content);
    const { enrichedHtml, headings } = isHtml
        ? extractTocAndAddIds(article.content)
        : { enrichedHtml: article.content, headings: [] };

    const isAuthorOrAdmin = currentUser && (currentUser.fullName === article.author || currentUser.role === 'admin');

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            {/* Tăng view count khi user thật sự mở trang */}
            <ViewTracker articleId={article.id} />

            {/* ── TOC sidebar (desktop) + collapsible (mobile) ── */}
            {headings.length >= 2 && <ArticleToc headings={headings} />}

            {/* ── Header ── */}
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
                        <Calendar size={12} />
                        {new Date(article.updatedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        <Eye size={12} /> {(article as any).viewCount ?? 0} lượt xem
                    </span>
                    <span className={`font-semibold ${cfg.textClass}`}>{cfg.label}</span>
                    <span className="rounded-full bg-slate-800/80 px-2 py-0.5 uppercase tracking-wide text-slate-300">
                        {CATEGORY_LABEL[article.category] ?? article.category}
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

            {/* ── Nội dung bài ── */}
            <div className="glass-panel rounded-2xl p-6">
                {isHtml ? (
                    <div
                        className="rich-content text-slate-200"
                        dangerouslySetInnerHTML={{ __html: enrichedHtml }}
                    />
                ) : (
                    <div className="space-y-4">
                        {article.content.split('\n').map((line, i) =>
                            line.trim() === '' ? <br key={i} /> : <p key={i} className="text-slate-200 leading-relaxed">{line}</p>
                        )}
                    </div>
                )}

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

            {/* ── Feedback comments cho tác giả / admin ── */}
            {isAuthorOrAdmin && dislikeComments.length > 0 && (
                <div className="glass-panel rounded-2xl px-6 py-4 space-y-3">
                    <p className="flex items-center gap-2 text-sm font-medium text-red-300">
                        <ThumbsDown size={14} /> Góp ý cần cải thiện ({dislikeComments.length})
                        <span className="text-xs text-slate-500 font-normal">(chỉ tác giả thấy)</span>
                    </p>
                    <div className="space-y-2">
                        {dislikeComments.map((c, i) => (
                            <div key={i} className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
                                <p className="text-sm text-slate-300 italic">&ldquo;{c.comment}&rdquo;</p>
                                <p className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
                                    <Clock size={10} />
                                    {new Date(c.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Chia sẻ quy trình ── */}
            {currentUser && (
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
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium text-white">{share.customerName}</p>
                                            <p className="mt-1 text-xs text-slate-400">
                                                {share.customerEmail || 'Không có email'} · Chia sẻ bởi {share.sharedBy?.fullName ?? article.author}
                                            </p>
                                            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
                                                <Clock size={11} />
                                                Tạo lúc {formatDateTime(share.sharedAt)}
                                                {share.revokedAt ? ` · Thu hồi lúc ${formatDateTime(share.revokedAt)}` : ''}
                                            </p>
                                            {share.status !== 'revoked' ? (
                                                <div className="mt-2 flex items-center gap-3">
                                                    <a
                                                        href={`/chia-se/${share.token}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-cyan-300 hover:underline"
                                                    >
                                                        Mở link chia sẻ
                                                    </a>
                                                    <CopyLinkButton url={`/chia-se/${share.token}`} />
                                                </div>
                                            ) : (
                                                <p className="mt-2 text-sm text-slate-500">
                                                    Link này đã bị thu hồi và không còn truy cập công khai.
                                                </p>
                                            )}
                                            {'customerComment' in share && share.customerComment && (
                                                <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-400 italic">
                                                    <MessageSquare size={12} className="mt-0.5 shrink-0" />
                                                    &ldquo;{share.customerComment}&rdquo;
                                                </p>
                                            )}
                                            {share.feedbackEvents.length > 0 && (
                                                <div className="mt-3 space-y-2 border-t border-slate-800/80 pt-3">
                                                    {share.feedbackEvents.map((event) => (
                                                        <div key={event.id} className="rounded-xl border border-slate-800/80 bg-slate-950/50 px-3 py-2">
                                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                                <p className="text-xs font-medium text-slate-200">
                                                                    {SHARE_EVENT_LABEL[event.eventType] ?? event.eventType}
                                                                </p>
                                                                <p className="text-[11px] text-slate-500">{formatDateTime(event.createdAt)}</p>
                                                            </div>
                                                            {event.comment ? (
                                                                <p className="mt-1 text-xs italic text-slate-400">&ldquo;{event.comment}&rdquo;</p>
                                                            ) : null}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                                            <span className={`rounded-full px-2 py-1 ${SHARE_STATUS_META[share.status] ?? 'bg-slate-800 text-slate-300'}`}>
                                                {SHARE_STATUS_LABEL[share.status] ?? share.status}
                                            </span>
                                            <span className="inline-flex items-center gap-1"><ThumbsUp size={12} /> {share.likeCount}</span>
                                            <span className="inline-flex items-center gap-1"><Heart size={12} /> {share.heartCount}</span>
                                            {share.status !== 'revoked' ? (
                                                <form action={deleteProcedureShare}>
                                                    <input type="hidden" name="shareId" value={share.id} />
                                                    <input type="hidden" name="articleId" value={article.id} />
                                                    <button
                                                        type="submit"
                                                        title="Thu hồi link chia sẻ"
                                                        className="rounded-lg bg-red-500/10 p-1.5 text-red-400 ring-1 ring-red-400/20 hover:bg-red-500/20 transition"
                                                        onClick={(e) => {
                                                            if (!confirm('Thu hồi link chia sẻ này? Khách hàng sẽ không truy cập được nữa.')) e.preventDefault();
                                                        }}
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </form>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            )}

            {/* ── Bài liên quan ── */}
            {relatedArticles.length > 0 && (
                <section className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Bài liên quan</h3>
                    <div className="grid gap-3 sm:grid-cols-3">
                        {relatedArticles.map((rel) => {
                            const relTheme = getModuleTheme(normalizeModuleKey(rel.module));
                            return (
                                <Link
                                    key={rel.id}
                                    href={`/kien-thuc/bai/${rel.id}`}
                                    className="glass-panel rounded-xl p-4 hover:bg-slate-800/60 transition group block"
                                >
                                    <p className={`text-[10px] font-medium uppercase tracking-wide mb-1 ${relTheme.textClass}`}>
                                        {CATEGORY_LABEL[rel.category] ?? rel.category}
                                    </p>
                                    <p className="text-sm font-medium text-white group-hover:text-cyan-300 transition line-clamp-2 leading-snug">
                                        {rel.title}
                                    </p>
                                    <p className="mt-2 text-xs text-slate-500">
                                        {rel.author} · {new Date(rel.updatedAt).toLocaleDateString('vi-VN')}
                                    </p>
                                </Link>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* ── Actions ── */}
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
