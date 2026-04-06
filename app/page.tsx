import { FolderKanban, Users, FileText, Share2, AlertTriangle, TrendingUp } from 'lucide-react';
import { getActivityLogs } from '@/app/actions';
import { getDashboardStats } from '@/app/actions-kb';
import { ExportLogsButton } from '@/app/components/dashboard/export-logs-button';
import { LogsByCategoryChart } from '@/app/components/dashboard/logs-by-category-chart';

export default async function DashboardPage() {
  const [logs, stats] = await Promise.all([getActivityLogs(), getDashboardStats()]);

  const { totalUsers, totalArticles, totalProjects, totalProcedureShares, totalErrorCodes } = stats;

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

  const statItems = [
    { label: 'Người Dùng', value: totalUsers, icon: Users, color: 'text-violet-500 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-500/10' },
    { label: 'Tổng Tài Liệu', value: totalArticles, icon: FileText, color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
    { label: 'Tổng Dự Án', value: totalProjects, icon: FolderKanban, color: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10' },
    { label: 'Mã Lỗi', value: totalErrorCodes, icon: AlertTriangle, color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
    { label: 'Link Chia Sẻ', value: totalProcedureShares, icon: Share2, color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="page-title">Tổng quan vận hành</h1>
        <p className="page-subtitle">Theo dõi dự án, hoạt động kỹ thuật và mức độ sử dụng cổng hỗ trợ.</p>
      </div>

      {/* Stat Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {statItems.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="stat-card">
            <div className="flex items-center justify-between">
              <p className="stat-label">{label}</p>
              <div className={`${bg} p-2 rounded-lg`}>
                <Icon className={color} size={18} />
              </div>
            </div>
            <p className="stat-value">{value}</p>
          </div>
        ))}
      </section>

      {/* Chart Section */}
      <section className="card p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <TrendingUp size={18} className="text-[var(--accent)]" />
              Phân bổ nhật ký theo nhóm việc
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              Cho biết đội đang dành thời gian vào nhóm công việc nào nhiều nhất.
            </p>
          </div>
          <ExportLogsButton logs={exportRows} />
        </div>

        {logsByCategoryData.length ? (
          <LogsByCategoryChart data={logsByCategoryData} />
        ) : (
          <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-12 text-center">
            <p className="text-sm text-[var(--text-muted)]">
              Chưa có nhật ký công việc nào. Hãy thêm dữ liệu ở trang nhật ký để biểu đồ này hoạt động.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
