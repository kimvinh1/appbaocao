import { getArticles } from '@/app/actions-kb';
import { FileText, Layers, Plus, Tag } from 'lucide-react';
import Link from 'next/link';

export default async function CepheidProtocolPage() {
  const articles = await getArticles('cepheid');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-semibold text-white">
            <Layers size={22} className="text-cyan-300" /> Quy trình & SOP – Cepheid
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Tập hợp SOP, hướng dẫn sử dụng cartridge và quy trình xử lý sự cố cho GeneXpert.
          </p>
        </div>
        <Link
          href="/kien-thuc/moi?module=cepheid"
          className="flex items-center gap-2 rounded-xl bg-cyan-500/20 px-4 py-2 text-sm font-medium text-cyan-300 ring-1 ring-cyan-400/40 transition hover:bg-cyan-500/30"
        >
          <Plus size={16} /> Thêm quy trình
        </Link>
      </div>

      {articles.length === 0 ? (
        <div className="glass-panel rounded-2xl px-8 py-16 text-center">
          <FileText size={40} className="mx-auto mb-4 text-slate-600" />
          <p className="text-slate-400">Chưa có tài liệu Cepheid nào. Hãy thêm quy trình đầu tiên.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {articles.map((article) => {
            const tags = article.tags ? article.tags.split(',').filter(Boolean) : [];
            return (
              <Link
                key={article.id}
                href={`/kien-thuc/bai/${article.id}`}
                className="glass-panel rounded-xl border border-cyan-500/10 p-4 transition hover:border-cyan-500/30"
              >
                <p className="font-semibold text-white">{article.title}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span key={tag} className="flex items-center gap-1 rounded-full bg-slate-800/80 px-2 py-0.5 text-xs text-slate-400">
                      <Tag size={10} /> {tag.trim()}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  {article.author} · {new Date(article.updatedAt).toLocaleDateString('vi-VN')}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
