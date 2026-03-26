'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

function parseDateInput(value: FormDataEntryValue | null, fieldName: string): Date {
  if (!value || typeof value !== 'string' || !value.trim()) {
    throw new Error(`${fieldName} is required.`);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${fieldName} is invalid.`);
  }

  return parsed;
}

function parseRequiredString(value: FormDataEntryValue | null, fieldName: string): string {
  if (!value || typeof value !== 'string' || !value.trim()) {
    throw new Error(`${fieldName} is required.`);
  }

  return value.trim();
}

function parseRequiredNumber(value: FormDataEntryValue | null, fieldName: string): number {
  const raw = parseRequiredString(value, fieldName);
  const parsed = Number(raw);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a positive number.`);
  }

  return parsed;
}

// ─── Projects ────────────────────────────────────────────────────────────────

export async function getProjects() {
  return prisma.project.findMany({
    orderBy: [{ createdAt: 'desc' }],
    include: {
      projectLogs: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });
}

export async function getProjectById(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: {
      projectLogs: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

async function generateProjectCode(): Promise<string> {
  const year = new Date().getFullYear().toString().slice(-2);
  const prefix = `ILL-${year}-`;
  const lastProject = await prisma.project.findFirst({
    where: { code: { startsWith: prefix } },
    orderBy: { code: 'desc' },
  });
  if (!lastProject) return `${prefix}001`;
  const lastNum = parseInt(lastProject.code.split('-').pop() ?? '0', 10);
  const nextNum = (lastNum + 1).toString().padStart(3, '0');
  return `${prefix}${nextNum}`;
}

export async function createProject(formData: FormData) {
  const codeInput = formData.get('code');
  const code =
    typeof codeInput === 'string' && codeInput.trim()
      ? codeInput.trim()
      : await generateProjectCode();

  const clientName = parseRequiredString(formData.get('clientName'), 'Khách hàng');
  const instrument = (formData.get('instrument') as string)?.trim() ?? '';
  const panelType = parseRequiredString(formData.get('panelType'), 'Panel / Xét nghiệm');
  const description = (formData.get('description') as string)?.trim() ?? '';
  const status = parseRequiredString(formData.get('status'), 'Trạng thái');
  const updatedBy = (formData.get('updatedBy') as string)?.trim() || 'Hệ thống';

  const project = await prisma.project.create({
    data: {
      code,
      clientName,
      instrument,
      panelType,
      description,
      status,
    },
  });

  await prisma.projectLog.create({
    data: {
      projectId: project.id,
      status,
      note: description ? `Tạo dự án: ${description}` : 'Tạo dự án mới',
      updatedBy,
    },
  });

  revalidatePath('/');
  revalidatePath('/projects');
}

export async function updateProjectStatus(formData: FormData) {
  const id = parseRequiredString(formData.get('id'), 'Project ID');
  const status = parseRequiredString(formData.get('status'), 'Trạng thái');
  const note = (formData.get('note') as string)?.trim() || 'Cập nhật trạng thái';
  const updatedBy = parseRequiredString(formData.get('updatedBy'), 'Người cập nhật');

  await prisma.project.update({
    where: { id },
    data: { status },
  });

  await prisma.projectLog.create({
    data: {
      projectId: id,
      status,
      note,
      updatedBy,
    },
  });

  revalidatePath('/');
  revalidatePath('/projects');
  revalidatePath(`/projects/${id}`);
}

// Keep old updateProject for backward compat
export async function updateProject(formData: FormData) {
  return updateProjectStatus(formData);
}

// ─── Activity Logs ────────────────────────────────────────────────────────────

export async function getActivityLogs() {
  return prisma.activityLog.findMany({
    include: {
      project: {
        select: {
          id: true,
          code: true,
          panelType: true,
          status: true,
        },
      },
    },
    orderBy: [{ logDate: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function createActivityLog(formData: FormData) {
  const teamMember = parseRequiredString(formData.get('teamMember'), 'Team member');
  const logDate = parseDateInput(formData.get('logDate'), 'Log date');
  const category = parseRequiredString(formData.get('category'), 'Category');
  const durationHours = parseRequiredNumber(formData.get('durationHours'), 'Duration hours');
  const description = parseRequiredString(formData.get('description'), 'Description');

  const projectValue = formData.get('projectId');
  const projectId =
    typeof projectValue === 'string' && projectValue.trim().length > 0
      ? projectValue.trim()
      : null;

  await prisma.activityLog.create({
    data: {
      teamMember,
      logDate,
      category,
      durationHours,
      description,
      projectId,
    },
  });

  revalidatePath('/');
  revalidatePath('/logs');
}
