'use client';

import { useTransition, useState, useOptimistic } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, X } from 'lucide-react';
import { submitContentFeedback } from '@/app/actions-kb';

type FeedbackButtonsProps = {
  contentType: 'article' | 'case' | 'error-code';
  contentId: string;
  likeCount: number;
  dislikeCount: number;
  userReaction: 'like' | 'dislike' | null;
  showComment?: boolean;
  size?: 'sm' | 'md';
};

type OptimisticState = {
  likeCount: number;
  dislikeCount: number;
  userReaction: 'like' | 'dislike' | null;
};

export function FeedbackButtons({
  contentType,
  contentId,
  likeCount,
  dislikeCount,
  userReaction,
  showComment = false,
  size = 'md',
}: FeedbackButtonsProps) {
  const [isPending, startTransition] = useTransition();
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [comment, setComment] = useState('');
  const [pendingReaction, setPendingReaction] = useState<'like' | 'dislike' | null>(null);

  const [optimistic, setOptimistic] = useOptimistic<OptimisticState, 'like' | 'dislike'>(
    { likeCount, dislikeCount, userReaction },
    (state, newReaction) => {
      // Toggle off
      if (state.userReaction === newReaction) {
        return {
          likeCount: newReaction === 'like' ? state.likeCount - 1 : state.likeCount,
          dislikeCount: newReaction === 'dislike' ? state.dislikeCount - 1 : state.dislikeCount,
          userReaction: null,
        };
      }
      // Switch
      const wasLike = state.userReaction === 'like';
      const wasDislike = state.userReaction === 'dislike';
      return {
        likeCount:
          newReaction === 'like'
            ? state.likeCount + 1
            : wasLike
            ? state.likeCount - 1
            : state.likeCount,
        dislikeCount:
          newReaction === 'dislike'
            ? state.dislikeCount + 1
            : wasDislike
            ? state.dislikeCount - 1
            : state.dislikeCount,
        userReaction: newReaction,
      };
    },
  );

  const handleReaction = (reaction: 'like' | 'dislike') => {
    if (showComment && reaction === 'dislike' && optimistic.userReaction !== 'dislike') {
      // Mở comment box khi dislike lần đầu
      setPendingReaction(reaction);
      setShowCommentBox(true);
      return;
    }
    submitReaction(reaction, '');
  };

  const submitReaction = (reaction: 'like' | 'dislike', commentText: string) => {
    const formData = new FormData();
    formData.set('contentType', contentType);
    formData.set('contentId', contentId);
    formData.set('reaction', reaction);
    if (commentText) formData.set('comment', commentText);

    startTransition(async () => {
      setOptimistic(reaction);
      await submitContentFeedback(formData);
    });
  };

  const handleCommentSubmit = () => {
    if (pendingReaction) {
      submitReaction(pendingReaction, comment);
      setShowCommentBox(false);
      setComment('');
      setPendingReaction(null);
    }
  };

  const iconSize = size === 'sm' ? 13 : 15;
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  const total = optimistic.likeCount + optimistic.dislikeCount;
  const likePercent = total > 0 ? Math.round((optimistic.likeCount / total) * 100) : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {/* Like */}
        <button
          onClick={() => handleReaction('like')}
          disabled={isPending}
          title="Hữu ích"
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 ${textSize} font-medium ring-1 transition disabled:opacity-50
            ${
              optimistic.userReaction === 'like'
                ? 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/40'
                : 'bg-slate-800/60 text-slate-400 ring-slate-700 hover:bg-emerald-500/10 hover:text-emerald-300 hover:ring-emerald-500/30'
            }`}
        >
          <ThumbsUp size={iconSize} />
          <span>{optimistic.likeCount}</span>
        </button>

        {/* Dislike */}
        <button
          onClick={() => handleReaction('dislike')}
          disabled={isPending}
          title="Cần cải thiện"
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 ${textSize} font-medium ring-1 transition disabled:opacity-50
            ${
              optimistic.userReaction === 'dislike'
                ? 'bg-red-500/20 text-red-300 ring-red-500/40'
                : 'bg-slate-800/60 text-slate-400 ring-slate-700 hover:bg-red-500/10 hover:text-red-300 hover:ring-red-500/30'
            }`}
        >
          <ThumbsDown size={iconSize} />
          <span>{optimistic.dislikeCount}</span>
        </button>

        {/* % hữu ích */}
        {likePercent !== null && total >= 2 && (
          <span className={`${textSize} text-slate-500`}>{likePercent}% hữu ích</span>
        )}

        {/* Nút ghi chú nhanh */}
        {showComment && (
          <button
            onClick={() => setShowCommentBox((v) => !v)}
            title="Góp ý"
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-slate-500 ring-1 ring-slate-700 hover:text-slate-300 transition"
          >
            <MessageSquare size={12} /> Góp ý
          </button>
        )}
      </div>

      {/* Progress bar */}
      {total >= 1 && (
        <div className="h-1 w-full rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${likePercent ?? 0}%` }}
          />
        </div>
      )}

      {/* Comment box */}
      {showCommentBox && (
        <div className="mt-2 rounded-xl border border-slate-700/60 bg-slate-950/60 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400 font-medium">Góp ý để cải thiện nội dung</p>
            <button
              onClick={() => {
                setShowCommentBox(false);
                setPendingReaction(null);
              }}
              className="text-slate-500 hover:text-slate-300"
            >
              <X size={14} />
            </button>
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Nội dung chưa rõ ở chỗ nào? Thiếu thông tin gì?..."
            rows={3}
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-slate-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCommentSubmit}
              className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs text-white hover:bg-slate-600 transition"
            >
              Gửi góp ý
            </button>
            <button
              onClick={() => submitReaction(pendingReaction!, '')}
              className="text-xs text-slate-500 hover:text-slate-300 transition"
            >
              Bỏ qua, chỉ vote
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
