'use client';

import { createResourceLink } from '@/app/actions-resources';
import { RESOURCE_MODULES, RESOURCE_CATEGORIES } from '@/lib/resource-constants';
import { ArrowLeft, Link2, Save } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState } from 'react';

export default function TaiLieuMoiPage() {
    const formRef = useRef<HTMLFormElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [customCategory, setCustomCategory] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setSaving(true);
        try {
            const fd = new FormData(e.currentTarget);
            await createResourceLink(fd);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Lỗi không xác định');
            setSaving(false);
        }
    }

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <div>
                <Link
                    href="/tai-lieu"
                    className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition mb-3"
                >
                    <ArrowLeft size={14} /> Thư Viện Link
                </Link>
                <h1 className="page-title flex items-center gap-2">
                    <Link2 size={20} className="text-cyan-500" /> Thêm Link Tài Liệu
                </h1>
                <p className="page-subtitle mt-1">Lưu lại link IFU, SDS, trang hướng dẫn máy / kit từ nhà sản xuất.</p>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="glass-panel rounded-2xl p-6 space-y-5">

                {/* Module + Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="form-label">Mảng sản phẩm</label>
                        <select name="module" defaultValue="illumina" className="input-field">
                            {RESOURCE_MODULES.map((m) => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="form-label">
                            Đề mục
                        </label>
                        {customCategory ? (
                            <div className="flex gap-2">
                                <input
                                    name="category"
                                    required
                                    placeholder="Nhập đề mục mới..."
                                    className="input-field flex-1"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setCustomCategory(false)}
                                    className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                >
                                    Chọn có sẵn
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <select name="category" defaultValue="Máy móc" className="input-field flex-1">
                                    {RESOURCE_CATEGORIES.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => setCustomCategory(true)}
                                    className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline whitespace-nowrap"
                                >
                                    + Tạo mới
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Title */}
                <div>
                    <label className="form-label">Tên tài liệu <span className="text-red-500">*</span></label>
                    <input
                        name="title"
                        required
                        placeholder="VD: NextSeq 550 System Guide v1.3"
                        className="input-field"
                    />
                </div>

                {/* URL */}
                <div>
                    <label className="form-label">
                        Đường dẫn (URL) <span className="text-red-500">*</span>
                        <span className="ml-1 text-slate-400 font-normal text-xs">— phải bắt đầu bằng https://</span>
                    </label>
                    <input
                        name="url"
                        type="url"
                        required
                        placeholder="https://support.illumina.com/..."
                        className="input-field font-mono text-sm"
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="form-label">
                        Mô tả ngắn
                        <span className="ml-1 text-slate-400 font-normal">(tùy chọn)</span>
                    </label>
                    <input
                        name="description"
                        placeholder="VD: Hướng dẫn vận hành đầy đủ cho NextSeq 550, bản tiếng Anh"
                        className="input-field"
                    />
                </div>

                {/* Tags */}
                <div>
                    <label className="form-label">
                        Tags
                        <span className="ml-1 text-slate-400 font-normal">(phân cách bằng dấu phẩy)</span>
                    </label>
                    <input
                        name="tags"
                        placeholder="VD: NextSeq, illumina, IFU, máy sequencer"
                        className="input-field"
                    />
                </div>

                {error && (
                    <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                        {error}
                    </div>
                )}

                <div className="flex items-center gap-3 pt-1">
                    <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
                        <Save size={15} /> {saving ? 'Đang lưu...' : 'Lưu Link'}
                    </button>
                    <Link href="/tai-lieu" className="btn-ghost">Hủy</Link>
                </div>
            </form>
        </div>
    );
}
