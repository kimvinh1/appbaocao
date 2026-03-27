import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { randomUUID } from 'node:crypto';

export async function POST(req: NextRequest) {
    try {
        const { dataUrl } = await req.json();

        if (!dataUrl || typeof dataUrl !== 'string') {
            return NextResponse.json({ error: 'Missing dataUrl' }, { status: 400 });
        }

        // Parse: data:<mime>;base64,<data>
        const match = dataUrl.match(/^data:([a-zA-Z0-9+/]+\/[a-zA-Z0-9+/]+);base64,(.+)$/);
        if (!match) {
            return NextResponse.json({ error: 'Invalid data URL format' }, { status: 400 });
        }

        const mimeType = match[1];
        const base64Data = match[2];
        const ext = mimeType.split('/')[1]?.split('+')[0] ?? 'png';
        const filename = `inline/${randomUUID()}.${ext}`;

        const buffer = Buffer.from(base64Data, 'base64');

        const { error } = await supabase.storage
            .from('portal-files')
            .upload(filename, buffer, {
                contentType: mimeType,
                upsert: false,
            });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const { data: publicData } = supabase.storage.from('portal-files').getPublicUrl(filename);
        return NextResponse.json({ url: publicData.publicUrl });
    } catch (err) {
        console.error('[upload-inline-image]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
