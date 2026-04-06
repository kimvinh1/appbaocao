'use client';

import { Trash2, Loader2 } from 'lucide-react';
import { useTransition } from 'react';
import { deleteProcedureShare } from '@/app/actions-kb';

export function RevokeShareButton({
  shareId,
  articleId,
}: {
  shareId: string;
  articleId: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleRevoke() {
    if (!window.confirm('Thu hồi link chia sẻ này? Khách hàng sẽ không truy cập được nữa.')) {
      return;
    }

    const fd = new FormData();
    fd.set('shareId', shareId);
    fd.set('articleId', articleId);

    startTransition(async () => {
      try {
        await deleteProcedureShare(fd);
      } catch (error) {
        alert('Không thể thu hồi lúc này. Vui lòng thử lại sau.');
      }
    });
  }

  return (
    <button
      onClick={handleRevoke}
      disabled={isPending}
      title="Thu hồi link chia sẻ"
      className="inline-flex items-center justify-center rounded-lg bg-red-500/10 p-1.5 text-red-400 ring-1 ring-red-400/20 hover:bg-red-500/20 transition disabled:opacity-50"
    >
      {isPending ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
    </button>
  );
}
