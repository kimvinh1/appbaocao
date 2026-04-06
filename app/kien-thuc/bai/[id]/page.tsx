import {
    createProcedureShare,
    getArticleById,
    getArticleDislikeComments,
    getContentFeedback,
    getProcedureSharesByArticle,
    getRelatedArticles,
} from '@/app/actions-kb';
import { getCurrentUser } from '@/lib/auth';
import {
    ArrowLeft, Calendar, Clock, Download, Eye, Heart,
    MessageSquare, Share2, Tag, ThumbsDown, ThumbsUp, User,
    BarChart3, CheckCheck, Users,
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getModuleTheme, normalizeModuleKey } from '@/lib/module-theme';
import { FeedbackButtons } from '@/app/components/ui/feedback-buttons';
import { ViewTracker } from '@/app/components/ui/view-tracker';
import { CopyLinkButton } from '@/app/components/ui/copy-link-button';
import { ArticleToc } from '@/app/components/ui/article-toc';
import { ToggleShareButton } from '@/app/components/ui/toggle-share-button';
import { extractTocAndAddIds } from '@/lib/html-toc';
import { getArticleCategoryLabel } from '@/lib/knowledge-center';

const SHARE_STATUS_META: Record<string, string> = {
    pending: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
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
                    className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-600 hover:text-gray-900 dark:text-white mb-3 transition w-fit"
                >
                    <ArrowLeft size={12} /> {cfg.label}
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white leading-snug">{article.title}</h1>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-600">
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
                    <span className="rounded-full bg-slate-100/80 dark:bg-slate-800/80 px-2 py-0.5 uppercase tracking-wide text-slate-700 dark:text-slate-300">
                        {getArticleCategoryLabel(article.category)}
                    </span>
                </div>
                {tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {tags.map((tag) => (
                            <span key={tag} className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-600 bg-slate-100/80 dark:bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-300 dark:border-slate-700">
                                <Tag size={10} /> {tag.trim()}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Nội dung bài ── */}
            <div className="glass-panel rounded-2xl p-5 sm:p-6">
                {isHtml ? (
                    <div className="document-paper">
                        <div
                            className="rich-content"
                            dangerouslySetInnerHTML={{ __html: enrichedHtml }}
                        />
                    </div>
                ) : (
                    <div className="document-paper space-y-4">
                        {article.content.split('\n').map((line, i) =>
                            line.trim() === '' ? <br key={i} /> : <p key={i} className="leading-relaxed">{line}</p>
                        )}
                    </div>
                )}

                {article.images && article.images.length > 0 && (
                    <div className="mt-6">
                        <p className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">Ảnh đính kèm</p>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {article.images.map((img) => (
                                <a key={img.id} href={img.imageUrl} target="_blank" rel="noopener noreferrer">
                                    <img
                                        src={img.imageUrl}
                                        alt="Ảnh đính kèm"
                                        className="h-40 w-full rounded-xl object-cover border border-slate-300 dark:border-slate-700 hover:opacity-90 transition"
                                    />
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {article.attachmentUrl ? (
                    <div className="mt-6 rounded-xl border border-slate-300/60 dark:border-slate-700/60 bg-slate-50/40 dark:bg-slate-950/40 p-4">
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
                                className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm text-gray-900 dark:text-white ring-1 ring-slate-200 dark:ring-slate-700 transition hover:bg-white/10"
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
                            className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm text-gray-900 dark:text-white ring-1 ring-slate-200 dark:ring-slate-700 transition hover:bg-white/10"
                        >
                            <Download size={15} /> Xuất PDF
                        </a>
                    </div>
                )}
            </div>

            {/* ── Đánh giá nội dung ── */}
            <div className="glass-panel rounded-2xl px-6 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-slate-500 dark:text-slate-600">Tài liệu này có hữu ích không?</p>
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
                        <span className="text-xs text-slate-600 dark:text-slate-600 font-normal">(chỉ tác giả thấy)</span>
                    </p>
                    <div className="space-y-2">
                        {dislikeComments.map((c, i) => (
                            <div key={i} className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
                                <p className="text-sm text-slate-700 dark:text-slate-300 italic">&ldquo;{c.comment}&rdquo;</p>
                                <p className="mt-1 flex items-center gap-1 text-[12px] text-slate-600 dark:text-slate-600">
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
                <section className="glass-panel rounded-2xl p-6 space-y-5">
                    {/* Header + Form */}
                    <div>
                        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                            <Share2 size={18} className={cfg.textClass} /> Chia sẻ quy trình cho khách hàng
                        </h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-600">
                            Tạo link riêng cho từng khách hàng. Theo dõi tương tác và bật/tắt link bất kỳ lúc nào mà không mất lịch sử.
                        </p>
                    </div>

                    <form action={createProcedureShare} className="grid gap-3 md:grid-cols-3">
                        <input type="hidden" name="articleId" value={article.id} />
                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-600 mb-1">Tên khách hàng *</label>
                            <input
                                name="customerName"
                                required
                                placeholder="Nguyễn Văn A"
                                className={`w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-slate-400 outline-none transition ${cfg.focusBorderClass}`}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-600 mb-1">Số điện thoại</label>
                            <input
                                name="customerPhone"
                                type="tel"
                                placeholder="0909..."
                                className={`w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-slate-400 outline-none transition ${cfg.focusBorderClass}`}
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                type="submit"
                                className={`w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium ring-1 transition ${cfg.buttonClass}`}
                            >
                                <Share2 size={15} /> Tạo link chia sẻ
                            </button>
                        </div>
                    </form>

                    {/* Stats tổng hợp */}
                    {shares.length > 0 && (() => {
                        const totalLikes = shares.reduce((s, sh) => s + sh.likeCount, 0);
                        const totalHearts = shares.reduce((s, sh) => s + sh.heartCount, 0);
                        const totalCompleted = shares.filter(sh => sh.status === 'completed').length;
                        const totalComments = shares.filter(sh => sh.customerComment).length;
                        const totalActive = shares.filter(sh => sh.status !== 'revoked').length;
                        return (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 p-3">
                                    <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-xs font-medium"><Users size={12} /> Tổng lượt share</div>
                                    <p className="mt-1.5 text-2xl font-bold text-blue-700 dark:text-blue-300">{shares.length}</p>
                                    <p className="text-xs text-blue-500 dark:text-blue-400">{totalActive} đang hoạt động</p>
                                </div>
                                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 p-3">
                                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-medium"><CheckCheck size={12} /> Hoàn tất</div>
                                    <p className="mt-1.5 text-2xl font-bold text-emerald-700 dark:text-emerald-300">{totalCompleted}</p>
                                    <p className="text-xs text-emerald-500">{shares.length > 0 ? Math.round(totalCompleted/shares.length*100) : 0}% tỉ lệ</p>
                                </div>
                                <div className="rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 p-3">
                                    <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 text-xs font-medium"><ThumbsUp size={12} /> Lượt thích</div>
                                    <p className="mt-1.5 text-2xl font-bold text-orange-700 dark:text-orange-300">{totalLikes}</p>
                                    <p className="text-xs text-pink-500 dark:text-pink-400">+ {totalHearts} yêu thích</p>
                                </div>
                                <div className="rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 p-3">
                                    <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 text-xs font-medium"><MessageSquare size={12} /> Bình luận</div>
                                    <p className="mt-1.5 text-2xl font-bold text-purple-700 dark:text-purple-300">{totalComments}</p>
                                    <p className="text-xs text-purple-500">phản hồi trực tiếp</p>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Danh sách */}
                    <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">{shares.length > 0 ? `${shares.length} lượt chia sẻ` : 'Chưa có lượt chia sẻ nào'}</p>
                        {shares.map((share) => (
                            <div
                                key={share.id}
                                className={`rounded-2xl border p-4 transition-colors ${
                                    share.status === 'revoked'
                                        ? 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30 opacity-70'
                                        : 'border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900/50'
                                }`}
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    {/* Left info */}
                                    <div className="min-w-0 flex-1 space-y-1.5">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="font-semibold text-gray-900 dark:text-white">{share.customerName}</p>
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SHARE_STATUS_META[share.status] ?? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                                                {SHARE_STATUS_LABEL[share.status] ?? share.status}
                                            </span>
                                        </div>

                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            {share.customerPhone && <span className="font-semibold text-slate-800 dark:text-slate-200">{share.customerPhone} · </span>}
                                            Chia sẻ bởi {share.sharedBy?.fullName ?? article.author}
                                        </p>

                                        <p className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 font-medium">
                                            <Clock size={12} />
                                            {formatDateTime(share.sharedAt)}
                                            {share.revokedAt && <span className="text-red-500"> · Tắt {formatDateTime(share.revokedAt)}</span>}
                                        </p>

                                        {/* Link actions */}
                                        {share.status !== 'revoked' && (
                                            <div className="flex items-center gap-2 pt-1">
                                                <a
                                                    href={`/chia-se/${share.token}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm font-semibold text-cyan-700 dark:text-cyan-400 hover:underline"
                                                >
                                                    Mở link chia sẻ ↗
                                                </a>
                                                <CopyLinkButton url={`/chia-se/${share.token}`} />
                                            </div>
                                        )}

                                        {/* Comment */}
                                        {'customerComment' in share && share.customerComment && (
                                            <div className="flex items-start gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 px-3 py-2 mt-1">
                                                <MessageSquare size={11} className="mt-0.5 shrink-0 text-slate-600" />
                                                <p className="text-xs text-slate-600 dark:text-slate-600 italic">&ldquo;{share.customerComment}&rdquo;</p>
                                            </div>
                                        )}

                                        {/* Feedback events */}
                                        {share.feedbackEvents.length > 0 && (
                                            <div className="mt-2 space-y-1 border-t border-slate-100 dark:border-slate-800 pt-2">
                                                {share.feedbackEvents.map((event) => (
                                                    <div key={event.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 px-3 py-1.5">
                                                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                                            {SHARE_EVENT_LABEL[event.eventType] ?? event.eventType}
                                                            {event.comment && <span className="ml-1 font-normal text-slate-600 italic">&ldquo;{event.comment}&rdquo;</span>}
                                                        </p>
                                                        <p className="text-xs text-slate-600 shrink-0">{formatDateTime(event.createdAt)}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Right actions */}
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-600">
                                            <span className="inline-flex items-center gap-1 font-medium"><ThumbsUp size={12} className="text-blue-500" /> {share.likeCount}</span>
                                            <span className="inline-flex items-center gap-1 font-medium"><Heart size={12} className="text-pink-500" /> {share.heartCount}</span>
                                        </div>
                                        <ToggleShareButton
                                            shareId={share.id}
                                            articleId={article.id}
                                            isRevoked={share.status === 'revoked'}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ── Bài liên quan ── */}
            {relatedArticles.length > 0 && (
                <section className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-600 uppercase tracking-wider">Bài liên quan</h3>
                    <div className="grid gap-3 sm:grid-cols-3">
                        {relatedArticles.map((rel) => {
                            const relTheme = getModuleTheme(normalizeModuleKey(rel.module));
                            return (
                                <Link
                                    key={rel.id}
                                    href={`/kien-thuc/bai/${rel.id}`}
                                    className="glass-panel rounded-xl p-4 hover:bg-slate-800/60 transition group block"
                                >
                                    <p className={`text-[12px] font-medium uppercase tracking-wide mb-1 ${relTheme.textClass}`}>
                                        {getArticleCategoryLabel(rel.category)}
                                    </p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-cyan-300 transition line-clamp-2 leading-snug">
                                        {rel.title}
                                    </p>
                                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-600">
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
