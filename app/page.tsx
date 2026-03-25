import { ClipboardList, FolderKanban, Users, FileText, TicketCheck } from 'lucide-react';
import { getActivityLogs } from '@/app/actions';
import { getDashboardStats } from '@/app/actions-kb';
import { ExportLogsButton } from '@/app/components/dashboard/export-logs-button';
import { LogsByCategoryChart } from '@/app/components/dashboard/logs-by-category-chart';

export default async function DashboardPage() {
  const [logs, stats] = await Promise.all([getActivityLogs(), getDashboardStats()]);

  const { totalUsers, totalArticles, totalProjects, totalSupportCases } = stats;

  const logsByCategoryMap = logs.reduce<Record<string, number>>((acc, log) => {
    acc[log.category] = (acc[log.category] ?? 0) + 1;
    return acc;
  }, {});

  const logsByCategoryData = Object.entries(logsByCategoryMap)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  const exportRows = logs.map((log) => ({
    date: new Date(log.logDate).toISOString().slice(0, 10),
    teamMember: log.teamMember,
    category: log.category,
    durationHours: log.durationHours,
    description: log.description,
    projectCode: log.project?.code ?? 'Khong co',
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Tổng quan vận hành</h2>
        <p className="mt-1 text-sm text-slate-400">Theo dõi dự án, hoạt động kỹ thuật và mức độ sử dụng cổng hỗ trợ.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="glass-panel rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Người Dùng</p>
            <Users className="text-cyan-300" size={18} />
          </div>
          <p className="mt-4 text-3xl font-semibold text-white">{totalUsers}</p>
        </article>

        <article className="glass-panel rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Tổng Tài Liệu</p>
            <FileText className="text-cyan-300" size={18} />
          </div>
          <p className="mt-4 text-3xl font-semibold text-white">{totalArticles}</p>
        </article>

        <article className="glass-panel rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Tổng dự án</p>
            <FolderKanban className="text-cyan-300" size={18} />
          </div>
          <p className="mt-4 text-3xl font-semibold text-white">{totalProjects}</p>
        </article>

        <article className="glass-panel rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Tổng Case Hỗ Trợ</p>
            <TicketCheck className="text-cyan-300" size={18} />
          </div>
          <p className="mt-4 text-3xl font-semibold text-white">{totalSupportCases}</p>
        </article>
      </section>

      <section className="glass-panel rounded-2xl p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">Phân bổ nhật ký theo nhóm việc</h3>
            <p className="text-sm text-slate-400">Cho biết đội đang dành thời gian vào nhóm công việc nào nhiều nhất.</p>
          </div>
          <ExportLogsButton logs={exportRows} />
        </div>

        {logsByCategoryData.length ? (
          <LogsByCategoryChart data={logsByCategoryData} />
        ) : (
          <div className="rounded-lg border border-dashed border-slate-600 px-4 py-10 text-center text-sm text-slate-400">
            Chưa có nhật ký công việc nào. Hãy thêm dữ liệu ở trang nhật ký để biểu đồ này hoạt động.
          </div>
        )}
      </section>
    </div>
  );
}
