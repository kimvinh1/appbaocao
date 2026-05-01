import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import { normalizeModuleKey } from '@/lib/module-theme';
import { getArticleCategoryLabel } from '@/lib/knowledge-center';

const FONT_PATH = path.join(process.cwd(), 'assets/fonts', 'NotoSans-Regular.ttf');

type ArticlePdfImage = {
  imageUrl: string;
};

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
  images?: ArticlePdfImage[];
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getContentHtml(content: string) {
  const isHtml = /^[\s]*<[a-zA-Z]/.test(content);

  if (isHtml) {
    return content;
  }

  return content
    .split('\n')
    .map((line) => (line.trim() ? `<p>${escapeHtml(line.trim())}</p>` : '<p>&nbsp;</p>'))
    .join('');
}

function getModuleLabel(module: string) {
  const normalized = normalizeModuleKey(module);
  if (normalized === 'illumina') return 'Illumina';
  if (normalized === 'vi-sinh') return 'Vi Sinh';
  if (normalized === 'cepheid') return 'Cepheid';
  return module;
}

function getModuleAccent(module: string) {
  const normalized = normalizeModuleKey(module);
  if (normalized === 'illumina') return '#ea6d22';
  if (normalized === 'vi-sinh') return '#ef4444';
  if (normalized === 'cepheid') return '#06b6d4';
  return '#475569';
}

async function getFontFaceCss() {
  const fontBytes = await readFile(FONT_PATH);
  const fontBase64 = fontBytes.toString('base64');
  return `
    @font-face {
      font-family: 'PortalNoto';
      src: url(data:font/ttf;base64,${fontBase64}) format('truetype');
      font-weight: 400 700;
      font-style: normal;
      font-display: swap;
    }
  `;
}

function buildArticleHtml(article: ArticlePdfSource, fontFaceCss: string) {
  const accent = getModuleAccent(article.module);
  const contentHtml = getContentHtml(article.content);
  const tags = article.tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
  const attachmentSection = article.attachmentUrl
    ? `
      <section class="attachment-box">
        <p class="attachment-title">Tài liệu đính kèm</p>
        <p class="attachment-link">${escapeHtml(article.attachmentUrl)}</p>
      </section>
    `
    : '';
  const gallerySection = article.images && article.images.length > 0
    ? `
      <section class="gallery">
        <h2>Ảnh đính kèm</h2>
        <div class="gallery-grid">
          ${article.images
            .map((image) => `<img src="${escapeHtml(image.imageUrl)}" alt="Ảnh đính kèm" />`)
            .join('')}
        </div>
      </section>
    `
    : '';

  return `<!DOCTYPE html>
  <html lang="vi">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>
        ${fontFaceCss}
        :root {
          --accent: ${accent};
          --text: #0f172a;
          --muted: #64748b;
          --border: #dbe2ea;
          --surface: #ffffff;
          --surface-soft: #f8fafc;
        }
        * { box-sizing: border-box; }
        html, body {
          margin: 0;
          padding: 0;
          background: #eef2f7;
          color: var(--text);
          font-family: 'PortalNoto', 'Inter', 'Segoe UI', system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        body { padding: 28px; }
        .sheet {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 44px 52px;
          box-shadow: 0 12px 40px rgba(15, 23, 42, 0.08);
        }
        .eyebrow {
          margin: 0 0 10px;
          color: var(--accent);
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        h1 {
          margin: 0;
          font-size: 38px;
          line-height: 1.15;
          letter-spacing: -0.04em;
        }
        .meta {
          margin-top: 18px;
          color: var(--muted);
          font-size: 14px;
          line-height: 1.7;
        }
        .tags {
          margin-top: 12px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .tag {
          border: 1px solid var(--border);
          border-radius: 999px;
          padding: 5px 10px;
          background: var(--surface-soft);
          color: #334155;
          font-size: 12px;
        }
        .content {
          margin-top: 30px;
          font-size: 16px;
          line-height: 1.9;
        }
        .content > *:first-child { margin-top: 0; }
        .content > *:last-child { margin-bottom: 0; }
        .content p { margin: 0 0 1rem; }
        .content h1, .content h2, .content h3, .content h4 {
          margin-top: 1.4rem;
          margin-bottom: 0.7rem;
          line-height: 1.3;
        }
        .content h1 { font-size: 2rem; }
        .content h2 {
          font-size: 1.5rem;
          padding-bottom: 0.35rem;
          border-bottom: 2px solid #e5e7eb;
        }
        .content h3 { font-size: 1.2rem; }
        .content ul, .content ol {
          margin: 0.8rem 0 1rem;
          padding-left: 1.9rem;
        }
        .content li {
          margin-bottom: 0.45rem;
          padding-left: 0.2rem;
        }
        .content li > p { margin-bottom: 0.35rem; }
        .content ul[data-type="taskList"] {
          list-style: none;
          padding-left: 0;
        }
        .content li[data-type="taskItem"] {
          display: flex;
          align-items: flex-start;
          gap: 0.65rem;
          padding-left: 0;
        }
        .content li[data-type="taskItem"] > label {
          margin-top: 0.15rem;
          flex-shrink: 0;
        }
        .content li[data-checked="true"] > div {
          color: var(--muted);
          text-decoration: line-through;
        }
        .content a {
          color: #2563eb;
          text-decoration: underline;
          word-break: break-word;
        }
        .content img {
          display: block;
          max-width: 100%;
          height: auto;
          margin: 1.25rem auto;
          border-radius: 12px;
          border: 1px solid var(--border);
          box-shadow: 0 6px 22px rgba(15, 23, 42, 0.1);
        }
        .content table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          margin: 1rem 0 1.25rem;
        }
        .content th, .content td {
          border: 1px solid var(--border);
          padding: 10px 12px;
          vertical-align: top;
        }
        .content th {
          background: var(--surface-soft);
          font-weight: 700;
        }
        .content blockquote {
          margin: 1rem 0;
          padding: 0.75rem 1rem;
          border-left: 4px solid #cbd5e1;
          background: #f8fafc;
          color: #334155;
          border-radius: 0 12px 12px 0;
        }
        .content blockquote[data-callout="note"] {
          border-left-color: #0ea5e9;
          background: #eff6ff;
          color: #0f172a;
        }
        .content blockquote[data-callout="warning"] {
          border-left-color: #f97316;
          background: #fff7ed;
          color: #7c2d12;
        }
        .attachment-box {
          margin-top: 28px;
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 16px 18px;
          background: var(--surface-soft);
        }
        .attachment-title {
          margin: 0 0 6px;
          font-weight: 700;
        }
        .attachment-link {
          margin: 0;
          color: var(--muted);
          word-break: break-word;
        }
        .gallery {
          margin-top: 28px;
        }
        .gallery h2 {
          margin: 0 0 14px;
          font-size: 1.25rem;
        }
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }
        .gallery-grid img {
          width: 100%;
          height: auto;
          margin: 0;
        }
        @page {
          size: A4;
          margin: 18mm 14mm;
        }
      </style>
    </head>
    <body>
      <main class="sheet">
        <p class="eyebrow">Knowledge Hub - Tài liệu kỹ thuật</p>
        <h1>${escapeHtml(article.title)}</h1>
        <div class="meta">
          Mảng: ${escapeHtml(getModuleLabel(article.module))}
          &nbsp;|&nbsp; Loại: ${escapeHtml(getArticleCategoryLabel(article.category))}
          &nbsp;|&nbsp; Tác giả: ${escapeHtml(article.author)}
          &nbsp;|&nbsp; Cập nhật: ${escapeHtml(article.updatedAt.toLocaleDateString('vi-VN'))}
        </div>
        ${tags.length > 0 ? `<div class="tags">${tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>` : ''}
        <section class="content">${contentHtml}</section>
        ${gallerySection}
        ${attachmentSection}
      </main>
    </body>
  </html>`;
}

async function resolveExecutablePath() {
  const customPath = process.env.CHROME_EXECUTABLE_PATH;
  if (customPath && existsSync(customPath)) {
    return customPath;
  }

  const localCandidates = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  ];

  for (const candidate of localCandidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return chromium.executablePath();
}

export async function buildArticlePdf(article: ArticlePdfSource) {
  const executablePath = await resolveExecutablePath();
  const browser = await puppeteer.launch({
    executablePath,
    args: chromium.args,
    defaultViewport: {
      width: 1280,
      height: 720,
      deviceScaleFactor: 1,
    },
    headless: true,
  });

  try {
    const page = await browser.newPage();
    const html = buildArticleHtml(article, await getFontFaceCss());

    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.emulateMediaType('screen');
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        Array.from(document.images).map((image) => {
          if (image.complete) {
            return Promise.resolve();
          }

          return new Promise<void>((resolve) => {
            image.addEventListener('load', () => resolve(), { once: true });
            image.addEventListener('error', () => resolve(), { once: true });
          });
        }),
      );
    });

    const bytes = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
    });

    return {
      bytes,
      fileName: `${slugify(article.title)}.pdf`,
    };
  } finally {
    await browser.close();
  }
}
