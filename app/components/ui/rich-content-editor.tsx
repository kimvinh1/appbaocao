'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { ImagePlus, Loader2, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';

interface RichContentEditorProps {
    /** form field name - a hidden <input> syncs the HTML value */
    name: string;
    /** initial HTML (or plain-text) content */
    defaultValue?: string;
    /** optional Tailwind class overrides for the editable area */
    className?: string;
    /** minimum visible rows (approximate) */
    rows?: number;
}

/**
 * A lightweight rich-content editor built on contentEditable.
 *
 * Supports:
 *  - Plain typing and basic keyboard shortcuts (Ctrl+B/I/U from browser default)
 *  - Paste from Word (images are uploaded to Vercel Blob, text/structure preserved)
 *  - Paste of copied images from clipboard
 *  - Drag-and-drop image insertion
 *  - Syncs innerHTML to a hidden <input name={name}> for form submission
 */
export function RichContentEditor({ name, defaultValue, className, rows = 14 }: RichContentEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const hiddenRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    // ââ 1. Set initial content once ââââââââââââââââââââââââââââââââââââââââââ
    useEffect(() => {
        const el = editorRef.current;
        if (!el) return;
        if (!defaultValue) return;
        // Detect plain text vs HTML
        const isHtml = /^[\s]*<[a-zA-Z]/.test(defaultValue);
        if (isHtml) {
            el.innerHTML = defaultValue;
        } else {
            // Convert plain text â paragraphs so the editor looks right
            el.innerHTML = defaultValue
                .split('\n')
                .map((line) => (line.trim() === '' ? '<br>' : `<p>${escapeHtml(line)}</p>`))
                .join('');
        }
        if (hiddenRef.current) hiddenRef.current.value = el.innerHTML;
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ââ 2. Keep hidden input in sync âââââââââââââââââââââââââââââââââââââââââ
    const sync = useCallback(() => {
        if (hiddenRef.current && editorRef.current) {
            hiddenRef.current.value = editorRef.current.innerHTML;
        }
    }, []);

    // ââ 3. Upload a single base64 data-URL to Vercel Blob âââââââââââââââââââ
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

    // ââ 4. Upload a File/Blob object and return public URL âââââââââââââââââââ
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

    // ââ 5. Insert HTML at the current cursor position ââââââââââââââââââââââââ
    const insertHtmlAtCursor = useCallback((html: string) => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        const range = selection.getRangeAt(0);
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
            selection.removeAllRanges();
            selection.addRange(r2);
        }
    }, []);

    // ââ 6. Handle Paste âââââââââââââââââââââââââââââââââââââââââââââââââââââââ
    const handlePaste = useCallback(
        async (e: React.ClipboardEvent<HTMLDivElement>) => {
            e.preventDefault();
            const cd = e.clipboardData;

            // ââ 6a. If clipboard contains image files directly (e.g. screenshot) ââ
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

            // ââ 6b. HTML paste (Word, browser copy, etc.) ââââââââââââââââââââââââ
            const htmlData = cd.getData('text/html');
            if (htmlData) {
                setUploading(true);
                const cleaned = await processWordHtml(htmlData, uploadDataUrl);
                setUploading(false);
                insertHtmlAtCursor(cleaned);
                sync();
                return;
            }

            // ââ 6c. Plain text fallback âââââââââââââââââââââââââââââââââââââââââââ
            const text = cd.getData('text/plain');
            if (text) {
                // Convert newlines to <br> / paragraphs
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

    // ââ 7. Handle drag-and-drop images âââââââââââââââââââââââââââââââââââââââ
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

    const minHeight = `${rows * 1.5}rem`;

    return (
        <div className="relative">
            {/* Hidden input carries the HTML content on form submit */}
            <input type="hidden" name={name} ref={hiddenRef} defaultValue={defaultValue ?? ''} />

            {/* Upload overlay */}
            {uploading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-slate-900/70 backdrop-blur-sm">
                    <span className="flex items-center gap-2 text-sm text-cyan-300">
                        <Loader2 size={16} className="animate-spin" /> Äang táº£i áº£nh lÃªn...
                    </span>
                </div>
            )}

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 rounded-t-lg border border-b-0 border-slate-600 bg-slate-800/60 px-2 py-1.5 overflow-x-auto">
                {/* Dropdown for Headings */}
                <select 
                    className="bg-transparent text-xs text-slate-300 outline-none hover:bg-slate-700 p-1 rounded cursor-pointer"
                    onChange={(e) => {
                        const val = e.target.value;
                        if (!val) return;
                        // For paragraphs, standard p block. Otherwise H1, H2, H3
                        document.execCommand('formatBlock', false, val);
                        e.target.value = ''; // reset to placeholder
                    }}
                    title="Cỡ chữ / Tiêu đề"
                >
                    <option value="" className="bg-slate-800 text-slate-300" disabled selected>Kiểu Chữ</option>
                    <option value="H1" className="bg-slate-800 text-slate-300 text-lg font-bold">Tiêu đề lớn 1</option>
                    <option value="H2" className="bg-slate-800 text-slate-300 text-base font-bold">Tiêu đề vừa 2</option>
                    <option value="H3" className="bg-slate-800 text-slate-300 text-sm font-bold">Tiêu đề nhỏ 3</option>
                    <option value="P" className="bg-slate-800 text-slate-300">Văn bản thường</option>
                </select>
                <div className="mx-1 h-4 w-px bg-slate-600" />
                
                {/* Color picker */}
                <label className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-slate-300 hover:bg-slate-700 transition cursor-pointer" title="Màu chữ">
                    <span className="text-xs font-bold underline decoration-red-500">A</span>
                    <input 
                        type="color" 
                        className="w-4 h-4 border-none bg-transparent cursor-pointer"
                        onChange={(e) => document.execCommand('foreColor', false, e.target.value)}
                    />
                </label>
                <div className="mx-1 h-4 w-px bg-slate-600" />

                <ToolbarButton onMouseDown={(e) => { e.preventDefault(); document.execCommand('bold'); }} title="In đậm (Ctrl+B)">
                    <strong className="text-xs">B</strong>
                </ToolbarButton>
                <ToolbarButton onMouseDown={(e) => { e.preventDefault(); document.execCommand('italic'); }} title="Italic (Ctrl+I)">
                    <em className="text-xs">I</em>
                </ToolbarButton>
                <ToolbarButton onMouseDown={(e) => { e.preventDefault(); document.execCommand('underline'); }} title="Underline (Ctrl+U)">
                    <span className="text-xs underline">U</span>
                </ToolbarButton>
                <div className="mx-1 h-4 w-px bg-slate-600" />
                <ToolbarButton onMouseDown={(e) => { e.preventDefault(); document.execCommand('insertUnorderedList'); }} title="Bullet list">
                    <span className="text-xs">â¢ â</span>
                </ToolbarButton>
                <ToolbarButton onMouseDown={(e) => { e.preventDefault(); document.execCommand('insertOrderedList'); }} title="Numbered list">
                    <span className="text-xs">1.</span>
                </ToolbarButton>
                <div className="mx-1 h-4 w-px bg-slate-600" />
                <ToolbarButton onMouseDown={(e) => { e.preventDefault(); document.execCommand('justifyLeft'); }} title="Căn trái">
                    <AlignLeft size={13} />
                </ToolbarButton>
                <ToolbarButton onMouseDown={(e) => { e.preventDefault(); document.execCommand('justifyCenter'); }} title="Căn giữa">
                    <AlignCenter size={13} />
                </ToolbarButton>
                <ToolbarButton onMouseDown={(e) => { e.preventDefault(); document.execCommand('justifyRight'); }} title="Căn phải">
                    <AlignRight size={13} />
                </ToolbarButton>
                <ToolbarButton onMouseDown={(e) => { e.preventDefault(); document.execCommand('justifyFull'); }} title="Căn đều">
                    <AlignJustify size={13} />
                </ToolbarButton>
                <div className="mx-1 h-4 w-px bg-slate-600" />
                {/* Image upload button */}
                <label
                    className="flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 text-xs text-slate-300 hover:bg-slate-700 transition"
                    title="Chèn ảnh từ file"
                >
                    <ImagePlus size={13} />
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="sr-only"
                        onChange={async (e) => {
                            const files = Array.from(e.target.files ?? []);
                            if (!files.length) return;
                            // Focus editor so insertHtmlAtCursor has a valid selection
                            editorRef.current?.focus();
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
                <span className="ml-auto text-xs text-slate-500">Ctrl+V Äá» dÃ¡n tá»« Word (kÃ¦m áº£nh)</span>
            </div>

            {/* Editable area */}
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={sync}
                onPaste={handlePaste}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className={
                    className ??
                    'document-paper rich-editor-area border-none outline-none transition text-base'
                }
                style={{ minHeight, overflowY: 'auto', lineHeight: '1.7' }}
                data-placeholder="Nháº­p ná»i dung hÆ°á»ng dáº«n, quy trÃ¬nh hoáº·c thÃ´ng tin ká»¹ thuáº­t táº¡i ÄÃ¢y..."
            />
        </div>
    );
}

// ââ Tiny toolbar button âââââââââââââââââââââââââââââââââââââââââââââââââââââ
function ToolbarButton({
    children,
    onMouseDown,
    title,
}: {
    children: React.ReactNode;
    onMouseDown: (e: React.MouseEvent) => void;
    title?: string;
}) {
    return (
        <button
            type="button"
            onMouseDown={onMouseDown}
            title={title}
            className="flex h-6 min-w-[1.5rem] items-center justify-center rounded px-1.5 text-slate-300 hover:bg-slate-700 transition"
        >
            {children}
        </button>
    );
}

// ââ Helpers ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * Clean up Word/browser clipboard HTML:
 *  - Remove Word-specific XML/conditional comments
 *  - Strip dangerous tags (script, style, etc.)
 *  - Upload base64 images to Vercel Blob and replace src
 *  - Keep structural tags: p, br, strong, em, u, ul, ol, li, h1-h6, table, img
 */
async function processWordHtml(
    html: string,
    uploadDataUrl: (url: string) => Promise<string | null>,
): Promise<string> {
    // Strip Word XML preamble / conditional comments
    let cleaned = html
        .replace(/<!--\[if[\s\S]*?<!\[endif\]-->/gi, '')
        .replace(/<xml[\s\S]*?<\/xml>/gi, '')
        .replace(/<o:[\s\S]*?<\/o:[^>]+>/gi, '')
        .replace(/<w:[\s\S]*?<\/w:[^>]+>/gi, '');

    const parser = new DOMParser();
    const doc = parser.parseFromString(cleaned, 'text/html');

    // Remove script, style, meta, link, head tags
    doc.querySelectorAll('script, style, meta, link, head').forEach((el) => el.remove());

    // Upload base64 images
    const images = Array.from(doc.querySelectorAll('img'));
    await Promise.all(
        images.map(async (img) => {
            if (img.src.startsWith('data:')) {
                const url = await uploadDataUrl(img.src);
                if (url) {
                    img.src = url;
                    img.style.maxWidth = '100%';
                } else {
                    // If upload fails, keep image as base64 (may be large but functional)
                    img.style.maxWidth = '100%';
                }
            }
            // Remove Word-specific attributes but keep src, alt, width, height
            Array.from(img.attributes).forEach((attr) => {
                if (!['src', 'alt', 'width', 'height', 'style'].includes(attr.name)) {
                    img.removeAttribute(attr.name);
                }
            });
        }),
    );

    // Remove mso-* inline styles but keep basic styles
    doc.querySelectorAll('[style]').forEach((el) => {
        const style = el.getAttribute('style') ?? '';
        // Remove mso-* properties
        const cleaned = style
            .split(';')
            .filter((rule) => !rule.trim().toLowerCase().startsWith('mso-'))
            .join(';');
        if (cleaned.trim()) {
            el.setAttribute('style', cleaned);
        } else {
            el.removeAttribute('style');
        }
    });

    // Remove class attributes (Word uses e.g. class="MsoNormal")
    doc.querySelectorAll('[class]').forEach((el) => el.removeAttribute('class'));

    return doc.body.innerHTML;
}
