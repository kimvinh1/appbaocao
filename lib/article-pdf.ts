import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument, rgb, type PDFFont, type PDFPage, type RGB } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { normalizeModuleKey } from '@/lib/module-theme';
import { getArticleCategoryLabel } from '@/lib/knowledge-center';

const PAGE_SIZE: [number, number] = [595.28, 841.89];
const PAGE_MARGIN = 56;
const FOOTER_SPACE = 28;
const FONT_PATH = path.join(process.cwd(), 'assets/fonts', 'NotoSans-Regular.ttf');

type ArticlePdfSource = {
  id: string;
  title: string;
  content: string;
  author: string;
  category: string;
  module: string;
  tags: string;
  updatedAt: Date;
  attachmentUrl: string | null;
};

type RenderState = {
  page: PDFPage;
  pages: PDFPage[];
  y: number;
};

function slugify(input: string) {
  const base = input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return base || 'tai-lieu';
}

function getCategoryLabel(category: string) {
  return getArticleCategoryLabel(category);
}

// ── HTML → structured blocks ──────────────────────────────────────────────────

type ContentBlock =
  | { type: 'h1' | 'h2' | 'h3'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'listItem'; text: string; bullet: string }
  | { type: 'spacer' };

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, '');
}

function innerText(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function htmlToBlocks(html: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];

  // Normalize: remove script/style
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '');

  // Split by block-level elements
  const blockPattern =
    /(<h[1-3][^>]*>[\s\S]*?<\/h[1-3]>|<li[^>]*>[\s\S]*?<\/li>|<p[^>]*>[\s\S]*?<\/p>|<div[^>]*>[\s\S]*?<\/div>|<br\s*\/?>)/gi;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const re = new RegExp(blockPattern.source, 'gi');

  while ((match = re.exec(cleaned)) !== null) {
    // Any text between block elements
    const before = cleaned.slice(lastIndex, match.index).replace(/<[^>]+>/g, '').trim();
    if (before) {
      const text = decodeEntities(before.replace(/\s+/g, ' ').trim());
      if (text) blocks.push({ type: 'paragraph', text });
    }

    const tag = match[0];
    const tagNameMatch = tag.match(/^<(h[1-3]|li|p|div|br)/i);
    const tagName = tagNameMatch?.[1]?.toLowerCase() ?? '';

    if (tagName === 'h1') {
      const text = innerText(tag);
      if (text) blocks.push({ type: 'h1', text });
    } else if (tagName === 'h2') {
      const text = innerText(tag);
      if (text) blocks.push({ type: 'h2', text });
    } else if (tagName === 'h3') {
      const text = innerText(tag);
      if (text) blocks.push({ type: 'h3', text });
    } else if (tagName === 'li') {
      const text = innerText(tag);
      if (text) blocks.push({ type: 'listItem', text, bullet: '•' });
    } else if (tagName === 'p' || tagName === 'div') {
      const text = innerText(tag);
      if (text) blocks.push({ type: 'paragraph', text });
      else blocks.push({ type: 'spacer' });
    } else if (tagName === 'br') {
      blocks.push({ type: 'spacer' });
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  const tail = cleaned.slice(lastIndex).replace(/<[^>]+>/g, '').trim();
  if (tail) {
    const text = decodeEntities(tail.replace(/\s+/g, ' ').trim());
    if (text) blocks.push({ type: 'paragraph', text });
  }

  // Deduplicate consecutive spacers
  return blocks.filter((b, i) => {
    if (b.type === 'spacer' && i > 0 && blocks[i - 1].type === 'spacer') return false;
    return true;
  });
}

function contentToBlocks(content: string): ContentBlock[] {
  const isHtml = /^[\s]*<[a-zA-Z]/.test(content);
  if (isHtml) {
    return htmlToBlocks(content);
  }
  // Plain text
  return content.split('\n').map((line) =>
    line.trim() === '' ? ({ type: 'spacer' } as ContentBlock) : ({ type: 'paragraph', text: line.trim() } as ContentBlock)
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function getModuleAccent(module: string): RGB {
  switch (normalizeModuleKey(module)) {
    case 'illumina':
      return rgb(0.91, 0.43, 0.13);
    case 'vi-sinh':
      return rgb(0.84, 0.2, 0.2);
    case 'cepheid':
      return rgb(0.02, 0.64, 0.91);
    default:
      return rgb(0.3, 0.35, 0.43);
  }
}

function breakLongWord(word: string, font: PDFFont, fontSize: number, maxWidth: number) {
  const segments: string[] = [];
  let current = '';

  for (const character of word) {
    const candidate = current + character;
    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth || current.length === 0) {
      current = candidate;
      continue;
    }

    segments.push(current);
    current = character;
  }

  if (current) {
    segments.push(current);
  }

  return segments;
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number) {
  const normalized = text.replace(/\s+/g, ' ').trim();

  if (!normalized) {
    return [];
  }

  const words = normalized.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
      currentLine = candidate;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    if (font.widthOfTextAtSize(word, fontSize) <= maxWidth) {
      currentLine = word;
      continue;
    }

    const wordSegments = breakLongWord(word, font, fontSize, maxWidth);
    lines.push(...wordSegments.slice(0, -1));
    currentLine = wordSegments[wordSegments.length - 1] ?? '';
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function addPage(pdfDoc: PDFDocument, pages: PDFPage[]) {
  const page = pdfDoc.addPage(PAGE_SIZE);
  pages.push(page);
  return page;
}

function ensureSpace(state: RenderState, pdfDoc: PDFDocument, requiredHeight: number) {
  if (state.y - requiredHeight >= PAGE_MARGIN + FOOTER_SPACE) {
    return;
  }

  state.page = addPage(pdfDoc, state.pages);
  state.y = PAGE_SIZE[1] - PAGE_MARGIN;
}

function drawWrappedParagraph(
  state: RenderState,
  pdfDoc: PDFDocument,
  font: PDFFont,
  text: string,
  options: {
    size: number;
    color: RGB;
    lineHeight: number;
    maxWidth: number;
    gapAfter?: number;
  }
) {
  const lines = wrapText(text, font, options.size, options.maxWidth);
  if (lines.length === 0) {
    state.y -= options.gapAfter ?? options.lineHeight * 0.4;
    return;
  }

  for (const line of lines) {
    ensureSpace(state, pdfDoc, options.lineHeight);
    state.page.drawText(line, {
      x: PAGE_MARGIN,
      y: state.y,
      size: options.size,
      font,
      color: options.color,
    });
    state.y -= options.lineHeight;
  }

  state.y -= options.gapAfter ?? 0;
}

export async function buildArticlePdf(article: ArticlePdfSource) {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const fontBytes = await readFile(FONT_PATH);
  const bodyFont = await pdfDoc.embedFont(fontBytes, { subset: true });
  const pages: PDFPage[] = [];
  const accentColor = getModuleAccent(article.module);
  const textColor = rgb(0.12, 0.16, 0.22);
  const mutedColor = rgb(0.35, 0.39, 0.46);
  const contentWidth = PAGE_SIZE[0] - PAGE_MARGIN * 2;

  const state: RenderState = {
    page: addPage(pdfDoc, pages),
    pages,
    y: PAGE_SIZE[1] - PAGE_MARGIN,
  };

  drawWrappedParagraph(state, pdfDoc, bodyFont, 'Knowledge Hub - Tài liệu kỹ thuật', {
    size: 11,
    color: accentColor,
    lineHeight: 15,
    maxWidth: contentWidth,
    gapAfter: 8,
  });

  drawWrappedParagraph(state, pdfDoc, bodyFont, article.title, {
    size: 23,
    color: textColor,
    lineHeight: 30,
    maxWidth: contentWidth,
    gapAfter: 10,
  });

  const metadata = [
    `Mảng: ${normalizeModuleKey(article.module)}`,
    `Loại: ${getCategoryLabel(article.category)}`,
    `Tác giả: ${article.author}`,
    `Cập nhật: ${article.updatedAt.toLocaleDateString('vi-VN')}`,
  ].join(' | ');

  drawWrappedParagraph(state, pdfDoc, bodyFont, metadata, {
    size: 10,
    color: mutedColor,
    lineHeight: 14,
    maxWidth: contentWidth,
    gapAfter: 10,
  });

  const tags = article.tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

  if (tags.length > 0) {
    drawWrappedParagraph(state, pdfDoc, bodyFont, `Tags: ${tags.join(', ')}`, {
      size: 10,
      color: mutedColor,
      lineHeight: 14,
      maxWidth: contentWidth,
      gapAfter: 14,
    });
  } else {
    state.y -= 6;
  }

  // ── Render content (HTML or plain text) ──────────────────────────────────
  const blocks = contentToBlocks(article.content);

  for (const block of blocks) {
    if (block.type === 'spacer') {
      state.y -= 8;
      continue;
    }

    if (block.type === 'h1') {
      state.y -= 4;
      drawWrappedParagraph(state, pdfDoc, bodyFont, block.text, {
        size: 17,
        color: textColor,
        lineHeight: 24,
        maxWidth: contentWidth,
        gapAfter: 6,
      });
      continue;
    }

    if (block.type === 'h2') {
      state.y -= 4;
      drawWrappedParagraph(state, pdfDoc, bodyFont, block.text, {
        size: 14,
        color: textColor,
        lineHeight: 20,
        maxWidth: contentWidth,
        gapAfter: 4,
      });
      continue;
    }

    if (block.type === 'h3') {
      drawWrappedParagraph(state, pdfDoc, bodyFont, block.text, {
        size: 12,
        color: accentColor,
        lineHeight: 18,
        maxWidth: contentWidth,
        gapAfter: 4,
      });
      continue;
    }

    if (block.type === 'listItem') {
      drawWrappedParagraph(state, pdfDoc, bodyFont, `${block.bullet}  ${block.text}`, {
        size: 11,
        color: textColor,
        lineHeight: 17,
        maxWidth: contentWidth - 12,
        gapAfter: 2,
      });
      continue;
    }

    // paragraph
    drawWrappedParagraph(state, pdfDoc, bodyFont, block.text, {
      size: 11,
      color: textColor,
      lineHeight: 17,
      maxWidth: contentWidth,
      gapAfter: 4,
    });
  }

  if (article.attachmentUrl) {
    state.y -= 6;
    drawWrappedParagraph(state, pdfDoc, bodyFont, 'Tài liệu đính kèm:', {
      size: 11,
      color: accentColor,
      lineHeight: 15,
      maxWidth: contentWidth,
      gapAfter: 4,
    });

    drawWrappedParagraph(state, pdfDoc, bodyFont, article.attachmentUrl, {
      size: 10,
      color: mutedColor,
      lineHeight: 14,
      maxWidth: contentWidth,
      gapAfter: 6,
    });
  }

  pages.forEach((page, index) => {
    page.drawLine({
      start: { x: PAGE_MARGIN, y: 36 },
      end: { x: PAGE_SIZE[0] - PAGE_MARGIN, y: 36 },
      thickness: 1,
      color: rgb(0.85, 0.88, 0.92),
    });

    page.drawText(`Trang ${index + 1}/${pages.length}`, {
      x: PAGE_MARGIN,
      y: 20,
      size: 9,
      font: bodyFont,
      color: mutedColor,
    });

    page.drawText(`ID: ${article.id}`, {
      x: PAGE_SIZE[0] - PAGE_MARGIN - bodyFont.widthOfTextAtSize(`ID: ${article.id}`, 9),
      y: 20,
      size: 9,
      font: bodyFont,
      color: mutedColor,
    });
  });

  const bytes = await pdfDoc.save();
  return {
    bytes,
    fileName: `${slugify(article.title)}.pdf`,
  };
}
