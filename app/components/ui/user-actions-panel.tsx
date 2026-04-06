'use client';

import {
  deleteUserAction,
  resetPasswordAction,
  toggleUserStatusAction,
  updateUserAction,
} from '@/app/actions-auth';
import { KeyRound, Pencil, Power, Trash2, X } from 'lucide-react';
import { useState, useTransition } from 'react';

type User = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
};

type Modal = 'edit' | 'password' | null;

export function UserActionsPanel({ user }: { user: User }) {
  const [modal, setModal] = useState<Modal>(null);
  const [isPending, startTransition] = useTransition();

  function close() { setModal(null); }

  function handleSubmit(action: (fd: FormData) => Promise<void>, extra?: Record<string, string>) {
    return (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      if (extra) Object.entries(extra).forEach(([k, v]) => fd.set(k, v));
      startTransition(() => action(fd));
      close();
    };
  }

  function handleDelete() {
    if (!window.confirm(`Xoá tài khoản "${user.fullName}"? Hành động này không thể hoàn tác.`)) return;
    const fd = new FormData();
    fd.set('userId', user.id);
    startTransition(() => deleteUserAction(fd));
  }

  function handleToggle() {
    const msg = user.isActive
      ? `Vô hiệu hóa tài khoản "${user.fullName}"?`
      : `Kích hoạt lại tài khoản "${user.fullName}"?`;
    if (!window.confirm(msg)) return;
    const fd = new FormData();
    fd.set('userId', user.id);
    startTransition(() => toggleUserStatusAction(fd));
  }

  const inputCls =
    'mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none transition focus:border-orange-400';
  const labelCls = 'block text-sm font-medium text-slate-700 dark:text-slate-300';

  return (
    <>
      {/* Action buttons */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setModal('edit')}
          disabled={isPending}
          title="Sửa thông tin"
          className="inline-flex items-center gap-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-500/30 hover:bg-blue-100 transition disabled:opacity-50"
        >
          <Pencil size={11} /> Sửa
        </button>
        <button
          onClick={() => setModal('password')}
          disabled={isPending}
          title="Đổi mật khẩu"
          className="inline-flex items-center gap-1 rounded-lg bg-amber-50 dark:bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-700 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-400/30 hover:bg-amber-100 transition disabled:opacity-50"
        >
          <KeyRound size={11} /> Mật khẩu
        </button>
        <button
          onClick={handleToggle}
          disabled={isPending}
          title={user.isActive ? 'Vô hiệu hoá' : 'Kích hoạt'}
          className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium ring-1 transition disabled:opacity-50 ${
            user.isActive
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 ring-slate-200 dark:ring-slate-700 hover:bg-slate-200'
              : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-emerald-200 dark:ring-emerald-400/30 hover:bg-emerald-100'
          }`}
        >
          <Power size={11} /> {user.isActive ? 'Tắt' : 'Bật'}
        </button>
        <button
          onClick={handleDelete}
          disabled={isPending}
          title="Xoá tài khoản"
          className="inline-flex items-center justify-center rounded-lg bg-red-50 dark:bg-red-500/10 p-1.5 text-red-600 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-400/30 hover:bg-red-100 transition disabled:opacity-50"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* Modals */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {modal === 'edit' ? 'Sửa thông tin người dùng' : 'Đổi mật khẩu'}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{user.fullName}</p>
              </div>
              <button
                onClick={close}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Edit form */}
            {modal === 'edit' && (
              <form onSubmit={handleSubmit(updateUserAction, { userId: user.id })} className="space-y-4">
                <input type="hidden" name="userId" value={user.id} />
                <div>
                  <label className={labelCls}>Họ tên *</label>
                  <input name="fullName" required defaultValue={user.fullName} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Email *</label>
                  <input name="email" type="email" required defaultValue={user.email} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Vai trò</label>
                  <select name="role" defaultValue={user.role} className={inputCls}>
                    <option value="user">Nhân viên</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex gap-2 justify-end pt-1">
                  <button type="button" onClick={close} className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                    Huỷ
                  </button>
                  <button type="submit" disabled={isPending} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition disabled:opacity-50">
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            )}

            {/* Password form */}
            {modal === 'password' && (
              <form onSubmit={handleSubmit(resetPasswordAction, { userId: user.id })} className="space-y-4">
                <input type="hidden" name="userId" value={user.id} />
                <div>
                  <label className={labelCls}>Mật khẩu mới *</label>
                  <input name="newPassword" type="password" required minLength={6} placeholder="Tối thiểu 6 ký tự" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Xác nhận mật khẩu *</label>
                  <input name="confirmPassword" type="password" required minLength={6} placeholder="Nhập lại mật khẩu" className={inputCls} />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-400/20 rounded-lg px-3 py-2">
                  ⚠️ Người dùng sẽ cần dùng mật khẩu mới để đăng nhập vào lần tiếp theo.
                </p>
                <div className="flex gap-2 justify-end pt-1">
                  <button type="button" onClick={close} className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                    Huỷ
                  </button>
                  <button type="submit" disabled={isPending} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 transition disabled:opacity-50">
                    Cập nhật mật khẩu
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
