import { createUserAction } from '@/app/actions-auth';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ShieldCheck, UserPlus } from 'lucide-react';

export default async function QuanTriNguoiDungPage() {
  await requireAdmin();

  const users = await prisma.user.findMany({
    orderBy: [{ createdAt: 'desc' }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-semibold text-white">
          <ShieldCheck size={22} className="text-orange-300" />
          Quản trị người dùng
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-500 dark:text-slate-400">
          Admin có thể tạo tài khoản nội bộ cho APP và quản lý vai trò truy cập.
        </p>
      </div>

      <section className="glass-panel rounded-2xl p-5">
        <h3 className="mb-4 text-lg font-semibold text-white">Tạo người dùng mới</h3>
        <form action={createUserAction} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="text-sm text-slate-700 dark:text-slate-300">
            Họ tên
            <input
              name="fullName"
              required
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white/80 dark:bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-orange-400"
            />
          </label>

          <label className="text-sm text-slate-700 dark:text-slate-300">
            Email
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white/80 dark:bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-orange-400"
            />
          </label>

          <label className="text-sm text-slate-700 dark:text-slate-300">
            Mật khẩu
            <input
              name="password"
              type="password"
              required
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white/80 dark:bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-orange-400"
            />
          </label>

          <label className="text-sm text-slate-700 dark:text-slate-300">
            Vai trò
            <select
              name="role"
              defaultValue="user"
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white/80 dark:bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition focus:border-orange-400"
            >
              <option value="user">Nhân viên</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          <div className="md:col-span-2 xl:col-span-4">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500/20 px-5 py-2.5 text-sm font-medium text-orange-300 ring-1 ring-orange-400/40 transition hover:bg-orange-500/30"
            >
              <UserPlus size={16} />
              Tạo người dùng
            </button>
          </div>
        </form>
      </section>

      <section className="table-shell">
        <table className="min-w-full text-sm">
          <thead className="bg-white/90 dark:bg-slate-900/90 text-left text-xs uppercase tracking-wide text-slate-600 dark:text-slate-500 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Họ tên</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Vai trò</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Ngày tạo</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-slate-200/80 dark:border-slate-800/80">
                <td className="px-4 py-3 font-medium text-white">{user.fullName}</td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{user.email}</td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{user.role === 'admin' ? 'Admin' : 'Nhân viên'}</td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{user.isActive ? 'Đang hoạt động' : 'Ngưng hoạt động'}</td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
