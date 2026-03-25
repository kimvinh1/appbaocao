import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument, rgb, type PDFFont, type PDFPage, type RGB } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { normalizeModuleKey } from '@/lib/module-theme';

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
  switch (category) {
    case 'quy-trinh':
      return 'Quy trình / SOP';
    case 'huong-dan':
      return 'Hướng dẫn sử dụng';
    case 'troubleshooting':
      return 'Xử lý sự cố';
    default:
      return 'FAQ';
  }
}

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

  for (const rawLine of article.content.split('\n')) {
    if (!rawLine.trim()) {
      state.y -= 8;
      continue;
    }

    drawWrappedParagraph(state, pdfDoc, bodyFont, rawLine, {
      size: 12,
      color: textColor,
      lineHeight: 18,
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
