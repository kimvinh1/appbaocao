/**
 * Parse H2/H3 headings từ HTML string, chèn id vào mỗi heading.
 * Chạy server-side (không dùng DOM API).
 */

export type TocItem = {
  id: string;
  text: string;
  level: 2 | 3;
};

/**
 * Thêm id vào các thẻ h2/h3 trong HTML và trả về danh sách TOC.
 * Regex đơn giản — phù hợp với HTML output của TipTap (single-line headings).
 */
export function extractTocAndAddIds(html: string): {
  enrichedHtml: string;
  headings: TocItem[];
} {
  if (!html || !/<h[23]/i.test(html)) {
    return { enrichedHtml: html, headings: [] };
  }

  let counter = 0;
  const headings: TocItem[] = [];

  // Match h2 và h3, kể cả khi đã có attributes (e.g. style, class)
  const enrichedHtml = html.replace(
    /<(h([23]))((?:\s[^>]*)?)>([\s\S]*?)<\/h\2>/gi,
    (_match, _tag, levelStr, attrs, inner) => {
      const level = parseInt(levelStr, 10) as 2 | 3;
      // Strip nested tags để lấy plain text
      const text = inner.replace(/<[^>]+>/g, '').trim();
      if (!text) return _match;

      const id = `toc-${++counter}`;
      headings.push({ id, text, level });

      // Giữ nguyên attributes, chỉ thêm id
      return `<h${level} id="${id}"${attrs}>${inner}</h${level}>`;
    },
  );

  return { enrichedHtml, headings };
}
