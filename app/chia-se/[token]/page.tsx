import { getProcedureShareByToken } from '@/app/actions-kb';
import { ShareInteractionPanel } from '@/app/components/ui/share-interaction-panel';
import { CheckCircle2, Circle, Download, UserRoundCheck } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getModuleTheme } from '@/lib/module-theme';

export default async function ChiaSeQuyTrinhPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const share = await getProcedureShareByToken(token);

  if (!share) {
    notFound();
  }

  const theme = getModuleTheme(share.article.module);

  const isCompleted = share.status === 'completed';

  return (
    <div className="mx-auto max-w-5xl space-y-6">

      {/* ── Progress Steps ── */}
      <div className="glass-panel rounded-2xl px-6 py-4">
        <ol className="flex items-center gap-0 text-xs text-slate-400">
          {/* Bước 1 */}
          <li className="flex items-center gap-2 flex-1">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/40">
              <CheckCircle2 size={14} />
            </span>
            <span className="font-medium text-cyan-300 hidden sm:block">Đọc quy trình</span>
          </li>
          <li className="w-8 h-px bg-slate-700 shrink-0" />
          {/* Bước 2 */}
          <li className="flex items-center gap-2 flex-1">
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-1 transition ${
              isCompleted
                ? 'bg-emerald-500/20 text-emerald-300 ring-emerald-400/40'
                : 'bg-slate-800 text-slate-500 ring-slate-700'
            }`}>
              {isCompleted ? <CheckCircle2 size={14} /> : <Circle size={14} />}
            </span>
            <span className={`hidden sm:block ${isCompleted ? 'text-emerald-300 font-medium' : 'text-slate-500'}`}>
              Xác nhận hoàn thành
            </span>
          </li>
          <li className="w-8 h-px bg-slate-700 shrink-0" />
          {/* Bước 3 */}
          <li className="flex items-center gap-2">
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-1 transition ${
              isCompleted
                ? 'bg-pink-500/20 text-pink-300 ring-pink-400/40'
                : 'bg-slate-800 text-slate-500 ring-slate-700'
            }`}>
              {isCompleted ? <CheckCircle2 size={14} /> : <Circle size={14} />}
            </span>
            <span className={`hidden sm:block ${isCompleted ? 'text-pink-300 font-medium' : 'text-slate-500'}`}>
              Phản hồi & đánh giá
            </span>
          </li>
        </ol>
      </div>

      {/* Header */}
      <div className="glass-panel rounded-[2rem] p-8">
        <p className={`text-sm font-medium uppercase tracking-[0.22em] ${theme.textClass}`}>
          Quy trình chia sẻ cho khách hàng
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">{share.article.title}</h1>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          Khách hàng: <span className="font-medium text-white">{share.customerName}</span>
          {share.customerEmail ? ` · ${share.customerEmail}` : ''}
        </p>
        <p className="mt-1 text-sm text-slate-400">
          Người chia sẻ: {share.sharedBy?.fullName ?? share.article.author} · Mảng {theme.label}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href={`/api/chia-se/${share.token}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-sm font-medium text-white ring-1 ring-slate-700 transition hover:bg-white/10"
          >
            <Download size={16} /> Tải PDF quy trình
          </a>
          {share.article.attachmentUrl ? (
            <a
              href={share.article.attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium ring-1 transition ${theme.buttonClass}`}
            >
              <Download size={16} /> Mở PDF đính kèm
            </a>
          ) : null}
        </div>
      </div>

      {/* Nội dung bài viết */}
      <section className="glass-panel rounded-2xl p-6 lg:p-8">
        {/^[\s]*<[a-zA-Z]/.test(share.article.content) ? (
          <div
            className="rich-content text-slate-200"
            dangerouslySetInnerHTML={{ __html: share.article.content }}
          />
        ) : (
          <div className="space-y-4">
            {share.article.content.split('\n').map((line, index) => (
              line.trim() === '' ? <br key={index} /> : <p key={index} className="text-slate-200 leading-relaxed">{line}</p>
            ))}
          </div>
        )}
        {share.article.images && share.article.images.length > 0 && (
          <div className="mt-6">
            <p className="mb-3 text-sm font-medium text-slate-300">Ảnh đính kèm</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {share.article.images.map((img) => (
                <a key={img.id} href={img.imageUrl} target="_blank" rel="noopener noreferrer">
                  <img
                    src={img.imageUrl}
                    alt="Ảnh đính kèm"
                    className="h-40 w-full rounded-xl object-cover border border-slate-700 hover:opacity-90 transition"
                  />
                </a>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Phản hồi thực hiện */}
      <section className="glass-panel rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <UserRoundCheck size={18} className={theme.textClass} /> Phản hồi thực hiện
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Sau khi làm xong, xác nhận hoàn tất và để lại cảm nhận của bạn.
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${share.status === 'completed' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-800 text-slate-300'}`}>
            {share.status === 'completed' ? 'Đã hoàn tất' : 'Đang chờ thực hiện'}
          </span>
        </div>

        {/* Hiển thị comment cũ nếu đã có */}
        {'customerComment' in share && share.customerComment && (
          <div className="mb-4 rounded-xl border border-slate-700/60 bg-slate-950/40 p-4 text-sm text-slate-300 italic">
            &ldquo;{share.customerComment}&rdquo;
          </div>
        )}

        <ShareInteractionPanel
          token={share.token}
          initialStatus={share.status}
          initialLikeCount={share.likeCount}
          initialHeartCount={share.heartCount}
          themeTextClass={theme.textClass}
          themeButtonClass={theme.buttonClass}
        />
      </section>
    </div>
  );
}
