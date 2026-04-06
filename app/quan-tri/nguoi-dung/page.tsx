import { createUserAction } from '@/app/actions-auth';
import { UserActionsPanel } from '@/app/components/ui/user-actions-panel';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ShieldCheck, UserPlus, Users } from 'lucide-react';

export default async function QuanTriNguoiDungPage() {
  await requireAdmin();

  const users = await prisma.user.findMany({
    orderBy: [{ createdAt: 'desc' }],
  });

  const totalActive = users.filter((u) => u.isActive).length;
  const totalAdmin = users.filter((u) => u.role === 'admin').length;

  const inputCls =
    'mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-slate-400 outline-none transition focus:border-orange-400';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
          <ShieldCheck size={22} className="text-orange-400" />
          Quản trị người dùng
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Admin có thể tạo tài khoản nội bộ, sửa thông tin, đổi mật khẩu và quản lý vai trò truy cập.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-panel rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
            <Users size={14} /> Tổng tài khoản
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{users.length}</p>
        </div>
        <div className="glass-panel rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            <Users size={14} /> Đang hoạt động
          </div>
          <p className="mt-2 text-3xl font-bold text-emerald-700 dark:text-emerald-300">{totalActive}</p>
        </div>
        <div className="glass-panel rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-orange-600 dark:text-orange-400">
            <ShieldCheck size={14} /> Admin
          </div>
          <p className="mt-2 text-3xl font-bold text-orange-700 dark:text-orange-300">{totalAdmin}</p>
        </div>
      </div>

      {/* Create user form */}
      <section className="glass-panel rounded-2xl p-5">
        <h3 className="mb-4 text-base font-bold text-gray-900 dark:text-white">Tạo người dùng mới</h3>
        <form action={createUserAction} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Họ tên *</label>
            <input name="fullName" required placeholder="Nguyễn Văn A" className={inputCls} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email *</label>
            <input name="email" type="email" required placeholder="email@company.com" className={inputCls} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Mật khẩu *</label>
            <input name="password" type="password" required placeholder="Tối thiểu 6 ký tự" className={inputCls} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Vai trò</label>
            <select name="role" defaultValue="user" className={inputCls}>
              <option value="user">Nhân viên</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="md:col-span-2 xl:col-span-4">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500/20 px-5 py-2.5 text-sm font-semibold text-orange-700 dark:text-orange-300 ring-1 ring-orange-400/40 transition hover:bg-orange-500/30"
            >
              <UserPlus size={16} />
              Tạo người dùng
            </button>
          </div>
        </form>
      </section>

      {/* User table */}
      <section className="table-shell overflow-hidden rounded-2xl">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900/90 text-left text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Họ tên</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Vai trò</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Ngày tạo</th>
              <th className="px-4 py-3 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-slate-200 dark:border-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{user.fullName}</td>
                <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">{user.email}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    user.role === 'admin'
                      ? 'bg-orange-100 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300'
                      : 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300'
                  }`}>
                    {user.role === 'admin' ? 'Admin' : 'Nhân viên'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    user.isActive
                      ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      : 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-red-400'}`} />
                    {user.isActive ? 'Hoạt động' : 'Ngưng'}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                  {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <UserActionsPanel
                      user={{
                        id: user.id,
                        fullName: user.fullName,
                        email: user.email,
                        role: user.role,
                        isActive: user.isActive,
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
