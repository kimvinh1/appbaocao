'use client';

import { Ban, CheckCircle2, Loader2 } from 'lucide-react';
import { useTransition, useState } from 'react';
import { toggleShareLink } from '@/app/actions-kb';

export function ToggleShareButton({
  shareId,
  articleId,
  isRevoked,
}: {
  shareId: string;
  articleId: string;
  isRevoked: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [revoked, setRevoked] = useState(isRevoked);

  function handleToggle() {
    const msg = revoked
      ? 'Bật lại link chia sẻ này? Khách hàng sẽ truy cập được lại.'
      : 'Tắt link chia sẻ? Khách hàng sẽ không truy cập được cho đến khi bật lại.';
    if (!window.confirm(msg)) return;

    startTransition(async () => {
      try {
        await toggleShareLink(shareId, articleId);
        setRevoked(!revoked);
      } catch {
        alert('Có lỗi xảy ra. Vui lòng thử lại.');
      }
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      title={revoked ? 'Bật lại link' : 'Tắt link tạm thời'}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ring-1 transition disabled:opacity-50 ${
        revoked
          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-400/30 hover:bg-emerald-500/20'
          : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-400/30 hover:bg-amber-500/20'
      }`}
    >
      {isPending ? (
        <Loader2 size={12} className="animate-spin" />
      ) : revoked ? (
        <CheckCircle2 size={12} />
      ) : (
        <Ban size={12} />
      )}
      {revoked ? 'Bật lại' : 'Tắt link'}
    </button>
  );
}
