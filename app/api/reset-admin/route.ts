import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

const RESET_SECRET = 'reset-portal-2026';

export async function POST(req: NextRequest) {
  try {
    const { secret, newPassword } = await req.json();
    if (secret !== RESET_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'Password too short' }, { status: 400 });
    }
    const hash = hashPassword(newPassword);
    await prisma.user.upsert({
      where: { email: 'admin@portal.local' },
      update: { passwordHash: hash },
      create: {
        email: 'admin@portal.local',
        fullName: 'Quan tri he thong',
        passwordHash: hash,
        role: 'admin',
        isActive: true,
      },
    });
    return NextResponse.json({ success: true, message: 'Admin OK' });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
