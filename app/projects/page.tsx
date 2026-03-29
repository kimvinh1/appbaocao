import Link from 'next/link';
import { createProject, getProjects } from '@/app/actions';
import { SubmitButton } from '@/app/components/ui/submit-button';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ProjectsTable } from './projects-table';

export const PROJECT_STATUSES = [
  { value: 'Tiếp nhận',          label: 'Tiếp nhận',          color: 'bg-slate-600 text-slate-200' },
  { value: 'Đã báo giá',         label: 'Đã báo giá',         color: 'bg-blue-700 text-blue-100' },
  { value: 'Chờ xác nhận',       label: 'Chờ xác nhận',       color: 'bg-yellow-700 text-yellow-100' },
  { value: 'Đang tiến hành',     label: 'Đang tiến hành',     color: 'bg-cyan-700 text-cyan-100' },
  { value: 'Tạm dừng',           label: 'Tạm dừng',           color: 'bg-slate-500 text-slate-100 opacity-80' },
  { value: 'Chờ phản hồi khách', label: 'Chờ phản hồi khách', color: 'bg-orange-700 text-orange-100' },
  { value: 'Hoàn thành',         label: 'Hoàn thành',         color: 'bg-green-700 text-green-100' },
  { value: 'Đã hủy',             label: 'Đã hủy',             color: 'bg-red-900 text-red-300' },
  { value: 'Lưu trữ',            label: 'Lưu trữ',            color: 'bg-neutral-800 text-neutral-400 border border-neutral-700' },
];

export function statusBadge(value: string) {
  const found = PROJECT_STATUSES.find((s) => s.value === value);
  const color = found?.color ?? 'bg-slate-600 text-slate-200';
  return `inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${color}`;
}

const INPUT_CLS = 'mt-1 w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400';

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/dang-nhap');

  const projects = await getProjects();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">Quản lý dự án</h2>
          <p className="mt-1 text-sm text-slate-400">Theo dõi toàn bộ dự án — từ tiếp nhận đến hoàn thành.</p>
        </div>
        <Link href="/projects/reports" className="inline-flex items-center gap-2 rounded-xl bg-cyan-500/10 px-4 py-2.5 text-sm font-semibold text-cyan-400 hover:bg-cyan-500/20 transition">
          Thống kê Báo cáo
        </Link>
      </div>

      {/* ── Create form ── */}
      <section className="glass-panel rounded-2xl p-5">
        <h3 className="mb-4 text-base font-semibold text-white">Tạo dự án mới</h3>
        <form action={createProject} className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <input type="hidden" name="updatedBy" value={user.fullName} />

          <label className="text-sm text-slate-300">
            Mã dự án
            <input name="code" placeholder="Tự động (để trống)" className={INPUT_CLS} />
            <span className="mt-1 block text-[11px] text-slate-500">Để trống → tỲ sinh ILL-26-XXX</span>
          </label>

          <label className="text-sm text-slate-300">
            Khách hàng <span className="text-red-400">*</span>
            <input name="clientName" required placeholder="Bệnh viện / Phòng khậm..." className={INPUT_CLS} />
          </label>

          <label className="text-sm text-slate-300">
            Máy giải trình tự
            <input name="instrument" placeholder="NextSeq 550, MiSeq..." className={INPUT_CLS} />
          </label>

          <label className="text-sm text-slate-300">
            Panel / Xét nghiệm <span className="text-red-400">*</span>
            <input name="panelType" required placeholder="TSO500, TruSight Oncology..." className={INPUT_CLS} />
          </label>

          <label className="text-sm text-slate-300">
            Trạng thái <span className="text-red-400">*</span>
            <select name="status" required defaultValue="Tiếp nhận" className={INPUT_CLS}>
              {PROJECT_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>

          <label className="text-sm text-slate-300">
            PS / Sales phụ trách
            <input name="salesPerson" placeholder="Tên PS/Sales..." className={INPUT_CLS} />
          </label>

          <label className="text-sm text-slate-300">
            App phụ trách (chính)
            <input name="appPerson" placeholder="Tên App Specialist..." className={INPUT_CLS} />
          </label>

          <label className="text-sm text-slate-300 md:col-span-2 xl:col-span-3">
            Mô tả / Ghi chú ban đầu
            <textarea name="description" rows={2} placeholder="Thông tin thêm về yêu cầu..."
              className={`${INPUT_CLS} resize-none`} />
          </label>

          <div className="flex items-end">
            <SubmitButton label="Tạo dự án" pendingLabel="Đang tạo..." />
          </div>
        </form>
      </section>

      {/* ── Table with client-side filter ── */}
      <ProjectsTable projects={projects} statuses={PROJECT_STATUSES} />
    </div>
  );
}
