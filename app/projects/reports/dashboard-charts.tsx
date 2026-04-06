'use client';

import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { PROJECT_STATUSES } from '../constants';

type Project = {
  id: string;
  code: string;
  clientName: string;
  panelType: string;
  status: string;
  createdAt: Date;
  appPerson?: string | null;
  salesPerson?: string | null;
};

export function DashboardCharts({ projects }: { projects: Project[] }) {
  // 1. Thống kê theo Trạng thái
  const statusData = useMemo(() => {
    // Tận dụng mảng màu từ PROJECT_STATUSES
    const colorMap = Object.fromEntries(
      PROJECT_STATUSES.map((s) => [s.value, s.color])
    );
    
    // Tách mã màu HEX để recharts vẽ. Color classes trong tailwind không parse thẳng vào FILL được.
    // Tạm dùng mapping cứng màu sắc (vì tailwind classes ở trên là dạng bg-blue-700...)
    const hexColors: Record<string, string> = {
      'Tiếp nhận': '#475569',
      'Đã báo giá': '#1d4ed8',
      'Chờ xác nhận': '#a16207',
      'Đang tiến hành': '#0e7490',
      'Tạm dừng': '#64748b',
      'Chờ phản hồi khách': '#c2410c',
      'Hoàn thành': '#15803d',
      'Đã hủy': '#7f1d1d',
      'Lưu trữ': '#262626',
    };

    const counts: Record<string, number> = {};
    projects.forEach((p) => {
      counts[p.status] = (counts[p.status] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({
        name,
        value,
        fill: hexColors[name] || '#94a3b8',
      }))
      .sort((a, b) => b.value - a.value); // Sort descending
  }, [projects]);

  // 2. Thống kê số lượng dự án tạo theo tháng
  const monthlyData = useMemo(() => {
    const monthlyCounts: Record<string, number> = {};
    projects.forEach((p) => {
      const date = new Date(p.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyCounts[key] = (monthlyCounts[key] || 0) + 1;
    });

    return Object.entries(monthlyCounts)
      .sort((a, b) => a[0].localeCompare(b[0])) // oldest to newest
      .map(([month, count]) => ({
        month,
        count,
      }));
  }, [projects]);

  // 3. Thống kê KPI cơ bản theo App
  const appData = useMemo(() => {
    const apps: Record<string, number> = {};
    projects.forEach((p) => {
      if (p.status === 'Đã hủy' || p.status === 'Lưu trữ') return; // Skip ignored statuses
      const appName = p.appPerson?.trim() || 'Chưa phân công';
      apps[appName] = (apps[appName] || 0) + 1;
    });

    return Object.entries(apps)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [projects]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-3 shadow-xl">
          <p className="font-semibold text-slate-800 dark:text-slate-200">{label || payload[0].name}</p>
          <p className="text-cyan-400 mt-1">
            Số lượng: <span className="font-bold">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Chart: Trạng thái */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col h-[400px]">
        <h3 className="text-white font-semibold mb-6">Tỷ lệ Trạng thái Dự án</h3>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                labelLine={false}
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart: Theo tháng */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col h-[400px]">
        <h3 className="text-white font-semibold mb-6">Sản lượng Dự án theo Tháng</h3>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip cursor={{ fill: '#1e293b' }} content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart: KPI App */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col h-[400px] lg:col-span-2">
        <h3 className="text-white font-semibold mb-6">Khối lượng công việc theo APP (Dự án Active)</h3>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={appData} layout="vertical" margin={{ top: 0, right: 20, left: 60, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
              <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" stroke="#cbd5e1" fontSize={12} tickLine={false} axisLine={false} width={120} />
              <Tooltip cursor={{ fill: '#1e293b' }} content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
