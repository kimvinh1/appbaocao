import { createProject, getProjects, updateProject } from '@/app/actions';
import { SubmitButton } from '@/app/components/ui/submit-button';

const PROJECT_STATUSES = [
  { value: 'Waiting', label: 'Chờ tiếp nhận' },
  { value: 'Extraction', label: 'Đang tách chiết' },
  { value: 'Sequencing', label: 'Đang chạy máy' },
  { value: 'Analysis', label: 'Đang phân tích' },
  { value: 'Completed', label: 'Hoàn tất' },
];

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Quản lý dự án</h2>
        <p className="mt-1 text-sm text-slate-400">Tạo mới và theo dõi tiến độ các dự án giải trình tự.</p>
      </div>

      <section className="glass-panel rounded-2xl p-5">
        <h3 className="mb-4 text-lg font-semibold text-white">Tạo dự án mới</h3>

        <form action={createProject} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="text-sm text-slate-300">
            Mã dự án
            <input
              name="code"
              required
              placeholder="ILL-26-001"
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400"
            />
          </label>

          <label className="text-sm text-slate-300">
            Khách hàng
            <input
              name="clientName"
              required
              placeholder="ABC Oncology"
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400"
            />
          </label>

          <label className="text-sm text-slate-300">
            Panel / xét nghiệm
            <input
              name="panelType"
              required
              placeholder="TSO500"
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400"
            />
          </label>

          <label className="text-sm text-slate-300">
            Trạng thái
            <select
              name="status"
              required
              defaultValue="Waiting"
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400"
            >
              {PROJECT_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-slate-300">
            Hạn hoàn thành
            <input
              name="deadline"
              type="date"
              required
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400"
            />
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
              <th className="px-4 py-3">Panel</th>
              <th className="px-4 py-3">Deadline</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Cập nhật</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id} className="border-t border-slate-800/80">
                <td className="px-4 py-3 font-medium text-white">{project.code}</td>
                <td className="px-4 py-3 text-slate-300">{project.clientName}</td>
                <td className="px-4 py-3 text-slate-300">{project.panelType}</td>
                <td className="px-4 py-3 text-slate-300">
                  {new Date(project.deadline).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-slate-300">{PROJECT_STATUSES.find((status) => status.value === project.status)?.label ?? project.status}</td>
                <td className="px-4 py-3">
                  <form action={updateProject} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={project.id} />
                    <select
                      name="status"
                      defaultValue={project.status}
                      className="rounded-lg border border-slate-600 bg-slate-900/80 px-2 py-1.5 text-xs text-white outline-none transition focus:border-cyan-400"
                    >
                      {PROJECT_STATUSES.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                    <SubmitButton
                      label="Lưu"
                      pendingLabel="..."
                      className="rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </form>
                </td>
              </tr>
            ))}

            {!projects.length && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">
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
