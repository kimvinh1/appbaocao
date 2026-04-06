'use client';

import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import type { Editor as TiptapEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CharacterCount from '@tiptap/extension-character-count';
import Dropcursor from '@tiptap/extension-dropcursor';
import Gapcursor from '@tiptap/extension-gapcursor';
import ImageExt from '@tiptap/extension-image';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import { Table } from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import Typography from '@tiptap/extension-typography';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { useRef, useCallback, useState, useEffect } from 'react';

const AUTOSAVE_DELAY = 3000; // ms sau lần gõ cuối mới lưu
const STORAGE_PREFIX = 'tiptap-draft-';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Link2, Link2Off, ImagePlus, Undo2, Redo2,
  Highlighter, Loader2, Quote, Minus,
} from 'lucide-react';

// ── Custom ResizableImage NodeView ────────────────────────────────────────────

const IMAGE_WIDTHS = ['25%', '50%', '75%', '100%'];

function ImageNodeView({ node, updateAttributes, selected }: NodeViewProps) {
  const { src, alt, width = '100%' } = node.attrs as { src: string; alt: string; width: string };

  return (
    <NodeViewWrapper className="tiptap-image-wrapper" style={{ display: 'block', textAlign: 'center', margin: '1.25rem 0' }}>
      <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
        <img
          src={src}
          alt={alt || ''}
          style={{
            width,
            maxWidth: '100%',
            height: 'auto',
            display: 'block',
            margin: '0 auto',
            borderRadius: '8px',
            border: '1px solid #e4e4e7',
            boxShadow: selected
              ? '0 0 0 3px #06b6d4, 0 2px 8px rgba(0,0,0,0.12)'
              : '0 2px 8px rgba(0,0,0,0.10)',
            transition: 'box-shadow 0.15s',
          }}
        />
        {selected && (
          <div style={{
            position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)',
            display: 'flex', alignItems: 'center', gap: '3px',
            background: 'rgba(15,23,42,0.92)', borderRadius: '8px', padding: '4px 8px',
            backdropFilter: 'blur(4px)', zIndex: 10, whiteSpace: 'nowrap',
          }}>
            <span style={{ fontSize: '10px', color: '#94a3b8', marginRight: '2px' }}>Kích thước:</span>
            {IMAGE_WIDTHS.map((w) => (
              <button
                key={w}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); updateAttributes({ width: w }); }}
                style={{
                  background: width === w ? '#06b6d4' : 'transparent',
                  color: width === w ? '#fff' : '#cbd5e1',
                  border: 'none', borderRadius: '4px',
                  padding: '2px 7px', fontSize: '11px', fontWeight: 500, cursor: 'pointer',
                }}
              >
                {w}
              </button>
            ))}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}

const ResizableImage = ImageExt.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        renderHTML: (attrs) => ({ width: attrs.width }),
        parseHTML: (el) => el.getAttribute('width') || '100%',
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});

// ── Props ────────────────────────────────────────────────────────────────────

interface RichContentEditorProps {
  name: string;
  defaultValue?: string;
  className?: string;
  rows?: number;
  storageKey?: string; // key cho localStorage autosave (e.g. "new-article", "edit-abc123")
}

function getSerializedContent(editor: TiptapEditor | null | undefined) {
  if (!editor) return '';
  if (editor.isEmpty) return '';
  return editor.getHTML();
}

// ── Main Component ────────────────────────────────────────────────────────────

export function RichContentEditor({ name, defaultValue, rows = 18, storageKey }: RichContentEditorProps) {
  const hiddenRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);

  // ── Autosave state ────────────────────────────────────────────────────────
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [draftBanner, setDraftBanner] = useState<{ html: string; savedAt: Date } | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      CharacterCount.configure({ limit: 50000 }),
      Dropcursor.configure({ color: '#0ea5e9', width: 3 }),
      Gapcursor,
      ResizableImage.configure({ inline: false }),
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Typography,
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer' } }),
      Placeholder.configure({ placeholder: 'Nhập nội dung hướng dẫn, quy trình hoặc thông tin kỹ thuật tại đây...' }),
    ],
    content: defaultValue || '',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = getSerializedContent(editor);
      if (hiddenRef.current) hiddenRef.current.value = html;

      // ── Autosave vào localStorage (debounced 3s) ──────────────────────────
      if (storageKey) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
          try {
            localStorage.setItem(
              STORAGE_PREFIX + storageKey,
              JSON.stringify({ html, savedAt: new Date().toISOString() }),
            );
            setSavedAt(new Date());
          } catch { /* localStorage không khả dụng */ }
        }, AUTOSAVE_DELAY);
      }
    },
    editorProps: {
      attributes: { class: 'tiptap-prose focus:outline-none' },
      handleDrop: (_view, event, _slice, moved) => {
        if (moved) return false;
        const files = Array.from(event.dataTransfer?.files ?? []).filter((f) => f.type.startsWith('image/'));
        if (!files.length) return false;
        event.preventDefault();
        void handleImageFiles(files);
        return true;
      },
      handlePaste: (_view, event) => {
        const items = Array.from(event.clipboardData?.items ?? []);
        const imgItem = items.find((i) => i.kind === 'file' && i.type.startsWith('image/'));
        if (!imgItem) return false;
        const file = imgItem.getAsFile();
        if (!file) return false;
        event.preventDefault();
        void handleImageFiles([file]);
        return true;
      },
    },
  });

  useEffect(() => {
    if (hiddenRef.current && editor) hiddenRef.current.value = getSerializedContent(editor);
  }, [editor]);

  useEffect(() => {
    if (!editor || !rootRef.current) return;
    const form = rootRef.current.closest('form');
    if (!form) return;

    const syncHiddenInput = () => {
      if (hiddenRef.current) hiddenRef.current.value = getSerializedContent(editor);
    };

    form.addEventListener('submit', syncHiddenInput, true);
    form.addEventListener('formdata', syncHiddenInput);

    return () => {
      form.removeEventListener('submit', syncHiddenInput, true);
      form.removeEventListener('formdata', syncHiddenInput);
    };
  }, [editor]);

  // ── Khôi phục bản nháp từ localStorage khi mount ─────────────────────────
  useEffect(() => {
    if (!editor || !storageKey) return;
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + storageKey);
      if (!raw) return;
      const data = JSON.parse(raw) as { html: string; savedAt: string };
      const hasContent = defaultValue && defaultValue.trim().length > 10;
      if (!hasContent) {
        // Bài mới: restore thầm lặng
        editor.commands.setContent(data.html);
        if (hiddenRef.current) hiddenRef.current.value = data.html;
        setSavedAt(new Date(data.savedAt));
      } else {
        // Bài đang edit: hỏi user trước
        setDraftBanner({ html: data.html, savedAt: new Date(data.savedAt) });
      }
    } catch { /* bỏ qua data lỗi */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, storageKey]);

  // ── Cleanup timer khi unmount ─────────────────────────────────────────────
  useEffect(() => {
    return () => clearTimeout(saveTimerRef.current);
  }, []);

  // ── Upload ────────────────────────────────────────────────────────────────

  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const res = await fetch('/api/upload-inline-image', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dataUrl: reader.result }),
          });
          const json = await res.json();
          resolve(json.url ?? null);
        } catch { resolve(null); }
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleImageFiles = useCallback(async (files: File[]) => {
    if (!editor) return;
    setUploading(true);
    for (const file of files) {
      const url = await uploadFile(file);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (url) editor.chain().focus().setImage({ src: url } as any).run();
    }
    setUploading(false);
  }, [editor, uploadFile]);

  // ── Draft banner callbacks ─────────────────────────────────────────────────
  const restoreDraft = useCallback(() => {
    if (!editor || !draftBanner) return;
    editor.commands.setContent(draftBanner.html);
    if (hiddenRef.current) hiddenRef.current.value = draftBanner.html;
    setSavedAt(draftBanner.savedAt);
    setDraftBanner(null);
  }, [editor, draftBanner]);

  const discardDraft = useCallback(() => {
    if (!storageKey) return;
    try { localStorage.removeItem(STORAGE_PREFIX + storageKey); } catch { /* ignore */ }
    setDraftBanner(null);
    setSavedAt(null);
  }, [storageKey]);

  const applyLink = useCallback(() => {
    if (!editor) return;
    const url = linkUrl.trim();
    if (!url) { editor.chain().focus().unsetLink().run(); }
    else {
      const href = url.startsWith('http') ? url : `https://${url}`;
      editor.chain().focus().setLink({ href }).run();
    }
    setShowLinkInput(false);
    setLinkUrl('');
  }, [editor, linkUrl]);

  const insertTemplateBlock = useCallback((type: 'note' | 'warning' | 'steps') => {
    if (!editor) return;

    if (type === 'note') {
      editor.chain().focus().insertContent(
        '<blockquote data-callout="note"><p><strong>Lưu ý:</strong> Điền thông tin quan trọng tại đây.</p></blockquote><p></p>',
      ).run();
      return;
    }

    if (type === 'warning') {
      editor.chain().focus().insertContent(
        '<blockquote data-callout="warning"><p><strong>Cảnh báo:</strong> Mô tả rủi ro hoặc điểm cần kiểm tra kỹ.</p></blockquote><p></p>',
      ).run();
      return;
    }

    editor.chain().focus().insertContent(
      '<h3>Bước thực hiện</h3><ol><li>Chuẩn bị mẫu / thiết bị.</li><li>Thực hiện thao tác chính.</li><li>Kiểm tra kết quả và xác nhận hoàn tất.</li></ol><p></p>',
    ).run();
  }, [editor]);

  const minHeight = `${rows * 1.75}rem`;

  if (!editor) {
    return <div style={{ minHeight }} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white" />;
  }

  return (
    <div ref={rootRef} className="relative rounded-xl border border-slate-200 dark:border-slate-700 overflow-visible shadow-sm">
      <input type="hidden" name={name} ref={hiddenRef} defaultValue={defaultValue ?? ''} />

      {uploading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm rounded-xl">
          <span className="flex items-center gap-2 text-sm text-cyan-600">
            <Loader2 size={16} className="animate-spin" /> Đang tải ảnh lên...
          </span>
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1.5 rounded-t-xl sticky top-0 z-10">

        {/* Paragraph style */}
        <select
          value={
            editor.isActive('heading', { level: 1 }) ? 'h1'
              : editor.isActive('heading', { level: 2 }) ? 'h2'
              : editor.isActive('heading', { level: 3 }) ? 'h3'
              : 'p'
          }
          onChange={(e) => {
            const v = e.target.value;
            if (v === 'p') editor.chain().focus().setParagraph().run();
            else editor.chain().focus().toggleHeading({ level: parseInt(v[1]) as 1 | 2 | 3 }).run();
          }}
          className="bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 text-xs rounded px-1.5 py-1 cursor-pointer outline-none"
        >
          <option value="p">Văn bản</option>
          <option value="h1">Tiêu đề 1</option>
          <option value="h2">Tiêu đề 2</option>
          <option value="h3">Tiêu đề 3</option>
        </select>

        <Sep />
        <TBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Đậm (Ctrl+B)"><Bold size={13} /></TBtn>
        <TBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Nghiêng (Ctrl+I)"><Italic size={13} /></TBtn>
        <TBtn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Gạch chân (Ctrl+U)"><UnderlineIcon size={13} /></TBtn>
        <TBtn active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="Gạch ngang"><Strikethrough size={13} /></TBtn>

        <Sep />

        {/* Highlight với color picker */}
        <label
          className={`flex h-7 items-center gap-1 rounded px-1.5 cursor-pointer text-xs transition hover:bg-slate-200 dark:hover:bg-slate-700 ${editor.isActive('highlight') ? 'bg-yellow-100 dark:bg-yellow-500/20' : ''}`}
          title="Màu nền chữ (Highlight)"
        >
          <Highlighter size={13} className={editor.isActive('highlight') ? 'text-yellow-500' : 'text-slate-600 dark:text-slate-300'} />
          <input
            type="color"
            className="w-4 h-4 rounded cursor-pointer border-none bg-transparent p-0"
            defaultValue="#fef08a"
            onChange={(e) => editor.chain().focus().setHighlight({ color: e.target.value }).run()}
          />
        </label>

        <Sep />

        <TBtn active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Căn trái"><AlignLeft size={13} /></TBtn>
        <TBtn active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Căn giữa"><AlignCenter size={13} /></TBtn>
        <TBtn active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Căn phải"><AlignRight size={13} /></TBtn>
        <TBtn active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()} title="Căn đều"><AlignJustify size={13} /></TBtn>

        <Sep />

        <TBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Danh sách gạch đầu dòng"><List size={13} /></TBtn>
        <TBtn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Danh sách đánh số"><ListOrdered size={13} /></TBtn>
        <TBtn active={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()} title="Checklist">CV</TBtn>
        <TBtn active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Trích dẫn"><Quote size={13} /></TBtn>

        <Sep />

        {/* Link */}
        <div className="relative">
          <TBtn
            active={editor.isActive('link')}
            onClick={() => {
              if (editor.isActive('link')) { editor.chain().focus().unsetLink().run(); }
              else { setLinkUrl(editor.getAttributes('link').href || ''); setShowLinkInput((v) => !v); }
            }}
            title={editor.isActive('link') ? 'Gỡ link' : 'Thêm link'}
          >
            {editor.isActive('link') ? <Link2Off size={13} /> : <Link2 size={13} />}
          </TBtn>
          {showLinkInput && (
            <div className="absolute top-full left-0 mt-1 z-50 flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl p-2 min-w-[260px]">
              <input
                autoFocus
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') applyLink(); if (e.key === 'Escape') setShowLinkInput(false); }}
                placeholder="https://..."
                className="flex-1 text-xs px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:border-cyan-400"
              />
              <button type="button" onClick={applyLink} className="rounded bg-cyan-500 px-2.5 py-1 text-xs text-white hover:bg-cyan-600 transition">OK</button>
            </div>
          )}
        </div>

        {/* Image */}
        <label className="flex h-7 items-center cursor-pointer rounded px-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition" title="Chèn ảnh (hoặc kéo thả / dán)">
          <ImagePlus size={13} />
          <input type="file" accept="image/*" multiple className="sr-only"
            onChange={(e) => { const files = Array.from(e.target.files ?? []); if (files.length) void handleImageFiles(files); e.target.value = ''; }} />
        </label>

        <TBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Đường kẻ phân cách"><Minus size={13} /></TBtn>
        <TBtn onClick={() => insertTemplateBlock('note')} title="Chèn khối lưu ý">Lưu ý</TBtn>
        <TBtn onClick={() => insertTemplateBlock('warning')} title="Chèn khối cảnh báo">Cảnh báo</TBtn>
        <TBtn onClick={() => insertTemplateBlock('steps')} title="Chèn các bước mẫu">Bước</TBtn>

        <Sep />

        <TBtn onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Chèn bảng">Bảng</TBtn>
        {editor.isActive('table') ? (
          <>
            <TBtn onClick={() => editor.chain().focus().addRowAfter().run()} title="Thêm hàng">+H</TBtn>
            <TBtn onClick={() => editor.chain().focus().addColumnAfter().run()} title="Thêm cột">+C</TBtn>
            <TBtn onClick={() => editor.chain().focus().deleteTable().run()} title="Xóa bảng">X Bảng</TBtn>
          </>
        ) : null}

        <Sep />

        <TBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Hoàn tác (Ctrl+Z)"><Undo2 size={13} /></TBtn>
        <TBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Làm lại (Ctrl+Y)"><Redo2 size={13} /></TBtn>

        <span className="ml-auto hidden sm:flex items-center gap-2 pr-1 shrink-0">
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            {editor.storage.characterCount.characters()} ký tự
          </span>
          {storageKey && savedAt ? (
            <span className="text-[10px] text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
              ✓ Đã lưu lúc {savedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 dark:text-slate-500">Ctrl+V ảnh · Kéo thả ảnh vào</span>
          )}
        </span>
      </div>

      {/* ── Banner khôi phục bản nháp (chỉ hiện khi edit bài đã có content) ── */}
      {draftBanner && (
        <div className="flex items-center gap-3 border-b border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs">
          <span className="text-amber-300">
            Có bản nháp chưa lưu từ{' '}
            {draftBanner.savedAt.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
          </span>
          <button
            type="button"
            onClick={restoreDraft}
            className="rounded bg-amber-500 px-2 py-0.5 text-white hover:bg-amber-400 transition"
          >
            Khôi phục
          </button>
          <button
            type="button"
            onClick={discardDraft}
            className="rounded bg-slate-700 px-2 py-0.5 text-slate-300 hover:bg-slate-600 transition"
          >
            Bỏ qua
          </button>
        </div>
      )}

      {/* ── Editor area ── */}
      <EditorContent editor={editor} className="tiptap-content-area" style={{ minHeight }} />
    </div>
  );
}

// ── Helper sub-components ─────────────────────────────────────────────────────

function Sep() {
  return <div className="mx-0.5 h-5 w-px bg-slate-300 dark:bg-slate-600 shrink-0" />;
}

function TBtn({
  children, onClick, active, disabled, title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick?.(); }}
      title={title}
      disabled={disabled}
      className={[
        'flex h-7 min-w-[1.75rem] items-center justify-center rounded px-1.5 text-xs transition shrink-0',
        active ? 'bg-slate-200 dark:bg-slate-600 text-slate-900 dark:text-white'
               : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700',
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
