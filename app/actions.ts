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

export async function getProjects() {
  return prisma.project.findMany({
    orderBy: [{ createdAt: 'desc' }],
  });
}

export async function createProject(formData: FormData) {
  const code = parseRequiredString(formData.get('code'), 'Project code');
  const clientName = parseRequiredString(formData.get('clientName'), 'Client name');
  const panelType = parseRequiredString(formData.get('panelType'), 'Panel type');
  const status = parseRequiredString(formData.get('status'), 'Status');
  const deadline = parseDateInput(formData.get('deadline'), 'Deadline');

  await prisma.project.create({
    data: {
      code,
      clientName,
      panelType,
      status,
      deadline,
    },
  });

  revalidatePath('/');
  revalidatePath('/projects');
  revalidatePath('/logs');
}

export async function updateProject(formData: FormData) {
  const id = parseRequiredString(formData.get('id'), 'Project ID');
  const status = parseRequiredString(formData.get('status'), 'Status');

  await prisma.project.update({
    where: { id },
    data: { status },
  });

  revalidatePath('/');
  revalidatePath('/projects');
  revalidatePath('/logs');
}

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
