'use client';

import { markProcedureShareCompleted, reactToProcedureShare } from '@/app/actions-kb';
import { CheckCircle2, Heart, ThumbsUp } from 'lucide-react';
import { useState, useTransition, useEffect } from 'react';

interface ShareInteractionPanelProps {
  token: string;
  initialStatus: string;
  initialLikeCount: number;
  initialHeartCount: number;
  themeTextClass: string;
  themeButtonClass: string;
}

export function ShareInteractionPanel({
  token,
  initialStatus,
  initialLikeCount,
  initialHeartCount,
  themeTextClass,
  themeButtonClass,
}: ShareInteractionPanelProps) {
  const [status, setStatus] = useState(initialStatus);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [heartCount, setHeartCount] = useState(initialHeartCount);
  const [reactedType, setReactedType] = useState<'like' | 'heart' | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const savedReaction = localStorage.getItem(`share-reaction-${token}`);
    if (savedReaction === 'like' || savedReaction === 'heart') {
      setReactedType(savedReaction);
    }
  }, [token]);

  function handleComplete() {
    const fd = new FormData();
    fd.set('token', token);
    fd.set('customerComment', comment);
    startTransition(async () => {
      try {
        setError(null);
        await markProcedureShareCompleted(fd);
        setStatus('completed');
        setSubmitted(true);
      } catch {
        setError('Không thể ghi nhận phản hồi. Link có thể đã bị thu hồi.');
      }
    });
  }

  function handleReact(reactionType: 'like' | 'heart') {
    if (reactedType) {
      setError('Bạn đã gửi đánh giá trước đó rồi. Cảm ơn bạn!');
      return;
    }

    const previousLikeCount = likeCount;
    const previousHeartCount = heartCount;

    // Optimistic UI updates
    setReactedType(reactionType);
    localStorage.setItem(`share-reaction-${token}`, reactionType);
    if (reactionType === 'like') setLikeCount((c) => c + 1);
    else setHeartCount((c) => c + 1);
    setError(null);

    const fd = new FormData();
    fd.set('token', token);
    fd.set('reactionType', reactionType);
    
    // We don't need to block UI with startTransition here for simple click
    // Fire and forget
    reactToProcedureShare(fd).catch(() => {
      // Revert on failure
      setError('Không thể ghi nhận đánh giá. Link có thể đã bị thu hồi.');
      setReactedType(null);
      localStorage.removeItem(`share-reaction-${token}`);
      setLikeCount(previousLikeCount);
      setHeartCount(previousHeartCount);
    });
  }

  const renderButtons = () => (
    <div className="flex flex-wrap gap-3">
      {status !== 'completed' && !submitted && (
        <button
          onClick={handleComplete}
          disabled={isPending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500/15 px-4 py-2.5 text-sm font-medium text-emerald-300 ring-1 ring-emerald-400/25 transition hover:bg-emerald-500/25 disabled:opacity-60 sm:w-auto"
        >
          <CheckCircle2 size={16} /> {isPending ? 'Đang ghi nhận...' : 'Tôi đã làm xong'}
        </button>
      )}
      <button
        onClick={() => handleReact('like')}
        disabled={isPending || reactedType !== null}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:opacity-80 sm:w-auto ring-1 ${
          reactedType === 'like'
            ? 'bg-cyan-500 text-white ring-cyan-500 shadow-md shadow-cyan-500/20'
            : 'bg-cyan-500/15 text-cyan-300 ring-cyan-400/25 hover:bg-cyan-500/25'
        }`}
      >
        <ThumbsUp size={16} className={reactedType === 'like' ? 'fill-current' : ''} /> Hữu ích ({likeCount})
      </button>
      <button
        onClick={() => handleReact('heart')}
        disabled={isPending || reactedType !== null}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:opacity-80 sm:w-auto ring-1 ${
          reactedType === 'heart'
            ? 'bg-pink-500 text-white ring-pink-500 shadow-md shadow-pink-500/20'
            : 'bg-pink-500/15 text-pink-300 ring-pink-400/25 hover:bg-pink-500/25'
        }`}
      >
        <Heart size={16} className={reactedType === 'heart' ? 'fill-current' : ''} /> Rất hiệu quả ({heartCount})
      </button>
    </div>
  );

  if (submitted || status === 'completed') {
    return (
      <div className="space-y-4">
        {error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}
        <div className="flex items-center gap-3 rounded-xl bg-emerald-500/15 px-4 py-3 text-emerald-300 ring-1 ring-emerald-400/25">
          <CheckCircle2 size={20} className="shrink-0" />
          <p className="text-sm font-medium">Cảm ơn bạn đã xác nhận hoàn tất! Đội kỹ thuật đã ghi nhận.</p>
        </div>
        {renderButtons()}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}
      <div>
        <label className="text-sm text-slate-300 block mb-1.5">
          Nhận xét của bạn <span className="text-slate-500">(không bắt buộc)</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="VD: Quy trình rõ ràng, dễ thực hiện. Tôi đã hoàn thành thành công..."
          className="w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none resize-none placeholder:text-slate-500 focus:border-slate-400 transition"
        />
      </div>
      {renderButtons()}
    </div>
  );
}

