'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { ImagePlus, Loader2, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';

interface RichContentEditorProps {
    /** form field name - a hidden <input> syncs the HTML value */
    name: string;
    /** initial HTML (or plain-text) content */
    defaultValue?: string;
    /** optional class overrides for the editable area */
    className?: string;
    /** minimum visible rows (approximate) */
    rows?: number;
}

export function RichContentEditor({ name, defaultValue, className, rows = 18 }: RichContentEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const hiddenRef = useRef<HTMLInputElement>(null);
    const savedRangeRef = useRef<Range | null>(null);
    const [uploading, setUploading] = useState(false);

    // ── Save / restore cursor position (needed when file dialog steals focus)
    const saveSelection = useCallback(() => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            savedRangeRef.current = sel.getRangeAt(0).cloneRange();
        }
    }, []);

    const restoreSelection = useCallback(() => {
        const range = savedRangeRef.current;
        if (!range) return;
        const sel = window.getSelection();
        if (!sel) return;
        sel.removeAllRanges();
        sel.addRange(range);
    }, []);

    // ── 1. Set initial content once ──────────────────────────────────────────
    useEffect(() => {
        const el = editorRef.current;
        if (!el) return;
        if (!defaultValue) return;
        const isHtml = /^[\s]*<[a-zA-Z]/.test(defaultValue);
        if (isHtml) {
            el.innerHTML = defaultValue;
        } else {
            el.innerHTML = defaultValue
                .split('\n')
                .map((line) => (line.trim() === '' ? '<br>' : `<p>${escapeHtml(line)}</p>`))
                .join('');
        }
        if (hiddenRef.current) hiddenRef.current.value = el.innerHTML;
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── 2. Keep hidden input in sync ─────────────────────────────────────────
    const sync = useCallback(() => {
        if (hiddenRef.current && editorRef.current) {
            hiddenRef.current.value = editorRef.current.innerHTML;
        }
    }, []);

    // ── 3. Upload base64 data-URL to Vercel Blob ──────────────────────────────
    const uploadDataUrl = useCallback(async (dataUrl: string): Promise<string | null> => {
        try {
            const res = await fetch('/api/upload-inline-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dataUrl }),
            });
            if (!res.ok) return null;
            const json = await res.json();
            return json.url ?? null;
        } catch {
            return null;
        }
    }, []);

    // ── 4. Upload a File/Blob and return public URL ───────────────────────────
    const uploadFile = useCallback(async (file: File): Promise<string | null> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = async () => {
                const url = await uploadDataUrl(reader.result as string);
                resolve(url);
            };
            reader.readAsDataURL(file);
        });
    }, [uploadDataUrl]);

    // ── 5. Insert HTML at cursor (uses savedRange if selection is lost) ────────
    const insertHtmlAtCursor = useCallback((html: string) => {
        // Try live selection first, fall back to saved range
        let sel = window.getSelection();
        let range: Range | null = null;

        if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode ?? null)) {
            range = sel.getRangeAt(0);
        } else if (savedRangeRef.current) {
            range = savedRangeRef.current;
            sel = window.getSelection();
            if (sel) {
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }

        if (!range) {
            // Last resort: append to end of editor
            if (editorRef.current) {
                editorRef.current.focus();
                const newRange = document.createRange();
                newRange.selectNodeContents(editorRef.current);
                newRange.collapse(false);
                const s = window.getSelection();
                if (s) { s.removeAllRanges(); s.addRange(newRange); }
                range = newRange;
            } else return;
        }

        range.deleteContents();
        const temp = document.createElement('div');
        temp.innerHTML = html;
        const frag = document.createDocumentFragment();
        let lastNode: Node | null = null;
        while (temp.firstChild) {
            lastNode = frag.appendChild(temp.firstChild);
        }
        range.insertNode(frag);
        if (lastNode) {
            const r2 = range.cloneRange();
            r2.setStartAfter(lastNode);
            r2.collapse(true);
            const s = window.getSelection();
            if (s) { s.removeAllRanges(); s.addRange(r2); }
            savedRangeRef.current = r2.cloneRange();
        }
    }, []);

    // ── 6. Handle Paste ───────────────────────────────────────────────────────
    const handlePaste = useCallback(
        async (e: React.ClipboardEvent<HTMLDivElement>) => {
            e.preventDefault();
            const cd = e.clipboardData;

            // 6a. Image file directly (screenshot)
            const imageFile = Array.from(cd.items).find(
                (item) => item.kind === 'file' && item.type.startsWith('image/')
            );
            if (imageFile) {
                const file = imageFile.getAsFile();
                if (file) {
                    setUploading(true);
                    const url = await uploadFile(file);
                    setUploading(false);
                    if (url) {
                        insertHtmlAtCursor(`<div style="text-align: center;"><img src="${url}" alt="" style="max-width:100%;" /></div><br>`);
                        sync();
                    }
                    return;
                }
            }

            // 6b. HTML paste (Word, browser)
            const htmlData = cd.getData('text/html');
            if (htmlData) {
                setUploading(true);
                const cleaned = await processWordHtml(htmlData, uploadDataUrl);
                setUploading(false);
                insertHtmlAtCursor(cleaned);
                sync();
                return;
            }

            // 6c. Plain text fallback
            const text = cd.getData('text/plain');
            if (text) {
                const html = text
                    .split('\n')
                    .map((line) => (line.trim() === '' ? '<br>' : `<p>${escapeHtml(line)}</p>`))
                    .join('');
                insertHtmlAtCursor(html);
                sync();
            }
        },
        [insertHtmlAtCursor, sync, uploadDataUrl, uploadFile],
    );

    // ── 7. Handle drag-and-drop images ───────────────────────────────────────
    const handleDrop = useCallback(
        async (e: React.DragEvent<HTMLDivElement>) => {
            const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
            if (files.length === 0) return;
            e.preventDefault();
            setUploading(true);
            for (const file of files) {
                const url = await uploadFile(file);
                if (url) {
                    insertHtmlAtCursor(`<div style="text-align: center;"><img src="${url}" alt="" style="max-width:100%;" /></div><br>`);
                }
            }
            setUploading(false);
            sync();
        },
        [insertHtmlAtCursor, sync, uploadFile],
    );

    const minHeight = `${rows * 1.75}rem`;

    return (
        <div className="relative rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden shadow-sm">
            {/* Hidden input carries the HTML content on form submit */}
            <input type="hidden" name={name} ref={hiddenRef} defaultValue={defaultValue ?? ''} />

            {/* Upload overlay */}
            {uploading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm">
                    <span className="flex items-center gap-2 text-sm text-cyan-600 dark:text-cyan-300">
                        <Loader2 size={16} className="animate-spin" /> Đang tải ảnh lên...
                    </span>
                </div>
            )}

            {/* ── Toolbar ── */}
            <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 px-2 py-1.5">

                {/* Kiểu chữ heading */}
                <select
                    className="bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 text-xs rounded px-1.5 py-1 cursor-pointer outline-none mr-1"
                    onChange={(e) => {
                        const val = e.target.value;
                        if (!val) return;
                        document.execCommand('formatBlock', false, val);
                        e.target.value = '';
                    }}
                    title="Kiểu tiêu đề"
                >
                    <option value="" disabled selected>Kiểu Chữ</option>
                    <option value="H1">Tiêu đề 1 (H1)</option>
                    <option value="H2">Tiêu đề 2 (H2)</option>
                    <option value="H3">Tiêu đề 3 (H3)</option>
                    <option value="P">Văn bản thường</option>
                </select>

                <Sep />

                {/* Màu chữ */}
                <label
                    className="flex items-center gap-1 rounded px-1.5 py-1 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                    title="Màu chữ"
                >
                    <span className="font-bold" style={{ color: '#e53e3e', textDecoration: 'underline', textDecorationColor: '#e53e3e' }}>A</span>
                    <input
                        type="color"
                        className="w-5 h-5 cursor-pointer border-none bg-transparent p-0"
                        defaultValue="#000000"
                        onChange={(e) => document.execCommand('foreColor', false, e.target.value)}
                    />
                </label>

                <Sep />

                {/* Bold / Italic / Underline */}
                <Btn cmd="bold" title="In đậm (Ctrl+B)"><strong>B</strong></Btn>
                <Btn cmd="italic" title="Nghiêng (Ctrl+I)"><em>I</em></Btn>
                <Btn cmd="underline" title="Gạch dưới (Ctrl+U)"><span className="underline">U</span></Btn>

                <Sep />

                {/* Danh sách */}
                <Btn cmd="insertUnorderedList" title="Danh sách gạch đầu dòng">
                    <span>• —</span>
                </Btn>
                <Btn cmd="insertOrderedList" title="Danh sách đánh số">
                    <span>1.</span>
                </Btn>

                <Sep />

                {/* Căn lề */}
                <Btn cmd="justifyLeft" title="Căn trái"><AlignLeft size={14} /></Btn>
                <Btn cmd="justifyCenter" title="Căn giữa"><AlignCenter size={14} /></Btn>
                <Btn cmd="justifyRight" title="Căn phải"><AlignRight size={14} /></Btn>
                <Btn cmd="justifyFull" title="Căn đều"><AlignJustify size={14} /></Btn>

                <Sep />

                {/* Chèn ảnh từ file */}
                <label
                    className="flex cursor-pointer items-center gap-1 rounded px-1.5 py-1 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                    title="Chèn ảnh từ file"
                    onMouseDown={() => saveSelection()}  // save cursor before file dialog opens
                >
                    <ImagePlus size={14} />
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="sr-only"
                        onChange={async (e) => {
                            const files = Array.from(e.target.files ?? []);
                            if (!files.length) return;
                            restoreSelection(); // restore cursor pos before inserting
                            setUploading(true);
                            for (const file of files) {
                                const url = await uploadFile(file);
                                if (url) {
                                    insertHtmlAtCursor(`<div style="text-align: center;"><img src="${url}" alt="" style="max-width:100%;" /></div><br>`);
                                }
                            }
                            setUploading(false);
                            sync();
                            e.target.value = '';
                        }}
                    />
                </label>

                <span className="ml-auto text-xs text-slate-400 dark:text-slate-500 hidden sm:inline">
                    Ctrl+V để dán từ Word (kèm ảnh)
                </span>
            </div>

            {/* ── Editable area ── */}
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={sync}
                onKeyUp={saveSelection}
                onMouseUp={saveSelection}
                onPaste={handlePaste}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className={className ?? 'rich-editor-area'}
                style={{ minHeight, overflowY: 'auto' }}
                data-placeholder="Nhập nội dung hướng dẫn, quy trình hoặc thông tin kỹ thuật tại đây..."
            />
        </div>
    );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Sep() {
    return <div className="mx-0.5 h-5 w-px bg-slate-300 dark:bg-slate-600" />;
}

function Btn({
    children,
    cmd,
    title,
}: {
    children: React.ReactNode;
    cmd: string;
    title?: string;
}) {
    return (
        <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); document.execCommand(cmd); }}
            title={title}
            className="flex h-7 min-w-[1.75rem] items-center justify-center rounded px-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
        >
            {children}
        </button>
    );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

async function processWordHtml(
    html: string,
    uploadDataUrl: (url: string) => Promise<string | null>,
): Promise<string> {
    let cleaned = html
        .replace(/<!--\[if[\s\S]*?<!\[endif\]-->/gi, '')
        .replace(/<xml[\s\S]*?<\/xml>/gi, '')
        .replace(/<o:[\s\S]*?<\/o:[^>]+>/gi, '')
        .replace(/<w:[\s\S]*?<\/w:[^>]+>/gi, '');

    const parser = new DOMParser();
    const doc = parser.parseFromString(cleaned, 'text/html');

    doc.querySelectorAll('script, style, meta, link, head').forEach((el) => el.remove());

    const images = Array.from(doc.querySelectorAll('img'));
    await Promise.all(
        images.map(async (img) => {
            if (img.src.startsWith('data:')) {
                const url = await uploadDataUrl(img.src);
                if (url) {
                    img.src = url;
                    img.style.maxWidth = '100%';
                } else {
                    img.style.maxWidth = '100%';
                }
            }
            Array.from(img.attributes).forEach((attr) => {
                if (!['src', 'alt', 'width', 'height', 'style'].includes(attr.name)) {
                    img.removeAttribute(attr.name);
                }
            });
        }),
    );

    doc.querySelectorAll('[style]').forEach((el) => {
        const style = el.getAttribute('style') ?? '';
        const fixed = style
            .split(';')
            .filter((rule) => !rule.trim().toLowerCase().startsWith('mso-'))
            .join(';');
        if (fixed.trim()) {
            el.setAttribute('style', fixed);
        } else {
            el.removeAttribute('style');
        }
    });

    doc.querySelectorAll('[class]').forEach((el) => el.removeAttribute('class'));

    return doc.body.innerHTML;
}
