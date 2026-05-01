'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { deleteBlobIfManaged, uploadFileToBlob } from '@/lib/blob';
import { requireKnowledgeEditor, requireUser, getCurrentUser } from '@/lib/auth';
import { normalizeModuleKey, resolveModuleAliases } from '@/lib/module-theme';
import { normalizeArticleCategory } from '@/lib/knowledge-center';

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

const ALL_MODULES = ['illumina', 'vi-sinh', 'cepheid', 'sinh-hoc-phan-tu'] as const;
const DEFAULT_SHARE_EXPIRY_DAYS = 14;
const MAX_SHARE_EXPIRY_DAYS = 90;

function revalidateModulePages(module: string) {
  const normalizedModule = normalizeModuleKey(module);
  revalidatePath('/');
  revalidatePath('/search');
  revalidatePath(`/kien-thuc/${normalizedModule}`);
  for (const m of ALL_MODULES) {
    revalidatePath(`/${m}/ma-loi`);
    revalidatePath(`/${m}/case`);
  }
}

function parseShareExpiresAt(value: FormDataEntryValue | null) {
  const raw = typeof value === 'string' ? value.trim() : '';
  const days = raw ? Number.parseInt(raw, 10) : DEFAULT_SHARE_EXPIRY_DAYS;
  const safeDays = Number.isFinite(days)
    ? Math.min(Math.max(days, 1), MAX_SHARE_EXPIRY_DAYS)
    : DEFAULT_SHARE_EXPIRY_DAYS;

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + safeDays);
  return expiresAt;
}

function isShareExpired(share: { expiresAt?: Date | null }) {
  return !!share.expiresAt && share.expiresAt.getTime() <= Date.now();
}

function getModuleFilter(module?: string) {
  const aliases = resolveModuleAliases(module);

  if (!aliases) {
    return undefined;
  }

  return {
    in: aliases,
  };
}

function isFormFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File;
}

function getUploadedFiles(formData: FormData, fieldName: string) {
  return formData
    .getAll(fieldName)
    .filter(isFormFile)
    .filter((file) => file.size > 0);
}

function isImageFile(file: File) {
  return file.type.startsWith('image/');
}

function ensureImageFiles(files: File[], maxCount: number, label: string) {
  if (files.length > maxCount) {
    throw new Error(`${label} chỉ được tối đa ${maxCount} ảnh`);
  }

  for (const file of files) {
    if (!isImageFile(file)) {
      throw new Error(`${label} chỉ nhận file ảnh`);
    }
  }

  return files;
}

function normalizeRichTextContent(value: string | null | undefined) {
  const raw = (value ?? '').trim();
  if (!raw) return '';

  const textOnly = raw
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return textOnly ? raw : '';
}

// ─── ARTICLES ───────────────────────────────────────────────────────────────

export async function getArticles(module?: string) {
  return prisma.article.findMany({
    where: module ? { module: getModuleFilter(module) } : undefined,
    orderBy: [{ updatedAt: 'desc' }],
    select: {
      id: true,
      module: true,
      title: true,
      category: true,
      tags: true,
      author: true,
      viewCount: true,
      attachmentUrl: true,
      createdAt: true,
      updatedAt: true,
    },
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

// Tăng lượt xem (gọi từ client component, không cần auth)
// Dùng $executeRaw vì Prisma client cần được regenerate sau khi thêm viewCount vào schema
export async function incrementArticleView(articleId: string) {
  try {
    await prisma.$executeRaw`UPDATE "Article" SET "viewCount" = "viewCount" + 1 WHERE "id" = ${articleId}`;
  } catch {
    // Bỏ qua lỗi — đếm view là non-critical
  }
}

export async function createArticle(formData: FormData) {
  const user = await requireKnowledgeEditor();
  const module = normalizeModuleKey(formData.get('module') as string);
  const category = normalizeArticleCategory((formData.get('category') as string) || 'quy-trinh');
  const title = formData.get('title') as string;
  const content = normalizeRichTextContent(formData.get('content') as string);
  const tags = formData.get('tags') as string;
  const attachmentUrlInput = (formData.get('attachmentUrl') as string | null)?.trim() || null;
  const imageFiles = ensureImageFiles(getUploadedFiles(formData, 'imageFiles'), 5, 'Ảnh đính kèm');

  if (!module || !title || !content) throw new Error('Missing required fields: module, title and content');

  const attachmentUrl = attachmentUrlInput || null;
  const imageUrls = await Promise.all(
    imageFiles.map((f) => uploadFileToBlob(f, 'articles/images'))
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
  await requireKnowledgeEditor();
  const id = formData.get('id') as string;
  const title = formData.get('title') as string;
  const content = normalizeRichTextContent(formData.get('content') as string);
  const tags = formData.get('tags') as string;
  const category = formData.get('category') ? normalizeArticleCategory(formData.get('category') as string) : undefined;
  const attachmentUrl = (formData.get('attachmentUrl') as string | null)?.trim() || null;
  const imageFiles = ensureImageFiles(getUploadedFiles(formData, 'imageFiles'), 5, 'Ảnh đính kèm');

  if (!id || !title || !content) throw new Error('Missing required fields');

  const existingArticle = await prisma.article.findUnique({
    where: { id },
    select: { module: true },
  });

  if (!existingArticle) throw new Error('Article not found');

  const imageUrls = await Promise.all(
    imageFiles.map((f) => uploadFileToBlob(f, 'articles/images'))
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
      attachmentUrl,
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
  await requireKnowledgeEditor();
  const imageId = formData.get('imageId') as string;
  if (!imageId) throw new Error('Missing image ID');

  const image = await prisma.articleImage.findUnique({
    where: { id: imageId },
    select: { articleId: true, imageUrl: true, article: { select: { module: true } } },
  });

  if (!image) throw new Error('Image not found');

  await prisma.articleImage.delete({ where: { id: imageId } });
  await deleteBlobIfManaged(image.imageUrl).catch(() => undefined);

  revalidateKnowledgeBase(image.article.module, image.articleId);
}

export async function deleteArticle(formData: FormData) {
  await requireKnowledgeEditor();
  const id = formData.get('id') as string;
  if (!id) throw new Error('Missing article ID');

  const existingArticle = await prisma.article.findUnique({
    where: { id },
    select: { module: true, images: { select: { imageUrl: true } } },
  });

  await prisma.article.delete({ where: { id } });

  if (existingArticle) {
    await Promise.all(existingArticle.images.map((image) => deleteBlobIfManaged(image.imageUrl).catch(() => undefined)));
    revalidateKnowledgeBase(existingArticle.module, id);
  } else {
    revalidatePath('/kien-thuc');
    revalidatePath('/search');
  }

  // Redirect về danh sách sau khi xoá
  const { redirect } = await import('next/navigation');
  redirect('/kien-thuc');
}

export async function archiveArticle(formData: FormData) {
  await requireKnowledgeEditor();
  const id = formData.get('id') as string;
  const archive = formData.get('archive') !== 'false'; // default true = lưu trữ
  if (!id) throw new Error('Missing article ID');

  const article = await prisma.article.findUnique({
    where: { id },
    select: { module: true },
  });
  if (!article) throw new Error('Article not found');

  await prisma.article.update({
    where: { id },
    data: { isArchived: archive },
  });

  revalidateKnowledgeBase(article.module, id);
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
  const module = normalizeModuleKey((formData.get('module') as string | null) || 'vi-sinh');
  const code = formData.get('code') as string;
  const instrument = formData.get('instrument') as string;
  const description = formData.get('description') as string;
  const cause = formData.get('cause') as string;
  const solution = formData.get('solution') as string;
  const severity = formData.get('severity') as string;
  const imageFile = formData.get('imageFile') as File | null;
  let imageUrl = (formData.get('imageUrl') as string | null)?.trim() || null;

  if (!code || !instrument || !description || !cause || !solution || !severity)
    throw new Error('All fields except module/imageUrl are required');

  const uploadedImageUrl = await uploadFileToBlob(imageFile, 'error-codes');
  if (uploadedImageUrl) imageUrl = uploadedImageUrl;

  const targetModule = module || 'vi-sinh';

  await prisma.errorCode.create({
    data: {
      module: targetModule,
      code,
      instrument,
      description,
      cause,
      solution,
      severity,
      imageUrl,
    },
  });

  revalidateModulePages(targetModule);
}

// ─── SUPPORT CASES ──────────────────────────────────────────────────────────

export async function getSupportCases(module?: string) {
  const cases = await prisma.supportCase.findMany({
    where: module ? { module: getModuleFilter(module) } : undefined,
    include: {
      images: {
        orderBy: { sortOrder: 'asc' },
      },
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
  const module = normalizeModuleKey(formData.get('module') as string);
  const caseDateRaw = formData.get('caseDate') as string;
  const customer = formData.get('customer') as string;
  const instrument = formData.get('instrument') as string;
  const issueType = formData.get('issueType') as string;
  const description = formData.get('description') as string;
  const content = (formData.get('content') as string | null)?.trim() || '';
  const resolution = formData.get('resolution') as string;
  const handler = formData.get('handler') as string;
  const status = formData.get('status') as string;
  const imageFiles = ensureImageFiles(getUploadedFiles(formData, 'imageFiles'), 2, 'Ảnh case');
  const attachmentUrl = (formData.get('attachmentUrl') as string | null)?.trim() || null;

  if (!module || !caseDateRaw || !customer || !instrument || !issueType || !description || !handler || !status)
    throw new Error('Missing required fields');

  if (!content && !resolution) {
    throw new Error('Nội dung case là bắt buộc');
  }

  const caseDate = new Date(caseDateRaw);
  if (isNaN(caseDate.getTime())) throw new Error('Invalid date');

  const imageUrls = await Promise.all(
    imageFiles.map((imageFile) => uploadFileToBlob(imageFile, 'support-cases/images'))
  );

  await prisma.supportCase.create({
    data: {
      module,
      caseDate,
      customer,
      instrument,
      issueType,
      description,
      content: content || null,
      resolution: resolution || '',
      handler,
      status,
      attachmentUrl,
      ...(imageUrls.length > 0
        ? {
            images: {
              create: imageUrls
                .filter((imageUrl): imageUrl is string => Boolean(imageUrl))
                .map((imageUrl, index) => ({
                  imageUrl,
                  sortOrder: index,
                })),
            },
          }
        : undefined),
    },
  });

  revalidateModulePages(module);
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
  const [totalArticles, totalProjects, totalProcedureShares, totalErrorCodes, totalUsers] =
    await Promise.all([
      prisma.article.count(),
      prisma.project.count(),
      prisma.procedureShare.count(),
      prisma.errorCode.count(),
      prisma.user.count({ where: { isActive: true } }),
    ]);

  return { totalArticles, totalProjects, totalProcedureShares, totalErrorCodes, totalUsers };
}

export async function getProcedureSharesByArticle(articleId: string) {
  const shares = await prisma.procedureShare.findMany({
    where: { articleId },
    include: {
      sharedBy: {
        select: {
          fullName: true,
        },
      },
      reactions: true,
      feedbackEvents: {
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: [{ sharedAt: 'desc' }],
  });

  return shares.map((share) => ({
    ...share,
    likeCount:
      share.reactions.filter((reaction) => reaction.reactionType === 'like').length +
      share.feedbackEvents.filter((event) => event.eventType === 'like').length,
    heartCount:
      share.reactions.filter((reaction) => reaction.reactionType === 'heart').length +
      share.feedbackEvents.filter((event) => event.eventType === 'heart').length,
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
      feedbackEvents: {
        orderBy: { createdAt: 'desc' },
      },
      sharedBy: {
        select: {
          fullName: true,
          email: true,
        },
      },
    },
  });

  if (!share) {
    return null;
  }

  const normalizedArticle = {
    ...share.article,
    module: normalizeModuleKey(share.article.module),
  };

  if (share.status === 'revoked' || share.revokedAt) {
    return {
      ...share,
      article: normalizedArticle,
      likeCount: 0,
      heartCount: 0,
      unavailableReason: 'revoked' as const,
    };
  }

  if (isShareExpired(share)) {
    return {
      ...share,
      article: normalizedArticle,
      likeCount: 0,
      heartCount: 0,
      unavailableReason: 'expired' as const,
    };
  }

  const isFirstOpen = !share.openedAt;
  const openedShare = await prisma.$transaction(async (tx) => {
    const updated = await tx.procedureShare.update({
      where: { token },
      data: {
        openedAt: share.openedAt ?? new Date(),
        lastOpenedAt: new Date(),
        openCount: { increment: 1 },
      },
      include: {
        article: {
          include: {
            images: { orderBy: { sortOrder: 'asc' } },
          },
        },
        reactions: true,
        feedbackEvents: {
          orderBy: { createdAt: 'desc' },
        },
        sharedBy: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (isFirstOpen) {
      await tx.procedureShareFeedback.create({
        data: {
          shareId: share.id,
          eventType: 'opened',
        },
      });
    }

    return updated;
  });

  return {
    ...openedShare,
    article: {
      ...openedShare.article,
      module: normalizeModuleKey(openedShare.article.module),
    },
    likeCount:
      openedShare.reactions.filter((reaction) => reaction.reactionType === 'like').length +
      openedShare.feedbackEvents.filter((event) => event.eventType === 'like').length,
    heartCount:
      openedShare.reactions.filter((reaction) => reaction.reactionType === 'heart').length +
      openedShare.feedbackEvents.filter((event) => event.eventType === 'heart').length,
  };
}

export async function createProcedureShare(formData: FormData) {
  const user = await requireKnowledgeEditor();
  const articleId = formData.get('articleId') as string;
  const customerName = formData.get('customerName') as string;
  const customerPhone = formData.get('customerPhone') as string;
  const expiresAt = parseShareExpiresAt(formData.get('expiresInDays'));

  if (!articleId || !customerName) {
    throw new Error('Thiếu thông tin chia sẻ quy trình');
  }

  const share = await prisma.procedureShare.create({
    data: {
      token: randomUUID(),
      articleId,
      customerName,
      customerPhone: customerPhone || null,
      expiresAt,
      sharedById: user.id,
    },
  });

  revalidatePath(`/kien-thuc/bai/${articleId}`);
  revalidatePath(`/chia-se/${share.token}`);
}

export async function markProcedureShareCompleted(formData: FormData) {
  const token = formData.get('token') as string;
  const customerComment = (formData.get('customerComment') as string) || null;

  if (!token) {
    throw new Error('Thiếu mã chia sẻ');
  }

  const existingShare = await prisma.procedureShare.findUnique({
    where: { token },
    select: { id: true, articleId: true, completedAt: true, status: true, revokedAt: true, expiresAt: true },
  });

  if (!existingShare) {
    throw new Error('Không tìm thấy quy trình đã chia sẻ');
  }

  if (existingShare.status === 'revoked' || existingShare.revokedAt) {
    throw new Error('Link chia sẻ này đã bị thu hồi');
  }

  if (isShareExpired(existingShare)) {
    throw new Error('Link chia sẻ này đã hết hạn');
  }

  await prisma.$transaction(async (tx) => {
    await tx.procedureShare.update({
      where: { token },
      data: {
        status: 'completed',
        completedAt: existingShare.completedAt ?? new Date(),
        customerComment: customerComment ?? undefined,
      },
    });

    if (!existingShare.completedAt) {
      await tx.procedureShareFeedback.create({
        data: {
          shareId: existingShare.id,
          eventType: 'completed',
          comment: customerComment || null,
        },
      });
    }
  });

  revalidatePath(`/chia-se/${token}`);
  revalidatePath(`/kien-thuc/bai/${existingShare.articleId}`);
}

export async function deleteProcedureShare(formData: FormData) {
  await requireKnowledgeEditor();
  const shareId = formData.get('shareId') as string;
  const articleId = formData.get('articleId') as string;

  if (!shareId) throw new Error('Thiếu ID chia sẻ');

  const existingShare = await prisma.procedureShare.findUnique({
    where: { id: shareId },
    select: { token: true, articleId: true, status: true },
  });

  if (!existingShare) {
    throw new Error('Không tìm thấy link chia sẻ');
  }

  if (existingShare.status !== 'revoked') {
    await prisma.procedureShare.update({
      where: { id: shareId },
      data: {
        status: 'revoked',
        revokedAt: new Date(),
      },
    });
  }

  revalidatePath(`/kien-thuc/bai/${articleId || existingShare.articleId}`);
  revalidatePath(`/chia-se/${existingShare.token}`);
}

export async function toggleShareLink(shareId: string, articleId: string) {
  await requireKnowledgeEditor();
  if (!shareId) throw new Error('Thiếu ID chia sẻ');

  const existingShare = await prisma.procedureShare.findUnique({
    where: { id: shareId },
    select: { token: true, articleId: true, status: true },
  });

  if (!existingShare) throw new Error('Không tìm thấy link chia sẻ');

  const wasRevoked = existingShare.status === 'revoked';
  await prisma.procedureShare.update({
    where: { id: shareId },
    data: wasRevoked
      ? { status: 'pending', revokedAt: null }
      : { status: 'revoked', revokedAt: new Date() },
  });

  revalidatePath(`/kien-thuc/bai/${articleId || existingShare.articleId}`);
  revalidatePath(`/chia-se/${existingShare.token}`);
}

export async function reactToProcedureShare(formData: FormData) {
  const token = formData.get('token') as string;
  const reactionType = formData.get('reactionType') as string;

  if (!token || !['like', 'heart'].includes(reactionType)) {
    throw new Error('Phản hồi không hợp lệ');
  }

  const share = await prisma.procedureShare.findUnique({
    where: { token },
    select: { id: true, articleId: true, status: true, revokedAt: true, expiresAt: true },
  });

  if (!share) {
    throw new Error('Không tìm thấy quy trình đã chia sẻ');
  }

  if (share.status === 'revoked' || share.revokedAt) {
    throw new Error('Link chia sẻ này đã bị thu hồi');
  }

  if (isShareExpired(share)) {
    throw new Error('Link chia sẻ này đã hết hạn');
  }

  await prisma.procedureShareFeedback.create({
    data: {
      shareId: share.id,
      eventType: reactionType,
    },
  });

  revalidatePath(`/kien-thuc/bai/${share.articleId}`);
}

// ─── Content Feedback (like/dislike) ────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

export type FeedbackStats = {
  likeCount: number;
  dislikeCount: number;
  userReaction: 'like' | 'dislike' | null;
};

export async function getContentFeedback(
  contentType: string,
  contentId: string,
): Promise<FeedbackStats> {
  const currentUser = await getCurrentUser();
  const userId = currentUser?.id ?? 'anonymous';

  const [likeCount, dislikeCount, userRecord] = await Promise.all([
    db.contentFeedback.count({
      where: { contentType, contentId, reaction: 'like' },
    }),
    db.contentFeedback.count({
      where: { contentType, contentId, reaction: 'dislike' },
    }),
    currentUser
      ? db.contentFeedback.findUnique({
          where: {
            contentType_contentId_userId: { contentType, contentId, userId },
          },
        })
      : null,
  ]);

  return {
    likeCount,
    dislikeCount,
    userReaction: (userRecord?.reaction as 'like' | 'dislike' | null) ?? null,
  };
}

export async function getContentFeedbackBatch(
  contentType: string,
  contentIds: string[],
): Promise<Record<string, FeedbackStats>> {
  if (contentIds.length === 0) return {};
  const currentUser = await getCurrentUser();
  const userId = currentUser?.id;

  const [allFeedbacks, userFeedbacks] = await Promise.all([
    db.contentFeedback.groupBy({
      by: ['contentId', 'reaction'],
      where: { contentType, contentId: { in: contentIds } },
      _count: true,
    }),
    userId
      ? db.contentFeedback.findMany({
          where: { contentType, contentId: { in: contentIds }, userId },
          select: { contentId: true, reaction: true },
        })
      : Promise.resolve([]),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userMap = Object.fromEntries((userFeedbacks as any[]).map((f: any) => [f.contentId, f.reaction]));

  return Object.fromEntries(
    contentIds.map((id) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const likes = (allFeedbacks as any[]).find((f: any) => f.contentId === id && f.reaction === 'like')?._count ?? 0;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dislikes = (allFeedbacks as any[]).find((f: any) => f.contentId === id && f.reaction === 'dislike')?._count ?? 0;
      return [
        id,
        {
          likeCount: likes,
          dislikeCount: dislikes,
          userReaction: (userMap[id] as 'like' | 'dislike' | null) ?? null,
        },
      ];
    }),
  );
}

export async function submitContentFeedback(formData: FormData): Promise<void> {
  const currentUser = await requireUser();
  const contentType = formData.get('contentType') as string;
  const contentId = formData.get('contentId') as string;
  const reaction = formData.get('reaction') as 'like' | 'dislike';
  const comment = (formData.get('comment') as string | null) ?? undefined;

  if (!contentType || !contentId || !['like', 'dislike'].includes(reaction)) {
    throw new Error('Dữ liệu không hợp lệ');
  }

  const userId = currentUser.id;
  const existing = await db.contentFeedback.findUnique({
    where: { contentType_contentId_userId: { contentType, contentId, userId } },
  });

  if (existing) {
    if (existing.reaction === reaction) {
      // Toggle off (xoá vote)
      await db.contentFeedback.delete({
        where: { contentType_contentId_userId: { contentType, contentId, userId } },
      });
    } else {
      // Đổi sang phản hồi ngược lại
      await db.contentFeedback.update({
        where: { contentType_contentId_userId: { contentType, contentId, userId } },
        data: { reaction, comment, updatedAt: new Date() },
      });
    }
  } else {
    await db.contentFeedback.create({
      data: { id: randomUUID(), contentType, contentId, userId, reaction, comment },
    });
  }

  // Revalidate relevant pages
  if (contentType === 'article') {
    revalidatePath(`/kien-thuc/bai/${contentId}`);
    revalidatePath('/kien-thuc');
    revalidatePath('/search');
  } else if (contentType === 'case') {
    revalidatePath('/kien-thuc/illumina');
    revalidatePath('/kien-thuc/vi-sinh');
    revalidatePath('/kien-thuc/cepheid');
  } else if (contentType === 'error-code') {
    revalidatePath('/kien-thuc/illumina');
    revalidatePath('/kien-thuc/vi-sinh');
    revalidatePath('/kien-thuc/cepheid');
  }
}

// ─── Feedback comments cho tác giả xem ─────────────────────────────────────

export async function getArticleDislikeComments(articleId: string) {
  const rows = await db.contentFeedback.findMany({
    where: {
      contentType: 'article',
      contentId: articleId,
      reaction: 'dislike',
      comment: { not: null },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { comment: true, createdAt: true },
  });
  return rows as Array<{ comment: string; createdAt: Date }>;
}

// ─── Bài liên quan ──────────────────────────────────────────────────────────

export async function getRelatedArticles(module: string, category: string, excludeId: string, limit = 3) {
  // Ưu tiên cùng module + cùng category
  const bySameCategory = await prisma.article.findMany({
    where: { module, category, id: { not: excludeId } },
    orderBy: { updatedAt: 'desc' },
    take: limit,
    select: { id: true, title: true, category: true, author: true, updatedAt: true, module: true },
  });

  if (bySameCategory.length >= limit) return bySameCategory;

  // Bù vào bằng cùng module, category khác
  const remaining = limit - bySameCategory.length;
  const excludeIds = [excludeId, ...bySameCategory.map((a) => a.id)];
  const byModule = await prisma.article.findMany({
    where: { module, id: { notIn: excludeIds } },
    orderBy: { updatedAt: 'desc' },
    take: remaining,
    select: { id: true, title: true, category: true, author: true, updatedAt: true, module: true },
  });

  return [...bySameCategory, ...byModule];
}
