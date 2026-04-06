import { createActivityLog, getActivityLogs, getProjects } from '@/app/actions';
import { SubmitButton } from '@/app/components/ui/submit-button';

const LOG_CATEGORIES = [
  { value: 'Onsite', label: 'Onsite / hiện trường' },
  { value: 'Report', label: 'Báo cáo' },
  { value: 'Training', label: 'Đào tạo' },
  { value: 'Maintenance', label: 'Bảo trì' },
];

export default async function LogsPage() {
  const [logs, projects] = await Promise.all([getActivityLogs(), getProjects()]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Nhật ký công việc</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Ghi nhận khối lượng công việc hằng ngày và liên kết với dự án.</p>
      </div>

      <section className="glass-panel rounded-2xl p-5">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Thêm nhật ký mới</h3>

        <form action={createActivityLog} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="text-sm text-slate-700 dark:text-slate-300">
            Nhân sự phụ trách
            <input
              name="teamMember"
              required
              placeholder="Nguyen Van A"
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white/80 dark:bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400"
            />
          </label>

          <label className="text-sm text-slate-700 dark:text-slate-300">
            Ngày ghi nhận
            <input
              name="logDate"
              type="date"
              required
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white/80 dark:bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400"
            />
          </label>

          <label className="text-sm text-slate-700 dark:text-slate-300">
            Nhóm công việc
            <select
              name="category"
              required
              defaultValue="Onsite"
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white/80 dark:bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400"
            >
              {LOG_CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-slate-700 dark:text-slate-300">
            Thời lượng (giờ)
            <input
              name="durationHours"
              type="number"
              min="0.1"
              step="0.1"
              required
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white/80 dark:bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400"
            />
          </label>

          <label className="text-sm text-slate-700 dark:text-slate-300">
            Gắn với dự án
            <select
              name="projectId"
              defaultValue=""
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white/80 dark:bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400"
            >
              <option value="">Không gắn dự án</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.code}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-slate-700 dark:text-slate-300 md:col-span-2 xl:col-span-3">
            Nội dung công việc
            <textarea
              name="description"
              required
              rows={3}
              placeholder="Processed FFPE sample extraction and library QC."
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white/80 dark:bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400"
            />
          </label>

          <div>
            <SubmitButton label="Lưu nhật ký" pendingLabel="Đang lưu..." />
          </div>
        </form>
      </section>

      <section className="table-shell">
        <table className="min-w-full text-sm">
          <thead className="bg-white/90 dark:bg-slate-900/90 text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Ngày</th>
              <th className="px-4 py-3">Nhân sự</th>
              <th className="px-4 py-3">Nhóm việc</th>
              <th className="px-4 py-3">Số giờ</th>
              <th className="px-4 py-3">Dự án</th>
              <th className="px-4 py-3">Mô tả</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-slate-200/80 dark:border-slate-800/80">
                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{new Date(log.logDate).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-gray-900 dark:text-white">{log.teamMember}</td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{LOG_CATEGORIES.find((category) => category.value === log.category)?.label ?? log.category}</td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{log.durationHours.toFixed(1)}</td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{log.project?.code ?? 'Không có'}</td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{log.description}</td>
              </tr>
            ))}

            {!logs.length && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                  Chưa có nhật ký công việc nào. Hãy thêm bản ghi đầu tiên bằng biểu mẫu bên trên.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
