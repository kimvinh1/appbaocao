export const PROJECT_STATUSES = [
  { value: 'Tiếp nhận',          label: 'Tiếp nhận',          color: 'bg-slate-600 text-slate-800 dark:text-slate-200' },
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
  const color = found?.color ?? 'bg-slate-600 text-slate-800 dark:text-slate-200';
  return `inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${color}`;
}
