'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Vui lòng đăng nhập để thực hiện thao tác này');
  return user;
}

import { RESOURCE_MODULES, RESOURCE_CATEGORIES } from '@/lib/resource-constants';

// ── Queries ────────────────────────────────────────────────────────────────────

export async function getResourceLinks(module?: string) {
  return prisma.resourceLink.findMany({
    where: module ? { module } : undefined,
    orderBy: [{ module: 'asc' }, { category: 'asc' }, { title: 'asc' }],
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function createResourceLink(formData: FormData) {
  const user = await requireUser();

  const title       = (formData.get('title') as string | null)?.trim();
  const url         = (formData.get('url') as string | null)?.trim();
  const module      = (formData.get('module') as string | null)?.trim() ?? 'chung';
  const category    = (formData.get('category') as string | null)?.trim() ?? 'Khác';
  const description = (formData.get('description') as string | null)?.trim() || undefined;
  const tags        = (formData.get('tags') as string | null)?.trim() ?? '';

  if (!title) throw new Error('Vui lòng nhập tiêu đề tài liệu');
  if (!url)   throw new Error('Vui lòng nhập đường dẫn URL');

  // Validate URL format
  try { new URL(url); } catch { throw new Error('URL không hợp lệ — phải bắt đầu bằng https://'); }

  await prisma.resourceLink.create({
    data: { title, url, module, category, description, tags, createdBy: user.fullName },
  });

  revalidatePath('/tai-lieu');
  redirect('/tai-lieu');
}

export async function deleteResourceLink(formData: FormData) {
  const user = await requireUser();
  const id   = formData.get('id') as string;
  if (!id) throw new Error('Thiếu ID');

  const link = await prisma.resourceLink.findUnique({ where: { id } });
  if (!link) throw new Error('Không tìm thấy tài liệu');

  // Chỉ admin hoặc người tạo mới được xóa
  if (user.role !== 'admin' && link.createdBy !== user.fullName) {
    throw new Error('Bạn không có quyền xóa tài liệu này');
  }

  await prisma.resourceLink.delete({ where: { id } });
  revalidatePath('/tai-lieu');
}

export async function updateResourceLink(formData: FormData) {
  const user  = await requireUser();
  const id    = (formData.get('id') as string | null)?.trim();
  if (!id) throw new Error('Thiếu ID');

  const link = await prisma.resourceLink.findUnique({ where: { id } });
  if (!link) throw new Error('Không tìm thấy');
  if (user.role !== 'admin' && link.createdBy !== user.fullName) {
    throw new Error('Không có quyền sửa');
  }

  const title       = (formData.get('title') as string | null)?.trim();
  const url         = (formData.get('url') as string | null)?.trim();
  const module      = (formData.get('module') as string | null)?.trim() ?? link.module;
  const category    = (formData.get('category') as string | null)?.trim() ?? link.category;
  const description = (formData.get('description') as string | null)?.trim() || null;
  const tags        = (formData.get('tags') as string | null)?.trim() ?? '';

  if (!title) throw new Error('Tiêu đề không được để trống');
  if (!url)   throw new Error('URL không được để trống');
  try { new URL(url); } catch { throw new Error('URL không hợp lệ'); }

  await prisma.resourceLink.update({
    where: { id },
    data: { title, url, module, category, description, tags },
  });

  revalidatePath('/tai-lieu');
  redirect('/tai-lieu');
}
