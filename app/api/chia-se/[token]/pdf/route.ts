import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildArticlePdf } from '@/lib/article-pdf';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const share = await prisma.procedureShare.findUnique({
    where: { token },
    include: {
      article: {
        include: {
          images: {
            select: { imageUrl: true },
            orderBy: { sortOrder: 'asc' },
          },
        },
      },
    },
  });

  if (!share) {
    return NextResponse.json({ error: 'Share not found' }, { status: 404 });
  }

  if (share.status === 'revoked' || share.revokedAt) {
    return NextResponse.json({ error: 'Share revoked' }, { status: 410 });
  }

  if (share.expiresAt && share.expiresAt.getTime() <= Date.now()) {
    return NextResponse.json({ error: 'Share expired' }, { status: 410 });
  }

  const pdf = await buildArticlePdf(share.article);

  return new NextResponse(Buffer.from(pdf.bytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${pdf.fileName}"`,
      'Cache-Control': 'no-store',
    },
  });
}
