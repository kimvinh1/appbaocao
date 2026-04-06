import { MODULE_THEMES, normalizeModuleKey } from '@/lib/module-theme';

export const ARTICLE_CATEGORY_OPTIONS = [
  { value: 'quy-trinh', label: 'Quy trình / hướng dẫn' },
  { value: 'case', label: 'Case / xử lý sự cố' },
] as const;

export type ArticleCategoryValue = (typeof ARTICLE_CATEGORY_OPTIONS)[number]['value'];

export const KNOWLEDGE_MODULE_CONFIG = {
  illumina: {
    ...MODULE_THEMES.illumina,
    title: 'Trung tâm tri thức Illumina',
    description: 'Gom SOP, case xử lý sự cố và mã lỗi để đội APP tra cứu và chia sẻ nhanh cho khách hàng.',
    errorDescription: 'Cơ sở dữ liệu mã lỗi, nguyên nhân và hướng xử lý cho hệ Illumina.',
    instruments: ['NextSeq 550', 'NextSeq 1000/2000', 'MiSeq', 'NovaSeq 6000', 'iSeq 100', 'MiniSeq'],
  },
  'vi-sinh': {
    ...MODULE_THEMES['vi-sinh'],
    title: 'Trung tâm tri thức Vi Sinh',
    description: 'Gom hướng dẫn vận hành, case kỹ thuật và mã lỗi cho nhóm vi sinh trong một chỗ.',
    errorDescription: 'Cơ sở dữ liệu mã lỗi và hướng xử lý cho các hệ thống vi sinh.',
    instruments: ['Walkaway-96', 'Walkaway-48', 'Autoscan 4', 'Thiết bị khác'],
  },
  cepheid: {
    ...MODULE_THEMES.cepheid,
    title: 'Trung tâm tri thức Cepheid',
    description: 'Quản lý SOP, case xử lý sự cố và mã lỗi cho GeneXpert trên cùng một trang.',
    errorDescription: 'Cơ sở dữ liệu mã lỗi, nguyên nhân và hướng xử lý cho nền tảng GeneXpert / Cepheid.',
    instruments: ['GeneXpert IV', 'GeneXpert XVI', 'GeneXpert Infinity', 'GeneXpert Edge', 'Khác'],
  },
} as const;

export function getKnowledgeModuleConfig(module: string) {
  return KNOWLEDGE_MODULE_CONFIG[normalizeModuleKey(module) as keyof typeof KNOWLEDGE_MODULE_CONFIG] ?? KNOWLEDGE_MODULE_CONFIG.illumina;
}

export function normalizeArticleCategory(category: string | null | undefined): ArticleCategoryValue {
  if (category === 'case' || category === 'troubleshooting') {
    return 'case';
  }

  return 'quy-trinh';
}

export function getArticleCategoryLabel(category: string | null | undefined) {
  return normalizeArticleCategory(category) === 'case'
    ? 'Case / xử lý sự cố'
    : 'Quy trình / hướng dẫn';
}

export function isArticleCategoryMatch(category: string | null | undefined, filter: string | null | undefined) {
  if (!filter || filter === 'all') {
    return true;
  }

  return normalizeArticleCategory(category) === filter;
}
