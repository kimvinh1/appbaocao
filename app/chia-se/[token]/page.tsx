import { getProcedureShareByToken, markProcedureShareCompleted, reactToProcedureShare } from '@/app/actions-kb';
import { Download, Heart, CheckCircle2, ThumbsUp, UserRoundCheck } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getModuleTheme } from '@/lib/module-theme';

export default async function ChiaSeQuyTrinhPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const share = await getProcedureShareByToken(token);

  if (!share) {
    notFound();
  }

  const theme = getModuleTheme(share.article.module);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
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

      <section className="glass-panel rounded-2xl p-6">
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

      <section className="glass-panel rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <UserRoundCheck size={18} className={theme.textClass} /> Phản hồi thực hiện
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Sau khi làm xong quy trình, khách hàng có thể xác nhận hoàn tất và gửi phản hồi cảm nhận.
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${share.status === 'completed' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-800 text-slate-300'}`}>
            {share.status === 'completed' ? 'Đã hoàn tất' : 'Đang chờ thực hiện'}
          </span>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <form action={markProcedureShareCompleted}>
            <input type="hidden" name="token" value={share.token} />
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/15 px-4 py-2.5 text-sm font-medium text-emerald-300 ring-1 ring-emerald-400/25 transition hover:bg-emerald-500/25"
            >
              <CheckCircle2 size={16} /> Tôi đã làm xong
            </button>
          </form>

          <form action={reactToProcedureShare}>
            <input type="hidden" name="token" value={share.token} />
            <input type="hidden" name="reactionType" value="like" />
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500/15 px-4 py-2.5 text-sm font-medium text-cyan-300 ring-1 ring-cyan-400/25 transition hover:bg-cyan-500/25"
            >
              <ThumbsUp size={16} /> Hữu ích ({share.likeCount})
            </button>
          </form>

          <form action={reactToProcedureShare}>
            <input type="hidden" name="token" value={share.token} />
            <input type="hidden" name="reactionType" value="heart" />
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-pink-500/15 px-4 py-2.5 text-sm font-medium text-pink-300 ring-1 ring-pink-400/25 transition hover:bg-pink-500/25"
            >
              <Heart size={16} /> Rất hiệu quả ({share.heartCount})
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
