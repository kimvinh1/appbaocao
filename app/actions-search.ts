'use server';

import { prisma } from '@/lib/prisma';
import { normalizeModuleKey } from '@/lib/module-theme';

export type SearchResultItem = {
    id: string;
    type: 'article' | 'error_code';
    title: string;
    description: string;
    module: string;
    link: string;
};

export async function globalSearch(query: string): Promise<SearchResultItem[]> {
    if (!query || query.trim() === '') return [];

    const q = query.trim();

    // Search Articles
    const articles = await prisma.article.findMany({
        where: {
            OR: [
                { title: { contains: q } },
                { content: { contains: q } },
                { tags: { contains: q } },
            ],
        },
        take: 20,
    });

    // Search Error Codes
    const errorCodes = await prisma.errorCode.findMany({
        where: {
            OR: [
                { code: { contains: q } },
                { instrument: { contains: q } },
                { description: { contains: q } },
                { cause: { contains: q } },
                { solution: { contains: q } },
            ],
        },
        take: 20,
    });

    const results: SearchResultItem[] = [
        ...articles.map((a) => ({
            id: a.id,
            type: 'article' as const,
            title: a.title,
            description: a.content.substring(0, 150) + '...',
            module: normalizeModuleKey(a.module),
            link: `/kien-thuc/bai/${a.id}`,
        })),
        ...errorCodes.map((e) => ({
            id: e.id,
            type: 'error_code' as const,
            title: `${e.code} (${e.instrument})`,
            description: e.description,
            module: normalizeModuleKey(e.module),
            link: `/kien-thuc/${normalizeModuleKey(e.module)}#ma-loi`,
        })),
    ];

    return results;
}
