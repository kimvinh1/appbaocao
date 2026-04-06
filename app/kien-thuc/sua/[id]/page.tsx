import { getArticleById } from '@/app/actions-kb';
import { ArrowLeft } from 'lucide-react';
import { getModuleTheme, normalizeModuleKey } from '@/lib/module-theme';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EditArticleForm } from './EditArticleForm';

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await getArticleById(id);

  if (!article) {
    notFound();
  }

  const moduleTheme = getModuleTheme(normalizeModuleKey(article.module));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link
          href={`/kien-thuc/bai/${id}`}
          className="mb-2 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 transition hover:text-gray-900 dark:text-white"
        >
          <ArrowLeft size={12} /> Quay lại bài viết
        </Link>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Chỉnh Sửa Tài Liệu</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Cập nhật tiêu đề, tags và nội dung bài viết hiện tại.
        </p>
      </div>

      <EditArticleForm article={article} moduleTheme={moduleTheme} />
    </div>
  );
}
