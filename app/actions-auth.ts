'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { clearSession, createSession, hashPassword, requireAdmin, verifyPassword } from '@/lib/auth';

function getRequiredString(value: FormDataEntryValue | null, fieldName: string) {
  if (!value || typeof value !== 'string' || !value.trim()) {
    throw new Error(`${fieldName} là bắt buộc`);
  }

  return value.trim();
}

export async function bootstrapAdmin(formData: FormData) {
  const existingUsers = await prisma.user.count();

  if (existingUsers > 0) {
    throw new Error('Hệ thống đã có tài khoản quản trị');
  }

  const fullName = getRequiredString(formData.get('fullName'), 'Họ tên');
  const email = getRequiredString(formData.get('email'), 'Email').toLowerCase();
  const password = getRequiredString(formData.get('password'), 'Mật khẩu');

  const admin = await prisma.user.create({
    data: {
      fullName,
      email,
      passwordHash: hashPassword(password),
      role: 'admin',
    },
  });

  await createSession(admin.id);
  redirect('/');
}

export async function loginAction(formData: FormData) {
  const email = getRequiredString(formData.get('email'), 'Email').toLowerCase();
  const password = getRequiredString(formData.get('password'), 'Mật khẩu');

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.isActive || !verifyPassword(password, user.passwordHash)) {
    throw new Error('Email hoặc mật khẩu không đúng');
  }

  await createSession(user.id);
  redirect('/');
}

export async function logoutAction() {
  await clearSession();
  redirect('/dang-nhap');
}

export async function createUserAction(formData: FormData) {
  await requireAdmin();

  const fullName = getRequiredString(formData.get('fullName'), 'Họ tên');
  const email = getRequiredString(formData.get('email'), 'Email').toLowerCase();
  const password = getRequiredString(formData.get('password'), 'Mật khẩu');
  const role = getRequiredString(formData.get('role'), 'Vai trò');

  if (!['admin', 'user'].includes(role)) {
    throw new Error('Vai trò không hợp lệ');
  }

  await prisma.user.create({
    data: {
      fullName,
      email,
      passwordHash: hashPassword(password),
      role,
    },
  });

  redirect('/quan-tri/nguoi-dung');
}

export async function updateUserAction(formData: FormData) {
  await requireAdmin();

  const userId = getRequiredString(formData.get('userId'), 'ID người dùng');
  const fullName = getRequiredString(formData.get('fullName'), 'Họ tên');
  const email = getRequiredString(formData.get('email'), 'Email').toLowerCase();
  const role = getRequiredString(formData.get('role'), 'Vai trò');

  if (!['admin', 'user'].includes(role)) throw new Error('Vai trò không hợp lệ');

  await prisma.user.update({
    where: { id: userId },
    data: { fullName, email, role },
  });

  redirect('/quan-tri/nguoi-dung');
}

export async function resetPasswordAction(formData: FormData) {
  await requireAdmin();

  const userId = getRequiredString(formData.get('userId'), 'ID người dùng');
  const newPassword = getRequiredString(formData.get('newPassword'), 'Mật khẩu mới');

  if (newPassword.length < 6) throw new Error('Mật khẩu phải có ít nhất 6 ký tự');

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hashPassword(newPassword) },
  });

  redirect('/quan-tri/nguoi-dung');
}

export async function toggleUserStatusAction(formData: FormData) {
  await requireAdmin();

  const userId = getRequiredString(formData.get('userId'), 'ID người dùng');

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isActive: true } });
  if (!user) throw new Error('Không tìm thấy người dùng');

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive },
  });

  redirect('/quan-tri/nguoi-dung');
}

export async function deleteUserAction(formData: FormData) {
  await requireAdmin();

  const userId = getRequiredString(formData.get('userId'), 'ID người dùng');

  // Bảo vệ: không cho xóa admin cuối cùng
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role === 'admin') {
    const adminCount = await prisma.user.count({ where: { role: 'admin', isActive: true } });
    if (adminCount <= 1) {
      throw new Error('Không thể xoá admin cuối cùng của hệ thống');
    }
  }

  await prisma.user.delete({ where: { id: userId } });

  redirect('/quan-tri/nguoi-dung');
}

