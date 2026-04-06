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
        const input = formRef.current?.querySelector<HTMLInputElement>('input[name="imageFiles"]');
        if (input) input.value = '';
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        await createArticle(formData);
        // Xóa bản nháp autosave sau khi lưu thành công
        try { localStorage.removeItem('tiptap-draft-new-article'); } catch { /* ignore */ }
        formRef.current?.reset();
        setImagePreviews([]);
        window.location.href = '/kien-thuc';
    }

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            {/* Header */}
            <div>
                <Link
                    href="/kien-thuc"
                    className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-3 transition-colors"
                >
                    <ArrowLeft size={12} /> Thư Viện Tài Liệu
                </Link>
                <h1 className="page-title">Thêm Tài Liệu Mới</h1>
                <p className="page-subtitle">Soạn bài viết, hướng dẫn kỹ thuật hoặc quy trình chuẩn.</p>
            </div>

            {/* Form */}
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">

                {/* Row: Module + Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="form-label">Mảng sản phẩm</label>
                        <select
                            name="module"
                            defaultValue={defaultModule}
                            className="input-field"
                        >
                            {MODULES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="form-label">Loại tài liệu</label>
                        <select
                            name="category"
                            defaultValue="quy-trinh"
                            className="input-field"
                        >
                            {ARTICLE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                    </div>
                </div>

                {/* Title */}
                <div>
                    <label className="form-label">Tiêu Đề <span className="text-red-500">*</span></label>
                    <input
                        name="title"
                        required
                        placeholder="VD: Hướng dẫn xử lý lỗi E204 trên Vitek 2"
                        className="input-field text-sm"
                    />
                </div>

                {/* Tags */}
                <div>
                    <label className="form-label">
                        Tags <span className="text-[var(--text-muted)] font-normal">(phân cách bằng dấu phẩy)</span>
                    </label>
                    <input
                        name="tags"
                        placeholder="VD: lỗi, Vitek2, vi sinh"
                        className="input-field text-sm"
                    />
                </div>

                {/* Attachment URL */}
                <div>
                    <label className="form-label">
                        Link tài liệu / PDF{' '}
                        <span className="text-[var(--text-muted)] font-normal">(Google Drive hoặc link công khai)</span>
                    </label>
                    <input
                        type="url"
                        name="attachmentUrl"
                        placeholder="https://drive.google.com/file/d/..."
                        className="input-field text-sm"
                    />
                </div>

                {/* Image Upload */}
                <div>
                    <label className="form-label">
                        <span className="flex items-center gap-1.5">
                            <ImagePlus size={13} /> Ảnh đính kèm
                            <span className="text-[var(--text-muted)] font-normal">(tối đa 5 ảnh)</span>
                        </span>
                    </label>
                    <input
                        type="file"
                        accept="image/*"
                        name="imageFiles"
                        multiple
                        onChange={handleImageChange}
                        className="input-field text-sm py-1.5 
                            file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0
                            file:text-xs file:font-semibold file:cursor-pointer
                            file:bg-[var(--accent)] file:text-white
                            hover:file:opacity-90"
                    />
                    {imagePreviews.length > 0 && (
                        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                            {imagePreviews.map((src, i) => (
                                <div key={i} className="relative group aspect-square">
                                    <img
                                        src={src}
                                        alt=""
                                        className="h-full w-full rounded-lg object-cover border border-[var(--border)]"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeImagePreview(i)}
                                        className="absolute top-1 right-1 rounded-full bg-black/60 p-0.5 text-white opacity-0 group-hover:opacity-100 transition"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Rich text content */}
                <div>
                    <label className="form-label">Nội Dung</label>
                    <RichContentEditor name="content" rows={18} storageKey="new-article" />
                </div>

                {/* Submit */}
                <div className="flex items-center gap-3 pt-2">
                    <button type="submit" className="btn-primary">
                        <Save size={16} /> Lưu Tài Liệu
                    </button>
                    <Link href="/kien-thuc" className="btn-ghost">
                        Hủy
                    </Link>
                </div>
            </form>
        </div>
    );
}
