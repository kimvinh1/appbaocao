import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const token = req.cookies.get('portal_session')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { prisma } = await import('@/lib/prisma');
        const session = await prisma.session.findUnique({
            where: { token },
            include: { user: true },
        });

        if (!session || session.expiresAt.getTime() <= Date.now() || !session.user.isActive) {
            if (session) {
                await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
            }
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { dataUrl } = await req.json();

        if (!dataUrl || typeof dataUrl !== 'string') {
            return NextResponse.json({ error: 'Missing dataUrl' }, { status: 400 });
        }

        const { uploadDataUrlToBlob } = await import('@/lib/blob');
        const url = await uploadDataUrlToBlob(dataUrl, 'inline');
        return NextResponse.json({ url });
    } catch (err) {
        console.error('[upload-inline-image]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
