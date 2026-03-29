'use client';

import { useTransition } from 'react';
import { deleteProject } from '@/app/actions';

export function DeleteProjectButton({ projectId }: { projectId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (confirm('Bạn có chắc chắn muốn xóa dự án này? Toàn bộ lịch sử cập nhật sẽ bị xóa vĩnh viễn.')) {
      startTransition(async () => {
        const formData = new FormData();
        formData.append('id', projectId);
        await deleteProject(formData);
      });
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="inline-flex items-center justify-center rounded-lg bg-red-900/30 border border-red-900 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-800/60 hover:text-red-100 transition whitespace-nowrap disabled:opacity-50"
    >
      {isPending ? 'Đang xóa...' : 'Xóa dự án'}
    </button>
  );
}
