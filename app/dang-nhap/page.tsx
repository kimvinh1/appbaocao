import { bootstrapAdmin, loginAction } from '@/app/actions-auth';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { LockKeyhole, ShieldCheck, UserRoundPlus } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function DangNhapPage() {
  const currentUser = await getCurrentUser();

  if (currentUser) {
    redirect('/');
  }

  const hasUsers = (await prisma.user.count()) > 0;

  return (
    <div className="mx-auto grid min-h-[80vh] max-w-5xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="glass-panel rounded-[2rem] border border-cyan-500/15 p-8 sm:p-10">
        <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">APP Portal</p>
        <h1 className="mt-4 text-4xl font-semibold text-gray-900 dark:text-white">Cổng điều phối hỗ trợ kỹ thuật</h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-slate-700 dark:text-slate-300">
          Hệ thống này dành cho đội APP, admin và khách hàng theo luồng chia sẻ quy trình. Bạn có thể ghi nhận case, đính ảnh hiện trường, chia sẻ SOP và theo dõi phản hồi hiệu quả từ khách hàng.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-300/70 dark:border-slate-700/70 bg-white/50 dark:bg-slate-900/50 p-4">
            <ShieldCheck className="text-orange-300" size={22} />
            <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">Phân quyền nội bộ</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-600">Admin tạo user và kiểm soát quyền truy cập.</p>
          </div>
          <div className="rounded-2xl border border-slate-300/70 dark:border-slate-700/70 bg-white/50 dark:bg-slate-900/50 p-4">
            <UserRoundPlus className="text-cyan-300" size={22} />
            <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">Chia sẻ quy trình</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-600">Gửi link cho khách hàng và ghi nhận trạng thái hoàn tất.</p>
          </div>
          <div className="rounded-2xl border border-slate-300/70 dark:border-slate-700/70 bg-white/50 dark:bg-slate-900/50 p-4">
            <LockKeyhole className="text-red-400" size={22} />
            <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">Case có ảnh</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-600">Lưu lại ảnh lỗi hoặc hiện trường để truy vết nhanh hơn.</p>
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-[2rem] p-8 sm:p-10">
        {hasUsers ? (
          <>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-600">Đăng nhập hệ thống</p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">Chào mừng quay lại</h2>
            <form action={loginAction} className="mt-8 space-y-4">
              <label className="block text-sm text-slate-700 dark:text-slate-300">
                Email
                <input
                  name="email"
                  type="email"
                  required
                  className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50/70 dark:bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                />
              </label>
              <label className="block text-sm text-slate-700 dark:text-slate-300">
                Mật khẩu
                <input
                  name="password"
                  type="password"
                  required
                  className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50/70 dark:bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                />
              </label>

              <button
                type="submit"
                className="w-full rounded-xl bg-cyan-500/20 px-5 py-3 text-sm font-semibold text-cyan-300 ring-1 ring-cyan-400/40 transition hover:bg-cyan-500/30"
              >
                Đăng nhập
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-600">Khởi tạo hệ thống</p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">Tạo tài khoản admin đầu tiên</h2>
            <form action={bootstrapAdmin} className="mt-8 space-y-4">
              <label className="block text-sm text-slate-700 dark:text-slate-300">
                Họ tên
                <input
                  name="fullName"
                  required
                  className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50/70 dark:bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-400"
                />
              </label>
              <label className="block text-sm text-slate-700 dark:text-slate-300">
                Email
                <input
                  name="email"
                  type="email"
                  required
                  className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50/70 dark:bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-400"
                />
              </label>
              <label className="block text-sm text-slate-700 dark:text-slate-300">
                Mật khẩu
                <input
                  name="password"
                  type="password"
                  required
                  className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50/70 dark:bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-400"
                />
              </label>

              <button
                type="submit"
                className="w-full rounded-xl bg-orange-500/20 px-5 py-3 text-sm font-semibold text-orange-300 ring-1 ring-orange-400/40 transition hover:bg-orange-500/30"
              >
                Khởi tạo admin
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
