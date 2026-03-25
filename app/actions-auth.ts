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
