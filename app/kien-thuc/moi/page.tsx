'use client';

import { createArticle } from '@/app/actions-kb';
import { ArrowLeft, ImagePlus, Save, X } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useRef, useState } from 'react';
import { RichContentEditor } from '@/app/components/ui/rich-content-editor';

const MODULES = [
    { value: 'illumina', label: 'Illumina' },
    { value: 'vi-sinh', label: 'Vi Sinh' },
    { value: 'cepheid', label: 'Cepheid' },
];

const ARTICLE_CATEGORIES = [
    { value: 'quy-trinh', label: 'Quy trình / SOP' },
    { value: 'huong-dan', label: 'Hướng dẫn sử dụng' },
    { value: 'troubleshooting', label: 'Xử lý sự cố' },
    { value: 'faq', label: 'Câu hỏi thường gặp' },
];

export default function NewArticlePage() {
    const searchParams = useSearchParams();
    const rawModule = searchParams.get('module') ?? 'illumina';
    const defaultModule = rawModule === 'sinh-hoc-phan-tu' ? 'cepheid' : rawModule;
    const formRef = useRef<HTMLFormElement>(null);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);

    function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files ?? []);
        setImagePreviews(files.map((f) => URL.createObjectURL(f)));
    }

    function removeImagePreview(index: number) {
        setImagePreviews((prev) => prev.filter((_, i) => i !== index));
        // Reset the file input so it doesn't carry removed files
        const input = formRef.current?.querySelector<HTMLInputElement>('input[name="imageFiles"]');
        if (input) input.value = '';
    }

    async function handleSubmit(formData: FormData) {
        await createArticle(formData);
        formRef.current?.reset();
        setImagePreviews([]);
        window.location.href = '/kien-thuc';
    }

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <div>
                <Link href="/kien-thuc" className="flex items-center gap-1 text-xs text-slate-400 hover:text-white mb-2 transition">
                    <ArrowLeft size={12} /> Thư Viện Tài Liệu
                </Link>
                <h2 className="text-2xl font-semibold text-white">Thêm Tài Liệu Mới</h2>
                <p className="mt-1 text-sm text-slate-400">Soạn bài viết, hướng dẫn kỹ thuật hoặc quy trình chuẩn.</p>
            </div>

            <form ref={formRef} action={handleSubmit} className="glass-panel rounded-2xl p-6 space-y-4">
                <label className="block text-sm text-slate-300">
                    Mảng sản phẩm
                    <select
                        name="module"
                        defaultValue={defaultModule}
                        className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400"
                    >
                        {MODULES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                </label>

                <label className="block text-sm text-slate-300">
                    Loại tài liệu
                    <select
                        name="category"
                        defaultValue="quy-trinh"
                        className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400"
                    >
                        {ARTICLE_CATEGORIES.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
                    </select>
                </label>

                <label className="block text-sm text-slate-300">
                    Tiêu Đề
                    <input
                        name="title"
                        required
                        placeholder="VD: Hướng dẫn xử lý lỗi E204 trên Vitek 2"
                        className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400"
                    />
                </label>

                <label className="block text-sm text-slate-300">
                    Tags <span className="text-slate-500">(phân cách bằng dấu phẩy)</span>
                    <input
                        name="tags"
                        placeholder="VD: lỗi, Vitek2, vi sinh"
                        className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400"
                    />
                </label>

                <label className="block text-sm text-slate-300">
                    Link tài liệu / PDF <span className="text-slate-500">(Google Drive hoặc link công khai)</span>
                    <input
                        type="url"
                        name="attachmentUrl"
                        placeholder="https://drive.google.com/file/d/..."
                        className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400"
                    />
                </label>

                <div className="block text-sm text-slate-300">
                    <span className="flex items-center gap-1.5">
                        <ImagePlus size={14} /> Ảnh đính kèm <span className="text-slate-500">(tối đa 5 ảnh)</span>
                    </span>
                    <input
                        type="file"
                        accept="image/*"
                        name="imageFiles"
                        multiple
                        onChange={handleImageChange}
                        className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-1.5 text-sm text-white outline-none focus:border-cyan-400 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-300 hover:file:bg-slate-700"
                    />
                    {imagePreviews.length > 0 && (
                        <div className="mt-3 grid grid-cols-3 gap-2">
                            {imagePreviews.map((src, i) => (
                                <div key={i} className="relative group">
                                    <img src={src} alt="" className="h-28 w-full rounded-lg object-cover border border-slate-700" />
                                    <button
                                        type="button"
                                        onClick={() => removeImagePreview(i)}
                                        className="absolute top-1 right-1 rounded-full bg-slate-900/80 p-0.5 text-slate-300 opacity-0 group-hover:opacity-100 transition hover:text-white"
                                    >
                                        <X size={13} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="block text-sm text-slate-300">
                    Nội Dung
                    <div className="mt-1">
                        <RichContentEditor name="content" rows={14} />
                    </div>
                </div>

                <button
                    type="submit"
                    className="flex items-center gap-2 rounded-xl bg-cyan-500/20 px-5 py-2.5 text-sm font-medium text-cyan-300 ring-1 ring-cyan-400/40 transition hover:bg-cyan-500/30"
                >
                    <Save size={16} /> Lưu Tài Liệu
                </button>
            </form>
        </div>
    );
}
