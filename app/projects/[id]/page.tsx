import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getProjectById, updateProjectStatus } from '@/app/actions';
import { SubmitButton } from '@/app/components/ui/submit-button';
import { getCurrentUser } from '@/lib/auth';
import { PROJECT_STATUSES, statusBadge } from '../page';

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/dang-nhap');

  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back */}
      <Link href="/projects" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-cyan-300 transition">
        ← Danh sách dự án
      </Link>

      {/* Header */}
      <div className="glass-panel rounded-2xl p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-lg font-bold text-cyan-300">{project.code}</p>
            <p className="text-xl font-semibold text-white mt-1">{project.clientName}</p>
            <p className="text-sm text-slate-400 mt-1">{project.panelType}{project.instrument ? ` · ${project.instrument}` : ''}</p>
          </div>
          <span className={statusBadge(project.status)}>{project.status}</span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide">Ngày tạo</p>
            <p className="text-slate-200 mt-0.5">{new Date(project.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
          </div>
          {project.description && (
            <div className="col-span-2">
              <p className="text-slate-500 text-xs uppercase tracking-wide">Mô tả</p>
              <p className="text-slate-200 mt-0.5">{project.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Update form */}
      <section className="glass-panel rounded-2xl p-5">
        <h3 className="mb-4 text-base font-semibold text-white">Thêm cập nhật mới</h3>
        <form action={updateProjectStatus} className="space-y-3">
          <input type="hidden" name="id" value={project.id} />
          <input type="hidden" name="updatedBy" value={user.fullName} />

          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm text-slate-300">
              Trạng thái mới <span className="text-red-400">*</span>
              <select name="status" required defaultValue={project.status}
                className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400">
                {PROJECT_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </label>

            <label className="text-sm text-slate-300 md:col-span-2">
              Nội dung cập nhật <span className="text-red-400">*</span>
              <textarea name="note" required rows={3}
                placeholder="Mô tả cụ thể: đã làm gì, kết quả ra sao, bước tiếp theo..."
                className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400 resize-none" />
            </label>
          </div>

          <SubmitButton label="Lưu cập nhật" pendingLabel="Đang lưu..." />
        </form>
      </section>

      {/* Timeline */}
      <section className="glass-panel rounded-2xl p-5">
        <h3 className="mb-4 text-base font-semibold text-white">
          Lịch sử dự án
          <span className="ml-2 text-xs text-slate-500 font-normal">({project.projectLogs.length} bản ghi)</span>
        </h3>

        {project.projectLogs.length === 0 ? (
          <p className="text-sm text-slate-500 italic">Chưa có lịch sử.</p>
        ) : (
          <ol className="relative border-l border-slate-700 ml-3 space-y-5">
            {project.projectLogs.map((log) => (
              <li key={log.id} className="ml-4">
                <div className="absolute -left-1.5 h-3 w-3 rounded-full border border-slate-600 bg-slate-800" />
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={statusBadge(log.status)}>{log.status}</span>
                  <span className="text-xs text-slate-400">
                    {new Date(log.createdAt).toLocaleString('vi-VN', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                  <span className="text-xs font-medium text-slate-300">— {log.updatedBy}</span>
                </div>
                <p className="text-sm text-slate-200">{log.note}</p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
