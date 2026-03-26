'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { normalizeModuleKey, resolveModuleAliases } from '@/lib/module-theme';

function revalidateKnowledgeBase(module: string, articleId?: string) {
  const normalizedModule = normalizeModuleKey(module);
  revalidatePath('/');
  revalidatePath('/search');
  revalidatePath('/kien-thuc');
  revalidatePath(`/kien-thuc/${normalizedModule}`);
  revalidatePath('/kien-thuc/cepheid');

  if (articleId) {
    revalidatePath(`/kien-thuc/bai/${articleId}`);
    revalidatePath(`/kien-thuc/sua/${articleId}`);
  }
}

function revalidateModulePages(module: string) {
  const normalizedModule = normalizeModuleKey(module);
  revalidatePath('/');
  revalidatePath('/search');
  revalidatePath(`/${normalizedModule}/ma-loi`);
  revalidatePath(`/${normalizedModule}/case`);
  revalidatePath('/cepheid/ma-loi');
  revalidatePath('/cepheid/case');
  revalidatePath('/sinh-hoc-phan-tu/ma-loi');
  revalidatePath('/sinh-hoc-phan-tu/case');
}

function getModuleFilter(module?: string) {
  const aliases = resolveModuleAliases(module);
  if (!aliases) return undefined;
  return { in: aliases };
}

/** Làm sạch URL Drive/link – trả null nếu rỗng hoặc không hợp lệ */
function sanitizeUrl(url: string | null | undefined): string | null {
  if (!url || url.trim() === '') return null;
  const trimmed = url.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) return null;
  return trimmed;
}

// ─── ARTICLES ───────────────────────────────────────────────────────────────

export async function getArticles(module?: string) {
  return prisma.article.findMany({
    where: module ? { module: getModuleFilter(module) } : undefined,
    orderBy: [{ updatedAt: 'desc' }],
  });
}

export async function getArticleById(id: string) {
  return prisma.article.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
    },
  });
}

export async function createArticle(formData: FormData) {
  const user = await requireUser();
  const module = normalizeModuleKey(formData.get('module') as string);
  const category = (formData.get('category') as string) || 'quy-trinh';
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const tags = formData.get('tags') as string;
  const attachment = ensurePdfFile(formData.get('attachment') as File | null, 'Tài liệu đính kèm');
  const imageFiles = ensureImageFiles(getUploadedFiles(formData, 'imageFiles'), 5, 'Ảnh đính kèm');

  if (!module || !title || !content) throw new Error('Missing required fields');

  const attachmentUrl = await uploadFileToSupabase(attachment, 'articles');
  const imageUrls = await Promise.all(
    imageFiles.map((f) => uploadFileToSupabase(f, 'articles/images'))
  );

  await prisma.article.create({
    data: {
      module,
      category,
      title,
      content,
      tags: tags || '',
      author: user.fullName,
      attachmentUrl,
      ...(imageUrls.length > 0
        ? {
            images: {
              create: imageUrls
                .filter((url): url is string => Boolean(url))
                .map((imageUrl, index) => ({ imageUrl, sortOrder: index })),
            },
          }
        : undefined),
    },
  });

  revalidateKnowledgeBase(module);
}
export async function updateArticle(formData: FormData) {
  const id = formData.get('id') as string;
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const tags = formData.get('tags') as string;
  const category = (formData.get('category') as string) || undefined;
  const imageFiles = ensureImageFiles(getUploadedFiles(formData, 'imageFiles'), 5, 'Ảnh đính kèm');

  if (!id || !title || !content) throw new Error('Missing required fields');

  const existingArticle = await prisma.article.findUnique({
    where: { id },
    select: { module: true },
  });

  if (!existingArticle) throw new Error('Article not found');

  const imageUrls = await Promise.all(
    imageFiles.map((f) => uploadFileToSupabase(f, 'articles/images'))
  );

  const currentImages = await prisma.articleImage.findMany({
    where: { articleId: id },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  });
  const nextSortOrder = currentImages.length > 0 ? currentImages[0].sortOrder + 1 : 0;

  await prisma.article.update({
    where: { id },
    data: {
      title,
      content,
      tags: tags || '',
      ...(category ? { category } : undefined),
      ...(imageUrls.length > 0
        ? {
            images: {
              create: imageUrls
                .filter((url): url is string => Boolean(url))
                .map((imageUrl, index) => ({ imageUrl, sortOrder: nextSortOrder + index })),
            },
          }
        : undefined),
    },
  });

  revalidateKnowledgeBase(existingArticle.module, id);
}

export async function deleteArticleImage(formData: FormData) {
  const imageId = formData.get('imageId') as string;
  if (!imageId) throw new Error('Missing image ID');

  const image = await prisma.articleImage.findUnique({
    where: { id: imageId },
    select: { articleId: true, article: { select: { module: true } } },
  });

  if (!image) throw new Error('Image not found');

  await prisma.articleImage.delete({ where: { id: imageId } });

  revalidateKnowledgeBase(image.article.module, image.articleId);
}
export async function deleteArticle(formData: FormData) {
  const id = formData.get('id') as string;
  if (!id) throw new Error('Missing article ID');

  const existingArticle = await prisma.article.findUnique({
    where: { id },
    select: { module: true },
  });

  await prisma.article.delete({ where: { id } });

  if (existingArticle) {
    revalidateKnowledgeBase(existingArticle.module, id);
    return;
  }

  revalidatePath('/kien-thuc');
  revalidatePath('/search');
}

// ─── ERROR CODES ─────────────────────────────────────────────────────────────

export async function getErrorCodes(module?: string, instrument?: string) {
  return prisma.errorCode.findMany({
    where: {
      ...(module && { module: getModuleFilter(module) }),
      ...(instrument && { instrument }),
    },
    orderBy: [{ instrument: 'asc' }, { code: 'asc' }],
  });
}

export async function createErrorCode(formData: FormData) {
  const moduleKey = normalizeModuleKey((formData.get('module') as string | null) || 'vi-sinh');
  const code = formData.get('code') as string;
  const instrument = formData.get('instrument') as string;
  const description = formData.get('description') as string;
  const cause = formData.get('cause') as string;
  const solution = formData.get('solution') as string;
  const severity = formData.get('severity') as string;
  // v2: chỉ nhận link ảnh
  const imageUrl = sanitizeUrl(formData.get('imageUrl') as string | null);

  if (!code || !instrument || !description || !cause || !solution || !severity)
    throw new Error('All fields except module/imageUrl are required');

  await prisma.errorCode.create({
    data: {
      module: moduleKey || 'vi-sinh',
      code,
      instrument,
      description,
      cause,
      solution,
      severity,
      imageUrl,
    },
  });

  revalidateModulePages(moduleKey);
}

// ─── SUPPORT CASES ────────────────────────────────────────────────────────────

export async function getSupportCases(module?: string) {
  const cases = await prisma.supportCase.findMany({
    where: module ? { module: getModuleFilter(module) } : undefined,
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
    },
    orderBy: [{ caseDate: 'desc' }],
  });

  return cases.map((supportCase) => ({
    ...supportCase,
    imageUrls: [
      ...(supportCase.imageUrl ? [supportCase.imageUrl] : []),
      ...supportCase.images.map((image) => image.imageUrl),
    ],
  }));
}

export async function createSupportCase(formData: FormData) {
  const moduleKey = normalizeModuleKey(formData.get('module') as string);
  const caseDateRaw = formData.get('caseDate') as string;
  const customer = formData.get('customer') as string;
  const instrument = formData.get('instrument') as string;
  const issueType = formData.get('issueType') as string;
  const description = formData.get('description') as string;
  const resolution = formData.get('resolution') as string;
  const handler = formData.get('handler') as string;
  const status = formData.get('status') as string;
  // v2: link ảnh (tối đa 2) thay vì upload
  const imageUrl1 = sanitizeUrl(formData.get('imageUrl1') as string | null);
  const imageUrl2 = sanitizeUrl(formData.get('imageUrl2') as string | null);
  // v2: link Drive cho tài liệu đính kèm
  const attachmentUrl = sanitizeUrl(formData.get('attachmentUrl') as string | null);

  if (!moduleKey || !caseDateRaw || !customer || !instrument || !issueType || !description || !handler || !status)
    throw new Error('Missing required fields');

  const caseDate = new Date(caseDateRaw);
  if (isNaN(caseDate.getTime())) throw new Error('Invalid date');

  const imageUrls = [imageUrl1, imageUrl2].filter((url): url is string => Boolean(url));

  await prisma.supportCase.create({
    data: {
      module: moduleKey,
      caseDate,
      customer,
      instrument,
      issueType,
      description,
      resolution: resolution || '',
      handler,
      status,
      attachmentUrl,
      ...(imageUrls.length > 0
        ? {
            images: {
              create: imageUrls.map((imageUrl, index) => ({
                imageUrl,
                sortOrder: index,
              })),
            },
          }
        : undefined),
    },
  });

  revalidateModulePages(moduleKey);
}

export async function updateCaseStatus(formData: FormData) {
  const id = formData.get('id') as string;
  const status = formData.get('status') as string;
  if (!id || !status) throw new Error('Missing fields');

  const existingCase = await prisma.supportCase.findUnique({
    where: { id },
    select: { module: true },
  });

  if (!existingCase) throw new Error('Support case not found');

  await prisma.supportCase.update({ where: { id }, data: { status } });
  revalidateModulePages(existingCase.module);
}

// ─── DASHBOARD STATS ──────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const totalArticles = await prisma.article.count();
  const totalProjects = await prisma.project.count();
  const totalSupportCases = await prisma.supportCase.count();
  const totalUsers = await prisma.user.count({ where: { isActive: true } });
  return { totalArticles, totalProjects, totalSupportCases, totalUsers };
}

export async function getProcedureSharesByArticle(articleId: string) {
  const shares = await prisma.procedureShare.findMany({
    where: { articleId },
    include: {
      sharedBy: { select: { fullName: true } },
      reactions: true,
    },
    orderBy: [{ sharedAt: 'desc' }],
  });

  return shares.map((share) => ({
    ...share,
    likeCount: share.reactions.filter((r) => r.reactionType === 'like').length,
    heartCount: share.reactions.filter((r) => r.reactionType === 'heart').length,
  }));
}

export async function getProcedureShareByToken(token: string) {
  const share = await prisma.procedureShare.findUnique({
    where: { token },
    include: {
      article: {
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
        },
      },
      reactions: true,
      sharedBy: { select: { fullName: true, email: true } },
    },
  });

  if (!share) return null;

  return {
    ...share,
    article: {
      ...share.article,
      module: normalizeModuleKey(share.article.module),
    },
    likeCount: share.reactions.filter((r) => r.reactionType === 'like').length,
    heartCount: share.reactions.filter((r) => r.reactionType === 'heart').length,
  };
}

export async function createProcedureShare(formData: FormData) {
  const user = await requireUser();
  const articleId = formData.get('articleId') as string;
  const customerName = formData.get('customerName') as string;
  const customerEmail = formData.get('customerEmail') as string;

  if (!articleId || !customerName) throw new Error('Thiếu thông tin chia sẻ quy trình');

  const share = await prisma.procedureShare.create({
    data: {
      token: randomUUID(),
      articleId,
      customerName,
      customerEmail: customerEmail || null,
      sharedById: user.id,
    },
  });

  revalidatePath(`/kien-thuc/bai/${articleId}`);
  revalidatePath(`/chia-se/${share.token}`);
}

export async function markProcedureShareCompleted(formData: FormData) {
  const token = formData.get('token') as string;
  if (!token) throw new Error('Thiếu mã chia sẻ');

  const existingShare = await prisma.procedureShare.findUnique({
    where: { token },
    select: { id: true, articleId: true, completedAt: true },
  });

  if (!existingShare) throw new Error('Không tìm thấy quy trình đã chia sẻ');

  await prisma.procedureShare.update({
    where: { token },
    data: {
      status: 'completed',
      completedAt: existingShare.completedAt ?? new Date(),
    },
  });

  revalidatePath(`/chia-se/${token}`);
  revalidatePath(`/kien-thuc/bai/${existingShare.articleId}`);
}

export async function reactToProcedureShare(formData: FormData) {
  const token = formData.get('token') as string;
  const reactionType = formData.get('reactionType') as string;

  if (!token || !['like', 'heart'].includes(reactionType)) throw new Error('Phản hồi không hợp lệ');

  const share = await prisma.procedureShare.findUnique({
    where: { token },
    select: { id: true, articleId: true },
  });

  if (!share) throw new Error('Không tìm thấy quy trình đã chia sẻ');

  await prisma.procedureReaction.create({
    data: { shareId: share.id, reactionType },
  });

  revalidatePath(`/chia-se/${token}`);
  revalidatePath(`/kien-thuc/bai/${share.articleId}`);
}
