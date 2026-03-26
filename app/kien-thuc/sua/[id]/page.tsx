import { deleteArticleImage, updateArticle, getArticleById } from '@/app/actions-kb';
import { SubmitButton } from '@/app/components/ui/submit-button';
import { ArrowLeft, ImagePlus, Save, Trash2 } from 'lucide-react';
import { getModuleTheme, normalizeModuleKey } from '@/lib/module-theme';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

const ARTICLE_CATEGORIES = [
  { value: 'quy-trinh', label: 'Quy trình / SOP' },
  { value: 'huong-dan', label: 'Hướng dẫn sử dụng' },
  { value: 'troubleshooting', label: 'Xử lý sự cố' },
  { value: 'faq', label: 'Câu hỏi thường gặp' },
];

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await getArticleById(id);

  if (!article) {
    notFound();
  }

  const moduleTheme = getModuleTheme(normalizeModuleKey(article.module));

  async function saveArticle(formData: FormData) {
    'use server';

    await updateArticle(formData);
    redirect(`/kien-thuc/bai/${id}`);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/kien-thuc/bai/${id}`}
          className="mb-2 flex items-center gap-1 text-xs text-slate-400 transition hover:text-white"
        >
          <ArrowLeft size={12} /> Quay lại bài viết
        </Link>
        <h2 className="text-2xl font-semibold text-white">Chỉnh Sửa Tài Liệu</h2>
        <p className="mt-1 text-sm text-slate-400">
          Cập nhật tiêu đề, tags và nội dung bài viết hiện tại.
        </p>
      </div>

      <form action={saveArticle} className="glass-panel rounded-2xl p-6 space-y-4">
        <input type="hidden" name="id" value={article.id} />

        <label className="block text-sm text-slate-300">
          Tiêu Đề
          <input
            name="title"
            required
            defaultValue={article.title}
            className={`mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition ${moduleTheme.focusBorderClass}`}
          />
        </label>

        <label className="block text-sm text-slate-300">
          Loại tài liệu
          <select
            name="category"
            defaultValue={article.category}
            className={`mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition ${moduleTheme.focusBorderClass}`}
          >
            {ARTICLE_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm text-slate-300">
          Tags <span className="text-slate-500">(phân cách bằng dấu phẩy)</span>
          <input
            name="tags"
            defaultValue={article.tags}
            className={`mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition ${moduleTheme.focusBorderClass}`}
          />
        </label>

        <label className="block text-sm text-slate-300">
          Nội Dung
          <textarea
            name="content"
            required
            rows={16}
            defaultValue={article.content}
            className={`mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 font-mono text-sm text-white outline-none transition ${moduleTheme.focusBorderClass}`}
          />
        </label>

        {article.images && article.images.length > 0 && (
          <div className="block text-sm text-slate-300">
            <p className="mb-2">Ảnh hiện tại</p>
            <div className="grid grid-cols-3 gap-2">
              {article.images.map((img) => (
                <div key={img.id} className="relative group">
                  <img
                    src={img.imageUrl}
                    alt="Ảnh đính kèm"
                    className="h-28 w-full rounded-lg object-cover border border-slate-700"
                  />
                  <form
                    action={deleteArticleImage}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition"
                  >
                    <input type="hidden" name="imageId" value={img.id} />
                    <button
                      type="submit"
                      title="Xóa ảnh"
                      className="rounded-full bg-red-500/80 p-1 text-white hover:bg-red-500"
                    >
                      <Trash2 size={12} />
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        )}

        <label className="block text-sm text-slate-300">
          <span className="flex items-center gap-1.5">
            <ImagePlus size={14} /> Thêm ảnh mới <span className="text-slate-500">(tối đa 5 ảnh mỗi lần)</span>
          </span>
          <input
            type="file"
            accept="image/*"
            name="imageFiles"
            multiple
            className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-1.5 text-sm text-white outline-none file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-300 hover:file:bg-slate-700"
          />
        </label>

        <SubmitButton
          label="Lưu thay đổi"
          pendingLabel="Đang lưu..."
          icon={<Save size={16} />}
          className={`flex w-fit items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium ring-1 transition ${moduleTheme.buttonClass}`}
        />
      </form>
    </div>
  );
}
