import Link from 'next/link';
import { createProject, getProjects } from '@/app/actions';
import { SubmitButton } from '@/app/components/ui/submit-button';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const PROJECT_STATUSES = [
  { value: 'Tiếp nhận',          label: 'Tiếp nhận',          color: 'bg-slate-600 text-slate-200' },
  { value: 'Đã báo giá',         label: 'Đã báo giá',         color: 'bg-blue-700 text-blue-100' },
  { value: 'Chờ xác nhận',       label: 'Chờ xác nhận',       color: 'bg-yellow-700 text-yellow-100' },
  { value: 'Đang tiến hành',     label: 'Đang tiến hành',     color: 'bg-cyan-700 text-cyan-100' },
  { value: 'Chờ phản hồi khách', label: 'Chờ phản hồi khách', color: 'bg-orange-700 text-orange-100' },
  { value: 'Hoàn thành',         label: 'Hoàn thành',         color: 'bg-green-700 text-green-100' },
  { value: 'Đã hủy',             label: 'Đã hủy',             color: 'bg-red-900 text-red-300' },
];

export function statusBadge(value: string) {
  const found = PROJECT_STATUSES.find((s) => s.value === value);
  const color = found?.color ?? 'bg-slate-600 text-slate-200';
  return `inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${color}`;
}

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/dang-nhap');

  const projects = await getProjects();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Quản lý dự án</h2>
        <p className="mt-1 text-sm text-slate-400">Theo dõi toàn bộ dự án — từ tiếp nhận đến hoàn thành.</p>
      </div>

      <section className="glass-panel rounded-2xl p-5">
        <h3 className="mb-4 text-base font-semibold text-white">Tạo dự án mới</h3>
        <form action={createProject} className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <input type="hidden" name="updatedBy" value={user.fullName} />

          <label className="text-sm text-slate-300">
            Mã dự án
            <input name="code" placeholder="Tự động (để trống)"
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400" />
            <span className="mt-1 block text-[11px] text-slate-500">Để trống → tự sinh ILL-26-XXX</span>
          </label>

          <label className="text-sm text-slate-300">
            Khách hàng <span className="text-red-400">*</span>
            <input name="clientName" required placeholder="Bệnh viện / Phòng khám..."
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400" />
          </label>

          <label className="text-sm text-slate-300">
            Máy giải trình tự
            <input name="instrument" placeholder="NextSeq 550, MiSeq..."
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400" />
          </label>

          <label className="text-sm text-slate-300">
            Panel / Xét nghiệm <span className="text-red-400">*</span>
            <input name="panelType" required placeholder="TSO500, TruSight Oncology..."
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400" />
          </label>

          <label className="text-sm text-slate-300">
            Trạng thái <span className="text-red-400">*</span>
            <select name="status" required defaultValue="Tiếp nhận"
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400">
              {PROJECT_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>

          <label className="text-sm text-slate-300 md:col-span-2 xl:col-span-3">
            Mô tả / Ghi chú ban đầu
            <textarea name="description" rows={2} placeholder="Thông tin thêm về yêu cầu..."
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400 resize-none" />
          </label>

          <div className="flex items-end">
            <SubmitButton label="Tạo dự án" pendingLabel="Đang tạo..." />
          </div>
        </form>
      </section>

      <section className="table-shell">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-900/90 text-left text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3">Mã dự án</th>
              <th className="px-4 py-3">Khách hàng</th>
              <th className="px-4 py-3">Máy giải</th>
              <th className="px-4 py-3">Panel</th>
              <th className="px-4 py-3">Ngày tạo</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Log gần nhất</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => {
              const lastLog = project.projectLogs[0];
              return (
                <tr key={project.id} className="border-t border-slate-800/80 hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-mono font-medium text-cyan-300">{project.code}</td>
                  <td className="px-4 py-3 text-white">{project.clientName}</td>
                  <td className="px-4 py-3 text-slate-300">{project.instrument || '—'}</td>
                  <td className="px-4 py-3 text-slate-300">{project.panelType}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {new Date(project.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={statusBadge(project.status)}>{project.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 max-w-xs">
                    {lastLog ? (
                      <div>
                        <span className="text-slate-300">{lastLog.updatedBy}</span>
                        {' · '}
                        <span>{new Date(lastLog.createdAt).toLocaleDateString('vi-VN')}</span>
                        <br />
                        <span className="text-slate-500 italic">{lastLog.note}</span>
                      </div>
                    ) : <span className="text-slate-600 italic">Chưa có log</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/projects/${project.id}`}
                      className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-cyan-500 hover:text-slate-950 whitespace-nowrap">
                      Chi tiết →
                    </Link>
                  </td>
                </tr>
              );
            })}
            {!projects.length && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-400">
                  Chưa có dự án nào. Hãy tạo dự án đầu tiên bằng biểu mẫu bên trên.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
