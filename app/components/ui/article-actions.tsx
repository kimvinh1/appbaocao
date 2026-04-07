'use client';

import { useTransition } from 'react';
import { Trash2, Archive, ArchiveRestore } from 'lucide-react';
import { deleteArticle, archiveArticle } from '@/app/actions-kb';
import { useRouter } from 'next/navigation';

type Props = {
  articleId: string;
  isArchived: boolean;
  moduleHref: string; // e.g. /kien-thuc/illumina
};

export function ArticleActions({ articleId, isArchived, moduleHref }: Props) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!confirm('⚠️ Bạn chắc chắn muốn XOÁ VĨNH VIỄN bài viết này?\nHành động này không thể hoàn tác.')) return;
    const fd = new FormData();
    fd.append('id', articleId);
    startTransition(async () => {
      await deleteArticle(fd);
      router.push(moduleHref);
    });
  }

  function handleArchive() {
    const msg = isArchived
      ? 'Khôi phục bài viết này về trạng thái hoạt động?'
      : 'Lưu trữ bài viết này?\nBài sẽ bị ẩn khỏi danh sách nhưng không bị xoá.';
    if (!confirm(msg)) return;
    const fd = new FormData();
    fd.append('id', articleId);
    fd.append('archive', isArchived ? 'false' : 'true');
    startTransition(async () => {
      await archiveArticle(fd);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      {/* Lưu trữ / Khôi phục */}
      <button
        type="button"
        onClick={handleArchive}
        disabled={pending}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
          isArchived
            ? 'border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
            : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
        }`}
        title={isArchived ? 'Khôi phục bài viết' : 'Lưu trữ — ẩn khỏi danh sách nhưng không xoá'}
      >
        {isArchived
          ? <><ArchiveRestore size={13} /> Khôi phục</>
          : <><Archive size={13} /> Lưu trữ</>
        }
      </button>

      {/* Xoá vĩnh viễn */}
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        className="flex items-center gap-1.5 rounded-lg border border-red-300 dark:border-red-500/40 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition disabled:opacity-50"
        title="Xoá vĩnh viễn bài viết này"
      >
        <Trash2 size={13} />
        {pending ? 'Đang xử lý...' : 'Xoá'}
      </button>
    </div>
  );
}
