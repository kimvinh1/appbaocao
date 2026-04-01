'use client';

import { updateArticle, deleteArticleImage } from '@/app/actions-kb';
import { RichContentEditor } from '@/app/components/ui/rich-content-editor';
import { ImagePlus, Save, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

interface ArticleImage {
    id: string;
    imageUrl: string;
}

interface ArticleData {
    id: string;
    title: string;
    content: string;
    tags: string | null;
    category: string;
    attachmentUrl: string | null;
    images: ArticleImage[];
}

interface ModuleTheme {
    focusBorderClass: string;
    buttonClass: string;
}

const ARTICLE_CATEGORIES = [
    { value: 'quy-trinh', label: 'Quy trình / SOP' },
    { value: 'huong-dan', label: 'Hướng dẫn sử dụng' },
    { value: 'troubleshooting', label: 'Xử lý sự cố' },
    { value: 'faq', label: 'Câu hỏi thường gặp' },
];

export function EditArticleForm({ article, moduleTheme }: { article: ArticleData; moduleTheme: ModuleTheme }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
            await updateArticle(formData);
            router.push(`/kien-thuc/bai/${article.id}`);
        });
    }

    return (
        <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-6 space-y-4">
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
                    defaultValue={article.tags ?? ''}
                    className={`mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition ${moduleTheme.focusBorderClass}`}
                />
            </label>

            <label className="block text-sm text-slate-300">
                Link tài liệu / PDF <span className="text-slate-500">(Google Drive hoặc link công khai)</span>
                <input
                    name="attachmentUrl"
                    type="url"
                    defaultValue={article.attachmentUrl ?? ''}
                    placeholder="https://drive.google.com/file/d/..."
                    className={`mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition ${moduleTheme.focusBorderClass}`}
                />
            </label>

            <div className="block text-sm text-slate-300">
                Nội Dung
                <div className="mt-1">
                    <RichContentEditor name="content" defaultValue={article.content} rows={16} />
                </div>
            </div>

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

            <button
                type="submit"
                disabled={isPending}
                className={`flex w-fit items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium ring-1 transition ${moduleTheme.buttonClass} disabled:opacity-60`}
            >
                <Save size={16} />
                {isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
        </form>
    );
}
