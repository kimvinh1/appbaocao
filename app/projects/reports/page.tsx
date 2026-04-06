import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getProjects } from '@/app/actions';
import { getCurrentUser } from '@/lib/auth';
import { DashboardCharts } from './dashboard-charts';

export default async function ReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/dang-nhap');

  // Lấy toàn bộ dữ liệu dự án (có thể cache/tối ưu nếu sau này dữ liệu phình to)
  const projects = await getProjects();

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/projects" className="inline-flex items-center gap-1 text-sm text-slate-600 dark:text-slate-500 dark:text-slate-400 hover:text-cyan-300 transition mb-2">
            ← Quay lại danh sách
          </Link>
          <h2 className="text-2xl font-semibold text-white">Báo cáo Thống kê</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-500 dark:text-slate-400">
            Tổng quan hiệu suất và tình trạng toàn bộ dự án APP Illumina.
          </p>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="glass-panel p-10 text-center rounded-2xl">
          <p className="text-slate-600 dark:text-slate-500 dark:text-slate-400">Chưa có dữ liệu dự án để lập biểu đồ.</p>
        </div>
      ) : (
        <DashboardCharts projects={projects} />
      )}
    </div>
  );
}
