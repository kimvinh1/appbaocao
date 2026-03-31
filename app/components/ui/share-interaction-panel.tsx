'use client';

import { markProcedureShareCompleted, reactToProcedureShare } from '@/app/actions-kb';
import { CheckCircle2, Heart, ThumbsUp } from 'lucide-react';
import { useState, useTransition } from 'react';

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
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleComplete() {
    const fd = new FormData();
    fd.set('token', token);
    fd.set('customerComment', comment);
    startTransition(async () => {
      await markProcedureShareCompleted(fd);
      setStatus('completed');
      setSubmitted(true);
    });
  }

  function handleReact(reactionType: 'like' | 'heart') {
    const fd = new FormData();
    fd.set('token', token);
    fd.set('reactionType', reactionType);
    startTransition(async () => {
      await reactToProcedureShare(fd);
      if (reactionType === 'like') setLikeCount((c) => c + 1);
      else setHeartCount((c) => c + 1);
    });
  }

  if (submitted || status === 'completed') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl bg-emerald-500/15 px-4 py-3 text-emerald-300 ring-1 ring-emerald-400/25">
          <CheckCircle2 size={20} className="shrink-0" />
          <p className="text-sm font-medium">Cảm ơn bạn đã xác nhận hoàn tất! Đội kỹ thuật đã ghi nhận.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleReact('like')}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-500/15 px-4 py-2.5 text-sm font-medium text-cyan-300 ring-1 ring-cyan-400/25 transition hover:bg-cyan-500/25 disabled:opacity-60"
          >
            <ThumbsUp size={16} /> Hữu ích ({likeCount})
          </button>
          <button
            onClick={() => handleReact('heart')}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-pink-500/15 px-4 py-2.5 text-sm font-medium text-pink-300 ring-1 ring-pink-400/25 transition hover:bg-pink-500/25 disabled:opacity-60"
          >
            <Heart size={16} /> Rất hiệu quả ({heartCount})
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleComplete}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/15 px-4 py-2.5 text-sm font-medium text-emerald-300 ring-1 ring-emerald-400/25 transition hover:bg-emerald-500/25 disabled:opacity-60"
        >
          <CheckCircle2 size={16} /> {isPending ? 'Đang ghi nhận...' : 'Tôi đã làm xong'}
        </button>
        <button
          onClick={() => handleReact('like')}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-500/15 px-4 py-2.5 text-sm font-medium text-cyan-300 ring-1 ring-cyan-400/25 transition hover:bg-cyan-500/25 disabled:opacity-60"
        >
          <ThumbsUp size={16} /> Hữu ích ({likeCount})
        </button>
        <button
          onClick={() => handleReact('heart')}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-pink-500/15 px-4 py-2.5 text-sm font-medium text-pink-300 ring-1 ring-pink-400/25 transition hover:bg-pink-500/25 disabled:opacity-60"
        >
          <Heart size={16} /> Rất hiệu quả ({heartCount})
        </button>
      </div>
    </div>
  );
}
