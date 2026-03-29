import { randomUUID } from 'node:crypto';
import { del, put } from '@vercel/blob';

function getFileExtension(fileName: string, fallback = 'bin') {
  const ext = fileName.split('.').pop()?.trim().toLowerCase();
  return ext || fallback;
}

function getMimeExtension(mimeType: string, fallback = 'bin') {
  const ext = mimeType.split('/')[1]?.split('+')[0]?.trim().toLowerCase();
  return ext || fallback;
}

export async function uploadFileToBlob(file: File | null, folder = 'portal') {
  if (!file || file.size === 0) {
    return null;
  }

  const pathname = `${folder}/${Date.now()}-${randomUUID()}.${getFileExtension(file.name)}`;
  const blob = await put(pathname, file, {
    access: 'public',
    addRandomSuffix: false,
    contentType: file.type || undefined,
  });

  return blob.url;
}

export async function uploadDataUrlToBlob(dataUrl: string, folder = 'inline') {
  const match = dataUrl.match(/^data:([a-zA-Z0-9+/]+\/[a-zA-Z0-9+/.-]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid data URL format');
  }

  const mimeType = match[1];
  const base64Data = match[2];
  const pathname = `${folder}/${Date.now()}-${randomUUID()}.${getMimeExtension(mimeType, 'png')}`;
  const buffer = Buffer.from(base64Data, 'base64');

  const blob = await put(pathname, buffer, {
    access: 'public',
    addRandomSuffix: false,
    contentType: mimeType,
  });

  return blob.url;
}

export function isVercelBlobUrl(url: string) {
  try {
    const hostname = new URL(url).hostname;
    return hostname.endsWith('.public.blob.vercel-storage.com') || hostname.endsWith('.blob.vercel-storage.com');
  } catch {
    return false;
  }
}

export async function deleteBlobIfManaged(url: string | null | undefined) {
  if (!url || !isVercelBlobUrl(url)) {
    return;
  }

  await del(url);
}
